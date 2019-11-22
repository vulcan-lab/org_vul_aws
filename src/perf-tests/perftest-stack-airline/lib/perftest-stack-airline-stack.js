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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZnRlc3Qtc3RhY2stYWlybGluZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBlcmZ0ZXN0LXN0YWNrLWFpcmxpbmUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxQ0FBc0M7QUFDdEMsd0NBQXdDO0FBQ3hDLHdDQUF3QztBQUN4Qyx3Q0FBd0M7QUFDeEMsOENBQTJFO0FBQzNFLGtEQUFtRDtBQUNuRCwwREFBMkQ7QUFDM0QsZ0RBQTREO0FBQzVELGtFQUFzRjtBQUN0RixzQ0FBdUM7QUFFdkMsb0RBQTJDO0FBQzNDLDhDQUE4QztBQUc5Qyx1REFBdUQ7QUFJdkQsTUFBTSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDO0FBQ2hFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQzFDLE1BQU0sU0FBUyxHQUFHLEdBQUcsVUFBVSxlQUFlLENBQUM7QUFDL0MsTUFBTSxRQUFRLEdBQUcsR0FBRyxVQUFVLE1BQU0sQ0FBQztBQUNyQyxNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQztBQUNwQyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUE7QUFDakIsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLFVBQVUsVUFBVSxDQUFBO0FBQ3JELE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxVQUFVLFdBQVcsQ0FBQTtBQUN2RCxNQUFNLFdBQVcsR0FBRyxHQUFHLFVBQVUsVUFBVSxDQUFBO0FBQzNDLE1BQU0sd0JBQXdCLEdBQUcsR0FBRyxVQUFVLG1CQUFtQixDQUFBO0FBQ2pFLE1BQU0seUJBQXlCLEdBQUcsR0FBRyxVQUFVLG9CQUFvQixDQUFBO0FBQ25FLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQTtBQUN6QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUE7QUFDaEIsTUFBTSxzQkFBc0IsR0FBRyxHQUFHLFVBQVUsb0JBQW9CLENBQUE7QUFDaEUsTUFBTSx1QkFB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QUU7WUFDdkMsV0FBVyxFQUFFLHVFQUF1RTtZQUNwRixPQUFPLEVBQUUsSUFBSTtZQUNiLFFBQVEsRUFBRSxxQkFBcUI7WUFDL0IsT0FBTyxFQUFFLEVBQ1I7U0FDRixDQUFDLENBQUE7UUFFRixNQUFNLENBQUMsZUFBZSxDQUFDO1lBQ3JCLE1BQU0sRUFBRSxDQUFDLFNBQVMsQ0FBQztZQUNuQixVQUFVLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztZQUNyQyxNQUFNLEVBQUU7Z0JBQ04sVUFBVSxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztnQkFDaEMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDO2FBQ3hCO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtRQUV2RCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNuQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFVBQVU7U0FDekIsQ0FBQyxDQUFBO0lBRUosQ0FBQztDQUNGO0FBcFBELDhEQW9QQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjZGsgPSByZXF1aXJlKCdAYXdzLWNkay9jb3JlJyk7XG5pbXBvcnQgZWMyID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWVjMicpXG5pbXBvcnQgZWNzID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWVjcycpXG5pbXBvcnQgZWNyID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWVjcicpXG5pbXBvcnQgeyBSb2xlLCBTZXJ2aWNlUHJpbmNpcGFsLCBQb2xpY3lTdGF0ZW1lbnQgfSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCBzZm4gPSByZXF1aXJlKCdAYXdzLWNkay9hd3Mtc3RlcGZ1bmN0aW9ucycpO1xuaW1wb3J0IHRhc2tzID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLXN0ZXBmdW5jdGlvbnMtdGFza3MnKTtcbmltcG9ydCB7IExvZ0dyb3VwLCBSZXRlbnRpb25EYXlzIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWxvZ3MnO1xuaW1wb3J0IHsgRGF0YSwgU2VydmljZUludGVncmF0aW9uUGF0dGVybiwgQ29udGV4dCB9IGZyb20gJ0Bhd3MtY2RrL2F3cy1zdGVwZnVuY3Rpb25zJztcbmltcG9ydCBzMyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1zMycpO1xuaW1wb3J0IHJ1bGUgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtZXZlbnRzJylcbmltcG9ydCB7IFJ1bGUgfSBmcm9tICdAYXdzLWNkay9hd3MtZXZlbnRzJztcbmltcG9ydCBsYW1iZGEgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtbGFtYmRhJylcbmltcG9ydCB7IEFybiB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmltcG9ydCB0YXJnZXRzID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWV2ZW50cy10YXJnZXRzJylcbmltcG9ydCB7IEltYWdlUHVsbFByaW5jaXBhbFR5cGUgfSBmcm9tICdAYXdzLWNkay9hd3MtY29kZWJ1aWxkJztcblxuXG5jb25zdCBDT0dOSVRPX1VTRVJfUE9PTF9BUk4gPSBwcm9jZXNzLmVudi5DT0dOSVRPX1VTRVJfUE9PTF9BUk47XG5jb25zdCBTVEFDS19OQU1FID0gcHJvY2Vzcy5lbnYuU1RBQ0tfTkFNRTtcbmNvbnN0IFJPTEVfTkFNRSA9IGAke1NUQUNLX05BTUV9LWZhcmdhdGUtcm9sZWA7XG5jb25zdCBWUENfTkFNRSA9IGAke1NUQUNLX05BTUV9LXZwY2A7XG5jb25zdCBDSURSX0JMT0NLID0gYDE5OC4xNjIuMC4wLzI0YDtcbmNvbnN0IE1BWF9BWnMgPSAyXG5jb25zdCBFQ1JfR0FUTElOR19SRVBPX05BTUUgPSBgJHtTVEFDS19OQU1FfS1nYXRsaW5nYFxuY29uc3QgRUNSX01PQ0tEQVRBX1JFUE9fTkFNRSA9IGAke1NUQUNLX05BTUV9LW1vY2tkYXRhYFxuY29uc3QgRUNTX0NMVVNURVIgPSBgJHtTVEFDS19OQU1FfS1jbHVzdGVyYFxuY29uc3QgR0FUTElOR19GQVJHQVRFX1RBU0tfREVGID0gYCR7U1RBQ0tfTkFNRX0tZ2F0bGluZy10YXNrLWRlZmBcbmNvbnN0IE1PQ0tEQVRBX0ZBUkdBVEVfVEFTS19ERUYgPSBgJHtTVEFDS19OQU1FfS1tb2NrZGF0YS10YXNrLWRlZmBcbmNvbnN0IE1FTU9SWV9MSU1JVCA9IDIwNDhcbmNvbnN0IENQVSA9IDEwMjRcbmNvbnN0IEdBVExJTkdfQ09OVEFJTkVSX05BTUUgPSBgJHtTVEFDS19OQU1FfS1nYXRsaW5nLWNvbnRhaW5lcmBcbmNvbnN0IE1PQ0tEQVRBX0NPTlRBSU5FUl9OQU1FID0gYCR7U1RBQ0tfTkFNRX0tbW9ja2RhdGEtY29udGFpbmVyYFxuY29uc3QgU1RBVEVfTUFDSElORV9OQU1FID0gYGxvYWR0ZXN0LSR7U1RBQ0tfTkFNRX1gXG5jb25zdCBTM19CVUNLRVRfTkFNRSA9IGAke1NUQUNLX05BTUV9LWxvYWR0ZXN0YFxuXG5leHBvcnQgY2xhc3MgUGVyZnRlc3RTdGFja0FpcmxpbmVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBjZGsuQXBwLCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCByb2xlID0gbmV3IFJvbGUodGhpcywgUk9MRV9OQU1FLCB7XG4gICAgICByb2xlTmFtZTogUk9MRV9OQU1FLFxuICAgICAgYXNzdW1lZEJ5OiBuZXcgU2VydmljZVByaW5jaXBhbCgnZWNzLXRhc2tzLmFtYXpvbmF3cy5jb20nKVxuICAgIH0pXG5cbiAgICBjb25zdCBidWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsIFwiczNidWNrZXRcIiwge1xuICAgICAgYnVja2V0TmFtZTogUzNfQlVDS0VUX05BTUVcbiAgICB9KVxuXG4gICAgcm9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIHJlc291cmNlczogW1xuICAgICAgICBgJHtidWNrZXQuYnVja2V0QXJufWAsXG4gICAgICAgIGAke2J1Y2tldC5idWNrZXRBcm59LypgXG4gICAgICBdLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgJ3MzOkdldE9iamVjdEFjbCcsXG4gICAgICAgICdzMzpHZXRPYmplY3QnLFxuICAgICAgICAnczM6TGlzdEJ1Y2tldCcsXG4gICAgICAgICdzMzpQdXRPYmplY3RBY2wnLFxuICAgICAgICAnczM6RGVsZXRlT2JqZWN0J1xuICAgICAgXVxuICAgIH0pKVxuXG4gICAgcm9sZS5hZGRUb1BvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIHJlc291cmNlczogW2Ake0NPR05JVE9fVVNFUl9QT09MX0FSTn1gXSxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2NvZ25pdG8taWRwOkFkbWluSW5pdGlhdGVBdXRoJyxcbiAgICAgICAgJ2NvZ25pdG8taWRwOkFkbWluQ3JlYXRlVXNlcicsXG4gICAgICAgICdjb2duaXRvLWlkcDpBZG1pbkNyZWF0ZVVzZXInLFxuICAgICAgICAnY29nbml0by1pZHA6QWRtaW5TZXRVc2VyUGFzc3dvcmQnLFxuICAgICAgICAnY29nbml0by1pZHA6VXBkYXRlVXNlclBvb2xDbGllbnQnLFxuICAgICAgICAnY29nbml0by1pZHA6QWRtaW5EZWxldGVVc2VyJ1xuICAgICAgXVxuICAgIH0pKVxuXG4gICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGModGhpcywgVlBDX05BTUUsIHtcbiAgICAgIGNpZHI6IENJRFJfQkxPQ0ssXG4gICAgICBtYXhBenM6IE1BWF9BWnNcbiAgICB9KVxuXG4gICAgY29uc3QgZ2F0bGluZ1JlcG9zaXRvcnkgPSBuZXcgZWNyLlJlcG9zaXRvcnkodGhpcywgRUNSX0dBVExJTkdfUkVQT19OQU1FLCB7XG4gICAgICByZXBvc2l0b3J5TmFtZTogRUNSX0dBVExJTkdfUkVQT19OQU1FXG4gICAgfSk7XG5cbiAgICBjb25zdCBtb2NrRGF0YVJlcG9zaXRvcnkgPSBuZXcgZWNyLlJlcG9zaXRvcnkodGhpcywgRUNSX01PQ0tEQVRBX1JFUE9fTkFNRSwge1xuICAgICAgcmVwb3NpdG9yeU5hbWU6IEVDUl9NT0NLREFUQV9SRVBPX05BTUVcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWNzLkNsdXN0ZXIodGhpcywgRUNTX0NMVVNURVIsIHtcbiAgICAgIHZwYzogdnBjLFxuICAgICAgY2x1c3Rlck5hbWU6IEVDU19DTFVTVEVSXG4gICAgfSk7XG5cbiAgICBjb25zdCBnYXRsaW5nVGFza0RlZmluaXRpb24gPSBuZXcgZWNzLkZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCBHQVRMSU5HX0ZBUkdBVEVfVEFTS19ERUYsIHtcbiAgICAgIGZhbWlseTogR0FUTElOR19GQVJHQVRFX1RBU0tfREVGLFxuICAgICAgZXhlY3V0aW9uUm9sZTogcm9sZSxcbiAgICAgIHRhc2tSb2xlOiByb2xlLFxuICAgICAgbWVtb3J5TGltaXRNaUI6IE1FTU9SWV9MSU1JVCxcbiAgICAgIGNwdTogQ1BVXG4gICAgfSk7XG5cbiAgICBjb25zdCBtb2NrRGF0YVRhc2tEZWZpbml0aW9uID0gbmV3IGVjcy5GYXJnYXRlVGFza0RlZmluaXRpb24odGhpcywgTU9DS0RBVEFfRkFSR0FURV9UQVNLX0RFRiwge1xuICAgICAgZmFtaWx5OiBNT0NLREFUQV9GQVJHQVRFX1RBU0tfREVGLFxuICAgICAgZXhlY3V0aW9uUm9sZTogcm9sZSxcbiAgICAgIHRhc2tSb2xlOiByb2xlLFxuICAgICAgbWVtb3J5TGltaXRNaUI6IE1FTU9SWV9MSU1JVCxcbiAgICAgIGNwdTogQ1BVXG4gICAgfSk7XG5cbiAgICBjb25zdCBnYXRsaW5nTG9nZ2luZyA9IG5ldyBlY3MuQXdzTG9nRHJpdmVyKHtcbiAgICAgIGxvZ0dyb3VwOiBuZXcgTG9nR3JvdXAodGhpcywgR0FUTElOR19DT05UQUlORVJfTkFNRSwge1xuICAgICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2Vjcy8ke0dBVExJTkdfQ09OVEFJTkVSX05BTUV9YCxcbiAgICAgICAgcmV0ZW50aW9uOiBSZXRlbnRpb25EYXlzLk9ORV9XRUVLXG4gICAgICB9KSxcbiAgICAgIHN0cmVhbVByZWZpeDogXCJnYXRsaW5nXCJcbiAgICB9KVxuXG4gICAgY29uc3QgbW9ja0RhdGFsb2dnaW5nID0gbmV3IGVjcy5Bd3NMb2dEcml2ZXIoe1xuICAgICAgbG9nR3JvdXA6IG5ldyBMb2dHcm91cCh0aGlzLCBNT0NLREFUQV9DT05UQUlORVJfTkFNRSwge1xuICAgICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2Vjcy8ke01PQ0tEQVRBX0NPTlRBSU5FUl9OQU1FfWAsXG4gICAgICAgIHJldGVudGlvbjogUmV0ZW50aW9uRGF5cy5PTkVfV0VFS1xuICAgICAgfSksXG4gICAgICBzdHJlYW1QcmVmaXg6IFwibW9ja2RhdGFcIlxuICAgIH0pXG5cbiAgICAvLyBDcmVhdGUgY29udGFpbmVyIGZyb20gbG9jYWwgYERvY2tlcmZpbGVgIGZvciBHYXRsaW5nXG4gICAgY29uc3QgZ2F0bGluZ0FwcENvbnRhaW5lciA9IGdhdGxpbmdUYXNrRGVmaW5pdGlvbi5hZGRDb250YWluZXIoR0FUTElOR19DT05UQUlORVJfTkFNRSwge1xuICAgICAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tRWNyUmVwb3NpdG9yeShnYXRsaW5nUmVwb3NpdG9yeSksXG4gICAgICBsb2dnaW5nOiBnYXRsaW5nTG9nZ2luZ1xuICAgIH0pO1xuXG4gICAgY29uc3QgbW9ja0RhdGFBcHBDb250YWluZXIgPSBtb2NrRGF0YVRhc2tEZWZpbml0aW9uLmFkZENvbnRhaW5lcihNT0NLREFUQV9DT05UQUlORVJfTkFNRSwge1xuICAgICAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tRWNyUmVwb3NpdG9yeShtb2NrRGF0YVJlcG9zaXRvcnkpLFxuICAgICAgbG9nZ2luZzogbW9ja0RhdGFsb2dnaW5nXG4gICAgfSk7XG5cbiAgICAvLyBTdGVwIGZ1bmN0aW9uIGZvciBzZXR0aW5nIHRoZSBsb2FkIHRlc3RcbiAgICBjb25zdCBzZXR1cFVzZXJzID0gbmV3IHNmbi5UYXNrKHRoaXMsIFwiU2V0dXAgVXNlcnNcIiwge1xuICAgICAgdGFzazogbmV3IHRhc2tzLlJ1bkVjc0ZhcmdhdGVUYXNrKHtcbiAgICAgICAgY2x1c3RlcixcbiAgICAgICAgdGFza0RlZmluaXRpb246IG1vY2tEYXRhVGFza0RlZmluaXRpb24sXG4gICAgICAgIGFzc2lnblB1YmxpY0lwOiB0cnVlLFxuICAgICAgICBjb250YWluZXJPdmVycmlkZXM6IFt7XG4gICAgICAgICAgY29udGFpbmVyTmFtZTogbW9ja0RhdGFBcHBDb250YWluZXIuY29udGFpbmVyTmFtZSxcbiAgICAgICAgICBjb21tYW5kOiBEYXRhLmxpc3RBdCgnJC5jb21tYW5kcycpLFxuICAgICAgICAgIGVudmlyb25tZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG5hbWU6ICdzZXR1cC11c2VycycsXG4gICAgICAgICAgICAgIHZhbHVlOiBDb250ZXh0LnRhc2tUb2tlblxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfV0sXG4gICAgICAgIGludGVncmF0aW9uUGF0dGVybjogU2VydmljZUludGVncmF0aW9uUGF0dGVybi5XQUlUX0ZPUl9UQVNLX1RPS0VOXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBjb25zdCBsb2FkRmxpZ2h0cyA9IG5ldyBzZm4uVGFzayh0aGlzLCBcIkxvYWQgRmxpZ2h0c1wiLCB7XG4gICAgICB0YXNrOiBuZXcgdGFza3MuUnVuRWNzRmFyZ2F0ZVRhc2soe1xuICAgICAgICBjbHVzdGVyLFxuICAgICAgICB0YXNrRGVmaW5pdGlvbjogbW9ja0RhdGFUYXNrRGVmaW5pdGlvbixcbiAgICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXG4gICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBtb2NrRGF0YUFwcENvbnRhaW5lci5jb250YWluZXJOYW1lLFxuICAgICAgICAgIGNvbW1hbmQ6IERhdGEubGlzdEF0KCckLmNvbW1hbmRzJyksXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbmFtZTogJ2xvYWQtZmxpZ2h0cycsXG4gICAgICAgICAgICAgIHZhbHVlOiBDb250ZXh0LnRhc2tUb2tlblxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfV0sXG4gICAgICAgIGludGVncmF0aW9uUGF0dGVybjogU2VydmljZUludGVncmF0aW9uUGF0dGVybi5XQUlUX0ZPUl9UQVNLX1RPS0VOXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBjb25zdCBydW5HYXRsaW5nID0gbmV3IHNmbi5UYXNrKHRoaXMsIFwiUnVuIEdhdGxpbmdcIiwge1xuICAgICAgdGFzazogbmV3IHRhc2tzLlJ1bkVjc0ZhcmdhdGVUYXNrKHtcbiAgICAgICAgY2x1c3RlcixcbiAgICAgICAgdGFza0RlZmluaXRpb246IGdhdGxpbmdUYXNrRGVmaW5pdGlvbixcbiAgICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXG4gICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBnYXRsaW5nQXBwQ29udGFpbmVyLmNvbnRhaW5lck5hbWUsXG4gICAgICAgICAgY29tbWFuZDogRGF0YS5saXN0QXQoJyQuY29tbWFuZHMnKSxcbiAgICAgICAgICBlbnZpcm9ubWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBuYW1lOiAncnVuLWdhdGxpbmcnLFxuICAgICAgICAgICAgICB2YWx1ZTogQ29udGV4dC50YXNrVG9rZW5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1dLFxuICAgICAgICBpbnRlZ3JhdGlvblBhdHRlcm46IFNlcnZpY2VJbnRlZ3JhdGlvblBhdHRlcm4uV0FJVF9GT1JfVEFTS19UT0tFTlxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgY29uc3QgY29uc29saWRhdGVSZXBvcnQgPSBuZXcgc2ZuLlRhc2sodGhpcywgXCJDb25zb2xpZGF0ZSBSZXBvcnRcIiwge1xuICAgICAgdGFzazogbmV3IHRhc2tzLlJ1bkVjc0ZhcmdhdGVUYXNrKHtcbiAgICAgICAgY2x1c3RlcixcbiAgICAgICAgdGFza0RlZmluaXRpb246IGdhdGxpbmdUYXNrRGVmaW5pdGlvbixcbiAgICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXG4gICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBnYXRsaW5nQXBwQ29udGFpbmVyLmNvbnRhaW5lck5hbWUsXG4gICAgICAgICAgY29tbWFuZDogRGF0YS5saXN0QXQoJyQuY29tbWFuZHMnKSxcbiAgICAgICAgICBlbnZpcm9ubWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBuYW1lOiAnY29uc29saWRhdGUtcmVwb3J0JyxcbiAgICAgICAgICAgICAgdmFsdWU6IENvbnRleHQudGFza1Rva2VuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9XSxcbiAgICAgICAgaW50ZWdyYXRpb25QYXR0ZXJuOiBTZXJ2aWNlSW50ZWdyYXRpb25QYXR0ZXJuLldBSVRfRk9SX1RBU0tfVE9LRU5cbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGNvbnN0IGNsZWFuVXAgPSBuZXcgc2ZuLlRhc2sodGhpcywgXCJDbGVhbiBVcFwiLCB7XG4gICAgICB0YXNrOiBuZXcgdGFza3MuUnVuRWNzRmFyZ2F0ZVRhc2soe1xuICAgICAgICBjbHVzdGVyLFxuICAgICAgICB0YXNrRGVmaW5pdGlvbjogbW9ja0RhdGFUYXNrRGVmaW5pdGlvbixcbiAgICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXG4gICAgICAgIGNvbnRhaW5lck92ZXJyaWRlczogW3tcbiAgICAgICAgICBjb250YWluZXJOYW1lOiBtb2NrRGF0YUFwcENvbnRhaW5lci5jb250YWluZXJOYW1lLFxuICAgICAgICAgIGNvbW1hbmQ6IERhdGEubGlzdEF0KCckLmNvbW1hbmRzJyksXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbmFtZTogJ2NsZWFuLXVwJyxcbiAgICAgICAgICAgICAgdmFsdWU6IENvbnRleHQudGFza1Rva2VuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9XSxcbiAgICAgICAgaW50ZWdyYXRpb25QYXR0ZXJuOiBTZXJ2aWNlSW50ZWdyYXRpb25QYXR0ZXJuLldBSVRfRk9SX1RBU0tfVE9LRU5cbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGNvbnN0IHN0ZXBmdW5jRGVmaW5pdGlvbiA9IHNldHVwVXNlcnNcbiAgICAgIC5uZXh0KGxvYWRGbGlnaHRzKVxuICAgICAgLm5leHQocnVuR2F0bGluZylcbiAgICAgIC5uZXh0KGNvbnNvbGlkYXRlUmVwb3J0KVxuICAgICAgLm5leHQoY2xlYW5VcClcblxuICAgIGNvbnN0IGxvYWR0ZXN0c2ZuID0gbmV3IHNmbi5TdGF0ZU1hY2hpbmUodGhpcywgU1RBVEVfTUFDSElORV9OQU1FLCB7XG4gICAgICBzdGF0ZU1hY2hpbmVOYW1lOiBTVEFURV9NQUNISU5FX05BTUUsXG4gICAgICBkZWZpbml0aW9uOiBzdGVwZnVuY0RlZmluaXRpb25cbiAgICB9KVxuXG4gICAgY29uc3QgZWNzTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcImVjc3Rhc2tsYW1iZGFcIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzEwX1gsXG4gICAgICBoYW5kbGVyOiBcImluZGV4LmhhbmRsZXJcIixcbiAgICAgIGNvZGU6IG5ldyBsYW1iZGEuQXNzZXRDb2RlKFwibGFtYmRhXCIpLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgJHtTVEFDS19OQU1FfS1lY3MtdGFzay1jaGFuZ2VgXG4gICAgfSlcblxuICAgIGVjc0xhbWJkYS5hZGRUb1JvbGVQb2xpY3kobmV3IFBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbXCJzdGF0ZXM6U2VuZFRhc2tTdWNjZXNzXCJdLFxuICAgICAgcmVzb3VyY2VzOiBbbG9hZHRlc3RzZm4uc3RhdGVNYWNoaW5lQXJuXVxuICAgIH0pKVxuXG4gICAgY29uc3QgY3dSdWxlID0gbmV3IFJ1bGUodGhpcywgXCJjdy1ydWxlXCIsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlJ1bGUgdGhhdCBsb29rcyBhdCBFQ1MgVGFzayBjaGFuZ2Ugc3RhdGUgYW5kIHRyaWdnZXJzIExhbWJkYSBmdW5jdGlvblwiLFxuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIHJ1bGVOYW1lOiBcIkVDUy10YXNrLWNoYW5nZS1jZGtcIixcbiAgICAgIHRhcmdldHM6IFsgXG4gICAgICBdXG4gICAgfSlcblxuICAgIGN3UnVsZS5hZGRFdmVudFBhdHRlcm4oe1xuICAgICAgc291cmNlOiBbJ2F3cy5lY3MnXSxcbiAgICAgIGRldGFpbFR5cGU6IFtcIkVDUyBUYXNrIFN0YXRlIENoYW5nZVwiXSxcbiAgICAgIGRldGFpbDoge1xuICAgICAgICBjbHVzdGVyQXJuOiBbY2x1c3Rlci5jbHVzdGVyQXJuXSxcbiAgICAgICAgbGFzdFN0YXR1czogW1wiU1RPUFBFRFwiXVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBjd1J1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGVjc0xhbWJkYSkpXG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnczMtYnVja2V0Jywge1xuICAgICAgdmFsdWU6IGJ1Y2tldC5idWNrZXROYW1lXG4gICAgfSlcblxuICB9XG59XG4iXX0=