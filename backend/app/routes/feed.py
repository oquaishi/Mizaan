from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from app import db
from app.models.prayer import Prayer
from app.models.friendship import Friendship
from app.models.reaction import Reaction
from app.models.user import User

bp = Blueprint('feed', __name__, url_prefix='/api/feed')

PAGE_SIZE = 20


def get_friend_ids(user_id):
    friendships = Friendship.query.filter(
        or_(
            Friendship.requester_id == user_id,
            Friendship.addressee_id == user_id
        ),
        Friendship.status == 'accepted'
    ).all()

    friend_ids = []
    for f in friendships:
        friend_ids.append(f.addressee_id if f.requester_id == user_id else f.requester_id)

    return friend_ids


@bp.route('', methods=['GET'])
@jwt_required()
def get_feed():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)

    friend_ids = get_friend_ids(user_id)

    if not friend_ids:
        return jsonify({'feed': [], 'page': page, 'has_more': False})

    offset = (page - 1) * PAGE_SIZE

    prayers = Prayer.query.filter(
        Prayer.user_id.in_(friend_ids)
    ).order_by(
        Prayer.checked_in_at.desc()
    ).limit(PAGE_SIZE + 1).offset(offset).all()

    has_more = len(prayers) > PAGE_SIZE
    prayers = prayers[:PAGE_SIZE]

    # Get reaction counts and whether current user reacted for each prayer
    feed = []
    for prayer in prayers:
        reaction_count = Reaction.query.filter_by(prayer_id=prayer.id).count()
        user_reacted = Reaction.query.filter_by(
            prayer_id=prayer.id,
            user_id=user_id
        ).first() is not None

        feed.append({
            'prayer_id': prayer.id,
            'user_id': prayer.user_id,
            'username': prayer.user.username,
            'profile_picture_url': prayer.user.profile_picture_url,
            'prayer_name': prayer.prayer_name,
            'photo_url': prayer.photo_url,
            'checked_in_at': prayer.checked_in_at.isoformat() if prayer.checked_in_at else None,
            'prayer_date': prayer.prayer_date.isoformat() if prayer.prayer_date else None,
            'reaction_count': reaction_count,
            'user_reacted': user_reacted
        })

    return jsonify({'feed': feed, 'page': page, 'has_more': has_more})


@bp.route('/<prayer_id>/react', methods=['POST'])
@jwt_required()
def add_reaction(prayer_id):
    user_id = get_jwt_identity()

    prayer = Prayer.query.get(prayer_id)
    if not prayer:
        return jsonify({'error': 'Prayer not found'}), 404

    if prayer.user_id == user_id:
        return jsonify({'error': 'You cannot react to your own prayer'}), 400

    existing = Reaction.query.filter_by(user_id=user_id, prayer_id=prayer_id).first()
    if existing:
        return jsonify({'error': 'Already reacted to this prayer'}), 400

    reaction = Reaction(user_id=user_id, prayer_id=prayer_id)
    db.session.add(reaction)
    db.session.commit()

    reaction_count = Reaction.query.filter_by(prayer_id=prayer_id).count()

    return jsonify({
        'message': 'Reaction added',
        'reaction_count': reaction_count
    }), 201


@bp.route('/<prayer_id>/react', methods=['DELETE'])
@jwt_required()
def remove_reaction(prayer_id):
    user_id = get_jwt_identity()

    reaction = Reaction.query.filter_by(
        user_id=user_id,
        prayer_id=prayer_id
    ).first()

    if not reaction:
        return jsonify({'error': 'Reaction not found'}), 404

    db.session.delete(reaction)
    db.session.commit()

    reaction_count = Reaction.query.filter_by(prayer_id=prayer_id).count()

    return jsonify({
        'message': 'Reaction removed',
        'reaction_count': reaction_count
    })
