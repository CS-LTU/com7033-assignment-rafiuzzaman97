# scripts/mongo_status.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from app.config import Config

def check_mongodb_status():
    print("🔍 Checking MongoDB Status...")
    config = Config()
    
    print(f"📡 MongoDB URI: {config.MONGO_URI}")
    print(f"💾 Database Name: {config.MONGO_DB_NAME}")
    print(f"🔧 USE_MONGODB: {config.USE_MONGODB}")
    print("=" * 50)
    
    try:
        client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ismaster')
        print("✅ MongoDB is running and accessible")
        
        # Show all databases
        databases = client.list_database_names()
        print(f"📁 Available databases: {databases}")
        
        # Check if our database exists
        if config.MONGO_DB_NAME in databases:
            print(f"✅ Database '{config.MONGO_DB_NAME}' exists")
            db = client[config.MONGO_DB_NAME]
            collections = db.list_collection_names()
            print(f"📂 Collections in {config.MONGO_DB_NAME}: {collections}")
        else:
            print(f"❌ Database '{config.MONGO_DB_NAME}' does not exist yet")
        
        client.close()
        return True
        
    except ConnectionFailure:
        print("❌ MongoDB is not running or not accessible")
        print("💡 Start MongoDB with: mongod --dbpath \"C:\\data\\db\"")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    check_mongodb_status()