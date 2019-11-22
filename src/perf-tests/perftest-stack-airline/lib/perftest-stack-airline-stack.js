"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const ecs = require("@aws-cdk/aws-ecs");
const ecr = require("@aws-cdk/aws-ecr");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const sfn = require("@aws-cdk/aws-stepfunctions");
const tasks = require("@aws-cdk/aws-stepfunctions-tasks");
const aws_logs_1 = require("@aws-cdk/aws-logs");
const aws_stepfunctions_1 = require("@aws-cdk/aws-stepfunctions");
const s3 = require("@aws-cdk/aws-s3");
const aws_events_1 = require("@aws-cdk/aws-events");
const lambda = require("@aws-cdk/aws-lambda");
const targets = require("@aws-cdk/aws-events-targets");
const COGNITO_USER_POOL_ARN = process.env.COGNITO_USER_POOL_ARN;
const STACK_NAME = process.env.STACK_NAME;
const ROLE_NAME = `${STACK_NAME}-fargate-role`;
const VPC_NAME = `${STACK_NAME}-vpc`;
const CIDR_BLOCK = `198.162.0.0/24`;
const MAX_AZs = 2;
const ECR_GATLING_REPO_NAME = `${STACK_NAME}-gatling`;
const ECR_MOCKDATA_REPO_NAME = `${STACK_NAME}-mockdata`;
const ECS_CLUSTER = `${STACK_NAME}-cluster`;
const GATLING_FARGATE_TASK_DEF = `${STACK_NAME}-gatling-task-def`;
const MOCKDATA_FARGATE_TASK_DEF = `${STACK_NAME}-mockdata-task-def`;
const MEMORY_LIMIT = 2048;
const CPU = 1024;
const GATLING_CONTAINER_NAME = `${STACK_NAME}-gatling-container`;
const MOCKDATA_CONTAINER_NAME = `${STACK_NAME}-mockdata-container`;
const STATE_MACHINE_NAME = `loadtest-${STACK_NAME}`;
const S3_BUCKET_NAME = `${STACK_NAME}-loadtest`;
class PerftestStackAirlineStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const role = new aws_iam_1.Role(this, ROLE_NAME, {
            roleName: ROLE_NAME,
            assumedBy: new aws_iam_1.ServicePrincipal('ecs-tasks.amazonaws.com')
        });
        const bucket = new s3.Bucket(this, "s3bucket", {
            bucketName: S3_BUCKET_NAME
        });
        role.addToPolicy(new aws_iam_1.PolicyStatement({
            resources: [
                `${bucket.bucketArn}`,
                `${bucket.bucketArn}/*`
            ],
            actions: [
                's3:PutObject',
                's3:GetObjectAcl',
                's3:GetObject',
                's3:ListBucket',
                's3:PutObjectAcl',
                's3:DeleteObject'
            ]
        }));
        role.addToPolicy(new aws_iam_1.PolicyStatement({
            resources: [`${COGNITO_USER_POOL_ARN}`],
            actions: [
                'cognito-idp:AdminInitiateAuth',
                'cognito-idp:AdminCreateUser',
                'cognito-idp:AdminSetUserPassword',
                'cognito-idp:UpdateUserPoolClient',
                'cognito-idp:AdminDeleteUser'
            ]
        }));
        const vpc = new ec2.Vpc(this, VPC_NAME, {
            cidr: CIDR_BLOCK,
            maxAzs: MAX_AZs
        });
        const gatlingRepository = new ecr.Repository(this, ECR_GATLING_REPO_NAME, {
            repositoryName: ECR_GATLING_REPO_NAME
        });
        const mockDataRepository = new ecr.Repository(this, ECR_MOCKDATA_REPO_NAME, {
            repositoryName: ECR_MOCKDATA_REPO_NAME
        });
        const cluster = new ecs.Cluster(this, ECS_CLUSTER, {
            vpc: vpc,
            clusterName: ECS_CLUSTER
        });
        const gatlingTaskDefinition = new ecs.FargateTaskDefinition(this, GATLING_FARGATE_TASK_DEF, {
            family: GATLING_FARGATE_TASK_DEF,
            executionRole: role,
            taskRole: role,
            memoryLimitMiB: MEMORY_LIMIT,
            cpu: CPU
        });
        const mockDataTaskDefinition = new ecs.FargateTaskDefinition(this, MOCKDATA_FARGATE_TASK_DEF, {
            family: MOCKDATA_FARGATE_TASK_DEF,
            executionRole: role,
            taskRole: role,
            memoryLimitMiB: MEMORY_LIMIT,
            cpu: CPU
        });
        const gatlingLogging = new ecs.AwsLogDriver({
            logGroup: new aws_logs_1.LogGroup(this, GATLING_CONTAINER_NAME, {
                logGroupName: `/aws/ecs/${GATLING_CONTAINER_NAME}`,
                retention: aws_logs_1.RetentionDays.ONE_WEEK
            }),
            streamPrefix: "gatling"
        });
        const mockDatalogging = new ecs.AwsLogDriver({
            logGroup: new aws_logs_1.LogGroup(this, MOCKDATA_CONTAINER_NAME, {
                logGroupName: `/aws/ecs/${MOCKDATA_CONTAINER_NAME}`,
                retention: aws_logs_1.RetentionDays.ONE_WEEK
            }),
            streamPrefix: "mockdata"
        });
        // Create container from local `Dockerfile` for Gatling
        const gatlingAppContainer = gatlingTaskDefinition.addContainer(GATLING_CONTAINER_NAME, {
            image: ecs.ContainerImage.fromEcrRepository(gatlingRepository),
            logging: gatlingLogging
        });
        const mockDataAppContainer = mockDataTaskDefinition.addContainer(MOCKDATA_CONTAINER_NAME, {
            image: ecs.ContainerImage.fromEcrRepository(mockDataRepository),
            logging: mockDatalogging
        });
        // Step function for setting the load test
        const setupUsers = new sfn.Task(this, "Setup Users", {
            task: new tasks.RunEcsFargateTask({
                cluster,
                taskDefinition: mockDataTaskDefinition,
                assignPublicIp: true,
                containerOverrides: [{
                        containerName: mockDataAppContainer.containerName,
                        command: aws_stepfunctions_1.Data.listAt('$.commands'),
                        environment: [
                            {
                                name: 'setup-users',
                                value: aws_stepfunctions_1.Context.taskToken
                            }
                        ]
                    }],
                integrationPattern: aws_stepfunctions_1.ServiceIntegrationPattern.WAIT_FOR_TASK_TOKEN
            })
        });
        const loadFlights = new sfn.Task(this, "Load Flights", {
            task: new tasks.RunEcsFargateTask({
                cluster,
                taskDefinition: mockDataTaskDefinition,
                assignPublicIp: true,
                containerOverrides: [{
                        containerName: mockDataAppContainer.containerName,
                        command: aws_stepfunctions_1.Data.listAt('$.commands'),
                        environment: [
                            {
                                name: 'load-flights',
                                value: aws_stepfunctions_1.Context.taskToken
                            }
                        ]
                    }],
                integrationPattern: aws_stepfunctions_1.ServiceIntegrationPattern.WAIT_FOR_TASK_TOKEN
            })
        });
        const runGatling = new sfn.Task(this, "Run Gatling", {
            task: new tasks.RunEcsFargateTask({
                cluster,
                taskDefinition: gatlingTaskDefinition,
                assignPublicIp: true,
                containerOverrides: [{
                        containerName: gatlingAppContainer.containerName,
                        command: aws_stepfunctions_1.Data.listAt('$.commands'),
                        environment: [
                            {
                                name: 'run-gatling',
                                value: aws_stepfunctions_1.Context.taskToken
                            }
                        ]
                    }],
                integrationPattern: aws_stepfunctions_1.ServiceIntegrationPattern.WAIT_FOR_TASK_TOKEN
            })
        });
        const consolidateReport = new sfn.Task(this, "Consolidate Report", {
            task: new tasks.RunEcsFargateTask({
                cluster,
                taskDefinition: gatlingTaskDefinition,
                assignPublicIp: true,
                containerOverrides: [{
                        containerName: gatlingAppContainer.containerName,
                        command: aws_stepfunctions_1.Data.listAt('$.commands'),
                        environment: [
                            {
                                name: 'consolidate-report',
                                value: aws_stepfunctions_1.Context.taskToken
                            }
                        ]
                    }],
                integrationPattern: aws_stepfunctions_1.ServiceIntegrationPattern.WAIT_FOR_TASK_TOKEN
            })
        });
        const cleanUp = new sfn.Task(this, "Clean Up", {
            task: new tasks.RunEcsFargateTask({
                cluster,
                taskDefinition: mockDataTaskDefinition,
                assignPublicIp: true,
                containerOverrides: [{
                        containerName: mockDataAppContainer.containerName,
                        command: aws_stepfunctions_1.Data.listAt('$.commands'),
                        environment: [
                            {
                                name: 'clean-up',
                                value: aws_stepfunctions_1.Context.taskToken
                            }
                        ]
                    }],
                integrationPattern: aws_stepfunctions_1.ServiceIntegrationPattern.WAIT_FOR_TASK_TOKEN
            })
        });
        const stepfuncDefinition = setupUsers
            .next(loadFlights)
            .next(runGatling)
            .next(consolidateReport)
            .next(cleanUp);
        const loadtestsfn = new sfn.StateMachine(this, STATE_MACHINE_NAME, {
            stateMachineName: STATE_MACHINE_NAME,
            definition: stepfuncDefinition
        });
        const ecsLambda = new lambda.Function(this, "ecstasklambda", {
            runtime: lambda.Runtime.NODEJS_10_X,
            handler: "index.handler",
            code: new lambda.AssetCode("lambda"),
            functionName: `${STACK_NAME}-ecs-task-change`
        });
        ecsLambda.addToRolePolicy(new aws_iam_1.PolicyStatement({
            actions: ["states:SendTaskSuccess"],
            resources: [loadtestsfn.stateMachineArn]
        }));
        const cwRule = new aws_events_1.Rule(this, "cw-rule", {
            description: "Rule that looks at ECS Task change state and triggers Lambda function",
            enabled: true,
            ruleName: "ECS-task-change-cdk",
            targets: []
        });
        cwRule.addEventPattern({
            source: ['aws.ecs'],
            detailType: ["ECS Task State Change"],
            detail: {
                clusterArn: [cluster.clusterArn],
                lastStatus: ["STOPPED"]
            }
        });
        cwRule.addTarget(new targets.LambdaFunction(ecsLambda));
        new cdk.CfnOutput(this, 's3-bucket', {
            value: bucket.bucketName
        });
    }
}
exports.PerftestStackAirlineStack = PerftestStackAirlineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZnRlc3Qtc3RhY2stYWlybGluZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBlcmZ0ZXN0LXN0YWNrLWFpcmxpbmUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxQ0FBc0M7QUFDdEMsd0NBQXdDO0FBQ3hDLHdDQUF3QztBQUN4Qyx3Q0FBd0M7QUFDeEMsOENBQTJFO0FBQzNFLGtEQUFtRDtBQUNuRCwwREFBMkQ7QUFDM0QsZ0RBQTREO0FBQzVELGtFQUFzRjtBQUN0RixzQ0FBdUM7QUFFdkMsb0RBQTJDO0FBQzNDLDhDQUE4QztBQUc5Qyx1REFBdUQ7QUFJdkQsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDO0FBQ2hFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQzFDLE1BQU0sU0FBUyxHQUFHLEdBQUcsVUFBVSxlQUFlLENBQUM7QUFDL0MsTUFBTSxRQUFRLEdBQUcsR0FBRyxVQUFVLE1BQU0sQ0FBQztBQUNyQyxNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQztBQUNwQyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUE7QUFDakIsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLFVBQVUsVUFBVSxDQUFBO0FBQ3JELE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxVQUFVLFdBQVcsQ0FBQTtBQUN2RCxNQUFNLFdBQVcsR0FBRyxHQUFHLFVBQVUsVUFBVSxDQUFBO0FBQzNDLE1BQU0sd0JBQXdCLEdBQUcsR0FBRyxVQUFVLG1CQUFtQixDQUFBO0FBQ2pFLE1BQU0seUJBQXlCLEdBQUcsR0FBRyxVQUFVLG9CQUFvQixDQUFBO0FBQ25FLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQTtBQUN6QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUE7QUFDaEIsTUFBTSxzQkFBc0IsR0FBRyxHQUFHLFVBQVUsb0JBQW9CLENBQUE7QUFDaEUsTUFBTSx1QkFB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RUFBRSx1RUFBdUU7WUFDcEYsT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUscUJBQXFCO1lBQy9CLE9BQU8sRUFBRSxFQUNSO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsTUFBTSxDQUFDLGVBQWUsQ0FBQztZQUNyQixNQUFNLEVBQUUsQ0FBQyxTQUFTLENBQUM7WUFDbkIsVUFBVSxFQUFFLENBQUMsdUJBQXVCLENBQUM7WUFDckMsTUFBTSxFQUFFO2dCQUNOLFVBQVUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7Z0JBQ2hDLFVBQVUsRUFBRSxDQUFDLFNBQVMsQ0FBQzthQUN4QjtTQUNGLENBQUMsQ0FBQTtRQUVGLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUE7UUFFdkQsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDbkMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxVQUFVO1NBQ3pCLENBQUMsQ0FBQTtJQUVKLENBQUM7Q0FDRjtBQW5QRCw4REFtUEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2RrID0gcmVxdWlyZSgnQGF3cy1jZGsvY29yZScpO1xuaW1wb3J0IGVjMiA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1lYzInKVxuaW1wb3J0IGVjcyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1lY3MnKVxuaW1wb3J0IGVjciA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1lY3InKVxuaW1wb3J0IHsgUm9sZSwgU2VydmljZVByaW5jaXBhbCwgUG9saWN5U3RhdGVtZW50IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5pbXBvcnQgc2ZuID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLXN0ZXBmdW5jdGlvbnMnKTtcbmltcG9ydCB0YXNrcyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1zdGVwZnVuY3Rpb25zLXRhc2tzJyk7XG5pbXBvcnQgeyBMb2dHcm91cCwgUmV0ZW50aW9uRGF5cyB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1sb2dzJztcbmltcG9ydCB7IERhdGEsIFNlcnZpY2VJbnRlZ3JhdGlvblBhdHRlcm4sIENvbnRleHQgfSBmcm9tICdAYXdzLWNkay9hd3Mtc3RlcGZ1bmN0aW9ucyc7XG5pbXBvcnQgczMgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtczMnKTtcbmltcG9ydCBydWxlID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWV2ZW50cycpXG5pbXBvcnQgeyBSdWxlIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWV2ZW50cyc7XG5pbXBvcnQgbGFtYmRhID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWxhbWJkYScpXG5pbXBvcnQgeyBBcm4gfSBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5pbXBvcnQgdGFyZ2V0cyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1ldmVudHMtdGFyZ2V0cycpXG5pbXBvcnQgeyBJbWFnZVB1bGxQcmluY2lwYWxUeXBlIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWNvZGVidWlsZCc7XG5cblxuY29uc3QgQ09HTklUT19VU0VSX1BPT0xfQVJOID0gcHJvY2Vzcy5lbnYuQ09HTklUT19VU0VSX1BPT0xfQVJOO1xuY29uc3QgU1RBQ0tfTkFNRSA9IHByb2Nlc3MuZW52LlNUQUNLX05BTUU7XG5jb25zdCBST0xFX05BTUUgPSBgJHtTVEFDS19OQU1FfS1mYXJnYXRlLXJvbGVgO1xuY29uc3QgVlBDX05BTUUgPSBgJHtTVEFDS19OQU1FfS12cGNgO1xuY29uc3QgQ0lEUl9CTE9DSyA9IGAxOTguMTYyLjAuMC8yNGA7XG5jb25zdCBNQVhfQVpzID0gMlxuY29uc3QgRUNSX0dBVExJTkdfUkVQT19OQU1FID0gYCR7U1RBQ0tfTkFNRX0tZ2F0bGluZ2BcbmNvbnN0IEVDUl9NT0NLREFUQV9SRVBPX05BTUUgPSBgJHtTVEFDS19OQU1FfS1tb2NrZGF0YWBcbmNvbnN0IEVDU19DTFVTVEVSID0gYCR7U1RBQ0tfTkFNRX0tY2x1c3RlcmBcbmNvbnN0IEdBVExJTkdfRkFSR0FURV9UQVNLX0RFRiA9IGAke1NUQUNLX05BTUV9LWdhdGxpbmctdGFzay1kZWZgXG5jb25zdCBNT0NLREFUQV9GQVJHQVRFX1RBU0tfREVGID0gYCR7U1RBQ0tfTkFNRX0tbW9ja2RhdGEtdGFzay1kZWZgXG5jb25zdCBNRU1PUllfTElNSVQgPSAyMDQ4XG5jb25zdCBDUFUgPSAxMDI0XG5jb25zdCBHQVRMSU5HX0NPTlRBSU5FUl9OQU1FID0gYCR7U1RBQ0tfTkFNRX0tZ2F0bGluZy1jb250YWluZXJgXG5jb25zdCBNT0NLREFUQV9DT05UQUlORVJfTkFNRSA9IGAke1NUQUNLX05BTUV9LW1vY2tkYXRhLWNvbnRhaW5lcmBcbmNvbnN0IFNUQVRFX01BQ0hJTkVfTkFNRSA9IGBsb2FkdGVzdC0ke1NUQUNLX05BTUV9YFxuY29uc3QgUzNfQlVDS0VUX05BTUUgPSBgJHtTVEFDS19OQU1FfS1sb2FkdGVzdGBcblxuZXhwb3J0IGNsYXNzIFBlcmZ0ZXN0U3RhY2tBaXJsaW5lU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkFwcCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qgcm9sZSA9IG5ldyBSb2xlKHRoaXMsIFJPTEVfTkFNRSwge1xuICAgICAgcm9sZU5hbWU6IFJPTEVfTkFNRSxcbiAgICAgIGFzc3VtZWRCeTogbmV3IFNlcnZpY2VQcmluY2lwYWwoJ2Vjcy10YXNrcy5hbWF6b25hd3MuY29tJylcbiAgICB9KVxuXG4gICAgY29uc3QgYnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBcInMzYnVja2V0XCIsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IFMzX0JVQ0tFVF9OQU1FXG4gICAgfSlcblxuICAgIHJvbGUuYWRkVG9Qb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgYCR7YnVja2V0LmJ1Y2tldEFybn1gLFxuICAgICAgICBgJHtidWNrZXQuYnVja2V0QXJufS8qYFxuICAgICAgXSxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICdzMzpHZXRPYmplY3RBY2wnLFxuICAgICAgICAnczM6R2V0T2JqZWN0JyxcbiAgICAgICAgJ3MzOkxpc3RCdWNrZXQnLFxuICAgICAgICAnczM6UHV0T2JqZWN0QWNsJyxcbiAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdCdcbiAgICAgIF1cbiAgICB9KSlcblxuICAgIHJvbGUuYWRkVG9Qb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICByZXNvdXJjZXM6IFtgJHtDT0dOSVRPX1VTRVJfUE9PTF9BUk59YF0sXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdjb2duaXRvLWlkcDpBZG1pbkluaXRpYXRlQXV0aCcsXG4gICAgICAgICdjb2duaXRvLWlkcDpBZG1pbkNyZWF0ZVVzZXInLFxuICAgICAgICAnY29nbml0by1pZHA6QWRtaW5TZXRVc2VyUGFzc3dvcmQnLFxuICAgICAgICAnY29nbml0by1pZHA6VXBkYXRlVXNlclBvb2xDbGllbnQnLFxuICAgICAgICAnY29nbml0by1pZHA6QWRtaW5EZWxldGVVc2VyJ1xuICAgICAgXVxuICAgIH0pKVxuXG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgVlBDX05BTUUsIHtcbiAgICAgIGNpZHI6IENJRFJfQkxPQ0ssXG4gICAgICBtYXhBenM6IE1BWF9BWnNcbiAgICB9KVxuXG4gICAgY29uc3QgZ2F0bGluZ1JlcG9zaXRvcnkgPSBuZXcgZWNyLlJlcG9zaXRvcnkodGhpcywgRUNSX0dBVExJTkdfUkVQT19OQU1FLCB7XG4gICAgICByZXBvc2l0b3J5TmFtZTogRUNSX0dBVExJTkdfUkVQT19OQU1FXG4gICAgfSk7XG5cbiAgICBjb25zdCBtb2NrRGF0YVJlcG9zaXRvcnkgPSBuZXcgZWNyLlJlcG9zaXRvcnkodGhpcywgRUNSX01PQ0tEQVRBX1JFUE9fTkFNRSwge1xuICAgICAgcmVwb3NpdG9yeU5hbWU6IEVDUl9NT0NLREFUQV9SRVBPX05BTUVcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWNzLkNsdXN0ZXIodGhpcywgRUNTX0NMVVNURVIsIHtcbiAgICAgIHZwYzogdnBjLFxuICAgICAgY2x1c3Rlck5hbWU6IEVDU19DTFVTVEVSXG4gICAgfSk7XG5cbiAgICBjb25zdCBnYXRsaW5nVGFza0RlZmluaXRpb24gPSBuZXcgZWNzLkZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCBHQVRMSU5HX0ZBUkdBVEVfVEFTS19ERUYsIHtcbiAgICAgIGZhbWlseTogR0FUTElOR19GQVJHQVRFX1RBU0tfREVGLFxuICAgICAgZXhlY3V0aW9uUm9sZTogcm9sZSxcbiAgICAgIHRhc2tSb2xlOiByb2xlLFxuICAgICAgbWVtb3J5TGltaXRNaUI6IE1FTU9SWV9MSU1JVCxcbiAgICAgIGNwdTogQ1BVXG4gICAgfSk7XG5cbiAgICBjb25zdCBtb2NrRGF0YVRhc2tEZWZpbml0aW9uID0gbmV3IGVjcy5GYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgTU9DS0RBVEFfRkFSR0FURV9UQVNLX0RFRiwge1xuICAgICAgZmFtaWx5OiBNT0NLREFUQV9GQVJHQVRFX1RBU0tfREVGLFxuICAgICAgZXhlY3V0aW9uUm9sZTogcm9sZSxcbiAgICAgIHRhc2tSb2xlOiByb2xlLFxuICAgICAgbWVtb3J5TGltaXRNaUI6IE1FTU9SWV9MSU1JVCxcbiAgICAgIGNwdTogQ1BVXG4gICAgfSk7XG5cbiAgICBjb25zdCBnYXRsaW5nTG9nZ2luZyA9IG5ldyBlY3MuQXdzTG9nRHJpdmVyKHtcbiAgICAgIGxvZ0dyb3VwOiBuZXcgTG9nR3JvdXAodGhpcywgR0FUTElOR19DT05UQUlORVJfTkFNRSwge1xuICAgICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2Vjcy8ke0dBVExJTkdfQ09OVEFJTkVSX05BTUV9YCxcbiAgICAgICAgcmV0ZW50aW9uOiBSZXRlbnRpb25EYXlzLk9ORV9XRUVLXG4gICAgICB9KSxcbiAgICAgIHN0cmVhbVByZWZpeDogXCJnYXRsaW5nXCJcbiAgICB9KVxuXG4gICAgY29uc3QgbW9ja0RhdGFsb2dnaW5nID0gbmV3IGVjcy5Bd3NMb2dEcml2ZXIoe1xuICAgICAgbG9nR3JvdXA6IG5ldyBMb2dHcm91cCh0aGlzLCBNT0NLREFUQV9DT05UQUlORVJfTkFNRSwge1xuICAgICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2Vjcy8ke01PQ0tEQVRBX0NPTlRBSU5FUl9OQU1FfWAsXG4gICAgICAgIHJldGVudGlvbjogUmV0ZW50aW9uRGF5cy5PTkVfV0VFS1xuICAgICAgfSksXG4gICAgICBzdHJlYW1QcmVmaXg6IFwibW9ja2RhdGFcIlxuICAgIH0pXG5cbiAgICAvLyBDcmVhdGUgY29udGFpbmVyIGZyb20gbG9jYWwgYERvY2tlcmZpbGVgIGZvciBHYXRsaW5nXG4gICAgY29uc3QgZ2F0bGluZ0FwcENvbnRhaW5lciA9IGdhdGxpbmdUYXNrRGVmaW5pdGlvbi5hZGRDb250YWluZXIoR0FUTElOR19DT05UQUlORVJfTkFNRSwge1xuICAgICAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tRWNyUmVwb3NpdG9yeShnYXRsaW5nUmVwb3NpdG9yeSksXG4gICAgICBsb2dnaW5nOiBnYXRsaW5nTG9nZ2luZ1xuICAgIH0pO1xuXG4gICAgY29uc3QgbW9ja0RhdGFBcHBDb250YWluZXIgPSBtb2NrRGF0YVRhc2tEZWZpbml0aW9uLmFkZENvbnRhaW5lcihNT0NLREFUQV9DT05UQUlORVJfTkFNRSwge1xuICAgICAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tRWNyUmVwb3NpdG9yeShtb2NrRGF0YVJlcG9zaXRvcnkpLFxuICAgICAgbG9nZ2luZzogbW9ja0RhdGFsb2dnaW5nXG4gICAgfSk7XG5cbiAgICAvLyBTdGVwIGZ1bmN0aW9uIGZvciBzZXR0aW5nIHRoZSBsb2FkIHRlc3RcbiAgICBjb25zdCBzZXR1cFVzZXJzID0gbmV3IHNmbi5UYXNrKHRoaXMsIFwiU2V0dXAgVXNlcnNcIiwge1xuICAgICAgdGFzazogbmV3IHRhc2tzLlJ1bkVjc0ZhcmdhdGVUYXNrKHtcbiAgICAgICAgY2x1c3RlcixcbiAgICAgICAgdGFza0RlZmluaXRpb246IG1vY2tEYXRhVGFza0RlZmluaXRpb24sXG4gICAgICAgIGFzc2lnblB1YmxpY0lwOiB0cnVlLFxuICAgICAgICBjb250YWluZXJPdmVycmlkZXM6IFt7XG4gICAgICAgICAgY29udGFpbmVyTmFtZTogbW9ja0RhdGFBcHBDb250YWluZXIuY29udGFpbmVyTmFtZSxcbiAgICAgICAgICBjb21tYW5kOiBEYXRhLmxpc3RBdCgnJC5jb21tYW5kcycpLFxuICAgICAgICAgIGVudmlyb25tZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG5hbWU6ICdzZXR1cC11c2VycycsXG4gICAgICAgICAgICAgIHZhbHVlOiBDb250ZXh0LnRhc2tUb2tlblxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfV0sXG4gICAgICAgIGludGVncmF0aW9uUGF0dGVybjogU2VydmljZUludGVncmF0aW9uUGF0dGVybi5XQUlUX0ZPUl9UQVNLX1RPS0VOXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBjb25zdCBsb2FkRmxpZ2h0cyA9IG5ldyBzZm4uVGFzayh0aGlzLCBcIkxvYWQgRmxpZ2h0c1wiLCB7XG4gICAgICB0YXNrOiBuZXcgdGFza3MuUnVuRWNzRmFyZ2F0ZVRhc2soe1xuICAgICAgICBjbHVzdGVyLFxuICAgICAgICB0YXNrRGVmaW5pdGlvbjogbW9ja0RhdGFUYXNrRGVmaW5pdGlvbixcbiAgICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXG4gICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBtb2NrRGF0YUFwcENvbnRhaW5lci5jb250YWluZXJOYW1lLFxuICAgICAgICAgIGNvbW1hbmQ6IERhdGEubGlzdEF0KCckLmNvbW1hbmRzJyksXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbmFtZTogJ2xvYWQtZmxpZ2h0cycsXG4gICAgICAgICAgICAgIHZhbHVlOiBDb250ZXh0LnRhc2tUb2tlblxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfV0sXG4gICAgICAgIGludGVncmF0aW9uUGF0dGVybjogU2VydmljZUludGVncmF0aW9uUGF0dGVybi5XQUlUX0ZPUl9UQVNLX1RPS0VOXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBjb25zdCBydW5HYXRsaW5nID0gbmV3IHNmbi5UYXNrKHRoaXMsIFwiUnVuIEdhdGxpbmdcIiwge1xuICAgICAgdGFzazogbmV3IHRhc2tzLlJ1bkVjc0ZhcmdhdGVUYXNrKHtcbiAgICAgICAgY2x1c3RlcixcbiAgICAgICAgdGFza0RlZmluaXRpb246IGdhdGxpbmdUYXNrRGVmaW5pdGlvbixcbiAgICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXG4gICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBnYXRsaW5nQXBwQ29udGFpbmVyLmNvbnRhaW5lck5hbWUsXG4gICAgICAgICAgY29tbWFuZDogRGF0YS5saXN0QXQoJyQuY29tbWFuZHMnKSxcbiAgICAgICAgICBlbnZpcm9ubWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBuYW1lOiAncnVuLWdhdGxpbmcnLFxuICAgICAgICAgICAgICB2YWx1ZTogQ29udGV4dC50YXNrVG9rZW5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1dLFxuICAgICAgICBpbnRlZ3JhdGlvblBhdHRlcm46IFNlcnZpY2VJbnRlZ3JhdGlvblBhdHRlcm4uV0FJVF9GT1JfVEFTS19UT0tFTlxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgY29uc3QgY29uc29saWRhdGVSZXBvcnQgPSBuZXcgc2ZuLlRhc2sodGhpcywgXCJDb25zb2xpZGF0ZSBSZXBvcnRcIiwge1xuICAgICAgdGFzazogbmV3IHRhc2tzLlJ1bkVjc0ZhcmdhdGVUYXNrKHtcbiAgICAgICAgY2x1c3RlcixcbiAgICAgICAgdGFza0RlZmluaXRpb246IGdhdGxpbmdUYXNrRGVmaW5pdGlvbixcbiAgICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXG4gICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBnYXRsaW5nQXBwQ29udGFpbmVyLmNvbnRhaW5lck5hbWUsXG4gICAgICAgICAgY29tbWFuZDogRGF0YS5saXN0QXQoJyQuY29tbWFuZHMnKSxcbiAgICAgICAgICBlbnZpcm9ubWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBuYW1lOiAnY29uc29saWRhdGUtcmVwb3J0JyxcbiAgICAgICAgICAgICAgdmFsdWU6IENvbnRleHQudGFza1Rva2VuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9XSxcbiAgICAgICAgaW50ZWdyYXRpb25QYXR0ZXJuOiBTZXJ2aWNlSW50ZWdyYXRpb25QYXR0ZXJuLldBSVRfRk9SX1RBU0tfVE9LRU5cbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGNvbnN0IGNsZWFuVXAgPSBuZXcgc2ZuLlRhc2sodGhpcywgXCJDbGVhbiBVcFwiLCB7XG4gICAgICB0YXNrOiBuZXcgdGFza3MuUnVuRWNzRmFyZ2F0ZVRhc2soe1xuICAgICAgICBjbHVzdGVyLFxuICAgICAgICB0YXNrRGVmaW5pdGlvbjogbW9ja0RhdGFUYXNrRGVmaW5pdGlvbixcbiAgICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXG4gICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBtb2NrRGF0YUFwcENvbnRhaW5lci5jb250YWluZXJOYW1lLFxuICAgICAgICAgIGNvbW1hbmQ6IERhdGEubGlzdEF0KCckLmNvbW1hbmRzJyksXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbmFtZTogJ2NsZWFuLXVwJyxcbiAgICAgICAgICAgICAgdmFsdWU6IENvbnRleHQudGFza1Rva2VuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9XSxcbiAgICAgICAgaW50ZWdyYXRpb25QYXR0ZXJuOiBTZXJ2aWNlSW50ZWdyYXRpb25QYXR0ZXJuLldBSVRfRk9SX1RBU0tfVE9LRU5cbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGNvbnN0IHN0ZXBmdW5jRGVmaW5pdGlvbiA9IHNldHVwVXNlcnNcbiAgICAgIC5uZXh0KGxvYWRGbGlnaHRzKVxuICAgICAgLm5leHQocnVuR2F0bGluZylcbiAgICAgIC5uZXh0KGNvbnNvbGlkYXRlUmVwb3J0KVxuICAgICAgLm5leHQoY2xlYW5VcClcblxuICAgIGNvbnN0IGxvYWR0ZXN0c2ZuID0gbmV3IHNmbi5TdGF0ZU1hY2hpbmUodGhpcywgU1RBVEVfTUFDSElORV9OQU1FLCB7XG4gICAgICBzdGF0ZU1hY2hpbmVOYW1lOiBTVEFURV9NQUNISU5FX05BTUUsXG4gICAgICBkZWZpbml0aW9uOiBzdGVwZnVuY0RlZmluaXRpb25cbiAgICB9KVxuXG4gICAgY29uc3QgZWNzTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcImVjc3Rhc2tsYW1iZGFcIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzEwX1gsXG4gICAgICBoYW5kbGVyOiBcImluZGV4LmhhbmRsZXJcIixcbiAgICAgIGNvZGU6IG5ldyBsYW1iZGEuQXNzZXRDb2RlKFwibGFtYmRhXCIpLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgJHtTVEFDS19OQU1FfS1lY3MtdGFzay1jaGFuZ2VgXG4gICAgfSlcblxuICAgIGVjc0xhbWJkYS5hZGRUb1JvbGVQb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbXCJzdGF0ZXM6U2VuZFRhc2tTdWNjZXNzXCJdLFxuICAgICAgcmVzb3VyY2VzOiBbbG9hZHRlc3RzZm4uc3RhdGVNYWNoaW5lQXJuXVxuICAgIH0pKVxuXG4gICAgY29uc3QgY3dSdWxlID0gbmV3IFJ1bGUodGhpcywgXCJjdy1ydWxlXCIsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlJ1bGUgdGhhdCBsb29rcyBhdCBFQ1MgVGFzayBjaGFuZ2Ugc3RhdGUgYW5kIHRyaWdnZXJzIExhbWJkYSBmdW5jdGlvblwiLFxuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIHJ1bGVOYW1lOiBcIkVDUy10YXNrLWNoYW5nZS1jZGtcIixcbiAgICAgIHRhcmdldHM6IFsgXG4gICAgICBdXG4gICAgfSlcblxuICAgIGN3UnVsZS5hZGRFdmVudFBhdHRlcm4oe1xuICAgICAgc291cmNlOiBbJ2F3cy5lY3MnXSxcbiAgICAgIGRldGFpbFR5cGU6IFtcIkVDUyBUYXNrIFN0YXRlIENoYW5nZVwiXSxcbiAgICAgIGRldGFpbDoge1xuICAgICAgICBjbHVzdGVyQXJuOiBbY2x1c3Rlci5jbHVzdGVyQXJuXSxcbiAgICAgICAgbGFzdFN0YXR1czogW1wiU1RPUFBFRFwiXVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBjd1J1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGVjc0xhbWJkYSkpXG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnczMtYnVja2V0Jywge1xuICAgICAgdmFsdWU6IGJ1Y2tldC5idWNrZXROYW1lXG4gICAgfSlcblxuICB9XG59XG4iXX0=