import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost, getCustomerRequests, getMenu } from '../services/api';
import {
  RiHomeLine, RiRestaurantLine, RiCustomerService2Line,
  RiFileListLine, RiBankCardLine, RiMenuLine, RiCloseLine,
  RiLogoutBoxRLine, RiWifiLine, RiTempColdLine, RiTv2Line,
  RiShieldCheckLine, RiPhoneLine, RiMapPinLine,
  RiInstagramLine, RiFacebookBoxLine, RiTwitterXLine,
  RiArrowLeftSLine, RiArrowRightSLine,
  RiSendPlaneLine, RiCheckLine, RiDeleteBinLine,
  RiHotelBedLine, RiDropLine, RiLeafLine,
  RiScissorsCutLine, RiMoonLine, RiToolsLine,
} from 'react-icons/ri';
import { MdOutlineBathtub, MdOutlineCoffeeMaker, MdOutlineLocalLaundryService } from 'react-icons/md';
import { LuSparkles } from 'react-icons/lu';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed right-5 top-5 z-[100] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-2xl backdrop-blur-md border"
          style={{
            background: t.type === 'success'
              ? 'linear-gradient(135deg, #0d2414 0%, #1a3a1e 100%)'
              : 'linear-gradient(135deg, #3b0a0a 0%, #5c1a1a 100%)',
            borderColor: t.type === 'success' ? 'rgba(155,194,60,0.3)' : 'rgba(220,38,38,0.3)',
            animation: 'slideInRight 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            minWidth: 260,
          }}
        >
          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
            t.type === 'success' ? 'bg-[#9bc23c]/20' : 'bg-red-500/20'
          }`}>
            <RiCheckLine className={`text-sm ${t.type === 'success' ? 'text-[#9bc23c]' : 'text-red-400'}`} />
          </div>
          <p className="flex-1 text-xs font-medium text-white/90 leading-snug">{t.message}</p>
          <button type="button" onClick={() => onDismiss(t.id)}
            className="flex-shrink-0 text-white/30 transition hover:text-white/70">
            <RiCloseLine className="text-sm" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'home',     label: 'Home',           Icon: RiHomeLine },
  { key: 'food',     label: 'Food Order',      Icon: RiRestaurantLine },
  { key: 'services', label: 'Guest Services',  Icon: RiCustomerService2Line },
  { key: 'requests', label: 'Requests',        Icon: RiFileListLine },
  { key: 'payments', label: 'Payments',        Icon: RiBankCardLine },
];

function Navbar({ active, onNav, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: '#0d2414' }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <button type="button" onClick={() => onNav('home')} className="flex items-center gap-3">
          <img src="/kuriftulogo.jpg" alt="Kuriftu" className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/10" />
          <div className="hidden sm:block">
            <p className="text-white text-sm font-semibold tracking-[0.1em]" style={{ fontFamily: 'Georgia, serif' }}>KURIFTU</p>
            <p className="text-[#9bc23c] text-[9px] uppercase tracking-[0.28em] font-semibold">Resort & Spa</p>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => onNav(key)}
              className={`relative px-4 py-2 text-xs font-medium tracking-[0.1em] uppercase transition-all duration-150 rounded-lg ${
                active === key ? 'text-[#9bc23c]' : 'text-white/50 hover:text-white'
              }`}>
              {label}
              {active === key && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-[#9bc23c]" />}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9bc23c] text-[#0d2414] text-xs font-bold">
              {(user?.name || 'G')[0].toUpperCase()}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-white leading-tight">{user?.name}</p>
              <p className="text-[10px] text-white/35">Room {user?.roomNumber || '—'}</p>
            </div>
          </div>
          <button type="button" onClick={onLogout}
            className="hidden sm:flex items-center rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-medium text-white/40 uppercase tracking-widest transition hover:border-red-400/30 hover:text-red-400">
            Sign out
          </button>
          <button type="button" onClick={() => setMenuOpen((p) => !p)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:text-white">
            {menuOpen ? <RiCloseLine className="text-lg" /> : <RiMenuLine className="text-lg" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/8 px-6 pb-4 md:hidden" style={{ backgroundColor: '#0d2414' }}>
          <div className="mt-3 flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => { onNav(key); setMenuOpen(false); }}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-left transition ${
                  active === key ? 'bg-white/8 text-[#9bc23c]' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                {label}
              </button>
            ))}
            <button type="button" onClick={onLogout}
              className="mt-1 rounded-lg px-4 py-2.5 text-sm font-medium text-left text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition">
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroCanvas({ user }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 560 }}>
      {/* Room photo */}
      <img
        src="/room.jpg"
        alt="Kuriftu Resort Room"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Multi-layer overlay: dark vignette + bottom fade */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, rgba(8,20,10,0.45) 0%, rgba(8,20,10,0.25) 40%, rgba(8,20,10,0.72) 100%)'
      }} />
      {/* Subtle left-side darkening so text pops */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to right, rgba(8,20,10,0.55) 0%, transparent 60%)'
      }} />

      {/* Text — left-aligned, vertically centered */}
      <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-14 lg:px-20">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8 bg-[#9bc23c]" />
          <p style={{
            color: '#9bc23c',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}>
            {getGreeting()}
          </p>
        </div>

        {/* Main heading */}
        <h1 style={{
          color: '#ffffff',
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 300,
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          textShadow: '0 2px 24px rgba(0,0,0,0.5)',
          marginBottom: '0.25rem',
        }}>
          Welcome back,
        </h1>
        <h2 style={{
          color: '#ffffff',
          fontSize: 'clamp(2.2rem, 5.5vw, 3.75rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          textShadow: '0 2px 32px rgba(0,0,0,0.6)',
          marginBottom: '1.25rem',
        }}>
          {user?.name}
        </h2>

        {/* Divider */}
        <div className="h-px w-12 bg-[#9bc23c] mb-5" />

        {/* Sub-info */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span style={{ color: '#9bc23c', fontSize: '0.75rem' }}>🏨</span>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.04em' }}>
              Room {user?.roomNumber || '—'}
            </p>
          </div>
          <div className="h-3 w-px bg-white/20" />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            Kuriftu Resort & Spa
          </p>
        </div>
      </div>

      {/* Bottom fade into cream background */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
        style={{ background: 'linear-gradient(to top, #faf8f4, transparent)' }} />
    </div>
  );
}

// ─── Services Carousel ────────────────────────────────────────────────────────

const SERVICES = [
  { key: 'spa',           label: 'Spa & Wellness',   icon: '🧖', desc: 'World-class treatments',      img: '/kuriftulogowithtext.webp' },
  { key: 'gym',           label: 'Fitness Center',   icon: '🏋️', desc: '24/7 fully equipped',         img: '/kuriftulogo.jpg' },
  { key: 'waterpark',     label: 'Water Park',       icon: '🌊', desc: 'Slides & relaxing pools',     img: '/kuriftulogowithtext.webp' },
  { key: 'entertainment', label: 'Entertainment',    icon: '🎭', desc: 'Live shows & cultural events', img: '/kuriftulogo.jpg' },
  { key: 'dining',        label: 'Fine Dining',      icon: '🍽️', desc: 'Curated culinary experience', img: '/kuriftulogowithtext.webp' },
  { key: 'pool',          label: 'Infinity Pool',    icon: '🏊', desc: 'Panoramic resort views',      img: '/kuriftulogo.jpg' },
];

function ServicesCarousel() {
  const [offset, setOffset] = useState(0);
  const timer = useRef(null);
  const visible = 3; // cards visible at once on desktop

  const max = SERVICES.length - visible;

  const next = () => setOffset((p) => Math.min(p + 1, max));
  const prev = () => setOffset((p) => Math.max(p - 1, 0));

  useEffect(() => {
    timer.current = setInterval(() => {
      setOffset((p) => (p >= max ? 0 : p + 1));
    }, 3500);
    return () => clearInterval(timer.current);
  }, [max]);

  return (
    <div className="relative">
      {/* Track */}
      <div className="overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(calc(-${offset} * (100% / ${visible} + 16px / ${visible})))` }}
        >
          {SERVICES.map((svc) => (
            <div
              key={svc.key}
              className="flex-shrink-0 relative overflow-hidden rounded-2xl shadow-md group cursor-pointer"
              style={{ width: `calc(${100 / visible}% - ${(16 * (visible - 1)) / visible}px)`, height: 260 }}
            >
              <img src={svc.img} alt={svc.label} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d2414]/90 via-[#0d2414]/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-2xl mb-1">{svc.icon}</p>
                <p className="text-white font-semibold text-sm tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>{svc.label}</p>
                <p className="text-white/55 text-xs mt-0.5">{svc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button type="button" onClick={() => { clearInterval(timer.current); prev(); }}
        disabled={offset === 0}
        className="absolute -left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg text-[#0d2414] transition hover:bg-[#9bc23c] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed z-10">
        <RiArrowLeftSLine className="text-lg" />
      </button>
      <button type="button" onClick={() => { clearInterval(timer.current); next(); }}
        disabled={offset >= max}
        className="absolute -right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg text-[#0d2414] transition hover:bg-[#9bc23c] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed z-10">
        <RiArrowRightSLine className="text-lg" />
      </button>

      {/* Dots */}
      <div className="mt-5 flex justify-center gap-1.5">
        {Array.from({ length: max + 1 }).map((_, i) => (
          <button key={i} type="button"
            onClick={() => { clearInterval(timer.current); setOffset(i); }}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: i === offset ? 20 : 6, backgroundColor: i === offset ? '#9bc23c' : '#d1d5db' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Room Details ─────────────────────────────────────────────────────────────

const AMENITIES = [
  { Icon: RiWifiLine,          label: 'Free Wi-Fi',       detail: '300 Mbps' },
  { Icon: RiTempColdLine,      label: 'Climate Control',  detail: 'Smart AC' },
  { Icon: RiTv2Line,           label: 'Smart TV',         detail: '55" 4K' },
  { Icon: MdOutlineBathtub,    label: 'Luxury Bath',      detail: 'Rain shower' },
  { Icon: MdOutlineCoffeeMaker,label: 'Mini Bar',         detail: 'Daily stocked' },
  { Icon: RiShieldCheckLine,   label: 'In-room Safe',     detail: 'Digital lock' },
];

function RoomDetails({ user }) {
  const checkIn = user?.checkInDate ? new Date(user.checkInDate) : new Date(Date.now() - 2 * 86400000);
  return (
    <div className="mx-auto max-w-7xl px-6 py-14" style={{ backgroundColor: '#faf8f4' }}>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px flex-1" style={{ backgroundColor: '#e0d8cc' }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: '#b8a898' }}>Your Stay</p>
        <div className="h-px flex-1" style={{ backgroundColor: '#e0d8cc' }} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
        {/* Room image */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ height: 280 }}>
          <img src="/room.jpg" alt="Your room" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0e06]/80 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-6 right-6">
            <p className="text-white font-semibold text-base" style={{ fontFamily: 'Georgia, serif' }}>
              Deluxe Suite · Room {user?.roomNumber || '212'}
            </p>
            <p className="text-white/50 text-xs mt-1 tracking-wide">King bed · Garden view · 45 m²</p>
          </div>
          <span className="absolute top-4 right-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow"
            style={{ backgroundColor: '#9bc23c', color: '#0d2414' }}>Active</span>
        </div>

        {/* Details */}
        <div>
          <div className="flex gap-4 mb-6">
            {[
              { label: 'Check-in', value: checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
              { label: 'Check-out', value: '11:00 AM' },
              { label: 'Guests', value: '2 Adults' },
            ].map((s) => (
              <div key={s.label} className="flex-1 pl-3" style={{ borderLeft: '2px solid #9bc23c' }}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#b8a898' }}>{s.label}</p>
                <p className="text-sm font-semibold" style={{ color: '#2c1a0e' }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {AMENITIES.map(({ Icon, label, detail }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-center border"
                style={{ backgroundColor: '#fff', borderColor: '#e8e0d4' }}>
                <Icon className="text-xl" style={{ color: '#9bc23c' }} />
                <p className="text-[11px] font-semibold leading-tight" style={{ color: '#2c1a0e' }}>{label}</p>
                <p className="text-[10px]" style={{ color: '#b8a898' }}>{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: 'Pool', value: '8AM–8PM' },
              { label: 'Gym', value: '24hrs' },
              { label: 'Breakfast', value: '7–10AM' },
              { label: 'Bar', value: '4–11PM' },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border"
                style={{ backgroundColor: '#fff', borderColor: '#e8e0d4' }}>
                <span style={{ color: '#b8a898' }}>{p.label}</span>
                <span className="font-semibold" style={{ color: '#2c1a0e' }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ backgroundColor: '#1a0e06' }} className="mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/kuriftulogo.jpg" alt="Kuriftu" className="h-8 w-8 rounded-lg object-cover opacity-80" />
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif', color: '#f5ede0' }}>Kuriftu</p>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: '#9bc23c' }}>Resort & Spa</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs" style={{ color: '#7a6a5a' }}>
            <span className="flex items-center gap-1.5"><RiPhoneLine style={{ color: '#9bc23c' }} /> +251 11 123 4567</span>
            <span className="flex items-center gap-1.5"><RiMapPinLine style={{ color: '#9bc23c' }} /> Bishoftu, Ethiopia</span>
          </div>
          <div className="flex items-center gap-3">
            {[RiInstagramLine, RiFacebookBoxLine, RiTwitterXLine].map((Icon, i) => (
              <button key={i} type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border transition"
                style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#7a6a5a' }}>
                <Icon className="text-sm" />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] tracking-widest uppercase" style={{ color: '#4a3a2a' }}>
            © {new Date().getFullYear()} Kuriftu Resort & Spa · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({ user }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      {/* Hero */}
      <HeroCanvas user={user} />

      {/* Services carousel */}
      <div className="mx-auto w-full max-w-7xl px-10 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: '#9bc23c' }}>Explore</p>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif', color: '#2c1a0e' }}>
              Resort Amenities
            </h2>
          </div>
          <p className="text-xs text-stone-400 hidden sm:block tracking-wide">Drag to explore</p>
        </div>
        <ServicesCarousel />
      </div>

      {/* Room details */}
      <div className="border-t" style={{ borderColor: '#e8e0d4' }}>
        <RoomDetails user={user} />
      </div>

      <Footer />
    </div>
  );
}

// ─── Food Order Page ──────────────────────────────────────────────────────────

const FOOD_CATEGORIES = [
  { key: 'all',           label: 'All Items' },
  { key: 'popular',       label: 'Popular' },
  { key: 'local',         label: 'Local Cuisine' },
  { key: 'drinks',        label: 'Drinks' },
  { key: 'international', label: 'International' },
];

const STATIC_MENU = [
  { name: 'Injera with Tibs', price: 180, category: 'local', tag: "Chef's Pick",
    desc: 'Traditional Ethiopian flatbread with sautéed spiced beef',
    img: 'https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=400&q=80' },
  { name: 'Doro Wat', price: 220, category: 'local', tag: 'Signature',
    desc: 'Slow-cooked spicy chicken stew with boiled eggs',
    img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80' },
  { name: 'Shiro Fitfit', price: 150, category: 'local', tag: null,
    desc: 'Chickpea stew folded with torn injera pieces',
    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
  { name: 'Grilled Salmon', price: 380, category: 'international', tag: 'Premium',
    desc: 'Atlantic salmon fillet with lemon butter and herbs',
    img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80' },
  { name: 'Club Sandwich', price: 250, category: 'popular', tag: null,
    desc: 'Triple-decker with grilled chicken, bacon and fresh greens',
    img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80' },
  { name: 'Margherita Pizza', price: 290, category: 'international', tag: null,
    desc: 'Wood-fired with San Marzano tomato, mozzarella and basil',
    img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
  { name: 'Caesar Salad', price: 200, category: 'popular', tag: null,
    desc: 'Crisp romaine, house croutons, parmesan and caesar dressing',
    img: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80' },
  { name: 'Pasta Carbonara', price: 270, category: 'international', tag: null,
    desc: 'Silky egg sauce with pancetta, parmesan and black pepper',
    img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80' },
  { name: 'Fresh Orange Juice', price: 90, category: 'drinks', tag: null,
    desc: 'Cold-pressed from freshly harvested Ethiopian oranges',
    img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80' },
  { name: 'Mango Smoothie', price: 110, category: 'drinks', tag: 'Popular',
    desc: 'Blended ripe mango with yogurt and a touch of honey',
    img: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80' },
  { name: 'Ethiopian Coffee', price: 70, category: 'drinks', tag: 'Signature',
    desc: 'Traditional ceremony coffee, rich, aromatic and bold',
    img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
  { name: 'Avocado Juice', price: 100, category: 'popular', tag: null,
    desc: 'Creamy blended avocado with chilled milk and cane sugar',
    img: 'https://images.unsplash.com/photo-1638176066959-e349a5e5e5e5?w=400&q=80' },
];

function FoodCard({ item, qty, onAdd, onInc, onDec }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        <img src={item.img} alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {item.tag && (
          <span className="absolute top-3 left-3 rounded-full bg-[#0d2414]/80 px-2.5 py-1 text-[10px] font-semibold text-[#9bc23c] uppercase tracking-wider backdrop-blur-sm">
            {item.tag}
          </span>
        )}
        {qty > 0 && (
          <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#9bc23c] text-[11px] font-bold text-[#0d2414] shadow-md">
            {qty}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-[#0d2414] text-sm leading-snug mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          {item.name}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 flex-1">{item.desc}</p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Price</p>
            <p className="text-base font-bold text-[#0d2414]">ETB {item.price}</p>
          </div>
          {qty === 0 ? (
            <button type="button" onClick={onAdd}
              className="rounded-xl bg-[#0d2414] px-4 py-2 text-xs font-semibold text-white tracking-wide transition hover:bg-[#1a4a22] hover:shadow-md">
              Add
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={onDec}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-600 text-sm font-bold transition hover:border-[#0d2414] hover:text-[#0d2414]">−</button>
              <span className="w-5 text-center text-sm font-bold text-[#0d2414]">{qty}</span>
              <button type="button" onClick={onInc}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9bc23c] text-[#0d2414] text-sm font-bold transition hover:bg-[#b4d655]">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FoodPage({ user, cart, setCart, onOrderPlaced }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [ordering, setOrdering] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [menuItems, setMenuItems] = useState(STATIC_MENU);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadMenu = async () => {
      setMenuLoading(true);
      try {
        const response = await getMenu(false);
        const availableItems = response?.items || [];

        if (!isMounted) return;

        const staticByName = new Map(STATIC_MENU.map((item) => [item.name.toLowerCase(), item]));
        const merged = availableItems.map((item) => {
          const key = `${item.item_name || ''}`.trim().toLowerCase();
          const existing = staticByName.get(key);
          if (existing) return existing;

          return {
            name: item.item_name,
            price: 0,
            category: 'popular',
            tag: null,
            desc: 'Freshly prepared by Kuriftu cafeteria staff.',
            img: '/kuriftulogowithtext.webp',
          };
        });

        setMenuItems(merged.length > 0 ? merged : STATIC_MENU);
      } catch {
        if (isMounted) setMenuItems(STATIC_MENU);
      } finally {
        if (isMounted) setMenuLoading(false);
      }
    };

    void loadMenu();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = activeFilter === 'all'
    ? menuItems
    : menuItems.filter((f) => f.category === activeFilter);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = menuItems.reduce((sum, item) => sum + (cart[item.name] || 0) * item.price, 0);

  const setQty = (name, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      next[name] = Math.max(0, (next[name] || 0) + delta);
      if (next[name] === 0) delete next[name];
      return next;
    });
  };

  const placeOrder = async () => {
    if (totalItems === 0) return;
    setOrdering(true);
    try {
      const items = menuItems.filter((i) => cart[i.name]);
      const orderText = items.map((i) => `${cart[i.name]}x ${i.name}`).join(', ');
      await apiPost('/api/chat', {
        name: user?.name || 'Guest',
        message: `I would like to order: ${orderText}`,
        room_number: user?.roomNumber || 'N/A',
        role: 'customer',
        user_id: `guest_${user?.roomNumber || '000'}`,
      });
      onOrderPlaced(items.map((i) => ({ ...i, qty: cart[i.name] })));
      setCart({});
      setShowCart(false);
    } catch {
      onOrderPlaced(null, 'Could not place order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9f2' }}>
      {/* Hero header */}
      <div style={{ background: 'linear-gradient(135deg, #0d2414 0%, #1a3a1e 100%)' }} className="px-6 pt-10 pb-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9bc23c] mb-2">Kuriftu Resort</p>
          <h1 className="text-3xl font-light text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            Food & Dining
          </h1>
          <p className="text-white/40 text-sm tracking-wide">Room service available 24 hours</p>
        </div>
      </div>

      {/* Sticky filter + cart bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3 gap-4">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {FOOD_CATEGORIES.map((cat) => (
              <button key={cat.key} type="button" onClick={() => setActiveFilter(cat.key)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all ${
                  activeFilter === cat.key
                    ? 'bg-[#0d2414] text-white shadow-sm'
                    : 'text-gray-500 hover:text-[#0d2414] hover:bg-gray-100'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
          {totalItems > 0 && (
            <button type="button" onClick={() => setShowCart(true)}
              className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-[#9bc23c] px-4 py-2 text-xs font-semibold text-[#0d2414] shadow transition hover:bg-[#b4d655]">
              <RiRestaurantLine className="text-sm" />
              {totalItems} item{totalItems !== 1 ? 's' : ''} · ETB {totalPrice.toLocaleString()}
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {menuLoading && (
          <p className="text-xs text-gray-400 mb-3 tracking-wide uppercase">Loading live menu…</p>
        )}
        <p className="text-xs text-gray-400 mb-6 tracking-wide uppercase">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          {activeFilter !== 'all' ? ` · ${FOOD_CATEGORIES.find(c => c.key === activeFilter)?.label}` : ''}
        </p>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <FoodCard key={item.name} item={item}
              qty={cart[item.name] || 0}
              onAdd={() => setQty(item.name, 1)}
              onInc={() => setQty(item.name, 1)}
              onDec={() => setQty(item.name, -1)} />
          ))}
        </div>
      </div>

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-[#0d2414]" style={{ fontFamily: 'Georgia, serif' }}>Your Order</h3>
                <p className="text-xs text-gray-400 mt-0.5">Room {user?.roomNumber || '—'}</p>
              </div>
              <button type="button" onClick={() => setShowCart(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200">
                <RiCloseLine className="text-base" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {menuItems.filter((i) => cart[i.name]).map((item) => (
                <div key={item.name} className="flex items-center gap-3 px-6 py-3.5">
                  <img src={item.img} alt={item.name} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0d2414] truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">ETB {item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button type="button" onClick={() => setQty(item.name, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-xs font-bold text-gray-600 transition hover:border-gray-400">−</button>
                    <span className="w-4 text-center text-sm font-semibold text-[#0d2414]">{cart[item.name]}</span>
                    <button type="button" onClick={() => setQty(item.name, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9bc23c] text-xs font-bold text-[#0d2414] transition hover:bg-[#b4d655]">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total</p>
                <p className="text-xl font-bold text-[#0d2414]">ETB {totalPrice.toLocaleString()}</p>
              </div>
              <button type="button" onClick={placeOrder} disabled={ordering}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d2414] py-3.5 text-sm font-semibold text-white tracking-wide transition hover:bg-[#1a4a22] disabled:opacity-50">
                {ordering
                  ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> Placing order...</>
                  : 'Confirm Order'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Guest Services Page ──────────────────────────────────────────────────────

const QUICK_REQUESTS = [
  { label: 'Extra Pillow',   Icon: RiHotelBedLine,            msg: 'I need an extra pillow please',          category: 'Bedding' },
  { label: 'Towels',         Icon: MdOutlineLocalLaundryService, msg: 'Please bring fresh towels to my room', category: 'Bedding' },
  { label: 'Toiletries',     Icon: RiDropLine,                msg: 'I need shampoo and conditioner',          category: 'Bath' },
  { label: 'Room Cleaning',  Icon: LuSparkles,                msg: 'Please clean my room',                   category: 'Housekeeping' },
  { label: 'Extra Blanket',  Icon: RiMoonLine,                msg: 'Please bring an extra blanket',          category: 'Bedding' },
  { label: 'Toothbrush Kit', Icon: RiLeafLine,                msg: 'I need a toothbrush kit please',         category: 'Bath' },
  { label: 'Maintenance',    Icon: RiToolsLine,               msg: 'I have a maintenance issue in my room',  category: 'Repair' },
  { label: 'Laundry',        Icon: RiScissorsCutLine,         msg: 'I need laundry service please',          category: 'Service' },
];

function GuestServicesPage({ user, onRequestSent }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(null);

  const sendRequest = async (message, label) => {
    const text = (message || input).trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await apiPost('/api/chat', {
        name: user?.name || 'Guest',
        message: text,
        room_number: user?.roomNumber || 'N/A',
        role: 'customer',
        user_id: `guest_${user?.roomNumber || '000'}`,
      });
      onRequestSent({ type: 'service', message: text, time: new Date().toISOString() });
    } catch {
      onRequestSent(null, 'Could not send request. Please try again.');
    } finally {
      setSending(false);
      setLastSent(label || 'custom');
      setInput('');
      setTimeout(() => setLastSent(null), 2500);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRequest(input, 'custom'); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9f2' }}>

      {/* Hero with room photo */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <img src="/room.jpg" alt="Room" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,20,10,0.5) 0%, rgba(8,20,10,0.78) 100%)' }} />
        <div className="relative h-full flex flex-col justify-end px-8 pb-8 sm:px-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9bc23c] mb-2">Concierge</p>
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>
            {getGreeting()}, <span className="font-semibold">{user?.name}</span>
          </h1>
          <p className="text-white/45 text-sm mt-1 tracking-wide">How can we make your stay exceptional today?</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* Compose — centered */}
        <div className="mx-auto max-w-2xl mb-12">
          <div className="rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Your Request</p>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={3}
                placeholder="Describe what you need and we'll take care of it right away…"
                className="w-full resize-none text-sm text-gray-800 outline-none placeholder:text-gray-300 bg-transparent leading-relaxed"
                style={{ fontFamily: 'Georgia, serif' }}
              />
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 px-6 py-3 bg-gray-50/40">
              <p className="text-[11px] text-gray-400">
                {input.length > 0 ? `${input.length} chars` : 'Enter to send · Shift+Enter for new line'}
              </p>
              <button
                type="button"
                onClick={() => sendRequest(input, 'custom')}
                disabled={!input.trim() || sending}
                className="flex items-center gap-2 rounded-xl bg-[#0d2414] px-5 py-2 text-xs font-semibold text-white tracking-wide transition hover:bg-[#1a4a22] active:scale-95 disabled:opacity-30"
              >
                {sending
                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  : <RiSendPlaneLine className="text-sm" />
                }
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
          {lastSent === 'custom' && (
            <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-[#9bc23c]/25 bg-[#f0faf2] px-4 py-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#9bc23c]/20">
                <RiCheckLine className="text-[#9bc23c] text-xs" />
              </div>
              <p className="text-xs text-[#2d5c10]">Request received — our team will attend to you shortly.</p>
            </div>
          )}
        </div>

        {/* Quick requests + info */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Quick Requests</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_REQUESTS.map(({ label, Icon, msg, category }) => {
                const justSent = lastSent === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => sendRequest(msg, label)}
                    disabled={sending}
                    className={`group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${
                      justSent
                        ? 'border-[#9bc23c]/30 bg-[#f0faf2]'
                        : 'border-gray-100 bg-white hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md'
                    } disabled:opacity-40`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      justSent ? 'bg-[#9bc23c]/15' : 'bg-gray-50 group-hover:bg-gray-100'
                    }`}>
                      {justSent
                        ? <RiCheckLine className="text-[#9bc23c] text-sm" />
                        : <Icon className="text-gray-400 text-sm group-hover:text-[#0d2414]" />
                      }
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0d2414] leading-tight">{label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide">{category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Resort Hours</p>
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm divide-y divide-gray-50">
              {[
                { label: 'Room Service', value: '24 hrs',   live: true },
                { label: 'Housekeeping', value: '7AM–10PM', live: false },
                { label: 'Concierge',    value: '24 hrs',   live: true },
                { label: 'Pool',         value: '8AM–8PM',  live: false },
                { label: 'Gym',          value: '24 hrs',   live: true },
                { label: 'Breakfast',    value: '7–10AM',   live: false },
                { label: 'Bar',          value: '4–11PM',   live: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${item.live ? 'bg-[#9bc23c]' : 'bg-gray-300'}`} />
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                  <p className="text-xs font-semibold text-[#0d2414]">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-[#0d2414] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9bc23c] mb-2">Front Desk</p>
              <p className="text-white/50 text-xs leading-relaxed mb-3">For urgent requests or emergencies.</p>
              <div className="flex items-center gap-2">
                <RiPhoneLine className="text-[#9bc23c] text-sm flex-shrink-0" />
                <p className="text-xs text-white/60">Dial <span className="font-bold text-white">0</span> from your room</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Requests Page ────────────────────────────────────────────────────────────

function RequestsPage({ requests }) {
  const foodReqs = requests.filter((r) => r.type === 'food');
  const serviceReqs = requests.filter((r) => r.type !== 'food');

  const RequestCard = ({ req, i }) => {
    const isFood = req.type === 'food';
    return (
      <div className="group flex items-start gap-4 rounded-2xl bg-white border border-gray-100 px-5 py-4 shadow-sm transition-all hover:shadow-md">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${isFood ? 'bg-amber-50' : 'bg-[#0d2414]/5'}`}>
          {isFood
            ? <RiRestaurantLine className="text-amber-500 text-sm" />
            : <RiCustomerService2Line className="text-[#0d2414]/50 text-sm" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
              isFood ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-[#9bc23c]/8 text-[#2d5c10] border-[#9bc23c]/15'
            }`}>
              {isFood ? 'Food' : 'Service'}
            </span>
            {req.time && (
              <span className="text-[10px] text-gray-400">
                {new Date(req.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{req.message}</p>
          {req.items && req.items.length > 0 && (
            <p className="mt-1 text-xs text-gray-400">{req.items.map((it) => `${it.qty}× ${it.name}`).join(' · ')}</p>
          )}
          <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-300">Status: {(req.status || 'pending').replace('_', ' ')}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9f2' }}>
      <div style={{ background: 'linear-gradient(135deg, #0d2414 0%, #1a3a1e 100%)' }} className="px-6 pt-10 pb-8">
        <div className="mx-auto max-w-5xl flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9bc23c] mb-2">Activity</p>
            <h1 className="text-3xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>My Requests</h1>
          </div>
          {requests.length > 0 && (
            <p className="text-white/30 text-xs pb-1 tracking-widest uppercase">{requests.length} total</p>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-8">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm mb-5">
              <RiFileListLine className="text-xl text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>No requests yet</p>
            <p className="mt-1 text-xs text-gray-400">Food orders and service requests will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
                Food Orders <span className="text-gray-300 font-normal">· {foodReqs.length}</span>
              </p>
              {foodReqs.length === 0
                ? <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center"><p className="text-xs text-gray-400">No food orders placed</p></div>
                : <div className="space-y-2.5">{foodReqs.map((req, i) => <RequestCard key={req.id || i} req={req} i={i} />)}</div>
              }
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
                Service Requests <span className="text-gray-300 font-normal">· {serviceReqs.length}</span>
              </p>
              {serviceReqs.length === 0
                ? <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center"><p className="text-xs text-gray-400">No service requests submitted</p></div>
                : <div className="space-y-2.5">{serviceReqs.map((req, i) => <RequestCard key={req.id || i} req={req} i={i} />)}</div>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payments Page ────────────────────────────────────────────────────────────

function PaymentsPage({ user, foodOrders }) {
  const checkInDate = user?.checkInDate
    ? new Date(user.checkInDate)
    : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const today = new Date();
  const daysStayed = Math.max(1, Math.ceil((today - checkInDate) / (1000 * 60 * 60 * 24)));
  const ROOM_RATE = 3500;
  const roomTotal = daysStayed * ROOM_RATE;
  const foodTotal = foodOrders.reduce((sum, order) =>
    order.items ? sum + order.items.reduce((s, i) => s + i.price * i.qty, 0) : sum, 0);
  const grandTotal = roomTotal + foodTotal;

  const foodLines = foodOrders.flatMap((order) =>
    order.items
      ? order.items.map((item) => ({
          label: item.name,
          sub: `${item.qty} × ETB ${item.price.toLocaleString()}`,
          amount: item.price * item.qty,
          Icon: RiRestaurantLine,
        }))
      : []
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9f2' }}>

      {/* Hero with room photo + total overlay */}
      <div className="relative overflow-hidden" style={{ height: 240 }}>
        <img src="/room.jpg" alt="Room" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,20,10,0.45) 0%, rgba(8,20,10,0.82) 100%)' }} />
        <div className="relative h-full flex flex-col justify-end px-8 pb-8 sm:px-14">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9bc23c] mb-2">Invoice</p>
              <h1 className="text-3xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>Your Bill</h1>
              <p className="text-white/40 text-sm mt-1">Room {user?.roomNumber || '212'} · {user?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Total Due</p>
              <p className="text-3xl font-bold text-[#9bc23c]" style={{ fontFamily: 'Georgia, serif' }}>
                ETB {grandTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* Left — charges */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Itemized Charges</p>

            {/* Room line */}
            <div className="flex items-center gap-4 rounded-2xl bg-white border border-gray-100 px-5 py-4 shadow-sm">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#0d2414]/5">
                <RiHotelBedLine className="text-[#0d2414]/50 text-base" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0d2414]" style={{ fontFamily: 'Georgia, serif' }}>Accommodation</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {daysStayed} night{daysStayed !== 1 ? 's' : ''} · Deluxe Suite · ETB {ROOM_RATE.toLocaleString()} / night
                </p>
              </div>
              <p className="text-sm font-semibold text-[#0d2414] flex-shrink-0">ETB {roomTotal.toLocaleString()}</p>
            </div>

            {/* Food lines */}
            {foodLines.map((line, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl bg-white border border-gray-100 px-5 py-4 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                  <line.Icon className="text-amber-500 text-base" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0d2414]" style={{ fontFamily: 'Georgia, serif' }}>{line.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{line.sub}</p>
                </div>
                <p className="text-sm font-semibold text-[#0d2414] flex-shrink-0">ETB {line.amount.toLocaleString()}</p>
              </div>
            ))}

            {/* Totals block */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden mt-2">
              {foodTotal > 0 && (
                <>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Room charges</p>
                    <p className="text-sm font-medium text-[#0d2414]">ETB {roomTotal.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Food & dining</p>
                    <p className="text-sm font-medium text-[#0d2414]">ETB {foodTotal.toLocaleString()}</p>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between px-5 py-4 bg-[#0d2414]">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Total Due</p>
                <p className="text-xl font-bold text-[#9bc23c]">ETB {grandTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Right — stay card */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Stay Details</p>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm divide-y divide-gray-50">
              {[
                { label: 'Guest',     value: user?.name || '—' },
                { label: 'Room',      value: `${user?.roomNumber || '212'} · Deluxe Suite` },
                { label: 'Check-in',  value: checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                { label: 'Check-out', value: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                { label: 'Duration',  value: `${daysStayed} night${daysStayed !== 1 ? 's' : ''}` },
                { label: 'Rate',      value: `ETB ${ROOM_RATE.toLocaleString()} / night` },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between px-4 py-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-xs font-semibold text-[#0d2414] text-right max-w-[55%]">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#9bc23c]/20 bg-[#f0faf2] px-5 py-4">
              <p className="text-xs font-semibold text-[#0d2414] mb-1.5">Ready to check out?</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Visit the front desk or dial <span className="font-bold text-[#0d2414]">0</span> from your room. Check-out is at 11:00 AM.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [cart, setCart] = useState({});
  const [requests, setRequests] = useState([]);
  const [toasts, setToasts] = useState([]);

  const hydrateRequestItems = (rows = []) => {
    const staticByName = new Map(STATIC_MENU.map((item) => [item.name.toLowerCase(), item]));

    return rows.map((row) => {
      const base = {
        id: row.instruction_id,
        type: row.type,
        message: row.message,
        time: row.created_at,
        status: row.status,
      };

      if (row.type !== 'food') return base;

      const text = `${row.message || ''}`;
      const matches = [...text.matchAll(/(\d+)x\s*([^,]+)/gi)];
      const items = matches.map((match) => {
        const qty = Number(match[1] || 0);
        const name = `${match[2] || ''}`.trim();
        const staticItem = staticByName.get(name.toLowerCase());
        return {
          name,
          qty,
          price: staticItem?.price || 0,
        };
      });

      return {
        ...base,
        items,
      };
    });
  };

  const refreshRequests = async () => {
    const roomNumber = `${user?.roomNumber || ''}`.trim();
    if (!roomNumber) return;

    try {
      const data = await getCustomerRequests(roomNumber);
      setRequests(hydrateRequestItems(data?.items || []));
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => {
    void refreshRequests();
  }, [user?.roomNumber]);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };

  const handleOrderPlaced = async (items, errorMessage) => {
    if (errorMessage) {
      pushToast(errorMessage, 'error');
      return;
    }

    await refreshRequests();
    pushToast('Order placed successfully!');
    setActivePage('requests');
  };

  const handleRequestSent = async (req, errorMessage) => {
    if (errorMessage) {
      pushToast(errorMessage, 'error');
      return;
    }

    await refreshRequests();
    pushToast('Request sent!');
  };

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const foodOrders = requests.filter((r) => r.type === 'food');

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f9f2' }}>
      {/* Navbar — always sage background, aligned with all pages */}
      <Navbar active={activePage} onNav={setActivePage} user={user} onLogout={handleLogout} />

      <div key={activePage}>
        {activePage === 'home'     && <HomePage user={user} />}
        {activePage === 'food'     && <FoodPage user={user} cart={cart} setCart={setCart} onOrderPlaced={handleOrderPlaced} />}
        {activePage === 'services' && <GuestServicesPage user={user} onRequestSent={handleRequestSent} />}
        {activePage === 'requests' && <RequestsPage requests={requests} />}
        {activePage === 'payments' && <PaymentsPage user={user} foodOrders={foodOrders} />}
      </div>

      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
