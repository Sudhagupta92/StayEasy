import os

class Config:
    PORT: int = int(os.getenv("PORT", 8000))
    MONGO_URI: str = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/stayeasy")
    DB_NAME: str = "stayeasy"
    NODE_ENV: str = os.getenv("NODE_ENV", "development")

config = Config()
