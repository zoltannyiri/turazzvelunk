import { createElement } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, Compass, MapPin,
  ShieldCheck, Users
} from 'lucide-react';
import './HomeScreen.css';

const journeys = [
  {
    number: '01',
    title: 'Hegyi túrák',
    description: 'Gerincek, csúcsok és hosszú panorámák tapasztalt túravezetőkkel.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=85&w=1200'
  },
  {
    number: '02',
    title: 'Vízi túrák',
    description: 'Folyók és tavak más nézőpontból, közös ritmusban a vízen.',
    image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&q=85&w=1200'
  },
  {
    number: '03',
    title: 'Motoros túrák',
    description: 'Kanyargós utak és gondosan felépített útvonalak két keréken.',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=85&w=1200'
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

const HomeScreen = () => {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&q=88&w=2200"
            alt=""
          />
        </div>
        <div className="home-hero-overlay" />
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <span className="home-kicker">Vezetett túrák · valódi közösség</span>
            <h1>Menj messzebb.<br /><em>Érkezz közelebb.</em></h1>
            <p>
              Közösen megélt utak hegyen, vízen és aszfalton.
              Válassz túrát, készülj fel velünk, és indulj el egy jó csapattal.
            </p>
            <div className="home-hero-actions">
              <Link to="/tours" className="home-button home-button-primary">
                Túrák felfedezése <ArrowRight size={18} />
              </Link>
              <Link to="/calendar" className="home-button home-button-ghost">
                <CalendarDays size={17} /> Túranaptár
              </Link>
            </div>
          </div>

          <div className="home-hero-note">
            <span><MapPin size={15} /> Következő útvonal</span>
            <strong>A tiéd lehet.</strong>
            <p>A jó történetek ritkán kezdődnek a kanapén.</p>
          </div>
        </div>
        {/* <div className="home-scroll-label"><span /> Görgess tovább</div> */}
      </section>

      <section className="home-intro home-container">
        <div className="home-section-heading">
          <span className="home-kicker">Találd meg a saját utad</span>
          <h2>Nem ugyanoda tartunk.<br />De együtt indulunk.</h2>
        </div>
        <div className="home-intro-copy">
          <p>
            Van, akit a csendes erdei ösvény, mást a magashegyi panoráma vagy
            a hosszú országút hív. Mi abban segítünk, hogy megtaláld a hozzád
            illő túrát és azokat, akikkel jó lesz végigmenni rajta.
          </p>
          <Link to="/tour-search">Segíts túrát választani <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="home-journeys home-container" aria-labelledby="journey-title">
        <div className="home-journeys-header">
          <div>
            <span className="home-kicker">Útvonalak és élmények</span>
            <h2 id="journey-title">Merre indulnál?</h2>
          </div>
          <Link to="/tours" className="home-text-link">Minden túra <ArrowRight size={16} /></Link>
        </div>

        <div className="home-journey-grid">
          {journeys.map((journey) => (
            <Link to="/tours" className="home-journey-card" key={journey.title}>
              <img src={journey.image} alt="" />
              <span className="home-journey-shade" />
              <span className="home-journey-number">{journey.number}</span>
              <span className="home-journey-content">
                <strong>{journey.title}</strong>
                <span>{journey.description}</span>
              </span>
              <span className="home-journey-arrow"><ArrowRight size={19} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-story">
        <div className="home-container home-story-grid">
          <div className="home-story-media">
            <img
              src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=86&w=1400"
              alt="Túrázók egy hegyi ösvényen"
            />
            <span className="home-image-caption"><Compass size={15} /> Az út közösen válik történetté</span>
          </div>
          <div className="home-story-copy">
            <span className="home-kicker">Több mint egy útvonal</span>
            <h2>A túra már jóval az indulás előtt elkezdődik.</h2>
            <p>
              A jelentkezéstől a felszerelés kiválasztásán át a közös
              beszélgetésig minden fontos részletet egy helyen találsz.
              Így amikor eljön az indulás napja, már csak az útra kell figyelned.
            </p>
            <Link to="/about-us" className="home-button home-button-dark">
              Így működik <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-principles home-container" aria-labelledby="principles-title">
        <div className="home-principles-heading">
          <span className="home-kicker">Ami minden úton számít</span>
          <h2 id="principles-title">Jól szervezett kalandok,<br />emberi léptékben.</h2>
        </div>
        <div className="home-principle-list">
          {principles.map(({ icon, title, text }, index) => (
            <article className="home-principle" key={title}>
              <span className="home-principle-index">0{index + 1}</span>
              <span className="home-principle-icon">{createElement(icon, { size: 21, strokeWidth: 1.7 })}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta home-container">
        <div className="home-cta-copy">
          <span className="home-kicker">A következő történet</span>
          <h2>Ott kezdődik,<br />ahol elindulsz.</h2>
        </div>
        <div className="home-cta-action">
          <p>Nézd meg a közelgő túrákat, és foglald le a helyed a következő közös útra.</p>
          <Link to="/tours" className="home-button home-button-light">
            Indulok <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default HomeScreen;
