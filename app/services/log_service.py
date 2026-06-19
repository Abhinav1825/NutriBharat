"""
Log Service - Food log CRUD operations
"""
from datetime import datetime
from app.models import food_log as LogModel
from app.services import food_service


def add_food_entry(user_id: str, food_name: str, meal_type: str,
                   quantity: float, calories: float, protein: float,
                   carbs: float, fat: float, unit: str = 'serving'):
    """Add a food entry to the log."""
    entry = {
        'food_name': food_name,
        'meal_type': meal_type,
        'quantity': quantity,
        'unit': unit,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
    }
    return LogModel.add_entry(user_id, entry)


def add_food_from_catalog(user_id: str, food_name: str, meal_type: str, quantity: float):
    """Look up food in catalog and add computed nutrition to log."""
    food = food_service.get_food_by_name(food_name)
    if not food:
        return None, 'Food not found in catalog'

    nutrition = food_service.calculate_nutrition(food, quantity)
    entry = add_food_entry(
        user_id=user_id,
        food_name=food['name'],
        meal_type=meal_type,
        quantity=quantity,
        calories=nutrition['calories'],
        protein=nutrition['protein'],
        carbs=nutrition['carbs'],
        fat=nutrition['fat'],
        unit=food.get('unit', 'serving')
    )
    return entry, None


def get_today_logs(user_id: str):
    date_str = datetime.utcnow().strftime('%Y-%m-%d')
    return LogModel.get_today_logs(user_id, date_str)


def delete_entry(user_id: str, entry_id: str):
    return LogModel.delete_entry(user_id, entry_id)
