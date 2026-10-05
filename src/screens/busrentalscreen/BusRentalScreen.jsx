import React, { useState } from 'react';
import {
  Bus, Users, Gauge, Sparkles, Phone, Mail,
  CheckCircle2, ArrowRight, CalendarDays, Banknote, Route
} from 'lucide-react';
import busImage from '../../assets/buszok.jpg';

const BusRentalScreen = () => {
  const [days, setDays] = useState('');
  const [extraKm, setExtraKm] = useState('');
  const [cleaning, setCleaning] = useState(false);

  const dailyRate = 26000;
  const extraKmRate = 35;
  const cleaningFee = 20000;
  const includedKmPerDay = 300;

  const parsedDays = Number(days) || 0;
  const parsedExtraKm = Number(extraKm) || 0;

  const totalDailyFee = parsedDays * dailyRate;
  const totalExtraKmFee = parsedExtraKm * extraKmRate;
  const totalCleaning = cleaning ? cleaningFee : 0;
  const grandTotal = totalDailyFee + totalExtraKmFee + totalCleaning;

  const formatPrice = (n) =>
    new Intl.NumberFormat('hu-HU').format(n);

  return (
    <div className="bg-[#f8faf7] min-h-screen pb-24 font-sans text-[#173327]">

      <div className="relative pt-20 pb-28 px-6 overflow-hidden min-h-[360px] flex items-center">
        <img
          src={busImage}
          className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-90"
          alt="Kisbuszok bérlésre"
        />
        <div className="absolute inset-0 bg-[#0f1f17]/70 backdrop-blur-[1px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#477258]/15 rounded-full blur-[140px] -mr-32 -mt-32 pointer-events-none z-10" />

        <div className="max-w-6xl mx-auto relative z-20 w-full text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#dce5d8] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Túrázz Velünk • Buszbérlés
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-normal tracking-tight mb-4 drop-shadow-md">
            Kisbusz bérlés
          </h1>
          <p className="text-[#dce5d8] text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed drop-shadow-sm">
            9 személyes kisbuszaink vonóhoroggal felszereltek – ideálisak csoportos túrákhoz, kirándulásokhoz és bármilyen közös utazáshoz.
          </p>
        </div>
      </div>

      {/* ── FŐ TARTALOM ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-30 space-y-12">

        {/* ── ÁRAK ÉS TUDNIVALÓK KÁRTYA ── */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#173327]/5 border border-[#d8dfd4] p-8 sm:p-12">

          {/* Fejléc */}
          <div className="grid lg:grid-cols-12 gap-8 items-center border-b border-[#ecefe6] pb-10 mb-10">
            <div className="lg:col-span-5">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067] mb-2 block">
                Bérleti díjak
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#173327] font-normal leading-tight">
                Egyszerű és átlátható árazás
              </h2>
            </div>

            <div className="lg:col-span-7 text-sm sm:text-base text-[#475b4e] leading-relaxed font-light space-y-4">
              <p>
                Kisbuszainkat napi díjjal adjuk bérbe, minden megkezdett nap számít. Az árban napi 300 km van benne - ezen felül kilométer-alapú pótdíj kerül felszámításra. Igény szerint takarítást is biztosítunk.
              </p>
            </div>
          </div>

          {/* Díjszabás kártyák */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 justify-center text-center">
            <div className="p-6 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8]">
              {/* <div className="w-10 h-10 rounded-xl bg-[#ecefe6] text-[#275940] flex items-center justify-center mb-4">
                <CalendarDays size={20} strokeWidth={2} />
              </div> */}
              <h3 className="font-serif text-lg text-[#173327] font-normal mb-1 items-center">Napi bérleti díj</h3>
              <p className="text-2xl font-black text-[#275940] mb-2">{formatPrice(dailyRate)} Ft<span className="text-sm font-normal text-[#648067]"> / nap</span></p>
              <p className="text-xs text-[#55695b] leading-relaxed font-light">
                Minden megkezdett nap után. Az árban napi {formatPrice(includedKmPerDay)} km benne van.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8]">
              {/* <div className="w-10 h-10 rounded-xl bg-[#ecefe6] text-[#275940] flex items-center justify-center mb-4">
                <Route size={20} strokeWidth={2} />
              </div> */}
              <h3 className="font-serif text-lg text-[#173327] font-normal mb-1">Túlkilométer díj</h3>
              <p className="text-2xl font-black text-[#275940] mb-2">{extraKmRate} Ft<span className="text-sm font-normal text-[#648067]"> / km</span></p>
              <p className="text-xs text-[#55695b] leading-relaxed font-light">
                A napi {formatPrice(includedKmPerDay)} km feletti kilométerekre kerül felszámításra.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8]">
              {/* <div className="w-10 h-10 rounded-xl bg-[#ecefe6] text-[#275940] flex items-center justify-center mb-4">
                <Sparkles size={20} strokeWidth={2} />
              </div> */}
              <h3 className="font-serif text-lg text-[#173327] font-normal mb-1">Takarítás</h3>
              <p className="text-2xl font-black text-[#275940] mb-2">{formatPrice(cleaningFee)} Ft</p>
              <p className="text-xs text-[#55695b] leading-relaxed font-light">
                Opcionális.
              </p>
            </div>
          </div>

          {/* Busz jellemzők */}
          <div className="border-t border-[#ecefe6] pt-8">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067] mb-5 block">
              A kisbuszaink
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users, text: '9 személyes' },
                { icon: Bus, text: 'Vonóhoroggal felszerelt' },
                { icon: Gauge, text: `${formatPrice(includedKmPerDay)} km / nap az árban` },
                { icon: CheckCircle2, text: 'Csoportos túrákhoz ideális' }
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 p-4 rounded-xl bg-[#f7f9f5] border border-[#dce5d8]">
                  <div className="w-8 h-8 rounded-lg bg-[#ecefe6] text-[#275940] flex items-center justify-center shrink-0">
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-[#2b4735]">{text}</span>
                </div>
              ))}
            </div>

            {/* Buszok fotó bemutató */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-[#d8dfd4] shadow-sm">
              <img
                src={busImage}
                alt="9 személyes vonóhorgos kisbuszaink"
                className="w-full h-64 sm:h-80 md:h-96 object-cover"
              />
            </div>
          </div>
        </div>

        {/* ── KALKULÁTOR KÁRTYA ── */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#173327]/5 border border-[#d8dfd4] p-8 sm:p-12">
          <div className="grid lg:grid-cols-12 gap-10 items-start">

            {/* Bal oldal: beviteli mezők */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067] mb-2 block">
                  Kalkulátor
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#173327] font-normal leading-tight">
                  Számold ki az árat
                </h2>
                <p className="mt-2 text-sm text-[#475b4e] font-light">
                  Add meg a napok számát, a napi keretbe nem férő extra kilométereket, és jelöld, ha takarítást is kérsz.
                </p>
              </div>

              {/* Napok */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#475b4e] mb-2">
                  Napok száma
                </label>
                <input
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setDays('');
                    } else {
                      setDays(Math.max(1, Number(e.target.value)));
                    }
                  }}
                  className="w-full rounded-xl border border-[#d2ddd0] bg-[#f8faf7] px-4 py-3 text-sm font-semibold text-[#173327] outline-none focus:border-[#477258] focus:ring-2 focus:ring-[#477258]/15 transition"
                />
                <p className="mt-1 text-[10px] text-[#78877c]">Minden megkezdett nap számít.</p>
              </div>

              {/* Extra km */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#475b4e] mb-2">
                  Extra kilométer ({formatPrice(includedKmPerDay)} km/nap felett)
                </label>
                <input
                  type="number"
                  min={0}
                  value={extraKm}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setExtraKm('');
                    } else {
                      setExtraKm(Math.max(0, Number(e.target.value)));
                    }
                  }}
                  className="w-full rounded-xl border border-[#d2ddd0] bg-[#f8faf7] px-4 py-3 text-sm font-semibold text-[#173327] outline-none focus:border-[#477258] focus:ring-2 focus:ring-[#477258]/15 transition"
                />
                <p className="mt-1 text-[10px] text-[#78877c]">Összes extra km a teljes bérlés idejére (a napi {formatPrice(includedKmPerDay)} km keretben nem szereplő km-ek).</p>
              </div>

              {/* Takarítás */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={cleaning}
                  onChange={(e) => setCleaning(e.target.checked)}
                  className="accent-[#275940] h-5 w-5 rounded"
                />
                <span className="text-sm font-semibold text-[#2b4735] group-hover:text-[#173327] transition-colors">
                  Takarítás
                </span>
              </label>
            </div>

            {/* Jobb oldal: összesítő */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-[#173327] text-white p-7 sm:p-8 space-y-5 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  {/* <Banknote size={18} strokeWidth={2} /> */}
                  <span className="text-xs font-bold uppercase tracking-widest text-[#b7c9b9]">Összesítő</span>
                </div>

                <div className="space-y-3 border-b border-white/15 pb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#b7c9b9]">Bérleti díj ({days} nap)</span>
                    <span className="font-bold">{formatPrice(totalDailyFee)} Ft</span>
                  </div>
                  {totalExtraKmFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#b7c9b9]">Túlkilométer ({formatPrice(extraKm)} km)</span>
                      <span className="font-bold">{formatPrice(totalExtraKmFee)} Ft</span>
                    </div>
                  )}
                  {cleaning && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#b7c9b9]">Takarítás</span>
                      <span className="font-bold">{formatPrice(totalCleaning)} Ft</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#b7c9b9]">Becsült összeg</span>
                  <span className="font-serif text-3xl font-normal tracking-tight">{formatPrice(grandTotal)} Ft</span>
                </div>

                <p className="text-[10px] text-[#8aab8e] leading-relaxed">
                  Az ár tájékoztató jellegű. A végleges díjat a ténylegesen megtett kilométerek és az igénybe vett szolgáltatások alapján számoljuk.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ELÉRHETŐSÉG KÁRTYA ── */}
        <div className="bg-white rounded-3xl shadow-xl shadow-[#173327]/5 border border-[#d8dfd4] p-8 sm:p-12">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067] mb-2 block">
                Foglalás és érdeklődés
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#173327] font-normal leading-tight">
                Lépj velünk kapcsolatba
              </h2>
              <p className="mt-3 text-sm text-[#475b4e] font-light leading-relaxed">
                Buszbérlés esetén írj nekünk e-mailt vagy hívj minket telefonon – rövid időn belül visszajelzünk az elérhetőségről és a részletekről.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="mailto:msz.tala@gmail.com"
                  className="flex items-center gap-4 p-5 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] hover:border-[#98ad98] hover:shadow-md transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#ecefe6] text-[#275940] flex items-center justify-center shrink-0 group-hover:bg-[#275940] group-hover:text-white transition-colors">
                    <Mail size={22} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-[#648067] mb-0.5">E-mail</div>
                    <div className="text-sm font-semibold text-[#173327]">msz.tala@gmail.com</div>
                  </div>
                </a>

                <a
                  href="tel:+36309793572"
                  className="flex items-center gap-4 p-5 rounded-2xl bg-[#f7f9f5] border border-[#dce5d8] hover:border-[#98ad98] hover:shadow-md transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#ecefe6] text-[#275940] flex items-center justify-center shrink-0 group-hover:bg-[#275940] group-hover:text-white transition-colors">
                    <Phone size={22} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-[#648067] mb-0.5">Telefon</div>
                    <div className="text-sm font-semibold text-[#173327]">+36 30 979 3572</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BusRentalScreen;
