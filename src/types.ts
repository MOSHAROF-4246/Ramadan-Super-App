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
  email: string;
  location: {
    city: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  language: 'en' | 'bn' | 'ar';
  theme: 'light' | 'dark';
}

export interface DailyLog {
  id?: number;
  user_id: string;
  date: string;
  roza_kept: boolean;
  missed_reason?: string;
  sehri_taken: boolean;
  iftar_done: boolean;
  taraweeh_prayed: boolean;
  quran_pages: number;
  zikr_count: number;
  charity_amount: number;
  notes?: string;
}
