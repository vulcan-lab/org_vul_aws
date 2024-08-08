import os
import sys
import json
import pytest
import boto3
from botocore.stub import Stubber
from botocore.exceptions import ClientError

# Load environment variables before importing the release module
def load_env_vars():
    with open(os.path.join(os.path.dirname(__file__), '../../local-env-vars.json')) as f:
        env_vars = json.load(f)
    for key, value in env_vars.items():
        for var, val in value.items():
            os.environ[var] = val

# Call the function to load environment variables
load_env_vars()

# Add the directory containing the 'release_flight' module to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../src'))

from reserve_flight.reserve import reserve_seat_on_flight

@pytest.fixture
def setup_dynamodb_stub():
    # Create a boto3 DynamoDB resource and a stubber
    dynamodb = boto3.resource('dynamodb')
    stubber = Stubber(dynamodb.meta.client)
    return dynamodb, stubber

@pytest.fixture
def event_data():
    # Load event data from JSON file
    with open(os.path.join(os.path.dirname(__file__), 'event.json')) as file:
        return json.load(file)

def test_reserve_seat_on_flight_success(setup_dynamodb_stub):
    dynamodb, stubber = setup_dynamodb_stub
    table_name = os.environ['FLIGHT_TABLE_NAME']
    table = dynamodb.Table(table_name)
    
    # Expected parameters for update_item
    expected_params = {
        'Key': {'id': '9e0cc93c-555b-4554-959d-f13a70de6c5a'},
        'ConditionExpression': 'id = :idVal AND seatCapacity > :zero',
        'UpdateExpression': 'SET seatCapacity = seatCapacity - :dec',
        'ExpressionAttributeValues': {
            ':idVal': '9e0cc93c-555b-4554-959d-f13a70de6c5a',
            ':dec': 1,
            ':zero': 0
        }
    }
    
    # Add a successful response to the stubber
    stubber.add_response('update_item', {}, expected_params)
    stubber.activate()

    try:
        # Call the function
        result = reserve_seat_on_flight('9e0cc93c-555b-4554-959d-f13a70de6c5a')
        
        # Verify the result
        assert result == {'status': 'SUCCESS'}
    finally:
        # Make sure to deactivate the stubber
        stubber.deactivate()
