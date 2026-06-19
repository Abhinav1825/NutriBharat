"""
Seed Script - Populates MongoDB with Indian food catalog
Run: python scripts/seed_db.py
"""
import sys
import os
import json

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from pymongo import MongoClient

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/food_nutrition')
DB_NAME = MONGO_URI.split('/')[-1].split('?')[0]

def seed():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db['food_catalog']

    # Load seed data
    seed_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'seed', 'food_catalog.json')
    with open(seed_path, 'r', encoding='utf-8') as f:
        foods = json.load(f)

    # Drop and re-seed for idempotency
    collection.drop()
    result = collection.insert_many(foods)

    # Create indexes
    collection.create_index([('name', 'text'), ('tags', 'text'), ('category', 'text')])
    collection.create_index('name')
    collection.create_index('category')

    print(f"✅ Seeded {len(result.inserted_ids)} foods into '{DB_NAME}.food_catalog'")
    print(f"   Database: {MONGO_URI}")

    # Show categories
    categories = collection.distinct('category')
    print(f"   Categories: {', '.join(sorted(categories))}")

    client.close()

if __name__ == '__main__':
    seed()
