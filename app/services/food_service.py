"""
Food Service - Catalog lookup and nutrition calculation
"""
from app.models import food_catalog as CatalogModel
from app.services import vision_service


def search_food(query: str):
    """Search food catalog by query string."""
    if not query or len(query.strip()) < 1:
        return []
    return CatalogModel.search(query.strip(), limit=15)


def get_all_foods():
    return CatalogModel.get_all()


def get_food_by_name(name: str):
    return CatalogModel.get_by_name(name)


def get_categories():
    return CatalogModel.get_categories()


def calculate_nutrition(food: dict, quantity: float) -> dict:
    """
    Calculate nutrition for a given quantity (serving multiplier).
    quantity=1.0 means one serving as defined in the catalog.
    """
    multiplier = quantity
    return {
        'food_name': food['name'],
        'unit': food.get('unit', 'serving'),
        'quantity': quantity,
        'serving': food.get('serving', 100),
        'calories': round(food['calories'] * multiplier, 1),
        'protein': round(food['protein'] * multiplier, 1),
        'carbs': round(food['carbs'] * multiplier, 1),
        'fat': round(food['fat'] * multiplier, 1),
    }


def identify_and_match(image_bytes: bytes, filename: str = ""):
    """
    Run vision API on image, then match results against catalog.
    Returns: {matches: [...], vision_labels: [...], error: str|None}
    """
    vision_result = vision_service.identify_food(image_bytes, filename)

    matches = []
    for label in vision_result.labels:
        food = CatalogModel.get_by_name(label['name'])
        if food:
            matches.append({
                'food': food,
                'confidence': label['confidence'],
                'vision_label': label['name'],
                'matched': True
            })
        else:
            matches.append({
                'food': None,
                'confidence': label['confidence'],
                'vision_label': label['name'],
                'matched': False
            })

    return {
        'matches': matches,
        'vision_labels': vision_result.labels,
        'error': vision_result.error,
        'provider': 'mock' if not matches else 'vision'
    }
