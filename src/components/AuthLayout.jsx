import { Link } from 'react-router-dom';
import { ArrowUpRight, Compass } from 'lucide-react';

const AuthLayout = ({ children, eyebrow, title, description }) => (
  <main className="bg-[#f5f5f0] px-4 py-8 text-[#173327] sm:px-6 sm:py-12">
    <div className="mx-auto grid min-h-[min(760px,calc(100svh-10rem))] w-full max-w-[1180px] overflow-hidden rounded-xl border border-[#d9dfd5] bg-[#fffefa] shadow-[0_22px_60px_rgba(23,51,39,0.08)] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
      <aside className="relative isolate flex min-h-[300px] flex-col justify-between overflow-hidden p-7 text-white sm:p-10 lg:min-h-full lg:p-12">
        <img
          src="https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&q=85&w=1500"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(9,28,19,0.58)_0%,rgba(9,28,19,0.20)_40%,rgba(9,28,19,0.88)_100%)]" />
        <Link to="/" className="inline-flex w-fit items-center gap-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/10"><Compass size={19} strokeWidth={1.5} /></span>
          Túrázz Velünk
        </Link>
        <div className="max-w-md">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d7e7d3]">Hegyen · vízen · úton</span>
          <p className="mt-3 font-serif text-[clamp(2.4rem,4.3vw,4.5rem)] leading-[1.04] tracking-[-0.045em]">
            Az út innen<br /><em className="font-normal text-[#e6d2ae]">folytatódik.</em>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#e0e8df]">Válassz egy új irányt, találj társakat, és gyűjts olyan élményeket, amelyek veled maradnak.</p>
          <Link to="/tours" className="mt-6 inline-flex items-center gap-1.5 border-b border-white/70 pb-1 text-xs font-semibold text-white transition-colors hover:text-[#e6d2ae]">
            Túrák felfedezése <ArrowUpRight size={15} />
          </Link>
        </div>
      </aside>
      <section className="flex min-w-0 items-center justify-center px-6 py-10 sm:px-12 sm:py-14 lg:px-[clamp(2.5rem,5vw,5rem)]">
        <div className="w-full max-w-[420px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#477258]">{eyebrow}</span>
          <h1 className="mt-2 font-serif text-[clamp(2.6rem,4vw,3.6rem)] leading-[1.08] tracking-[-0.045em]">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#607267]">{description}</p>
          {children}
        </div>
      </section>
    </div>
  </main>
);

export default AuthLayout;
