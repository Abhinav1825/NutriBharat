"""
MongoDB Models - Food Catalog
"""
from flask import current_app


def get_collection():
    return current_app.db['food_catalog']


def search(query: str, limit: int = 20):
    """Text search across name and tags."""
    q = query.strip().lower()
    results = get_collection().find(
        {'$or': [
            {'name': {'$regex': q, '$options': 'i'}},
            {'tags': {'$in': [q]}},
            {'category': {'$regex': q, '$options': 'i'}}
        ]},
        {'_id': 0}
    ).limit(limit)
    return list(results)


def get_all():
    return list(get_collection().find({}, {'_id': 0}).sort('name', 1))


def get_by_name(name: str):
    """Exact then fuzzy match."""
    result = get_collection().find_one(
        {'name': {'$regex': f'^{name}$', '$options': 'i'}},
        {'_id': 0}
    )
    if not result:
        # Try partial match
        result = get_collection().find_one(
            {'name': {'$regex': name[:6], '$options': 'i'}},
            {'_id': 0}
        )
    return result


def get_categories():
    return get_collection().distinct('category')


def count():
    return get_collection().count_documents({})
