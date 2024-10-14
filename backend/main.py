# backend/main.py

import os
import uuid
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

# DynamoDB configuration
DYNAMODB_ENDPOINT_URL = os.getenv('DYNAMODB_ENDPOINT_URL', 'http://dynamodb-local:8000')
DYNAMODB_TABLE_NAME = 'HighScores'

# Provide dummy AWS credentials
AWS_ACCESS_KEY_ID = 'fakeMyKeyId'
AWS_SECRET_ACCESS_KEY = 'fakeSecretAccessKey'

# Initialize DynamoDB resource with dummy credentials
dynamodb = boto3.resource(
    'dynamodb',
    endpoint_url=DYNAMODB_ENDPOINT_URL,
    region_name='us-west-2',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

app = FastAPI()

# CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define Pydantic models
class WinData(BaseModel):
    moves: int
    time: str
    game: str
    name: str = None  # Name can be optional initially

class HighScore(BaseModel):
    moves: int
    time: str
    name: str

# Create DynamoDB table if it doesn't exist
def create_table():
    existing_tables = dynamodb.meta.client.list_tables()['TableNames']
    if DYNAMODB_TABLE_NAME not in existing_tables:
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

create_table()

table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# Endpoint to receive win data
@app.post("/api/win_state")
async def submit_win_data(win_data: WinData):
    try:
        score_id = str(uuid.uuid4())

        item = {
            'game': win_data.game,
            'score_id': score_id,
            'moves': win_data.moves,
            'time': win_data.time,
            'name': win_data.name or 'Anonymous'
        }

        table.put_item(Item=item)
        print(f"Received win data: {win_data}")
        return {"message": "Win data received successfully"}
    except ClientError as e:
        print(e.response['Error']['Message'])
        raise HTTPException(status_code=500, detail="Error saving data")

# Endpoint to retrieve the leaderboard
@app.get("/api/win_states", response_model=List[HighScore])
async def get_win_states(game: str):
    try:
        # Query items for the given game, sorted by moves
        response = table.query(
            IndexName='GameMovesIndex',
            KeyConditionExpression=Key('game').eq(game),
            ScanIndexForward=True,  # Sort ascending
            Limit=10
        )
        items = response.get('Items', [])
        # Sort items by moves and time
        items.sort(key=lambda x: (x['moves'], x['time']))
        high_scores = [{'moves': item['moves'], 'time': item['time'], 'name': item['name']} for item in items]
        return high_scores
    except ClientError as e:
        print(e.response['Error']['Message'])
        raise HTTPException(status_code=500, detail="Error retrieving data")
