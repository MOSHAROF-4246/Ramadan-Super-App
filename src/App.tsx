import React, { useState, useEffect, useMemo } from 'react';
import { 
  Moon, Sun, MapPin, Clock, BookOpen, Heart, 
  Settings, BarChart3, MessageSquare, Home, 
  Calendar as CalendarIcon, Award, Users, Calculator, Search,
  ChevronRight, Bell, Zap, Coffee, Droplets, Save, Download,
  CheckCircle2, XCircle, Edit3, Trash2, Globe, Layout,
  ChevronLeft, MoreVertical, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { getRamadanCoachAdvice } from './services/geminiService';
import { PrayerTimes, UserProfile, DailyLog } from './types';
import { QuranReader } from './components/QuranReader';
import { ZakatCalculator } from './components/ZakatCalculator';
import { TasbihCounter } from './components/TasbihCounter';
import { translations, Language } from './translations';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Card = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={cn(
      "glass rounded-3xl p-6 transition-all duration-300",
      onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
      className
    )}
  >
    {children}
  </motion.div>
);

const NavItem = ({ icon: Icon, label, active, onClick, isCenter = false }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-1 transition-all duration-300",
      active ? "text-ramadan-emerald" : "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300",
      isCenter && "relative -top-8 w-16 h-16 rounded-full bg-ramadan-green text-white shadow-xl shadow-ramadan-green/40 border-4 border-white dark:border-zinc-900"
    )}
  >
    <Icon size={isCenter ? 32 : 24} strokeWidth={active ? 2.5 : 2} />
    {!isCenter && <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>}
  </button>
);

const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
  <Card className="p-4">
    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-3", colorClass)}>
      <Icon size={20} />
    </div>
    <div className="text-2xl font-display font-bold text-stone-800 dark:text-stone-100">{value}</div>
    <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">{label}</div>
  </Card>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState<Language>('en');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const t = translations[lang];
  const isRTL = lang === 'ar';

  const [location, setLocation] = useState({ city: 'Dhaka', country: 'Bangladesh' });
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string, time: string } | null>(null);
  const [countdown, setCountdown] = useState('');
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [currentLog, setCurrentLog] = useState<DailyLog>({
    user_id: 'user_1',
    date: new Date().toISOString().split('T')[0],
    roza_kept: true,
    sehri_taken: true,
    iftar_done: true,
    taraweeh_prayed: false,
    quran_pages: 0,
    zikr_count: 0,
    charity_amount: 0
  });

  // --- Effects ---

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchPrayerTimes();
    fetchLogs();
    fetchAiAdvice();
  }, [location, lang]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (prayerTimes) updateCountdown();
    }, 1000);
    return () => clearInterval(timer);
  }, [prayerTimes]);

  // --- API Calls ---

  const fetchPrayerTimes = async () => {
    try {
      const res = await fetch(`/api/prayer-times?city=${location.city}&country=${location.country}`);
      const data = await res.json();
      if (data.data) {
        setPrayerTimes(data.data.timings);
      }
    } catch (error) {
      console.error("Error fetching prayer times", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/logs/user_1`);
      const data = await res.json();
      setLogs(data);
      const today = new Date().toISOString().split('T')[0];
      const todayLog = data.find((l: any) => l.date === today);
      if (todayLog) {
        setCurrentLog({
          ...todayLog,
          roza_kept: !!todayLog.roza_kept,
          sehri_taken: !!todayLog.sehri_taken,
          iftar_done: !!todayLog.iftar_done,
          taraweeh_prayed: !!todayLog.taraweeh_prayed
        });
      }
    } catch (error) {
      console.error("Error fetching logs", error);
    }
  };

  const saveLog = async () => {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLog)
      });
      fetchLogs();
      alert(lang === 'bn' ? 'সংরক্ষিত হয়েছে!' : (lang === 'ar' ? 'تم الحفظ!' : 'Saved successfully!'));
    } catch (error) {
      console.error("Error saving log", error);
    }
  };

  const fetchAiAdvice = async () => {
    const advice = await getRamadanCoachAdvice({ 
      fasting: currentLog.roza_kept, 
      quran: `${currentLog.quran_pages} pages`, 
      mood: 'energetic' 
    }, lang);
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

  // --- Render Helpers ---

  const chartData = useMemo(() => {
    return logs.slice(0, 7).reverse().map(l => ({
      date: l.date.split('-')[2],
      quran: l.quran_pages,
      zikr: l.zikr_count / 10, // scaled for chart
      charity: l.charity_amount
    }));
  }, [logs]);

  return (
    <div className={cn(
      "min-h-screen pb-32 max-w-md mx-auto relative overflow-x-hidden transition-colors duration-500",
      isDarkMode ? "bg-zinc-950 text-stone-100" : "bg-stone-50 text-stone-900",
      isRTL && "rtl"
    )}>
      {/* Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-ramadan-emerald/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-ramadan-gold/10 rounded-full blur-[120px] -z-10" />

      {/* Header */}
      <header className="p-6 flex justify-between items-center sticky top-0 z-40 backdrop-blur-xl bg-white/10 dark:bg-black/10">
        <div>
          <h1 className="text-2xl font-display font-bold text-ramadan-green dark:text-ramadan-emerald">{t.appName}</h1>
          <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm font-medium">
            <MapPin size={14} className="text-ramadan-emerald" />
            <span>{location.city}, {location.country}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 glass rounded-2xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => {
              const langs: Language[] = ['en', 'bn', 'ar'];
              const next = langs[(langs.indexOf(lang) + 1) % langs.length];
              setLang(next);
            }}
            className="px-4 py-1 glass rounded-2xl text-xs font-bold text-ramadan-emerald uppercase tracking-widest"
          >
            {lang}
          </button>
        </div>
      </header>

      <main className="px-6 space-y-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Hero Countdown */}
              <Card className="bg-gradient-to-br from-ramadan-green to-emerald-950 text-white border-none overflow-hidden relative p-8 shadow-2xl shadow-ramadan-green/30">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 uppercase tracking-widest">
                      {t.next}: {lang === 'bn' ? (t.salahNames[nextPrayer?.name as keyof typeof t.salahNames] || nextPrayer?.name) : (lang === 'ar' ? (t.salahNames[nextPrayer?.name as keyof typeof t.salahNames] || nextPrayer?.name) : nextPrayer?.name)}
                    </span>
                    <div className="p-2 bg-ramadan-gold rounded-xl text-ramadan-green shadow-lg shadow-ramadan-gold/40">
                      <Moon size={24} fill="currentColor" />
                    </div>
                  </div>
                  <div className="text-6xl font-display font-bold mb-2 tracking-tighter">{countdown}</div>
                  <p className="text-white/70 text-sm font-medium">
                    {t.until} {lang === 'bn' ? (t.salahNames[nextPrayer?.name as keyof typeof t.salahNames] || nextPrayer?.name) : (lang === 'ar' ? (t.salahNames[nextPrayer?.name as keyof typeof t.salahNames] || nextPrayer?.name) : nextPrayer?.name)} {t.at} <span className="font-mono font-bold text-white">{nextPrayer?.time}</span>
                  </p>
                </div>
                <div className="absolute right-[-40px] bottom-[-40px] opacity-10 rotate-12">
                  <Moon size={240} />
                </div>
              </Card>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard 
                  label={t.streak} 
                  value={`${logs.filter(l => l.roza_kept).length} ${t.days}`} 
                  icon={Award} 
                  colorClass="bg-ramadan-gold/20 text-ramadan-gold" 
                />
                <StatCard 
                  label={t.stats.quranProgress} 
                  value={`${logs.reduce((acc, l) => acc + l.quran_pages, 0)} pgs`} 
                  icon={BookOpen} 
                  colorClass="bg-blue-500/20 text-blue-500" 
                />
              </div>

              {/* AI Coach Advice */}
              <Card className="bg-ramadan-gold/5 dark:bg-ramadan-gold/10 border-ramadan-gold/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-ramadan-gold/20 rounded-2xl text-ramadan-gold">
                    <Zap size={22} fill="currentColor" />
                  </div>
                  <h3 className="font-display font-bold text-stone-800 dark:text-stone-100 text-lg">{t.aiCoach}</h3>
                </div>
                <p className="text-stone-600 dark:text-stone-400 text-sm italic mb-6 leading-relaxed">"{aiAdvice?.motivation || t.loadingAdvice}"</p>
                <div className="space-y-4">
                  {aiAdvice?.tips?.map((tip: string, i: number) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <div className="w-6 h-6 rounded-full bg-ramadan-emerald/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={14} className="text-ramadan-emerald" />
                      </div>
                      <span className="text-sm text-stone-700 dark:text-stone-300 font-medium leading-snug">{tip}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Prayer Schedule Preview */}
              <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-stone-100 dark:border-zinc-800 flex justify-between items-center">
                  <h3 className="font-display font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    <Clock size={18} className="text-ramadan-emerald" />
                    {t.schedule}
                  </h3>
                  <button onClick={() => setActiveTab('calendar')} className="text-xs font-bold text-ramadan-emerald uppercase tracking-widest">{t.back}</button>
                </div>
                <div className="p-2">
                  {prayerTimes && Object.entries(prayerTimes).filter(([k]) => !['Imsak', 'Midnight', 'Sunset'].includes(k)).map(([name, time]) => (
                    <div key={name} className={cn(
                      "flex justify-between items-center p-4 rounded-2xl transition-all",
                      nextPrayer?.name === name ? "bg-ramadan-emerald/10 text-ramadan-emerald font-bold scale-[1.02]" : "text-stone-600 dark:text-stone-400"
                    )}>
                      <span className="text-sm font-medium">{lang === 'bn' ? (t.salahNames[name as keyof typeof t.salahNames] || name) : (lang === 'ar' ? (t.salahNames[name as keyof typeof t.salahNames] || name) : name)}</span>
                      <span className="font-mono text-base">{time}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'tracker' && (
            <motion.div 
              key="tracker"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-display font-bold text-ramadan-green dark:text-ramadan-emerald">{t.tracker}</h2>
                <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">{currentLog.date}</div>
              </div>

              <Card className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {/* Boolean Toggles */}
                  {[
                    { key: 'roza_kept', label: t.trackerFields.roza, icon: Sun },
                    { key: 'sehri_taken', label: t.trackerFields.sehri, icon: Coffee },
                    { key: 'iftar_done', label: t.trackerFields.iftar, icon: Droplets },
                    { key: 'taraweeh_prayed', label: t.trackerFields.taraweeh, icon: Moon },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-zinc-900/50 rounded-2xl border border-stone-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
                          <field.icon size={18} className="text-ramadan-emerald" />
                        </div>
                        <span className="text-sm font-bold text-stone-700 dark:text-stone-300">{field.label}</span>
                      </div>
                      <button 
                        onClick={() => setCurrentLog({...currentLog, [field.key]: !currentLog[field.key as keyof DailyLog]})}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          currentLog[field.key as keyof DailyLog] ? "bg-ramadan-emerald" : "bg-stone-200 dark:bg-zinc-800"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          currentLog[field.key as keyof DailyLog] ? (isRTL ? "left-1" : "right-1") : (isRTL ? "right-1" : "left-1")
                        )} />
                      </button>
                    </div>
                  ))}

                  {/* Numeric Inputs */}
                  {[
                    { key: 'quran_pages', label: t.trackerFields.quran, icon: BookOpen, unit: 'pgs' },
                    { key: 'zikr_count', label: t.trackerFields.zikr, icon: Zap, unit: 'cnt' },
                    { key: 'charity_amount', label: t.trackerFields.charity, icon: Heart, unit: '$' },
                  ].map((field) => (
                    <div key={field.key} className="p-4 bg-stone-50 dark:bg-zinc-900/50 rounded-2xl border border-stone-100 dark:border-zinc-800">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
                            <field.icon size={18} className="text-ramadan-emerald" />
                          </div>
                          <span className="text-sm font-bold text-stone-700 dark:text-stone-300">{field.label}</span>
                        </div>
                        <span className="text-xs font-bold text-ramadan-emerald">{currentLog[field.key as keyof DailyLog]} {field.unit}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max={field.key === 'zikr_count' ? 5000 : 100}
                        step={field.key === 'zikr_count' ? 100 : 1}
                        value={currentLog[field.key as keyof DailyLog] as number}
                        onChange={(e) => setCurrentLog({...currentLog, [field.key]: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-stone-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-ramadan-emerald"
                      />
                    </div>
                  ))}

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t.trackerFields.notes}</label>
                    <textarea 
                      value={currentLog.notes || ''}
                      onChange={(e) => setCurrentLog({...currentLog, notes: e.target.value})}
                      className="w-full p-4 bg-stone-50 dark:bg-zinc-900/50 rounded-2xl border border-stone-100 dark:border-zinc-800 focus:ring-2 focus:ring-ramadan-emerald outline-none text-sm min-h-[100px]"
                      placeholder="..."
                    />
                  </div>
                </div>

                <button 
                  onClick={saveLog}
                  className="w-full py-4 bg-ramadan-green text-white rounded-2xl font-bold shadow-xl shadow-ramadan-green/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Save size={20} />
                  {lang === 'bn' ? 'সেভ করুন' : (lang === 'ar' ? 'حفظ' : 'Save Progress')}
                </button>
              </Card>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-display font-bold text-ramadan-green dark:text-ramadan-emerald">{t.stats.rozaRate}</h2>
              
              <Card className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="quran" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="zikr" stroke="#fbbf24" strokeWidth={4} dot={{ r: 4, fill: '#fbbf24' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-ramadan-emerald" />
                    <span className="text-[10px] font-bold text-stone-500 uppercase">{t.quran}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-ramadan-gold" />
                    <span className="text-[10px] font-bold text-stone-500 uppercase">{t.tasbih}</span>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-4">
                <Card className="flex items-center justify-between p-6">
                  <div>
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{t.stats.prayerConsistency}</div>
                    <div className="text-3xl font-display font-bold text-stone-800 dark:text-stone-100">92%</div>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-ramadan-emerald border-t-transparent animate-spin-slow" />
                </Card>
                <Card className="flex items-center justify-between p-6">
                  <div>
                    <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{t.stats.charityTotal}</div>
                    <div className="text-3xl font-display font-bold text-stone-800 dark:text-stone-100">${logs.reduce((acc, l) => acc + l.charity_amount, 0)}</div>
                  </div>
                  <Heart size={40} className="text-red-400 fill-red-400 opacity-20" />
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-display font-bold text-ramadan-green dark:text-ramadan-emerald">{t.schedule}</h2>
                <button className="p-2 glass rounded-xl text-ramadan-emerald"><Download size={20} /></button>
              </div>
              
              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 dark:bg-zinc-900 text-stone-400 uppercase text-[10px] font-bold tracking-widest">
                      <tr>
                        <th className="p-4">Day</th>
                        <th className="p-4">Sehri</th>
                        <th className="p-4">Iftar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                      {[...Array(30)].map((_, i) => (
                        <tr key={i} className={cn(
                          "hover:bg-stone-50 dark:hover:bg-zinc-900 transition-colors",
                          i === 11 && "bg-ramadan-emerald/5 text-ramadan-emerald font-bold"
                        )}>
                          <td className="p-4">Ramadan {i + 1}</td>
                          <td className="p-4 font-mono">05:12 AM</td>
                          <td className="p-4 font-mono">06:18 PM</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'tasbih' && (
            <motion.div key="tasbih" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <TasbihCounter lang={lang} />
            </motion.div>
          )}
          
          {activeTab === 'quran' && (
            <motion.div key="quran" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <QuranReader lang={lang} />
            </motion.div>
          )}

          {activeTab === 'zakat' && (
            <motion.div key="zakat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ZakatCalculator lang={lang} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 z-50">
        <div className="glass rounded-[40px] p-2 flex justify-between items-center shadow-2xl border-white/40 dark:border-zinc-800/40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl">
          <NavItem icon={Home} label={t.home} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={Edit3} label={t.tracker} active={activeTab === 'tracker'} onClick={() => setActiveTab('tracker')} />
          <NavItem icon={Zap} active={activeTab === 'tasbih'} onClick={() => setActiveTab('tasbih')} isCenter />
          <NavItem icon={BarChart3} label={t.statsNav} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={CalendarIcon} label={t.schedule} active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
        </div>
      </nav>
    </div>
  );
}
