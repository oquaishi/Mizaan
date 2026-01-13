import React, { createContext, useState, useContext, useEffect } from 'react';
import { prayerTimesAPI } from '../services/api';

interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface PrayerTimesData {
  date: string;
  date_gregorian: string;
  times: PrayerTimes;
  current_prayer: string;
  next_prayer: string;
  time_until_next: string;
  calculation_method: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface PrayerTimesContextType {
  prayerTimes: PrayerTimesData | null;
  isLoading: boolean;
  error: string | null;
  fetchPrayerTimes: () => Promise<void>;
  refreshPrayerTimes: () => Promise<void>;
}

const PrayerTimesContext = createContext<PrayerTimesContextType | undefined>(undefined);

export const PrayerTimesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrayerTimes = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const data = await prayerTimesAPI.getTodayPrayerTimes();
      setPrayerTimes(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Failed to fetch prayer times';
      setError(errorMessage);
      console.error('Error fetching prayer times:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPrayerTimes = async () => {
    await fetchPrayerTimes();
  };

  return (
    <PrayerTimesContext.Provider
      value={{
        prayerTimes,
        isLoading,
        error,
        fetchPrayerTimes,
        refreshPrayerTimes,
      }}
    >
      {children}
    </PrayerTimesContext.Provider>
  );
};

// Custom hook to use prayer times context
export const usePrayerTimes = () => {
  const context = useContext(PrayerTimesContext);
  if (context === undefined) {
    throw new Error('usePrayerTimes must be used within a PrayerTimesProvider');
  }
  return context;
};
