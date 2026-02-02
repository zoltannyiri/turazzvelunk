import React from 'react';
import { Mountain, Waves, Flower2, Bike, CheckCircle2 } from 'lucide-react';

const AboutScreen = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-emerald-950 pt-20 pb-28 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-black uppercase tracking-widest mb-6">
            Rólunk
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Aktív időtöltés típusai
          </h1>
          <p className="text-emerald-200/70 max-w-2xl mx-auto">
            Tervezet – egyeztetést igényel a csapattal. Az alábbi kategóriák segítenek átlátni a programokat és azok nehézségét.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-emerald-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Mountain size={24} />
              </div>
              <h3 className="text-xl font-black text-emerald-950">Hegyi túrák</h3>
            </div>
            <ul className="space-y-2 text-slate-700">
              {['Hazai – Külföldi túrák', 'Magashegyi túrák', 'Via Ferrata', 'Könnyű – Közepesen nehéz – Nehéz'].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-emerald-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Waves size={24} />
              </div>
              <h3 className="text-xl font-black text-emerald-950">Vízitúrák</h3>
            </div>
            <ul className="space-y-2 text-slate-700">
              {['Vitorlás', 'Kajak – Kenu'].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-emerald-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Flower2 size={24} />
              </div>
              <h3 className="text-xl font-black text-emerald-950">Jóga</h3>
            </div>
            <ul className="space-y-2 text-slate-700">
              {['Ha-tha', 'Gerinc', 'Ashtanga', 'Vinyasa'].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-emerald-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Bike size={24} />
              </div>
              <h3 className="text-xl font-black text-emerald-950">Motoros</h3>
            </div>
            <ul className="space-y-2 text-slate-700">
              {['Külföldi', 'Hazai'].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;
