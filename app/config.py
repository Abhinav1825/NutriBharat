"""
Application Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-please-change')

    # MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/food_nutrition')
    DB_NAME = MONGO_URI.split('/')[-1].split('?')[0] if '/' in MONGO_URI else 'food_nutrition'

    # Vision API
    VISION_PROVIDER = os.getenv('VISION_PROVIDER', 'mock')
    GOOGLE_VISION_API_KEY = os.getenv('GOOGLE_VISION_API_KEY', '')
    CLARIFAI_API_KEY = os.getenv('CLARIFAI_API_KEY', '')
    CLARIFAI_MODEL_ID = os.getenv('CLARIFAI_MODEL_ID', 'food-item-recognition')
    HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY', '')
    HF_MODEL_ID = os.getenv('HF_MODEL_ID', 'google/vit-base-patch16-224')
    LOGMEAL_API_KEY = os.getenv('LOGMEAL_API_KEY', '')
    LOGMEAL_MODEL_ID = os.getenv('LOGMEAL_MODEL_ID', 'v2/food-recognition/complete')

    # Upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

    # Session
    PERMANENT_SESSION_LIFETIME = 86400 * 30  # 30 days
