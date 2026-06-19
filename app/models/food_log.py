"""
MongoDB Models - Food Log
"""
from datetime import datetime, date
from bson import ObjectId
from flask import current_app


def get_collection():
    return current_app.db['food_logs']


MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']


def add_entry(user_id: str, entry: dict):
    """Add a food log entry."""
    doc = {
        'user_id': user_id,
        'food_name': entry['food_name'],
        'meal_type': entry.get('meal_type', 'Snacks'),
        'quantity': float(entry.get('quantity', 1.0)),
        'unit': entry.get('unit', 'serving'),
        'calories': float(entry.get('calories', 0)),
        'protein': float(entry.get('protein', 0)),
        'carbs': float(entry.get('carbs', 0)),
        'fat': float(entry.get('fat', 0)),
        'logged_at': datetime.utcnow(),
        'date_str': datetime.utcnow().strftime('%Y-%m-%d'),
    }
    result = get_collection().insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    doc['logged_at'] = doc['logged_at'].isoformat()
    return doc


def get_today_logs(user_id: str, date_str: str = None):
    """Get all logs for today grouped by meal type."""
    if not date_str:
        date_str = datetime.utcnow().strftime('%Y-%m-%d')

    logs = list(get_collection().find(
        {'user_id': user_id, 'date_str': date_str},
        sort=[('logged_at', 1)]
    ))

    grouped = {m: [] for m in MEAL_TYPES}
    for log in logs:
        log['_id'] = str(log['_id'])
        log['logged_at'] = log['logged_at'].isoformat() if hasattr(log['logged_at'], 'isoformat') else str(log['logged_at'])
        meal = log.get('meal_type', 'Snacks')
        if meal in grouped:
            grouped[meal].append(log)
        else:
            grouped['Snacks'].append(log)

    return grouped


def get_date_range_logs(user_id: str, days: int = 7):
    """Get logs for past N days (for trend chart)."""
    from datetime import timedelta
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days - 1)

    logs = list(get_collection().find(
        {'user_id': user_id, 'date_str': {'$gte': start_date.strftime('%Y-%m-%d')}},
        {'_id': 0}
    ))
    return logs


def delete_entry(user_id: str, entry_id: str):
    """Delete a log entry (only if it belongs to user)."""
    result = get_collection().delete_one({
        '_id': ObjectId(entry_id),
        'user_id': user_id
    })
    return result.deleted_count > 0
