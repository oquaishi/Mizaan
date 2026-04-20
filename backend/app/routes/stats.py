from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.stats_service import StatsService
from app.models.prayer import Prayer
from app.models.friendship import Friendship
from app.models.user import User
from app import db
from datetime import date, timedelta
from sqlalchemy import func, or_

bp = Blueprint('stats', __name__, url_prefix='/api/stats')


@bp.route('', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    stats = StatsService.get_full_stats(user_id)
    return jsonify(stats)


@bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    user_id = get_jwt_identity()

    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # Monday
    days_until_reset = 7 - today.weekday()

    # Get all accepted friend IDs
    friendships = Friendship.query.filter(
        or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
        Friendship.status == 'accepted'
    ).all()

    friend_ids = [
        f.addressee_id if f.requester_id == user_id else f.requester_id
        for f in friendships
    ]

    all_ids = [user_id] + friend_ids

    # Count completed prayers this week per user
    counts = db.session.query(
        Prayer.user_id,
        func.count(Prayer.id).label('count')
    ).filter(
        Prayer.user_id.in_(all_ids),
        Prayer.prayer_date >= week_start,
        Prayer.prayer_date <= today,
        Prayer.status == 'completed'
    ).group_by(Prayer.user_id).all()

    count_map = {r.user_id: r.count for r in counts}

    users = User.query.filter(User.id.in_(all_ids)).all()

    leaderboard = sorted([
        {
            'user_id': u.id,
            'username': u.username,
            'count': count_map.get(u.id, 0),
            'is_me': u.id == user_id,
        }
        for u in users
    ], key=lambda x: x['count'], reverse=True)

    for i, entry in enumerate(leaderboard):
        entry['rank'] = i + 1

    return jsonify({
        'leaderboard': leaderboard,
        'week_start': week_start.isoformat(),
        'days_until_reset': days_until_reset,
    })


@bp.route('/debug', methods=['GET'])
@jwt_required()
@jwt_required()
def debug_stats():
    user_id = get_jwt_identity()
    today = date.today()

    all_prayers = Prayer.query.filter_by(user_id=user_id).all()
    today_prayers = Prayer.query.filter_by(user_id=user_id, prayer_date=today).all()

    return jsonify({
        'user_id': user_id,
        'server_date_today': today.isoformat(),
        'total_prayers_in_db': len(all_prayers),
        'todays_prayer_count': len(today_prayers),
        'todays_prayers': [p.to_dict() for p in today_prayers],
        'all_prayer_dates': list(set([p.prayer_date.isoformat() for p in all_prayers]))
    })
