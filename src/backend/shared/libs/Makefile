deploy: ##=> Deploy shared Lambda Layers using SAM
    $(info [*] Packaging and deploying shared Lambda libs layers...)
    AWS_BRANCH=archive && \
    sam build && \
    sam package \
        --s3-bucket $(DEPLOYMENT_BUCKET_NAME) \
        --output-template-file packaged.yaml && \
    sam deploy \
        --template-file packaged.yaml \
        --stack-name $(STACK_NAME)-shared-layers-$(AWS_BRANCH) \
        --parameter-overrides ParameterKey=Stage,ParameterValue=$(AWS_BRANCH) \
        --capabilities CAPABILITY_IAM
    
    # Add this line to output the SharedLibsLayer ARN
    @echo "SharedLibsLayer=$$(aws cloudformation describe-stacks --stack-name $(STACK_NAME)-shared-layers-$(AWS_BRANCH) --query 'Stacks[0].Outputs[?OutputKey==`SharedLibsLayerArn`].OutputValue' --output text)"

delete: ##=> Delete shared Lambda layers stack
	aws cloudformation delete-stack --stack-name $(STACK_NAME)-shared-layers-$(AWS_BRANCH)

# deploy: ##=> Deploy shared Lambda Layers using SAM
# 	$(info [*] Packaging and deploying shared Lambda libs layers...)
# 	AWS_BRANCH=archive && \
# 	sam build && \
# 	sam package \
# 		--s3-bucket $(DEPLOYMENT_BUCKET_NAME) \
# 		--output-template-file packaged.yaml && \
# 	sam deploy \
# 		--template-file packaged.yaml \
# 		--stack-name $(STACK_NAME)-shared-layers-$(AWS_BRANCH) \
# 		--parameter-overrides ParameterKey=Stage,ParameterValue=$(AWS_BRANCH) \
# 		--capabilities CAPABILITY_IAM

# delete: ##=> Delete shared Lambda layers stack
# 	aws cloudformation delete-stack --stack-name $(STACK_NAME)-shared-layers-$(AWS_BRANCH)