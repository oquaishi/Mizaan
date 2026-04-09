from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, date, timedelta
import pytz


scheduler = BackgroundScheduler()


def check_prayer_reminders():
    from app import db
    from app.models.user import User
    from app.models.prayer import Prayer
    from app.services.notification_service import NotificationService
    from app.services.prayer_time_service import PrayerTimeService

    with db.app.app_context():
        users = User.query.filter_by(notifications_enabled=True, prayer_reminders_enabled=True).all()

        for user in users:
            if not user.fcm_token or not user.timezone or not user.location:
                continue

            try:
                tz = pytz.timezone(user.timezone)
                now = datetime.now(tz)
                today = now.date()

                prayer_times = PrayerTimeService.get_prayer_times(user.location, today)
                if not prayer_times:
                    continue

                prayer_names = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
                time_keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

                completed_prayers = {
                    p.prayer_name for p in Prayer.query.filter_by(
                        user_id=user.id,
                        prayer_date=today
                    ).all()
                }

                minutes_before = user.reminder_minutes_before or 15

                for name, key in zip(prayer_names, time_keys):
                    if name in completed_prayers:
                        continue

                    time_str = prayer_times.get(key)
                    if not time_str:
                        continue

                    prayer_hour, prayer_minute = map(int, time_str.split(':'))
                    prayer_dt = tz.localize(datetime(today.year, today.month, today.day, prayer_hour, prayer_minute))
                    reminder_dt = prayer_dt - timedelta(minutes=minutes_before)

                    diff = abs((now - reminder_dt).total_seconds())
                    if diff <= 150:
                        NotificationService.send_prayer_reminder(user, name, minutes_before)

            except Exception as e:
                print(f'Reminder check error for user {user.id}: {e}')


def check_missed_prayers():
    from app import db
    from app.models.user import User
    from app.models.prayer import Prayer
    from app.services.notification_service import NotificationService
    from app.services.prayer_time_service import PrayerTimeService

    with db.app.app_context():
        users = User.query.filter_by(notifications_enabled=True, missed_prayer_alerts=True).all()

        prayer_names = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
        time_keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

        for user in users:
            if not user.fcm_token or not user.timezone or not user.location:
                continue

            try:
                tz = pytz.timezone(user.timezone)
                now = datetime.now(tz)
                today = now.date()

                prayer_times = PrayerTimeService.get_prayer_times(user.location, today)
                if not prayer_times:
                    continue

                completed_prayers = {
                    p.prayer_name for p in Prayer.query.filter_by(
                        user_id=user.id,
                        prayer_date=today
                    ).all()
                }

                for name, key in zip(prayer_names, time_keys):
                    if name in completed_prayers:
                        continue

                    time_str = prayer_times.get(key)
                    if not time_str:
                        continue

                    prayer_hour, prayer_minute = map(int, time_str.split(':'))
                    prayer_dt = tz.localize(datetime(today.year, today.month, today.day, prayer_hour, prayer_minute))

                    missed_window_start = prayer_dt + timedelta(minutes=30)
                    missed_window_end = prayer_dt + timedelta(minutes=35)

                    if missed_window_start <= now <= missed_window_end:
                        NotificationService.send_missed_prayer_alert(user, name)

            except Exception as e:
                print(f'Missed prayer check error for user {user.id}: {e}')


def start_scheduler(app):
    scheduler.add_job(
        check_prayer_reminders,
        CronTrigger(minute='*/2'),
        id='prayer_reminders',
        replace_existing=True
    )

    scheduler.add_job(
        check_missed_prayers,
        CronTrigger(minute='*/5'),
        id='missed_prayers',
        replace_existing=True
    )

    scheduler.start()
    print('Scheduler started')
