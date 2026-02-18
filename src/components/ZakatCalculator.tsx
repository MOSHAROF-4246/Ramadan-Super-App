import React, { useState } from 'react';
import { Calculator, Info, ArrowRight } from 'lucide-react';

export const ZakatCalculator = () => {
  const [assets, setAssets] = useState<Record<string, number>>({
    cash: 0,
    gold: 0,
    silver: 0,
    investments: 0,
    business: 0,
    receivables: 0
  });
  const [liabilities, setLiabilities] = useState<Record<string, number>>({
    debts: 0,
    expenses: 0
  });

  const nisabGold = 87.48; // grams
  const goldPrice = 65; // USD per gram (mock)
  const nisabValue = nisabGold * goldPrice;

  const totalAssets = (Object.values(assets) as number[]).reduce((a, b) => a + b, 0);
  const totalLiabilities = (Object.values(liabilities) as number[]).reduce((a, b) => a + b, 0);
  const netWealth = totalAssets - totalLiabilities;
  const zakatDue = netWealth >= nisabValue ? netWealth * 0.025 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-ramadan-emerald/5 p-4 rounded-2xl border border-ramadan-emerald/10 flex items-start gap-3">
        <Info className="text-ramadan-emerald flex-shrink-0" size={20} />
        <p className="text-xs text-stone-600">
          Nisab threshold is currently approx. <b>${nisabValue.toLocaleString()}</b> (Value of 87.48g Gold). Zakat is 2.5% of your net wealth if it exceeds Nisab.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-stone-800 flex items-center gap-2">
          <ArrowRight size={16} className="text-ramadan-emerald" />
          Assets
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {Object.keys(assets).map((key) => (
            <div key={key} className="flex justify-between items-center p-4 glass rounded-2xl">
              <label className="text-sm font-medium text-stone-600 capitalize">{key}</label>
              <input 
                type="number" 
                value={assets[key as keyof typeof assets]}
                onChange={(e) => setAssets({...assets, [key]: parseFloat(e.target.value) || 0})}
                className="w-24 text-right bg-transparent font-bold text-stone-800 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <h3 className="font-bold text-stone-800 flex items-center gap-2 mt-6">
          <ArrowRight size={16} className="text-ramadan-emerald" />
          Liabilities
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {Object.keys(liabilities).map((key) => (
            <div key={key} className="flex justify-between items-center p-4 glass rounded-2xl">
              <label className="text-sm font-medium text-stone-600 capitalize">{key}</label>
              <input 
                type="number" 
                value={liabilities[key as keyof typeof liabilities]}
                onChange={(e) => setLiabilities({...liabilities, [key]: parseFloat(e.target.value) || 0})}
                className="w-24 text-right bg-transparent font-bold text-stone-800 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-ramadan-green rounded-3xl text-white space-y-4 shadow-xl shadow-ramadan-green/20">
        <div className="flex justify-between items-center opacity-70 text-sm">
          <span>Net Wealth</span>
          <span>${netWealth.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest opacity-70">Zakat Due</div>
            <div className="text-4xl font-display font-bold">${zakatDue.toLocaleString()}</div>
          </div>
          <Calculator size={40} className="opacity-20" />
        </div>
      </div>
    </div>
  );
};
