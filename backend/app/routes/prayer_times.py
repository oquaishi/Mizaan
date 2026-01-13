from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.services.prayer_times_service import PrayerTimesService
from datetime import datetime

bp = Blueprint('prayer_times', __name__, url_prefix='/api/prayer-times')


@bp.route('', methods=['GET'])
@jwt_required()
def get_today_prayer_times():
    """
    Get prayer times for today based on user's saved location.
    Requires authentication.
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if user has location set
        if not user.location:
            return jsonify({
                'error': 'Location not set',
                'message': 'Please set your location in settings to view prayer times'
            }), 400

        # Parse location (stored as "latitude,longitude")
        try:
            latitude, longitude = map(float, user.location.split(','))
        except ValueError:
            return jsonify({'error': 'Invalid location format'}), 400

        # Get calculation method (default to ISNA = 2)
        method = get_method_number(user.calculation_method)

        # Fetch prayer times
        prayer_data = PrayerTimesService.get_prayer_times(
            latitude=latitude,
            longitude=longitude,
            method=method
        )

        # Get current prayer and next prayer
        current_prayer, next_prayer = PrayerTimesService.get_current_prayer(
            prayer_data['times']
        )

        # Calculate time until next prayer
        time_until_next = PrayerTimesService.calculate_time_until_prayer(
            next_prayer,
            prayer_data['times']
        )

        return jsonify({
            'date': prayer_data['date'],
            'date_gregorian': prayer_data['date_gregorian'],
            'times': prayer_data['times'],
            'current_prayer': current_prayer,
            'next_prayer': next_prayer,
            'time_until_next': time_until_next,
            'calculation_method': user.calculation_method,
            'location': {
                'latitude': latitude,
                'longitude': longitude
            }
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch prayer times', 'details': str(e)}), 500


@bp.route('/<date>', methods=['GET'])
@jwt_required()
def get_prayer_times_for_date(date):
    """
    Get prayer times for a specific date.
    Date should be in DD-MM-YYYY format.
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if user has location set
        if not user.location:
            return jsonify({
                'error': 'Location not set',
                'message': 'Please set your location in settings to view prayer times'
            }), 400

        # Validate date format
        try:
            datetime.strptime(date, '%d-%m-%Y')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use DD-MM-YYYY'}), 400

        # Parse location
        try:
            latitude, longitude = map(float, user.location.split(','))
        except ValueError:
            return jsonify({'error': 'Invalid location format'}), 400

        # Get calculation method
        method = get_method_number(user.calculation_method)

        # Fetch prayer times for specific date
        prayer_data = PrayerTimesService.get_prayer_times(
            latitude=latitude,
            longitude=longitude,
            date=date,
            method=method
        )

        return jsonify({
            'date': prayer_data['date'],
            'date_gregorian': prayer_data['date_gregorian'],
            'times': prayer_data['times'],
            'calculation_method': user.calculation_method,
            'location': {
                'latitude': latitude,
                'longitude': longitude
            }
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch prayer times', 'details': str(e)}), 500


def get_method_number(method_name: str) -> int:
    """Convert method name to Aladhan API method number."""
    method_map = {
        'ISNA': 2,
        'MWL': 3,
        'KARACHI': 1,
        'MAKKAH': 4,
        'EGYPT': 5
    }
    return method_map.get(method_name, 2)  # Default to ISNA
