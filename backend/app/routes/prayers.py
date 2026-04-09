from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from app import db
from app.models import Prayer, User
from app.services.image_service import ImageService

bp = Blueprint('prayers', __name__, url_prefix='/api/prayers')

VALID_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']


@bp.route('/check-in', methods=['POST'])
@jwt_required()
def check_in_prayer():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('prayer_name'):
        return jsonify({'error': 'Prayer name is required'}), 400

    prayer_name = data['prayer_name']

    if prayer_name not in VALID_PRAYERS:
        return jsonify({'error': f'Invalid prayer name. Must be one of: {VALID_PRAYERS}'}), 400

    # Check if already checked in for this prayer today
    today = date.today()
    existing = Prayer.query.filter_by(
        user_id=user_id,
        prayer_name=prayer_name,
        prayer_date=today
    ).first()

    if existing:
        return jsonify({'error': f'Already checked in for {prayer_name} today'}), 400

    # Upload photo if provided
    photo_url = None
    if data.get('photo'):
        photo_url = ImageService.upload_prayer_photo(
            data['photo'],
            user_id,
            prayer_name
        )

    # Create prayer record
    prayer = Prayer(
        user_id=user_id,
        prayer_name=prayer_name,
        photo_url=photo_url,
        prayer_date=today,
        note=data.get('note'),
        status=data.get('status', 'completed')
    )

    db.session.add(prayer)
    db.session.commit()

    # Notify friends
    try:
        from app.models.friendship import Friendship
        from app.services.notification_service import NotificationService
        from sqlalchemy import or_

        current_user = User.query.get(user_id)
        friendships = Friendship.query.filter(
            or_(
                Friendship.requester_id == user_id,
                Friendship.addressee_id == user_id
            ),
            Friendship.status == 'accepted'
        ).all()

        for f in friendships:
            friend_id = f.addressee_id if f.requester_id == user_id else f.requester_id
            friend = User.query.get(friend_id)
            if friend:
                NotificationService.send_friend_activity_alert(friend, current_user.username, prayer_name)
    except Exception:
        pass

    return jsonify({
        'message': f'{prayer_name} checked in successfully!',
        'prayer': prayer.to_dict()
    }), 201


@bp.route('/today', methods=['GET'])
@jwt_required()
def get_todays_prayers():
    user_id = get_jwt_identity()
    today = date.today()

    checked_in = Prayer.query.filter_by(
        user_id=user_id,
        prayer_date=today
    ).all()

    checked_in_names = [p.prayer_name for p in checked_in]
    pending = [p for p in VALID_PRAYERS if p not in checked_in_names]

    return jsonify({
        'date': today.isoformat(),
        'completed': [p.to_dict() for p in checked_in],
        'completed_names': checked_in_names,
        'pending': pending,
        'total_completed': len(checked_in),
        'total_prayers': 5
    })


@bp.route('/history', methods=['GET'])
@jwt_required()
def get_prayer_history():
    user_id = get_jwt_identity()
    days = request.args.get('days', 7, type=int)
    days = min(days, 30)

    start_date = date.today() - timedelta(days=days)

    prayers = Prayer.query.filter(
        Prayer.user_id == user_id,
        Prayer.prayer_date >= start_date
    ).order_by(Prayer.prayer_date.desc(), Prayer.checked_in_at.desc()).all()

    return jsonify({
        'prayers': [p.to_dict() for p in prayers],
        'total': len(prayers),
        'days': days
    })


@bp.route('/<prayer_id>', methods=['DELETE'])
@jwt_required()
def delete_prayer(prayer_id):
    user_id = get_jwt_identity()

    prayer = Prayer.query.get(prayer_id)

    if not prayer:
        return jsonify({'error': 'Prayer not found'}), 404

    if prayer.user_id != user_id:
        return jsonify({'error': 'Not authorized to delete this prayer'}), 403

    if prayer.photo_url:
        ImageService.delete_image(prayer.photo_url)

    db.session.delete(prayer)
    db.session.commit()

    return jsonify({'message': 'Prayer deleted successfully'})
