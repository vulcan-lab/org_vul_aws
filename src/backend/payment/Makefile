PROFILE := "archive"
SHARED_LIBS_LAYER ?= "arn:aws:lambda:us-x-x:xxxxxxxxxxx:layer:ProjectSharedLibs:x"   # add your own a shared libs_layer 

target:
	@$(MAKE) pr

dev:
	poetry install

format:
	poetry run isort -rc .
	poetry run black src
	poetry run black tests

lint: format
	poetry run flake8

test:
	poetry run pytest

test-html:
	poetry run pytest --cov-report html

pr: lint test 

invoke-collect-payment:
	sam local invoke \
		--event src/collect-payment/event.json \
		--env-vars local-env-vars.json CollectPayment \
		--parameter-overrides SharedLibsLayer=${SHARED_LIBS_LAYER} \
		--profile ${PROFILE}

invoke-refund-payment:
	sam local invoke \
		--event src/refund-payment/event.json \
		--env-vars local-env-vars.json RefundPayment \
		--parameter-overrides SharedLibsLayer=${SHARED_LIBS_LAYER} \
		--profile ${PROFILE}

deploy: ##=> Deploy payment service using SAM
    $(info [*] Packaging and deploying Payment service...)
    sam package \
        --s3-bucket $${DEPLOYMENT_BUCKET_NAME} \
        --output-template-file packaged.yaml && \
    aws cloudformation deploy \
        --template-file packaged.yaml \
        --stack-name $${STACK_NAME}-payment-$${AWS_BRANCH} \
        --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
        --parameter-overrides \
            Stage=$${AWS_BRANCH} \
            SharedLibsLayer=$(SHARED_LIBS_LAYER)


delete: ##=> Delete payment service
	aws cloudformation delete-stack --stack-name $${STACK_NAME}-payment-$${AWS_BRANCH}
