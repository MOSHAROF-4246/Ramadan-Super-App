import React, { useState } from 'react';
import { RotateCcw, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { translations, Language } from '../translations';

export const TasbihCounter = ({ lang = 'en' }: { lang?: Language }) => {
  const t = translations[lang];
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const phrases = t.phrases;

  const increment = () => {
    if (count < target) {
      setCount(count + 1);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    } else {
      setCount(1);
      setPhraseIndex((phraseIndex + 1) % phrases.length);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-display font-bold text-ramadan-green">{phrases[phraseIndex]}</h3>
        <p className="text-stone-400 text-sm uppercase tracking-widest">{t.target}: {target}</p>
      </div>


      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-stone-100"
          />
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 120}
            initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - count / target) }}
            className="text-ramadan-emerald"
          />
        </svg>
        
        <button 
          onClick={increment}
          className="w-48 h-48 bg-white rounded-full shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-transform border-8 border-stone-50"
        >
          <AnimatePresence mode="wait">
            <motion.span 
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-display font-bold text-stone-800"
            >
              {count}
            </motion.span>
          </AnimatePresence>
          <Plus size={24} className="text-ramadan-emerald mt-2" />
        </button>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => setCount(0)}
          className="p-4 glass rounded-2xl text-stone-400 hover:text-stone-600"
        >
          <RotateCcw size={24} />
        </button>
        <div className="flex gap-2">
          {[33, 99, 100].map(t => (
            <button 
              key={t}
              onClick={() => { setTarget(t); setCount(0); }}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${target === t ? 'bg-ramadan-emerald text-white' : 'glass text-stone-400'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
