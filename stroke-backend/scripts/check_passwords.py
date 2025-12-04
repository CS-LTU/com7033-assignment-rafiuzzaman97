import sqlite3

conn = sqlite3.connect('instance/stroke_care.db')
cursor = conn.cursor()
cursor.execute('SELECT username, password_hash FROM user LIMIT 3')
results = cursor.fetchall()

print("SQLite Users:")
for row in results:
    print(f"  Username: {row[0]}")
    print(f"  Password hash: {row[1][:60] if row[1] else 'NONE'}")
    print()
conn.close()

print("\nMongoDB Users:")
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017')
db = client['stroke_care']
users = db.users.find().limit(3)
for user in users:
    print(f"  Username: {user['username']}")
    print(f"  Password hash: {user.get('password_hash', 'NONE')[:60]}")
    print()
