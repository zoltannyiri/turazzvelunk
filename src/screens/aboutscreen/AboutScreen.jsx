import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mountain, Waves, Flower2, Bike, CheckCircle2, 
  Compass, Users, ShieldCheck, ArrowRight 
} from 'lucide-react';

const AboutScreen = () => {
  return (
    <div className="bg-[#f8faf7] min-h-screen pb-24 font-sans text-[#173327]">
      
      {/* --- RÓLUNK FEJLÉC HÁTTÉRKÉPPEL ÉS TERMÉSZETES ZÖLD TÓNUSSAL --- */}
      <div className="relative pt-20 pb-28 px-6 overflow-hidden min-h-[360px] flex items-center">
        
        {/* HÁTTÉRKÉP RÉTEG */}
        <img 
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-95"
          alt="Hegyvidéki természet háttér"
        />
        
        {/* SÖTÉTÍTŐ TERMÉSZETES ZÖLD OVERLAY */}
        <div className="absolute inset-0 bg-[#0f1f17]/75 backdrop-blur-[1px]"></div>

        {/* LÁGY MÉLYZÖLD FÉNYEFFEKT */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#477258]/15 rounded-full blur-[140px] -mr-32 -mt-32 pointer-events-none z-10"></div>
        
        <div className="max-w-6xl mx-auto relative z-20 w-full text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#dce5d8] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Túrázz Velünk • Küldetésünk
          </div>
          
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-normal tracking-tight mb-4 drop-shadow-md">
            Együtt járjuk a hegyeket
          </h1>
          <p className="text-[#dce5d8] text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed drop-shadow-sm">
            Közösség, természetközeli kalandok és biztonságos túravezetés. Célunk, hogy a természetjárás örömét mindenki megtapasztalhassa.
          </p>
        </div>
      </div>

      {/* --- BEMUTATKOZÁS & ÉRTÉKEK KÁRTYA --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-30 mb-16">
        <div className="bg-white rounded-3xl shadow-xl shadow-[#173327]/5 border border-[#d8dfd4] p-8 sm:p-12">
          
          <div className="grid lg:grid-cols-12 gap-8 items-center border-b border-[#ecefe6] pb-10 mb-10">
            <div className="lg:col-span-5">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067] mb-2 block">
                Kik vagyunk?
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#173327] font-normal leading-tight">
                Nem csupán túrákat szervezünk, hanem valódi élményeket adunk.
              </h2>
            </div>
            
            <div className="lg:col-span-7 text-sm sm:text-base text-[#475b4e] leading-relaxed font-light space-y-4">
              <p>
                A Túrázz Velünk csapata elhivatott természetjárókból, tapasztalt túravezetőkből és sportkedvelőkből áll. Hiszünk abban, hogy a természet nemcsak kikapcsol, hanem valódi közösséget is formál.
              </p>
              <p>
                Akár kezdő kirándulóként indulsz útnak, akár a magashegyi via ferrata gerincek vonzanak, nálunk biztonságos keretek között, jó hangulatú csapatban fedezheted fel a legszebb hazai és külföldi tájakat.
              </p>
            </div>
          </div>

          {/* 3 FŐ ALAPÉRTÉK */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8]">
              <div className="w-10 h-10 rounded-xl bg-[#ecefe6] text-[#275940] flex items-center justify-center mb-4">
                <Compass size={20} strokeWidth={2} />
              </div>
              <h3 className="font-serif text-lg text-[#173327] font-normal mb-1">
                Biztonság és felkészültség
              </h3>
              <p className="text-xs text-[#55695b] leading-relaxed font-light">
                Gondosan bejárt és előkészített útvonalak, profi túravezetőkkel és folyamatos figyelemmel.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8]">
              <div className="w-10 h-10 rounded-xl bg-[#ecefe6] text-[#275940] flex items-center justify-center mb-4">
                <Users size={20} strokeWidth={2} />
              </div>
              <h3 className="font-serif text-lg text-[#173327] font-normal mb-1">
                Összetartó közösség
              </h3>
              <p className="text-xs text-[#55695b] leading-relaxed font-light">
                Olyan csapat, ahol az egymásra figyelés, az élmények megosztása és az új barátságok maguktól jönnek.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8]">
              <div className="w-10 h-10 rounded-xl bg-[#ecefe6] text-[#275940] flex items-center justify-center mb-4">
                <ShieldCheck size={20} strokeWidth={2} />
              </div>
              <h3 className="font-serif text-lg text-[#173327] font-normal mb-1">
                Természetvédelem
              </h3>
              <p className="text-xs text-[#55695b] leading-relaxed font-light">
                Felelős kirándulás a „Leave No Trace” elvei szerint: megőrizzük a táj érintetlen szépségét.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* --- AKTÍV IDŐTÖLTÉS TÍPUSAI --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-30 mb-16">
        
        <div className="border-b border-[#d8dfd4] pb-4 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067]">
              Programkínálat
            </span>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#173327]">
              Aktív időtöltés típusai
            </h2>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#718174] bg-[#f7f9f5] border border-[#dce5d8] px-3.5 py-1.5 rounded-full inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#477258]"></span>
            4 fő kategória
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* HEGYI TÚRÁK */}
          <div className="group bg-white rounded-3xl border border-[#dce5d8] hover:border-[#b4c7b0] shadow-sm hover:shadow-xl transition-all duration-300 p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] text-[#275940] flex items-center justify-center group-hover:bg-[#275940] group-hover:text-white group-hover:border-[#275940] transition-colors">
                  <Mountain size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#648067] block">
                    Gyalogtúrák
                  </span>
                  <h3 className="font-serif text-2xl text-[#173327] font-normal">
                    Hegyi túrák
                  </h3>
                </div>
              </div>
              
              <p className="text-xs text-[#55695b] mb-5 font-light leading-relaxed">
                A lankás hazai középhegységektől az alpesi gerinctúrákig és vasalt utakig minden szinten találsz nálunk kihívást.
              </p>

              <ul className="space-y-2.5 text-xs text-[#20382a] font-medium border-t border-[#ecefe6] pt-4">
                {['Hazai és külföldi hegyi túrák', 'Magashegyi élménytúrák', 'Via Ferrata útvonalak', 'Könnyű, közepesen nehéz és nehéz fokozatok'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-[#477258] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* VÍZITÚRÁK */}
          <div className="group bg-white rounded-3xl border border-[#dce5d8] hover:border-[#b4c7b0] shadow-sm hover:shadow-xl transition-all duration-300 p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] text-[#275940] flex items-center justify-center group-hover:bg-[#275940] group-hover:text-white group-hover:border-[#275940] transition-colors">
                  <Waves size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#648067] block">
                    Vízisportok
                  </span>
                  <h3 className="font-serif text-2xl text-[#173327] font-normal">
                    Vízitúrák
                  </h3>
                </div>
              </div>

              <p className="text-xs text-[#55695b] mb-5 font-light leading-relaxed">
                Csendes folyókon evezés, tavi vitorlázás vagy tengerparti kajakozás a hűsítő vizek szerelmeseinek.
              </p>

              <ul className="space-y-2.5 text-xs text-[#20382a] font-medium border-t border-[#ecefe6] pt-4">
                {['Vitorlás túrák és élményhajózás', 'Kajak- és kenutúrák természetvédelmi területeken', 'Biztonságos felszerelés és mentőmellények', 'Családbarát és sportos evezős programok'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-[#477258] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* JÓGA */}
          <div className="group bg-white rounded-3xl border border-[#dce5d8] hover:border-[#b4c7b0] shadow-sm hover:shadow-xl transition-all duration-300 p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] text-[#275940] flex items-center justify-center group-hover:bg-[#275940] group-hover:text-white group-hover:border-[#275940] transition-colors">
                  <Flower2 size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#648067] block">
                    Test és lélek
                  </span>
                  <h3 className="font-serif text-2xl text-[#173327] font-normal">
                    Jóga és elvonulás
                  </h3>
                </div>
              </div>

              <p className="text-xs text-[#55695b] mb-5 font-light leading-relaxed">
                Tudatos jelenlét a fák alatt, légzőgyakorlatok és gerinckímélő jógaórák hegyi panorámával kísérve.
              </p>

              <ul className="space-y-2.5 text-xs text-[#20382a] font-medium border-t border-[#ecefe6] pt-4">
                {['Hatha és gerincjóga a szabad ég alatt', 'Vinyasa flow és dinamikus órák', 'Meditáció és stresszoldás a természetben', 'Kezdők és haladók számára egyaránt'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-[#477258] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* MOTOROS */}
          <div className="group bg-white rounded-3xl border border-[#dce5d8] hover:border-[#b4c7b0] shadow-sm hover:shadow-xl transition-all duration-300 p-7 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] text-[#275940] flex items-center justify-center group-hover:bg-[#275940] group-hover:text-white group-hover:border-[#275940] transition-colors">
                  <Bike size={24} strokeWidth={1.8} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#648067] block">
                    Két keréken
                  </span>
                  <h3 className="font-serif text-2xl text-[#173327] font-normal">
                    Motoros túrák
                  </h3>
                </div>
              </div>

              <p className="text-xs text-[#55695b] mb-5 font-light leading-relaxed">
                Festői szerpentinek, kanyargós hegyi hágók és közös gurulások a motorozás szerelmeseinek.
              </p>

              <ul className="space-y-2.5 text-xs text-[#20382a] font-medium border-t border-[#ecefe6] pt-4">
                {['Hazai panorámautak és rejtett kincsek', 'Külföldi alpesi hágótúrák', 'Biztonságos csoportos motorozási szabályok', 'Közös megállók és gasztronómiai élmények'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-[#477258] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* --- CSATLAKOZZ HOZZÁNK CTA SÁV --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-30">
        <div className="rounded-3xl bg-[#173327] p-8 sm:p-12 text-white border border-[#275940] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a8c9b2] mb-2 block">
              Csatlakozz te is!
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
              Készen állsz az első közös élményre?
            </h2>
            <p className="text-[#dce5d8] text-sm font-light mt-1 max-w-xl">
              Nézz körül a közelgő túráink között, és jelentkezz néhány egyszerű lépésben.
            </p>
          </div>
          
          <Link
            to="/tours"
            className="shrink-0 px-7 py-3.5 rounded-2xl bg-white text-[#173327] hover:bg-[#ecefe6] text-xs font-bold uppercase tracking-wider transition shadow-sm inline-flex items-center gap-2"
          >
            Túrák böngészése <ArrowRight size={16} />
          </Link>
        </div>
      </div>

    </div>
  );
};

export default AboutScreen;
