import { createElement } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, Compass, MapPin,
  ShieldCheck, Users
} from 'lucide-react';

const journeys = [
  {
    number: '01',
    title: 'Hegyi túrák',
    category: 'Hegyi túrák',
    description: 'Gerincek, csúcsok és hosszú panorámák tapasztalt túravezetőkkel.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=85&w=1200'
  },
  {
    number: '02',
    title: 'Vízi túrák',
    category: 'Vízitúrák',
    description: 'Folyók és tavak más nézőpontból, közös ritmusban a vízen.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=85&w=1200'
  },
  {
    number: '03',
    title: 'Motoros túrák',
    category: 'Motoros',
    description: 'Kanyargós utak és gondosan felépített útvonalak két keréken.',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=85&w=1200'
  },
  {
    number: '04',
    title: 'Jóga túrák',
    category: 'Jóga',
    description: 'Feltöltődés a természetben, testi-lelki egyensúly és vezetett gyakorlás.',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=85&w=1200'
  }
];

const principles = [
  {
    icon: ShieldCheck,
    title: 'Felkészült vezetők',
    text: 'A túrákat olyan vezetők szervezik, akik ismerik az útvonalat, a terepet és a csapat igényeit.'
  },
  {
    icon: Users,
    title: 'Valódi közösség',
    text: 'A fontos információk, a résztvevők és a csevegés egy helyen maradnak a jelentkezéstől az indulásig.'
  },
  {
    icon: CalendarDays,
    title: 'Átlátható szervezés',
    text: 'Időpontok, elérhető helyek, felszerelések és fizetési részletek világosan, meglepetések nélkül.'
  }
];

const container = 'mx-auto w-full max-w-[1444px] px-8 max-[900px]:px-4';
const kicker = 'block text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#68816c]';
const button = 'inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg border border-transparent px-5 py-3 text-[13px] font-bold transition-all hover:-translate-y-0.5 max-[620px]:w-full';
const editorialHeading = 'mt-3 font-serif font-normal leading-[1.05] tracking-[-0.045em]';

const HomeScreen = () => (
  <main className="overflow-hidden bg-[#f5f5f0] text-[#173327]">
    <section className="relative isolate flex min-h-[calc(100svh-4.6rem)] items-end text-white max-[620px]:min-h-[calc(100svh-4.1rem)]">
      <div className="absolute inset-0 -z-20" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&q=88&w=2200"
          alt=""
          className="h-full w-full object-cover object-[center_42%]"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,28,19,0.83)_0%,rgba(9,28,19,0.58)_46%,rgba(9,28,19,0.18)_78%),linear-gradient(0deg,rgba(10,29,19,0.72)_0%,transparent_45%)]" />
      <div className={`${container} grid grid-cols-[minmax(0,1fr)_18rem] items-end gap-16 py-28 max-[900px]:grid-cols-1 max-[900px]:gap-12 max-[900px]:py-20`}>
        <div className="max-w-[58rem]">
          <span className={`${kicker} text-[#c2d6bc]`}>Vezetett túrák · valódi közösség</span>
          <h1 className="mt-5 font-serif text-[clamp(3.7rem,7.3vw,7.6rem)] font-normal leading-[0.91] tracking-[-0.06em] max-[620px]:text-[clamp(3.2rem,16vw,4.6rem)]">
            Menj messzebb.<br /><em className="font-normal text-[#d7bf93]">Érkezz közelebb.</em>
          </h1>
          <p className="mt-7 max-w-[37rem] text-[clamp(1rem,1.4vw,1.18rem)] leading-[1.75] text-[#e0e8df]">
            Közösen megélt utak hegyen, vízen és aszfalton.
            Válassz túrát, készülj fel velünk, és indulj el egy jó csapattal.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 max-[620px]:w-full">
            <Link to="/tours" className={`${button} bg-[#e7eee2] text-[#173327] hover:bg-white`}>
              Túrák felfedezése <ArrowRight size={18} />
            </Link>
            <Link to="/calendar" className={`${button} border-white/45 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15`}>
              <CalendarDays size={17} /> Túranaptár
            </Link>
          </div>
        </div>
        <div className="max-w-80 border-t border-white/40 pt-5">
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#c9d8c8]"><MapPin size={15} /> Következő útvonal</span>
          <strong className="mt-3 block font-serif text-[1.65rem] font-normal">A tiéd lehet.</strong>
          <p className="mt-2 text-xs leading-relaxed text-[#cbd6cd]">A jó történetek ritkán kezdődnek a kanapén.</p>
        </div>
      </div>
    </section>

    <section className={`${container} grid grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] gap-[clamp(3rem,9vw,9rem)] py-[clamp(6rem,10vw,10rem)] max-[900px]:grid-cols-1 max-[620px]:py-20`}>
      <div>
        <span className={kicker}>Találd meg a saját utad</span>
        <h2 className={`${editorialHeading} text-[clamp(2.8rem,5vw,5.2rem)]`}>Nem ugyanoda tartunk.<br />De együtt indulunk.</h2>
      </div>
      <div className="self-end border-l border-[#bcc9b8] pl-8 max-[620px]:border-t max-[620px]:border-l-0 max-[620px]:pt-6 max-[620px]:pl-0">
        <p className="text-base leading-[1.85] text-[#5e7063]">
          Van, akit a csendes erdei ösvény, mást a magashegyi panoráma vagy
          a hosszú országút hív. Mi abban segítünk, hogy megtaláld a hozzád
          illő túrát és azokat, akikkel jó lesz végigmenni rajta.
        </p>
        <Link to="/tour-search" className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#275940]">Segíts túrát választani <ArrowRight size={16} /></Link>
      </div>
    </section>

    <section className={`${container} pb-[clamp(6rem,10vw,10rem)]`} aria-labelledby="journey-title">
      <div className="flex items-end justify-between gap-8 border-b border-[#cfd8cb] pb-6 max-[620px]:flex-col max-[620px]:items-start">
        <div>
          <span className={kicker}>Útvonalak és élmények</span>
          <h2 id="journey-title" className={`${editorialHeading} text-[clamp(2.4rem,4vw,4rem)]`}>Merre indulnál?</h2>
        </div>
        <Link to="/tours" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#275940]">Minden túra <ArrowRight size={16} /></Link>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {journeys.map((journey) => (
          <Link
            to={`/tour-search?category=${encodeURIComponent(journey.category)}`}
            className="group relative isolate min-h-[30rem] overflow-hidden rounded-xl text-white max-[900px]:min-h-[22rem]"
            key={journey.title}
          >
            <img src={journey.image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b1f14]/90 to-transparent" />
            <span className="absolute top-5 left-5 text-[10px] font-extrabold tracking-[0.14em]">{journey.number}</span>
            <span className="absolute right-6 bottom-6 left-6 flex flex-col">
              <strong className="font-serif text-[clamp(1.5rem,2vw,2.2rem)] font-normal">{journey.title}</strong>
              <span className="mt-2.5 max-w-sm text-xs leading-relaxed text-[#dce6dd]">{journey.description}</span>
            </span>
            <span className="absolute top-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 transition-colors group-hover:bg-white group-hover:text-[#173327]"><ArrowRight size={19} /></span>
          </Link>
        ))}
      </div>
    </section>

    <section className="bg-[#e8eee4] py-[clamp(5rem,9vw,9rem)]">
      <div className={`${container} grid grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] items-center gap-[clamp(3rem,8vw,8rem)] max-[900px]:grid-cols-1`}>
        <div className="relative">
          <img src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=86&w=1400" alt="Túrázók egy hegyi ösvényen" className="min-h-[34rem] w-full rounded-xl object-cover max-[900px]:min-h-[28rem]" />
          <span className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-lg bg-[#fffefa]/95 px-3 py-2.5 text-[11px] font-bold text-[#275940] backdrop-blur-sm"><Compass size={15} /> Az út közösen válik történetté</span>
        </div>
        <div>
          <span className={kicker}>Több mint egy útvonal</span>
          <h2 className={`${editorialHeading} text-[clamp(2.6rem,4.6vw,4.6rem)]`}>A túra már jóval az indulás előtt elkezdődik.</h2>
          <p className="mt-6 leading-[1.85] text-[#526657]">
            A jelentkezéstől a felszerelés kiválasztásán át a közös
            beszélgetésig minden fontos részletet egy helyen találsz.
            Így amikor eljön az indulás napja, már csak az útra kell figyelned.
          </p>
          <Link to="/about-us" className={`${button} mt-8 bg-[#275940] text-white hover:bg-[#173d2a]`}>Így működik <ArrowRight size={18} /></Link>
        </div>
      </div>
    </section>

    <section className={`${container} grid grid-cols-[minmax(19rem,0.75fr)_minmax(0,1.25fr)] gap-[clamp(3rem,8vw,8rem)] py-[clamp(6rem,10vw,10rem)] max-[900px]:grid-cols-1`} aria-labelledby="principles-title">
      <div>
        <span className={kicker}>Ami minden úton számít</span>
        <h2 id="principles-title" className={`${editorialHeading} text-[clamp(2.5rem,4.2vw,4.2rem)]`}>Jól szervezett kalandok,<br />emberi léptékben.</h2>
      </div>
      <div className="border-t border-[#bdc9b9]">
        {principles.map(({ icon, title, text }, index) => (
          <article className="grid grid-cols-[2rem_3rem_1fr] gap-4 border-b border-[#bdc9b9] py-7 max-[620px]:grid-cols-[1.5rem_2.75rem_1fr] max-[620px]:gap-2.5" key={title}>
            <span className="text-[10px] font-extrabold tracking-[0.12em] text-[#8b9a8d]">0{index + 1}</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#b9c8b7] text-[#477258]">{createElement(icon, { size: 21, strokeWidth: 1.7 })}</span>
            <div>
              <h3 className="font-serif text-[1.4rem] font-normal">{title}</h3>
              <p className="mt-2 max-w-[35rem] text-sm leading-[1.7] text-[#647368]">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className={`${container} mb-8 grid grid-cols-[1fr_minmax(18rem,0.55fr)] items-end gap-16 rounded-xl bg-[#173327] p-[clamp(2.5rem,6vw,5.5rem)] text-white max-[900px]:grid-cols-1 max-[620px]:gap-8`}>
      <div>
        <span className={`${kicker} text-[#a9c4aa]`}>A következő történet</span>
        <h2 className={`${editorialHeading} text-[clamp(3rem,5.5vw,5.8rem)]`}>Ott kezdődik,<br />ahol elindulsz.</h2>
      </div>
      <div>
        <p className="text-sm leading-[1.75] text-[#c4d2c6]">Nézd meg a közelgő túrákat, és foglald le a helyed a következő közös útra.</p>
        <Link to="/tours" className={`${button} mt-6 bg-[#dce8d7] text-[#173327] hover:bg-white`}>Indulok <ArrowRight size={18} /></Link>
      </div>
    </section>
  </main>
);

export default HomeScreen;
