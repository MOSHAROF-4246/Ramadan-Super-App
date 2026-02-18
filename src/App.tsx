import React, { useState, useEffect } from 'react';
import { 
  Moon, Sun, MapPin, Clock, BookOpen, Heart, 
  Settings, BarChart3, MessageSquare, Home, 
  Calendar, Award, Users, Calculator, Search,
  ChevronRight, Bell, Zap, Coffee, Droplets
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getRamadanCoachAdvice } from './services/geminiService';
import { PrayerTimes, UserProfile, IbadahLog } from './types';
import { QuranReader } from './components/QuranReader';
import { ZakatCalculator } from './components/ZakatCalculator';
import { TasbihCounter } from './components/TasbihCounter';
import { translations, Language } from './translations';

// --- Components ---

const Card = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={`glass rounded-3xl p-6 ${className} ${onClick ? 'cursor-pointer hover:bg-stone-50 transition-colors' : ''}`}
  >
    {children}
  </motion.div>
);

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${active ? 'text-ramadan-emerald scale-110' : 'text-stone-400 hover:text-stone-600'}`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];
  const [location, setLocation] = useState({ city: 'Dhaka', country: 'Bangladesh' });
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string, time: string } | null>(null);
  const [countdown, setCountdown] = useState('');
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sehriAlertMins, setSehriAlertMins] = useState(15);
  const [alertTriggered, setAlertTriggered] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkAlert = () => {
      if (!prayerTimes || alertTriggered) return;
      
      const imsakTime = prayerTimes.Imsak;
      const [hours, minutes] = imsakTime.split(':');
      const imsakDate = new Date();
      imsakDate.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const alertDate = new Date(imsakDate.getTime() - sehriAlertMins * 60000);
      const now = new Date();
      
      if (now >= alertDate && now < imsakDate) {
        if (Notification.permission === "granted") {
          new Notification(t.alertTitle, {
            body: t.alertBody.replace('{mins}', sehriAlertMins.toString()),
            icon: '/favicon.ico'
          });
          setAlertTriggered(true);
        }
      }
      
      // Reset alert after Imsak passes
      if (now > imsakDate) {
        setAlertTriggered(false);
      }
    };

    const alertInterval = setInterval(checkAlert, 30000);
    return () => clearInterval(alertInterval);
  }, [prayerTimes, sehriAlertMins, alertTriggered, t]);

  useEffect(() => {
    fetchPrayerTimes();
    fetchAiAdvice();
  }, [location, lang]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (prayerTimes) updateCountdown();
    }, 1000);
    return () => clearInterval(timer);
  }, [prayerTimes]);

  const fetchPrayerTimes = async () => {
    try {
      const res = await fetch(`/api/prayer-times?city=${location.city}&country=${location.country}`);
      const data = await res.json();
      if (data.data) {
        setPrayerTimes(data.data.timings);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching prayer times", error);
    }
  };

  const fetchAiAdvice = async () => {
    const advice = await getRamadanCoachAdvice({ fasting: true, quran: '2 juz', mood: 'energetic' }, lang);
    setAiAdvice(advice);
  };

  const updateCountdown = () => {
    if (!prayerTimes) return;
    const now = new Date();
    const times = Object.entries(prayerTimes).map(([name, time]) => {
      const [hours, minutes] = (time as string).split(':');
      const prayerDate = new Date();
      prayerDate.setHours(parseInt(hours), parseInt(minutes), 0);
      if (prayerDate < now) prayerDate.setDate(prayerDate.getDate() + 1);
      return { name, time: prayerDate };
    }).sort((a, b) => a.time.getTime() - b.time.getTime());

    const next = times[0];
    setNextPrayer({ name: next.name, time: prayerTimes[next.name as keyof PrayerTimes] });

    const diff = next.time.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setCountdown(`${h}h ${m}m ${s}s`);
  };

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-ramadan-emerald/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-ramadan-gold/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-ramadan-green">{t.appName}</h1>
          <div className="flex items-center gap-1 text-stone-500 text-sm">
            <MapPin size={14} />
            <span>{location.city}, {location.country}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="px-3 py-1 glass rounded-xl text-xs font-bold text-ramadan-emerald"
          >
            {lang === 'en' ? 'BN' : 'EN'}
          </button>
          <button className="p-3 glass rounded-2xl text-stone-600"><Bell size={20} /></button>
        </div>
      </header>

      <main className="px-6 space-y-6">
        {activeTab === 'home' && (
          <>
            {/* Hero Countdown */}
            <Card className="bg-gradient-to-br from-ramadan-green to-emerald-900 text-white border-none overflow-hidden relative">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    {t.next}: {lang === 'bn' ? (t.salahNames[nextPrayer?.name as keyof typeof t.salahNames] || nextPrayer?.name) : nextPrayer?.name}
                  </span>
                  <Moon className="text-ramadan-gold fill-ramadan-gold" size={24} />
                </div>
                <div className="text-4xl font-display font-bold mb-1">{countdown}</div>
                <p className="text-white/70 text-sm">
                  {t.until} {lang === 'bn' ? (t.salahNames[nextPrayer?.name as keyof typeof t.salahNames] || nextPrayer?.name) : nextPrayer?.name} {t.at} {nextPrayer?.time}
                </p>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                <Moon size={150} />
              </div>
            </Card>

            {/* AI Coach Advice */}
            <Card className="bg-ramadan-gold/5 border-ramadan-gold/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-ramadan-gold/20 rounded-xl text-ramadan-gold">
                  <Zap size={20} />
                </div>
                <h3 className="font-display font-bold text-stone-800">{t.aiCoach}</h3>
              </div>
              <p className="text-stone-600 text-sm italic mb-4">"{aiAdvice?.motivation || t.loadingAdvice}"</p>
              <div className="space-y-3">
                {aiAdvice?.tips?.map((tip: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-ramadan-emerald/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-ramadan-emerald" />
                    </div>
                    <span className="text-sm text-stone-700">{tip}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Sehri Alert Setting */}
            <Card className="bg-stone-50 border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="text-ramadan-emerald" size={20} />
                  <h3 className="font-bold text-stone-800">{t.sehriAlert}</h3>
                </div>
                <span className="bg-ramadan-emerald/10 text-ramadan-emerald px-3 py-1 rounded-full text-xs font-bold">
                  {sehriAlertMins} {t.minsBefore}
                </span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="60" 
                step="5"
                value={sehriAlertMins}
                onChange={(e) => {
                  setSehriAlertMins(parseInt(e.target.value));
                  setAlertTriggered(false);
                }}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-ramadan-emerald"
              />
              <div className="flex justify-between mt-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                <span>5m</span>
                <span>30m</span>
                <span>60m</span>
              </div>
            </Card>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card 
                onClick={() => setActiveTab('quran')}
                className="flex flex-col items-center text-center gap-3 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><BookOpen size={24} /></div>
                <div>
                  <h4 className="font-bold text-stone-800">{t.quran}</h4>
                  <p className="text-[10px] text-stone-500 uppercase tracking-tighter">{t.readListen}</p>
                </div>
              </Card>
              <Card 
                onClick={() => setActiveTab('zakat')}
                className="flex flex-col items-center text-center gap-3 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Heart size={24} /></div>
                <div>
                  <h4 className="font-bold text-stone-800">{t.zakat}</h4>
                  <p className="text-[10px] text-stone-500 uppercase tracking-tighter">{t.calculateWealth}</p>
                </div>
              </Card>
            </div>

            {/* Prayer Times List */}
            <Card>
              <h3 className="font-display font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-ramadan-emerald" />
                {t.schedule}
              </h3>
              <div className="space-y-1">
                {prayerTimes && Object.entries(prayerTimes).filter(([k]) => !['Imsak', 'Midnight', 'Sunset'].includes(k)).map(([name, time]) => (
                  <div key={name} className={`flex justify-between items-center p-3 rounded-2xl transition-all ${nextPrayer?.name === name ? 'bg-ramadan-emerald/10 text-ramadan-emerald font-bold' : 'text-stone-600'}`}>
                    <span>{lang === 'bn' ? (t.salahNames[name as keyof typeof t.salahNames] || name) : name}</span>
                    <span className="font-mono">{time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {activeTab === 'tracker' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-ramadan-green">{t.tracker}</h2>
            <Card>
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <span className="text-xs text-stone-400 uppercase font-bold tracking-widest">{t.streak}</span>
                  <span className="text-3xl font-display font-bold text-ramadan-emerald">12 {t.days}</span>
                </div>
                <Award size={48} className="text-ramadan-gold" />
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`h-10 rounded-lg flex items-center justify-center text-xs font-bold ${i < 5 ? 'bg-ramadan-emerald text-white' : 'bg-stone-100 text-stone-400'}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="font-display font-bold text-stone-800">{t.checklist}</h3>
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Taraweeh', 'Quran Reading', 'Sadaqah'].map((item) => (
                <div key={item} className="flex items-center justify-between p-4 glass rounded-2xl">
                  <span className="font-medium text-stone-700">{lang === 'bn' ? (t.salahNames[item as keyof typeof t.salahNames] || item) : item}</span>
                  <input type="checkbox" className="w-6 h-6 rounded-lg accent-ramadan-emerald" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quran' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-ramadan-green">{t.quran}</h2>
            <QuranReader lang={lang} />
          </div>
        )}

        {activeTab === 'zakat' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-ramadan-green">{t.zakat}</h2>
            <ZakatCalculator lang={lang} />
          </div>
        )}

        {activeTab === 'tasbih' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-ramadan-green">{t.tasbih}</h2>
            <TasbihCounter lang={lang} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-ramadan-green">Insights</h2>
            <Card className="h-64 flex items-center justify-center">
              <BarChart3 size={48} className="text-stone-200" />
              <span className="absolute text-stone-400 font-medium">Spiritual Heatmap Loading...</span>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-blue-50/50 border-blue-100">
                <div className="text-blue-600 mb-2"><Droplets size={20} /></div>
                <div className="text-2xl font-bold text-stone-800">1.2L</div>
                <div className="text-xs text-stone-500">Water Intake</div>
              </Card>
              <Card className="bg-orange-50/50 border-orange-100">
                <div className="text-orange-600 mb-2"><Coffee size={20} /></div>
                <div className="text-2xl font-bold text-stone-800">1,450</div>
                <div className="text-xs text-stone-500">Calories (Iftar)</div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 z-50">
        <div className="glass rounded-[32px] p-4 flex justify-between items-center shadow-2xl border-white/40">
          <NavItem icon={Home} label={t.home} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={Calendar} label={t.tracker} active={activeTab === 'tracker'} onClick={() => setActiveTab('tracker')} />
          <div className="relative -top-8">
            <button 
              onClick={() => setActiveTab('tasbih')}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white transition-all ${activeTab === 'tasbih' ? 'bg-ramadan-gold scale-110 shadow-ramadan-gold/40' : 'bg-ramadan-green shadow-ramadan-green/40'}`}
            >
              <Zap size={32} />
            </button>
          </div>
          <NavItem icon={Users} label={t.social} active={activeTab === 'community'} onClick={() => setActiveTab('community')} />
          <NavItem icon={BarChart3} label={t.stats} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
        </div>
      </nav>
    </div>
  );
}
