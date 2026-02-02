import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Map, ShieldCheck, Zap, Camera } from 'lucide-react';

const HomeScreen = () => {
  return (
    <div className="bg-white overflow-hidden">
      {/* --- HERO SECTION --- */}
      <section className="relative h-[90vh] flex items-center justify-center">
        {/* Háttér kép overlay-el */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070" 
            className="w-full h-full object-cover"
            alt="Mountains"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl">
          <span className="inline-block py-1 px-4 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-sm font-bold tracking-widest uppercase mb-6 animate-fade-in">
            Fedezd fel a járatlan utat
          </span>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-tight mb-8 tracking-tighter">
            A kaland ott kezdődik, ahol az <span className="text-emerald-400 underline decoration-emerald-500/50">aszfalt véget ér.</span>
          </h1>
          <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Szakadj ki a hétköznapokból. Profi túravezetőkkel, kis létszámú csoportokkal és életre szóló élményekkel várunk a legszebb csúcsokon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/tours" className="group bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center gap-2 shadow-2xl shadow-emerald-600/20">
              Túrák böngészése <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/about-us" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-2xl font-black text-lg transition-all">
              Hogyan működik?
            </Link>
          </div>
        </div>
      </section>

      {/* --- ELŐNYÖK (Features) --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700">
              <ShieldCheck size={30} />
            </div>
            <h3 className="text-2xl font-black text-emerald-950">Maximális Biztonság</h3>
            <p className="text-gray-600 leading-relaxed">Minősített hegyi vezetőkkel és modern felszereléssel gondoskodunk arról, hogy csak az élményre kelljen figyelned.</p>
          </div>
          <div className="space-y-4">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
              <Zap size={30} />
            </div>
            <h3 className="text-2xl font-black text-emerald-950">Valódi Kihívás</h3>
            <p className="text-gray-600 leading-relaxed">Nincsenek "turista csapdák". Mi oda viszünk, ahová a tömeg már nem jut el. Teszteld a határaidat!</p>
          </div>
          <div className="space-y-4">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Camera size={30} />
            </div>
            <h3 className="text-2xl font-black text-emerald-950">Örök Emlékek</h3>
            <p className="text-gray-600 leading-relaxed">Profi fotókat készítünk az út során, hogy ne a telefonodat kelljen bújnod a csúcson.</p>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="bg-emerald-950 py-20 px-6 rounded-[3rem] mx-4 mb-10 overflow-hidden relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Készen állsz az első lépésre?</h2>
          <p className="text-emerald-200/70 text-lg mb-10">Csatlakozz több mint 500 elégedett túrázóhoz és fedezd fel a Kárpátok vagy az Alpok legszebb részeit.</p>
          <Link to="/register" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-orange-500/20">
            Fiók létrehozása most
          </Link>
        </div>
        {/* Dekoratív elem */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </section>
    </div>
  );
};

export default HomeScreen;