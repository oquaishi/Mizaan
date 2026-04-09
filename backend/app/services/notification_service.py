from exponent_server_sdk import (
    PushClient,
    PushMessage,
    PushServerError,
    DeviceNotRegisteredError,
)
from app import db


class NotificationService:

    @staticmethod
    def send_notification(token: str, title: str, body: str, data: dict = None):
        if not token or not token.startswith('ExponentPushToken'):
            return False

        try:
            response = PushClient().publish(
                PushMessage(
                    to=token,
                    title=title,
                    body=body,
                    data=data or {},
                    sound='default',
                    badge=1,
                )
            )
            response.validate_response()
            return True

        except DeviceNotRegisteredError:
            # Token is no longer valid - clear it from the database
            from app.models.user import User
            user = User.query.filter_by(fcm_token=token).first()
            if user:
                user.fcm_token = None
                db.session.commit()
            return False

        except PushServerError as e:
            print(f'Push server error: {e}')
            return False

        except Exception as e:
            print(f'Notification error: {e}')
            return False

    @staticmethod
    def send_prayer_reminder(user, prayer_name: str, minutes_before: int):
        if not user.fcm_token or not user.notifications_enabled or not user.prayer_reminders_enabled:
            return

        NotificationService.send_notification(
            token=user.fcm_token,
            title=f'{prayer_name} in {minutes_before} minutes',
            body='Time to prepare for prayer 🕌',
            data={'type': 'prayer_reminder', 'prayer_name': prayer_name}
        )

    @staticmethod
    def send_missed_prayer_alert(user, prayer_name: str):
        if not user.fcm_token or not user.notifications_enabled or not user.missed_prayer_alerts:
            return

        NotificationService.send_notification(
            token=user.fcm_token,
            title=f'You missed {prayer_name}',
            body='You can still check in — tap to open Mizaan',
            data={'type': 'missed_prayer', 'prayer_name': prayer_name}
        )

    @staticmethod
    def send_friend_activity_alert(user, friend_username: str, prayer_name: str):
        if not user.fcm_token or not user.notifications_enabled or not user.friend_activity_alerts:
            return

        NotificationService.send_notification(
            token=user.fcm_token,
            title=f'{friend_username} just prayed',
            body=f'{friend_username} checked in for {prayer_name} 🤲',
            data={'type': 'friend_activity', 'prayer_name': prayer_name}
        )
