# backend/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# In-memory storage for stubbed responses (to be replaced with DynamoDB)
fake_leaderboard = {
    "Chromaxen": [
        {"moves": 10, "time": "00:01:30", "name": "Alice"},
        {"moves": 12, "time": "00:02:00", "name": "Bob"},
        # Add more fake data as needed
    ]
}

# Endpoint to receive win data
@app.post("/api/win_state")
async def submit_win_data(win_data: WinData):
    # Stubbed response: pretend to save data
    print(f"Received win data: {win_data}")
    return {"message": "Win data received successfully"}

# Endpoint to retrieve the leaderboard
@app.get("/api/win_states", response_model=List[HighScore])
async def get_win_states(game: str):
    # Stubbed response: return fake leaderboard data
    if game in fake_leaderboard:
        return fake_leaderboard[game]
    else:
        raise HTTPException(status_code=404, detail="Game not found")
