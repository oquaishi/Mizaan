import requests
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

class PrayerTimesService:
    """
    Service for fetching and calculating Islamic prayer times using Aladhan API.
    Handles API communication, caching, and current prayer detection.
    """

    ALADHAN_API_BASE = "http://api.aladhan.com/v1"
    PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

    # Cache to avoid excessive API calls (in-memory for now)
    _cache = {}

    @classmethod
    def get_prayer_times(cls, latitude: float, longitude: float,
                        date: Optional[str] = None,
                        method: int = 2) -> Dict:
        """
        Fetch prayer times for a given location and date.

        Args:
            latitude: Location latitude
            longitude: Location longitude
            date: Date in DD-MM-YYYY format (default: today)
            method: Calculation method (default: 2 for ISNA)
                1 = University of Islamic Sciences, Karachi
                2 = Islamic Society of North America (ISNA)
                3 = Muslim World League (MWL)
                4 = Umm al-Qura, Makkah
                5 = Egyptian General Authority of Survey

        Returns:
            Dictionary with prayer times and metadata
        """
        # Use today's date if not provided
        if not date:
            date = datetime.now().strftime('%d-%m-%Y')

        # Check cache first
        cache_key = f"{latitude}_{longitude}_{date}_{method}"
        if cache_key in cls._cache:
            return cls._cache[cache_key]

        # Make API request
        try:
            url = f"{cls.ALADHAN_API_BASE}/timings/{date}"
            params = {
                'latitude': latitude,
                'longitude': longitude,
                'method': method
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            if data['code'] == 200:
                timings = data['data']['timings']

                # Extract only the 5 main prayers
                prayer_times = {
                    'Fajr': timings['Fajr'],
                    'Dhuhr': timings['Dhuhr'],
                    'Asr': timings['Asr'],
                    'Maghrib': timings['Maghrib'],
                    'Isha': timings['Isha']
                }

                result = {
                    'date': data['data']['date']['readable'],
                    'date_gregorian': data['data']['date']['gregorian']['date'],
                    'times': prayer_times,
                    'method': method,
                    'location': {
                        'latitude': latitude,
                        'longitude': longitude
                    }
                }

                # Cache the result for 24 hours
                cls._cache[cache_key] = result

                return result
            else:
                raise Exception("Invalid response from Aladhan API")

        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch prayer times: {str(e)}")

    @classmethod
    def get_current_prayer(cls, prayer_times: Dict) -> Tuple[Optional[str], Optional[str]]:
        """
        Determine which prayer is currently active and which is next.

        Args:
            prayer_times: Dictionary of prayer times (e.g., {'Fajr': '06:15', ...})

        Returns:
            Tuple of (current_prayer, next_prayer)
        """
        now = datetime.now()
        current_time = now.time()

        # Convert prayer times to datetime.time objects
        times = {}
        for prayer, time_str in prayer_times.items():
            hour, minute = map(int, time_str.split(':'))
            times[prayer] = datetime.strptime(f"{hour:02d}:{minute:02d}", "%H:%M").time()

        # Determine current and next prayer
        current_prayer = None
        next_prayer = None

        # Check each prayer window
        if current_time < times['Fajr']:
            # Before Fajr (early morning) - still Isha from yesterday
            current_prayer = 'Isha'
            next_prayer = 'Fajr'
        elif current_time >= times['Fajr'] and current_time < times['Dhuhr']:
            current_prayer = 'Fajr'
            next_prayer = 'Dhuhr'
        elif current_time >= times['Dhuhr'] and current_time < times['Asr']:
            current_prayer = 'Dhuhr'
            next_prayer = 'Asr'
        elif current_time >= times['Asr'] and current_time < times['Maghrib']:
            current_prayer = 'Asr'
            next_prayer = 'Maghrib'
        elif current_time >= times['Maghrib'] and current_time < times['Isha']:
            current_prayer = 'Maghrib'
            next_prayer = 'Isha'
        else:  # current_time >= times['Isha']
            current_prayer = 'Isha'
            next_prayer = 'Fajr'  # Next day's Fajr

        return current_prayer, next_prayer

    @classmethod
    def calculate_time_until_prayer(cls, target_prayer: str, prayer_times: Dict) -> str:
        """
        Calculate time remaining until a specific prayer.

        Args:
            target_prayer: Name of the prayer (e.g., 'Dhuhr')
            prayer_times: Dictionary of prayer times

        Returns:
            Formatted string like "2 hours 15 minutes" or "45 minutes"
        """
        now = datetime.now()

        # Get target prayer time
        target_time_str = prayer_times.get(target_prayer)
        if not target_time_str:
            return "Unknown"

        hour, minute = map(int, target_time_str.split(':'))
        target_datetime = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

        # If target time has passed today, it's tomorrow (only for Fajr after Isha)
        if target_datetime < now:
            target_datetime += timedelta(days=1)

        # Calculate difference
        time_diff = target_datetime - now

        hours = time_diff.seconds // 3600
        minutes = (time_diff.seconds % 3600) // 60

        if hours > 0:
            return f"{hours} hour{'s' if hours != 1 else ''} {minutes} minute{'s' if minutes != 1 else ''}"
        else:
            return f"{minutes} minute{'s' if minutes != 1 else ''}"

    @classmethod
    def get_method_name(cls, method: int) -> str:
        """Get human-readable name for calculation method."""
        methods = {
            1: "University of Islamic Sciences, Karachi",
            2: "Islamic Society of North America (ISNA)",
            3: "Muslim World League (MWL)",
            4: "Umm al-Qura, Makkah",
            5: "Egyptian General Authority of Survey"
        }
        return methods.get(method, "Unknown Method")

    @classmethod
    def clear_cache(cls):
        """Clear the prayer times cache."""
        cls._cache = {}
