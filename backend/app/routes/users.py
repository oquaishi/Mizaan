from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint('users', __name__, url_prefix='/api/users')

@bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    # Validate and update location (format: "latitude,longitude")
    if 'location' in data:
        location = data['location']
        try:
            # Validate location format
            lat, lon = map(float, location.split(','))
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                return jsonify({'error': 'Invalid latitude or longitude values'}), 400
            user.location = location
        except (ValueError, AttributeError):
            return jsonify({'error': 'Location must be in format "latitude,longitude"'}), 400

    # Update timezone
    if 'timezone' in data:
        user.timezone = data['timezone']

    # Validate and update calculation method
    if 'calculation_method' in data:
        valid_methods = ['ISNA', 'MWL', 'KARACHI', 'MAKKAH', 'EGYPT']
        method = data['calculation_method']
        if method not in valid_methods:
            return jsonify({
                'error': 'Invalid calculation method',
                'valid_methods': valid_methods
            }), 400
        user.calculation_method = method

    # Update profile picture
    if 'profile_picture_url' in data:
        user.profile_picture_url = data['profile_picture_url']

    db.session.commit()

    return jsonify({
        'message': 'Settings updated successfully',
        'user': user.to_dict()
    }), 200
