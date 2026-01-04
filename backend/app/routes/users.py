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

    if 'location' in data:
        user.location = data['location']
    if 'timezone' in data:
        user.timezone = data['timezone']
    if 'calculation_method' in data:
        user.calculation_method = data['calculation_method']
    if 'profile_picture_url' in data:
        user.profile_picture_url = data['profile_picture_url']

    db.session.commit()

    return jsonify({
        'message': 'Settings updated successfully',
        'user': user.to_dict()
    }), 200
