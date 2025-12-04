# scripts/view_mongodb.py
import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from app.config import Config
from bson import ObjectId

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

def view_mongodb_data():
    print("📊 Viewing MongoDB Data...")
    config = Config()
    
    try:
        client = MongoClient(config.MONGO_URI)
        db = client[config.MONGO_DB_NAME]
        
        print("✅ Connected to MongoDB successfully!")
        print("=" * 50)
        
        # List all collections
        collections = db.list_collection_names()
        print(f"📂 Collections: {collections}")
        
        if not collections:
            print("ℹ️  No collections found. Database might be empty.")
            return
        
        # Show data from each collection
        for collection_name in collections:
            print(f"\n🏷️  Collection: {collection_name}")
            print("-" * 40)
            
            collection = db[collection_name]
            count = collection.count_documents({})
            print(f"📊 Document count: {count}")
            
            if count > 0:
                # Show all documents
                documents = collection.find()
                for i, doc in enumerate(documents, 1):
                    print(f"\n📄 Document #{i}:")
                    print(json.dumps(doc, cls=JSONEncoder, indent=2))
            else:
                print("ℹ️  No documents in this collection")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("💡 Make sure MongoDB is running: mongod --dbpath \"C:\\data\\db\"")

if __name__ == "__main__":
    view_mongodb_data()