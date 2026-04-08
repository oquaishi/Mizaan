from datetime import date, timedelta
from app.models.prayer import Prayer

PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']


class StatsService:

    @staticmethod
    def get_full_stats(user_id: str) -> dict:
        current_streak = StatsService._calculate_current_streak(user_id)
        longest_streak = StatsService._calculate_longest_streak(user_id)
        weekly_rate = StatsService._calculate_completion_rate(user_id, 7)
        monthly_rate = StatsService._calculate_completion_rate(user_id, 30)
        calendar = StatsService._get_calendar_data(user_id, 30)

        return {
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'weekly_completion_rate': weekly_rate,
            'monthly_completion_rate': monthly_rate,
            'calendar': calendar
        }

    @staticmethod
    def _calculate_current_streak(user_id: str) -> int:
        streak = 0
        check_date = date.today()

        while True:
            count = Prayer.query.filter_by(
                user_id=user_id,
                prayer_date=check_date
            ).count()

            if count == 5:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        return streak

    @staticmethod
    def _calculate_longest_streak(user_id: str) -> int:
        prayers = Prayer.query.filter_by(user_id=user_id).all()

        if not prayers:
            return 0

        # Group prayer counts by date
        daily_counts = {}
        for prayer in prayers:
            d = prayer.prayer_date
            daily_counts[d] = daily_counts.get(d, 0) + 1

        # Walk through sorted dates and find longest consecutive run of 5/5 days
        sorted_dates = sorted(daily_counts.keys())
        longest = 0
        current = 0

        for i, d in enumerate(sorted_dates):
            if daily_counts[d] == 5:
                if i == 0 or (d - sorted_dates[i - 1]).days == 1:
                    current += 1
                else:
                    current = 1
                longest = max(longest, current)
            else:
                current = 0

        return longest

    @staticmethod
    def _calculate_completion_rate(user_id: str, days: int) -> float:
        start_date = date.today() - timedelta(days=days - 1)

        prayers = Prayer.query.filter(
            Prayer.user_id == user_id,
            Prayer.prayer_date >= start_date
        ).all()

        total_possible = days * 5
        completed = len(prayers)

        if total_possible == 0:
            return 0.0

        return round((completed / total_possible) * 100, 1)

    @staticmethod
    def _get_calendar_data(user_id: str, days: int) -> list:
        start_date = date.today() - timedelta(days=days - 1)

        prayers = Prayer.query.filter(
            Prayer.user_id == user_id,
            Prayer.prayer_date >= start_date
        ).all()

        # Group by date
        daily_counts = {}
        for prayer in prayers:
            d = prayer.prayer_date.isoformat()
            daily_counts[d] = daily_counts.get(d, 0) + 1

        # Build calendar entries for each day in range
        calendar = []
        for i in range(days):
            day = (start_date + timedelta(days=i)).isoformat()
            count = daily_counts.get(day, 0)

            if count == 5:
                status = 'complete'
            elif count > 0:
                status = 'partial'
            else:
                status = 'missed'

            calendar.append({
                'date': day,
                'count': count,
                'status': status
            })

        return calendar
