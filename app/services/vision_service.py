"""
Vision Service - Abstracted food image recognition
Supports: google (preferred), clarifai, huggingface, mock
"""
import base64
import random
import requests
from flask import current_app

MOCK_FOODS = [
    "Masala Dosa", "Idli", "Vada", "Chicken Biryani", "Dal Makhani",
    "Paneer Butter Masala", "Roti (Chapati)", "Samosa", "Aloo Paratha",
    "Palak Paneer", "Chana Masala", "Rajma", "Pav Bhaji", "Gulab Jamun",
    "Kheer", "Rasgulla", "Butter Chicken", "Tandoori Chicken", "Naan",
    "Jeera Rice", "Poha", "Upma", "Dhokla", "Pani Puri", "Bhel Puri"
]

class VisionResult:
    def __init__(self, labels: list, error: str = None):
        self.labels = labels
        self.error = error

def identify_food(image_bytes: bytes, filename: str = "") -> VisionResult:
    provider = current_app.config.get('VISION_PROVIDER', 'google')

    try:
        if provider == 'google':
            return _google_identify(image_bytes)
        elif provider == 'clarifai':
            return _clarifai_identify(image_bytes)
        elif provider == 'huggingface':
            return _huggingface_identify(image_bytes)
        else:
            return _mock_identify(image_bytes)
    except Exception as e:
        return VisionResult(labels=[], error=str(e))

def _google_identify(image_bytes: bytes) -> VisionResult:
    """Google Cloud Vision API via REST."""
    api_key = current_app.config.get('GOOGLE_VISION_API_KEY', '')
    if not api_key:
        return VisionResult(labels=[], error='Google Vision API key not configured')

    b64 = base64.b64encode(image_bytes).decode('utf-8')
    url = f'https://vision.googleapis.com/v1/images:annotate?key={api_key}'
    payload = {
        'requests': [{
            'image': {'content': b64},
            'features': [
                {'type': 'LABEL_DETECTION', 'maxResults': 10},
                {'type': 'WEB_DETECTION', 'maxResults': 5}
            ]
        }]
    }

    try:
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        responses = data.get('responses', [{}])[0]

        labels = []
        for item in responses.get('labelAnnotations', []):
            labels.append({
                'name': item['description'],
                'confidence': round(item['score'], 2)
            })

        return VisionResult(labels=labels[:5])
    except Exception as e:
        return VisionResult(labels=[], error=str(e))

def _mock_identify(image_bytes: bytes) -> VisionResult:
    choices = random.sample(MOCK_FOODS, 3)
    return VisionResult([{'name': c, 'confidence': 0.9} for c in choices])

# (Other providers clarifai/huggingface kept for future support)
def _clarifai_identify(image_bytes: bytes) -> VisionResult:
    return _mock_identify(image_bytes) # Placeholder

def _huggingface_identify(image_bytes: bytes) -> VisionResult:
    return _mock_identify(image_bytes) # Placeholder
