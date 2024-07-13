##########################
# Bootstrapping variables
##########################

AWS_BRANCH ?= "archive" #git branch 
FLIGHT_TABLE_NAME ?= "xxxxxxxx"  # dynamodb FLIGHT_TABLE_NAME
STACK_NAME ?= "xxxxxxxx"         # cloudformation stack 
DEPLOYMENT_BUCKET_NAME ?= "xxxxxxxx"   # S3 Bucket 
GRAPHQL_API_ID ?= " xxxxx"  
BOOKING_TABLE_NAME ?= "xxxxxxx"  #dynamodb BOOKING_TABLE_NAME
REGION ?= us-east=2
SHARED_LIBS_LAYER ?= "arn:aws:lambda:us-x-x:xxxxxxxxxxx:layer:ProjectSharedLibs:x"   # add your own a shared libs_layer in lambda layers 


target:
	$(info ${HELP_MESSAGE})
	@exit 0

init: ##=> Install OS deps and dev tools
	$(info [*] Bootstrapping CI system...)
	@$(MAKE) _install_os_packages

deploy: ##=> Deploy services
	$(info [*] Deploying...)
	$(MAKE) deploy.shared-lambda-layers || true
	$(MAKE) deploy.payment

delete: ##=> Delete services
	$(MAKE) delete.payment
	$(MAKE) delete.shared-lambda-layers

delete.payment: ##=> Delete payment service
	$(MAKE) -C src/backend/payment delete

delete.shared-lambda-layers: ##=> Delete shared Lambda layers stack
	$(MAKE) -C src/backend/shared/libs delete

deploy.payment: ##=> Deploy Payment service using SAM
    $(MAKE) -C src/backend/payment deploy SHARED_LIBS_LAYER=$(SHARED_LIBS_LAYER)

deploy.shared-lambda-layers: ##=> Deploy shared Lambda Layers using SAM
	$(MAKE) -C src/backend/shared/libs deploy

export.parameter:
	$(info [+] Adding new parameter named "${NAME}")
	aws ssm put-parameter \
		--name "$${NAME}" \
		--type "String" \
		--value "$${VALUE}" \
		--overwrite

#############
#  Helpers  #
#############

_install_os_packages:
	$(info [*] Installing jq...)
	npm install -g jq-cli-wrapper
	$(info [*] Upgrading Python SAM CLI and CloudFormation linter to the latest version...)
	python3 -m pip install --upgrade --user cfn-lint aws-sam-cli
	npm -g install aws-cdk

define HELP_MESSAGE

##########################
#  Environment variables  #
##########################
	

	These variables are automatically filled at CI time except STRIPE_SECRET_KEY
	If doing a dirty/individual/non-ci deployment locally you'd need them to be set

	AWS_BRANCH: "archive"
		Description: Feature branch name used as part of stacks name; added by Amplify Console by default
	FLIGHT_TABLE_NAME: "Flight-xxxxxxxx-xxxx"
		Description: Flight Table name created by Amplify for Catalog service
	STACK_NAME: "awsserverlessairline-xxxxx"
		Description: Stack Name already deployed; used for dirty/individual deployment
	DEPLOYMENT_BUCKET_NAME: " "
		Description: S3 Bucket name used for deployment artifacts
	GRAPHQL_API_ID: "xxxxxx"
		Description: AppSync GraphQL ID already deployed
	BOOKING_TABLE_NAME: "Booking-xxxxxx"
		Description: Flight Table name created by Amplify for Booking service
	STRIPE_SECRET_KEY: "sk_live_xxxxxxxxx"
		Description: Stripe Private Secret Key generated in Stripe; manually added in Amplify Console Env Variables per App

	Common usage:

	...::: Bootstraps environment with necessary tools like SAM CLI, cfn-lint, etc. :::...
	$ make init

	...::: Deploy all SAM based services :::...
	$ make deploy

	...::: Delete all SAM based services :::...
	$ make delete

	...::: Export parameter and its value to System Manager Parameter Store :::...
	$ make export.parameter NAME="/env/service/amplify/api/id" VALUE="xzklsdio234"
endef 