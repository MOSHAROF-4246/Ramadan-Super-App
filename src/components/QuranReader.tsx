import React, { useState, useEffect } from 'react';
import { Search, Book, Play, Pause, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';

import { translations, Language } from '../translations';

export const QuranReader = ({ lang = 'en' }: { lang?: Language }) => {
  const t = translations[lang];
  const [surahs, setSurahs] = useState<any[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<any>(null);
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(data => setSurahs(data.data));
  }, []);

  const loadSurah = (number: number) => {
    setLoading(true);
    fetch(`https://api.alquran.cloud/v1/surah/${number}/editions/quran-uthmani,en.sahih`)
      .then(res => res.json())
      .then(data => {
        const uthmani = data.data[0].ayahs;
        const english = data.data[1].ayahs;
        const combined = uthmani.map((a: any, i: number) => ({
          ...a,
          translation: english[i].text
        }));
        setAyahs(combined);
        setSelectedSurah(surahs.find(s => s.number === number));
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      {!selectedSurah ? (
        <div className="grid grid-cols-1 gap-3">
          {surahs.map(s => (
            <button 
              key={s.number}
              onClick={() => loadSurah(s.number)}
              className="glass p-4 rounded-2xl flex justify-between items-center hover:bg-ramadan-emerald/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-ramadan-emerald/10 rounded-full flex items-center justify-center text-ramadan-emerald font-bold">
                  {s.number}
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-stone-800">{s.englishName}</h4>
                  <p className="text-xs text-stone-500">{s.englishNameTranslation}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="arabic-text text-xl text-ramadan-green">{s.name}</div>
                <div className="text-[10px] text-stone-400 uppercase">{s.numberOfAyahs} {t.ayahs}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedSurah(null)}
            className="text-ramadan-emerald font-bold flex items-center gap-2"
          >
            ← {t.back}
          </button>
          
          <div className="text-center py-8">
            <h2 className="text-3xl font-display font-bold text-ramadan-green">{selectedSurah.englishName}</h2>
            <div className="arabic-text text-4xl mt-2 text-ramadan-green">{selectedSurah.name}</div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-stone-400">Loading...</div>
          ) : (
            <div className="space-y-8">
              {ayahs.map((a, i) => (
                <div key={i} className="space-y-4 border-b border-stone-100 pb-8">
                  <div className="flex justify-between items-start">
                    <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-400">
                      {a.numberInSurah}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-2 text-stone-400 hover:text-ramadan-emerald"><Play size={18} /></button>
                      <button className="p-2 text-stone-400 hover:text-ramadan-emerald"><Bookmark size={18} /></button>
                    </div>
                  </div>
                  <div className="arabic-text text-3xl leading-loose text-right text-stone-800">
                    {a.text}
                  </div>
                  <div className="text-stone-600 text-sm leading-relaxed">
                    {a.translation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
