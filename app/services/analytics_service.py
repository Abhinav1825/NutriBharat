"""
Analytics Service - Pandas-based aggregations for dashboard
"""
from datetime import datetime, timedelta
import pandas as pd
from app.models import food_log as LogModel


def get_daily_totals(user_id: str, date_str: str = None) -> dict:
    """Get macro totals for a specific day."""
    if not date_str:
        date_str = datetime.utcnow().strftime('%Y-%m-%d')

    logs = LogModel.get_today_logs(user_id, date_str)
    all_entries = []
    for meal_logs in logs.values():
        all_entries.extend(meal_logs)

    if not all_entries:
        return {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0}

    df = pd.DataFrame(all_entries)
    totals = {
        'calories': round(df['calories'].sum(), 1),
        'protein': round(df['protein'].sum(), 1),
        'carbs': round(df['carbs'].sum(), 1),
        'fat': round(df['fat'].sum(), 1),
    }
    return totals


def get_weekly_trend(user_id: str, days: int = 7) -> list:
    """Get daily calorie totals for last N days."""
    logs = LogModel.get_date_range_logs(user_id, days)

    end_date = datetime.utcnow().date()
    date_range = [(end_date - timedelta(days=i)).strftime('%Y-%m-%d')
                  for i in range(days - 1, -1, -1)]

    if not logs:
        return [{'date': d, 'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0}
                for d in date_range]

    df = pd.DataFrame(logs)
    daily = df.groupby('date_str').agg(
        calories=('calories', 'sum'),
        protein=('protein', 'sum'),
        carbs=('carbs', 'sum'),
        fat=('fat', 'sum'),
    ).reset_index()

    # Fill missing dates with 0
    result = []
    for d in date_range:
        row = daily[daily['date_str'] == d]
        if not row.empty:
            result.append({
                'date': d,
                'calories': round(float(row['calories'].iloc[0]), 1),
                'protein': round(float(row['protein'].iloc[0]), 1),
                'carbs': round(float(row['carbs'].iloc[0]), 1),
                'fat': round(float(row['fat'].iloc[0]), 1),
            })
        else:
            result.append({'date': d, 'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0})

    return result


def get_meal_distribution(user_id: str, date_str: str = None) -> dict:
    """Get calories per meal type for today."""
    if not date_str:
        date_str = datetime.utcnow().strftime('%Y-%m-%d')

    logs = LogModel.get_today_logs(user_id, date_str)
    distribution = {}
    for meal_type, entries in logs.items():
        if entries:
            total = sum(e['calories'] for e in entries)
            distribution[meal_type] = round(total, 1)
        else:
            distribution[meal_type] = 0

    return distribution


def get_macro_breakdown(user_id: str, date_str: str = None) -> dict:
    """Get macro breakdown as percentages for donut chart."""
    totals = get_daily_totals(user_id, date_str)
    protein_cal = totals['protein'] * 4
    carbs_cal = totals['carbs'] * 4
    fat_cal = totals['fat'] * 9
    total_macro_cal = protein_cal + carbs_cal + fat_cal

    if total_macro_cal == 0:
        return {'protein': 33, 'carbs': 34, 'fat': 33}

    return {
        'protein': round(protein_cal / total_macro_cal * 100, 1),
        'carbs': round(carbs_cal / total_macro_cal * 100, 1),
        'fat': round(fat_cal / total_macro_cal * 100, 1),
    }


def generate_csv_report(user_id: str, days: int = 7) -> str:
    """Generate a CSV report using Pandas for export."""
    logs = LogModel.get_date_range_logs(user_id, days)
    if not logs:
        df = pd.DataFrame(columns=['date_str', 'meal_type', 'food_name', 'quantity',
                                   'calories', 'protein', 'carbs', 'fat'])
    else:
        df = pd.DataFrame(logs)
        cols = ['date_str', 'meal_type', 'food_name', 'quantity', 'unit',
                'calories', 'protein', 'carbs', 'fat', 'logged_at']
        df = df[[c for c in cols if c in df.columns]]
        df = df.sort_values(['date_str', 'meal_type'])

    return df.to_csv(index=False)
