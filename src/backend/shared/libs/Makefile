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

deploy: deploy.shared-lambda-layers deploy.payment ##=> Deploy all services

deploy.shared-lambda-layers: ##=> Deploy shared Lambda Layers using SAM
	$(info [*] Packaging and deploying shared Lambda libs layers...)
	sam build && \
	sam package \
		--s3-bucket $(DEPLOYMENT_BUCKET_NAME) \
		--output-template-file packaged.yaml && \
	sam deploy \
		--template-file packaged.yaml \
		--stack-name $(STACK_NAME)-shared-layers-$(AWS_BRANCH) \
		--parameter-overrides ParameterKey=Stage,ParameterValue=$(AWS_BRANCH) \
		--capabilities CAPABILITY_IAM

deploy.payment: ##=> Deploy Payment service using SAM
	$(info [*] Packaging and deploying Payment service...)
	sam package \
		--s3-bucket $(DEPLOYMENT_BUCKET_NAME) \
		--output-template-file packaged.yaml && \
	aws cloudformation deploy \
		--template-file packaged.yaml \
		--stack-name $(STACK_NAME)-payment-$(AWS_BRANCH) \
		--capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
		--parameter-overrides \
			Stage=$(AWS_BRANCH) \
			SharedLibsLayer=$(SHARED_LIBS_LAYER)

delete: ##=> Delete shared Lambda layers stack
	aws cloudformation delete-stack --stack-name $(STACK_NAME)-shared-layers-$(AWS_BRANCH)
