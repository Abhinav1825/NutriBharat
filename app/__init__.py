"""
Flask Application Factory
"""
from flask import Flask, session, redirect, url_for
from pymongo import MongoClient
from app.config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize MongoDB
    client = MongoClient(app.config['MONGO_URI'])
    app.db = client[app.config['DB_NAME']]

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.food import food_bp
    from app.routes.logs import logs_bp
    from app.routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(food_bp, url_prefix='/food')
    app.register_blueprint(logs_bp, url_prefix='/logs')
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')

    # Root redirect
    @app.route('/')
    def index():
        if 'user_id' not in session:
            return redirect(url_for('auth.login_page'))
        return redirect(url_for('food.upload_page'))

    return app
