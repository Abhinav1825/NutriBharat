"""
MongoDB Models - User
"""
from datetime import datetime
from bson import ObjectId
from flask import current_app


def get_collection():
    return current_app.db['users']


def find_by_username(username: str):
    return get_collection().find_one({'username': username.lower().strip()})


def find_by_id(user_id: str):
    try:
        return get_collection().find_one({'_id': ObjectId(user_id)})
    except Exception:
        return None


def create_user(username: str, display_name: str = None):
    doc = {
        'username': username.lower().strip(),
        'display_name': display_name or username,
        'created_at': datetime.utcnow(),
        'daily_calorie_goal': 2000,
        'daily_protein_goal': 50,
        'daily_carbs_goal': 300,
        'daily_fat_goal': 65,
    }
    result = get_collection().insert_one(doc)
    doc['_id'] = result.inserted_id
    return doc


def get_or_create_user(username: str):
    user = find_by_username(username)
    if not user:
        user = create_user(username)
    return user


def update_goals(user_id: str, goals: dict):
    get_collection().update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {
            'daily_calorie_goal': goals.get('calories', 2000),
            'daily_protein_goal': goals.get('protein', 50),
            'daily_carbs_goal': goals.get('carbs', 300),
            'daily_fat_goal': goals.get('fat', 65),
        }}
    )
