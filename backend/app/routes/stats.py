from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.stats_service import StatsService
from app.models.prayer import Prayer
from datetime import date

bp = Blueprint('stats', __name__, url_prefix='/api/stats')


@bp.route('', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    stats = StatsService.get_full_stats(user_id)
    return jsonify(stats)


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
