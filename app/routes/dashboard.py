"""
Dashboard Routes - Analytics and chart data
"""
from flask import Blueprint, request, jsonify, render_template, session, Response
from app.routes.auth import login_required
from app.services import analytics_service
from app.models import user as UserModel

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/', methods=['GET'])
@login_required
def dashboard_page():
    return render_template('dashboard.html')


@dashboard_bp.route('/summary', methods=['GET'])
@login_required
def summary():
    """Today's macro totals + goals."""
    user = UserModel.find_by_id(session['user_id'])
    totals = analytics_service.get_daily_totals(session['user_id'])
    macro_pct = analytics_service.get_macro_breakdown(session['user_id'])

    goals = {
        'calories': user.get('daily_calorie_goal', 2000) if user else 2000,
        'protein': user.get('daily_protein_goal', 50) if user else 50,
        'carbs': user.get('daily_carbs_goal', 300) if user else 300,
        'fat': user.get('daily_fat_goal', 65) if user else 65,
    }

    return jsonify({
        'totals': totals,
        'goals': goals,
        'macro_percentages': macro_pct,
    })


@dashboard_bp.route('/trend', methods=['GET'])
@login_required
def trend():
    """7-day calorie/macro trend."""
    days = min(int(request.args.get('days', 7)), 30)
    data = analytics_service.get_weekly_trend(session['user_id'], days)
    return jsonify({'trend': data, 'days': days})


@dashboard_bp.route('/distribution', methods=['GET'])
@login_required
def distribution():
    """Meal type calorie distribution for today."""
    data = analytics_service.get_meal_distribution(session['user_id'])
    return jsonify({'distribution': data})


@dashboard_bp.route('/export', methods=['GET'])
@login_required
def export_csv():
    """Export log data as CSV using Pandas."""
    days = min(int(request.args.get('days', 7)), 30)
    csv_data = analytics_service.generate_csv_report(session['user_id'], days)

    from datetime import datetime
    filename = f"nutrition_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    return Response(
        csv_data,
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )
