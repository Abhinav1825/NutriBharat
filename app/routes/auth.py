"""
Auth Routes - Simple session-based login
"""
from flask import Blueprint, request, session, jsonify, render_template, redirect, url_for
from app.models import user as UserModel

auth_bp = Blueprint('auth', __name__)


def login_required(f):
    """Decorator to require login."""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json:
                return jsonify({'error': 'Login required', 'redirect': '/auth/login'}), 401
            return redirect(url_for('auth.login_page'))
        return f(*args, **kwargs)
    return decorated


@auth_bp.route('/login', methods=['GET'])
def login_page():
    if 'user_id' in session:
        return redirect(url_for('food.upload_page'))
    return render_template('index.html')


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or request.form
    username = (data.get('username') or '').strip()

    if not username or len(username) < 2:
        return jsonify({'error': 'Username must be at least 2 characters'}), 400

    if len(username) > 30:
        return jsonify({'error': 'Username too long (max 30 characters)'}), 400

    user = UserModel.get_or_create_user(username)
    session['user_id'] = str(user['_id'])
    session['username'] = user['display_name']
    session.permanent = True

    return jsonify({
        'success': True,
        'user': {
            'id': str(user['_id']),
            'username': user['username'],
            'display_name': user['display_name'],
        },
        'redirect': '/food/upload'
    })


@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'redirect': '/auth/login'})


@auth_bp.route('/me', methods=['GET'])
@login_required
def me():
    user = UserModel.find_by_id(session['user_id'])
    if not user:
        session.clear()
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': str(user['_id']),
        'username': user['username'],
        'display_name': user['display_name'],
        'goals': {
            'calories': user.get('daily_calorie_goal', 2000),
            'protein': user.get('daily_protein_goal', 50),
            'carbs': user.get('daily_carbs_goal', 300),
            'fat': user.get('daily_fat_goal', 65),
        }
    })


@auth_bp.route('/goals', methods=['PUT'])
@login_required
def update_goals():
    data = request.get_json()
    UserModel.update_goals(session['user_id'], data)
    return jsonify({'success': True})
