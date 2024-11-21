# backend/tests/test_main.py

import os
import pytest
from fastapi.testclient import TestClient
from moto import mock_dynamodb
import boto3
from backend.main import app, DYNAMODB_TABLE_NAME, REGION_NAME

os.environ['TESTING'] = '1'
client = TestClient(app)

# Fixture to mock DynamoDB
@pytest.fixture(scope='function')
def mock_dynamodb_fixture():
    with mock_dynamodb():
        # Create a mocked DynamoDB resource and table
        dynamodb = boto3.resource('dynamodb', region_name=REGION_NAME)
        table = dynamodb.create_table(
            TableName=DYNAMODB_TABLE_NAME,
            KeySchema=[
                {'AttributeName': 'game', 'KeyType': 'HASH'},  # Partition key
                {'AttributeName': 'score_id', 'KeyType': 'RANGE'}  # Sort key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'game', 'AttributeType': 'S'},
                {'AttributeName': 'score_id', 'AttributeType': 'S'},
                {'AttributeName': 'moves', 'AttributeType': 'N'},
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            },
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'GameMovesIndex',
                    'KeySchema': [
                        {'AttributeName': 'game', 'KeyType': 'HASH'},
                        {'AttributeName': 'moves', 'KeyType': 'RANGE'},
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {
                        'ReadCapacityUnits': 5,
                        'WriteCapacityUnits': 5
                    }
                }
            ]
        )
        table.wait_until_exists()
        # Assign the mocked table to the app's state
        app.state.table = table
        yield
        # Clean up after test
        table.delete()
        dynamodb = None

def test_submit_win_data(mock_dynamodb_fixture):
    response = client.post("/api/win_state", json={
        "moves": 10,
        "time": "2023-01-01T12:00:00",
        "game": "test_game",
        "name": "Tester"
    })
    assert response.status_code == 200
    assert response.json() == {"message": "Win data received successfully"}

def test_get_win_states(mock_dynamodb_fixture):
    # Submit sample data
    client.post("/api/win_state", json={
        "moves": 10,
        "time": "2023-01-01T12:00:00",
        "game": "test_game",
        "name": "Tester1"
    })
    client.post("/api/win_state", json={
        "moves": 8,
        "time": "2023-01-01T11:00:00",
        "game": "test_game",
        "name": "Tester2"
    })
    # Retrieve win states
    response = client.get("/api/win_states", params={"game": "test_game"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]['moves'] == 8
    assert data[0]['name'] == 'Tester2'
    assert data[1]['moves'] == 10
    assert data[1]['name'] == 'Tester1'
