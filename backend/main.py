# backend/main.py

import os
import uuid
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from mangum import Mangum

DYNAMODB_ENDPOINT_URL = os.environ.get('DYNAMODB_ENDPOINT_URL', 'http://dynamodb-local:8000')
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', 'fakeMyKeyId')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', 'fakeSecretAccessKey')
REGION_NAME = os.environ.get('AWS_REGION', 'us-east-2')
DYNAMODB_TABLE_NAME = 'HighScores'

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
def create_table(dynamodb):
    try:
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
            print("DynamoDB table created")
    except Exception as e:
        print(f"Error creating table: {e}")

@app.on_event("startup")
async def startup_event():
    try:
        print(f"DYNAMODB_ENDPOINT_URL: {DYNAMODB_ENDPOINT_URL}")
        dynamodb = boto3.resource(
            'dynamodb',
            endpoint_url=DYNAMODB_ENDPOINT_URL,
            region_name=REGION_NAME,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY
        )
        create_table(dynamodb)  # Always create the table if it doesn't exist
        app.state.table = dynamodb.Table(DYNAMODB_TABLE_NAME)
        # Test connectivity
        existing_tables = dynamodb.meta.client.list_tables()['TableNames']
        print(f"Existing tables: {existing_tables}")
        print("DynamoDB resource initialized")
    except Exception as e:
        print(f"Exception during DynamoDB initialization: {e}")
        import traceback
        traceback.print_exc()

# Endpoint to receive win data
@app.post("/api/win_state")
async def submit_win_data(win_data: WinData, request: Request):
    try:
        table = request.app.state.table
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
        print(f"Error saving data: {e.response['Error']['Message']}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error saving data")
    except Exception as e:
        print(f"Exception in submit_win_data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
# Endpoint to retrieve the leaderboard
@app.get("/api/win_states", response_model=List[HighScore])
async def get_win_states(game: str, request: Request):
    try:
        table = request.app.state.table
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
        print(f"Error retrieving data: {e.response['Error']['Message']}")
        raise HTTPException(status_code=500, detail="Error retrieving data")
    except Exception as e:
        print(f"Exception in get_win_states: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Add the Mangum handler after defining the app
handler = Mangum(app)
