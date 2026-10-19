from pymongo import MongoClient
from config import config

client = None
db = None

def get_db():
    global client, db
    if db is None:
        try:
            client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=2000)
            db = client[config.DB_NAME]
        except Exception as e:
            print(f"[AI Service Database Warning] Could not connect to PyMongo: {e}")
            db = None
    return db
