from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from routes import recommendations, predictions, insights

app = FastAPI(
    title="StayEasy AI Microservice",
    description="Python AI Service providing smart recommendations, occupancy forecasting, revenue prediction, and maintenance risk insights.",
    version="1.0.0"
)

# Enable CORS for Node.js API Gateway & React client
client_url = os.getenv("CLIENT_URL", "http://localhost:5173")
allowed_origins = [
    client_url,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(recommendations.router)
app.include_router(predictions.router)
app.include_router(insights.router)

@app.get("/")
def read_root():
    return {
        "success": True,
        "service": "StayEasy Python AI Microservice",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/health")
@app.get("/model-info")
def get_health():
    metadata = {}
    meta_path = os.path.join(os.path.dirname(__file__), "models", "saved", "model_metadata.json")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r") as f:
                metadata = json.load(f)
        except Exception:
            metadata = {}

    return {
        "status": "healthy",
        "service": "StayEasy Python AI Microservice",
        "version": "1.0.0",
        "modelsLoaded": len(metadata.get("models", [])),
        "modelMetadata": metadata.get("models", [])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
