export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface UserProfile {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    lat?: number;
    lng?: number;
  };
}

export interface IbadahLog {
  id: number;
  date: string;
  type: 'salah' | 'fasting' | 'quran' | 'charity' | 'zikr';
  value: string;
  notes?: string;
}
