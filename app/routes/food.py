"""
Food Routes - Image upload + catalog search
"""
import io
from flask import Blueprint, request, jsonify, render_template, current_app
from app.routes.auth import login_required
from app.services import food_service

food_bp = Blueprint('food', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@food_bp.route('/upload', methods=['GET'])
@login_required
def upload_page():
    return render_template('upload.html')


@food_bp.route('/search-page', methods=['GET'])
@login_required
def search_page():
    return render_template('search.html')


@food_bp.route('/upload', methods=['POST'])
@login_required
def upload_image():
    """Receive image, identify food via vision API, return matches."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed. Use PNG, JPG, JPEG, GIF, or WEBP'}), 400

    image_bytes = file.read()
    if len(image_bytes) > 16 * 1024 * 1024:
        return jsonify({'error': 'File too large (max 16MB)'}), 413

    result = food_service.identify_and_match(image_bytes, file.filename)
    provider = current_app.config.get('VISION_PROVIDER', 'mock')

    # Build response
    matched_foods = []
    unmatched_labels = []

    for m in result['matches']:
        if m['matched'] and m['food']:
            matched_foods.append({
                'food': m['food'],
                'confidence': m['confidence'],
                'label': m['vision_label']
            })
        else:
            unmatched_labels.append({
                'label': m['vision_label'],
                'confidence': m['confidence']
            })

    return jsonify({
        'success': True,
        'provider': provider,
        'matched_foods': matched_foods,
        'unmatched_labels': unmatched_labels,
        'vision_labels': result['vision_labels'],
        'error': result.get('error'),
        'is_mock': provider == 'mock'
    })


@food_bp.route('/search', methods=['GET'])
@login_required
def search_food():
    """Search food catalog."""
    query = request.args.get('q', '').strip()
    limit = min(int(request.args.get('limit', 15)), 50)

    if not query:
        return jsonify({'results': [], 'query': ''})

    results = food_service.search_food(query)
    return jsonify({'results': results[:limit], 'query': query})


@food_bp.route('/all', methods=['GET'])
@login_required
def all_foods():
    """Get all foods in catalog (for dropdown)."""
    foods = food_service.get_all_foods()
    return jsonify({'foods': foods, 'count': len(foods)})


@food_bp.route('/categories', methods=['GET'])
@login_required
def categories():
    cats = food_service.get_categories()
    return jsonify({'categories': sorted(cats)})
