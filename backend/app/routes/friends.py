from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from app import db
from app.models.user import User
from app.models.friendship import Friendship

bp = Blueprint('friends', __name__, url_prefix='/api/friends')


@bp.route('/request', methods=['POST'])
@jwt_required()
def send_request():
    requester_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('addressee_id'):
        return jsonify({'error': 'addressee_id is required'}), 400

    addressee_id = data['addressee_id']

    if requester_id == addressee_id:
        return jsonify({'error': 'You cannot send a friend request to yourself'}), 400

    # Check addressee exists
    addressee = User.query.get(addressee_id)
    if not addressee:
        return jsonify({'error': 'User not found'}), 404

    # Check if a friendship already exists in either direction
    existing = Friendship.query.filter(
        or_(
            (Friendship.requester_id == requester_id) & (Friendship.addressee_id == addressee_id),
            (Friendship.requester_id == addressee_id) & (Friendship.addressee_id == requester_id)
        )
    ).first()

    if existing:
        if existing.status == 'accepted':
            return jsonify({'error': 'Already friends'}), 400
        if existing.status == 'pending':
            return jsonify({'error': 'Friend request already sent'}), 400
        if existing.status == 'declined':
            # Allow re-request by updating the existing record
            existing.status = 'pending'
            existing.requester_id = requester_id
            existing.addressee_id = addressee_id
            db.session.commit()
            return jsonify({'message': 'Friend request sent', 'friendship': existing.to_dict()}), 200

    friendship = Friendship(
        requester_id=requester_id,
        addressee_id=addressee_id,
        status='pending'
    )
    db.session.add(friendship)
    db.session.commit()

    return jsonify({'message': 'Friend request sent', 'friendship': friendship.to_dict()}), 201


@bp.route('/<friendship_id>/respond', methods=['PUT'])
@jwt_required()
def respond_to_request(friendship_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get('action'):
        return jsonify({'error': 'action is required (accept or decline)'}), 400

    action = data['action']
    if action not in ['accept', 'decline']:
        return jsonify({'error': 'action must be accept or decline'}), 400

    friendship = Friendship.query.get(friendship_id)
    if not friendship:
        return jsonify({'error': 'Friend request not found'}), 404

    # Only the addressee can respond
    if friendship.addressee_id != user_id:
        return jsonify({'error': 'Not authorized to respond to this request'}), 403

    if friendship.status != 'pending':
        return jsonify({'error': 'This request has already been responded to'}), 400

    friendship.status = 'accepted' if action == 'accept' else 'declined'
    db.session.commit()

    return jsonify({
        'message': f'Friend request {friendship.status}',
        'friendship': friendship.to_dict()
    })


@bp.route('', methods=['GET'])
@jwt_required()
def get_friends():
    user_id = get_jwt_identity()

    friendships = Friendship.query.filter(
        or_(
            Friendship.requester_id == user_id,
            Friendship.addressee_id == user_id
        ),
        Friendship.status == 'accepted'
    ).all()

    friends = []
    for f in friendships:
        # Return the other user's info
        friend_user = f.addressee if f.requester_id == user_id else f.requester
        friends.append({
            'friendship_id': f.id,
            'user_id': friend_user.id,
            'username': friend_user.username,
            'profile_picture_url': friend_user.profile_picture_url,
            'since': f.created_at.isoformat() if f.created_at else None
        })

    return jsonify({'friends': friends, 'total': len(friends)})


@bp.route('/requests', methods=['GET'])
@jwt_required()
def get_pending_requests():
    user_id = get_jwt_identity()

    pending = Friendship.query.filter_by(
        addressee_id=user_id,
        status='pending'
    ).all()

    return jsonify({
        'requests': [f.to_dict() for f in pending],
        'total': len(pending)
    })


@bp.route('/<friendship_id>', methods=['DELETE'])
@jwt_required()
def remove_friend(friendship_id):
    user_id = get_jwt_identity()

    friendship = Friendship.query.get(friendship_id)
    if not friendship:
        return jsonify({'error': 'Friendship not found'}), 404

    # Either user in the friendship can remove it
    if friendship.requester_id != user_id and friendship.addressee_id != user_id:
        return jsonify({'error': 'Not authorized'}), 403

    db.session.delete(friendship)
    db.session.commit()

    return jsonify({'message': 'Friend removed successfully'})
