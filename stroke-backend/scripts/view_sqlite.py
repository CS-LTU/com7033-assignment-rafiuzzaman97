# scripts/view_sqlite.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlite3
from app.config import Config

def view_sqlite_data():
    print("📊 Viewing SQLite Data...")
    config = Config()
    
    # Extract database path from URI
    db_path = config.SQLALCHEMY_DATABASE_URI.replace('sqlite:///', '')
    
    print(f"💾 Database: {db_path}")
    print("=" * 50)
    
    if not os.path.exists(db_path):
        print("❌ Database file not found!")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]
        
        print(f"📋 Tables: {tables}")
        
        for table_name in tables:
            print(f"\n🏷️  Table: {table_name}")
            print("-" * 30)
            
            # Get table info
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print("Columns:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"Total rows: {count}")
            
            # Show all data
            if count > 0:
                cursor.execute(f"SELECT * FROM {table_name}")
                rows = cursor.fetchall()
                print("Data:")
                for row in rows:
                    print(f"  {row}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    view_sqlite_data()