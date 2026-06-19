"""
Logs Routes - Meal log CRUD
"""
from flask import Blueprint, request, jsonify, render_template, session
from app.routes.auth import login_required
from app.services import log_service, food_service

logs_bp = Blueprint('logs', __name__)


@logs_bp.route('/', methods=['GET'])
@login_required
def tracker_page():
    return render_template('tracker.html')


@logs_bp.route('/add', methods=['POST'])
@login_required
def add_log():
    """Add food to meal log."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    food_name = (data.get('food_name') or '').strip()
    meal_type = data.get('meal_type', 'Snacks')
    quantity = float(data.get('quantity', 1.0))

    if not food_name:
        return jsonify({'error': 'food_name is required'}), 400

    if meal_type not in ['Breakfast', 'Lunch', 'Dinner', 'Snacks']:
        meal_type = 'Snacks'

    if quantity <= 0:
        return jsonify({'error': 'Quantity must be positive'}), 400

    # If nutrition is provided directly (from image upload flow)
    if all(k in data for k in ['calories', 'protein', 'carbs', 'fat']):
        entry = log_service.add_food_entry(
            user_id=session['user_id'],
            food_name=food_name,
            meal_type=meal_type,
            quantity=quantity,
            calories=float(data['calories']),
            protein=float(data['protein']),
            carbs=float(data['carbs']),
            fat=float(data['fat']),
            unit=data.get('unit', 'serving')
        )
    else:
        # Look up from catalog
        entry, error = log_service.add_food_from_catalog(
            user_id=session['user_id'],
            food_name=food_name,
            meal_type=meal_type,
            quantity=quantity
        )
        if error:
            return jsonify({'error': error}), 404

    return jsonify({'success': True, 'entry': entry})


@logs_bp.route('/today', methods=['GET'])
@login_required
def today_logs():
    """Get today's logs grouped by meal type."""
    logs = log_service.get_today_logs(session['user_id'])
    return jsonify({'logs': logs})


@logs_bp.route('/<entry_id>', methods=['DELETE'])
@login_required
def delete_log(entry_id):
    """Delete a log entry."""
    success = log_service.delete_entry(session['user_id'], entry_id)
    if success:
        return jsonify({'success': True})
    return jsonify({'error': 'Entry not found or unauthorized'}), 404
