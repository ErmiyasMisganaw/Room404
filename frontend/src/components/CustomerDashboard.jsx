import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../services/api';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-sm ${
          t.type === 'success' ? 'border-[#9bc23c]/40 bg-white text-[#2d5c10]' : 'border-red-300 bg-red-50 text-red-700'
        }`}>
          <p className="font-medium">{t.message}</p>
          <button type="button" onClick={() => onDismiss(t.id)} className="text-xs opacity-50 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'food', label: 'Food Order' },
  { key: 'services', label: 'Guest Services' },
  { key: 'requests', label: 'Requests' },
  { key: 'payments', label: 'Payments' },
];

function Navbar({ active, onNav, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#9bc23c]/20 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/kuriftulogo.jpg" alt="Kuriftu" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-[#0d2414] leading-tight">Kuriftu Resort</p>
            <p className="text-[10px] text-[#9bc23c] font-semibold uppercase tracking-wider">Luxury Experience</p>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onNav(item.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                active === item.key
                  ? 'bg-[#9bc23c] text-[#0d2414] shadow-sm'
                  : 'text-gray-600 hover:bg-[#9bc23c]/10 hover:text-[#0d2414]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-[#0d2414]">{user?.name}</p>
            <p className="text-[10px] text-gray-400">Room {user?.roomNumber || '—'}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0d2414] text-white text-sm font-bold shadow">
            {(user?.name || 'G')[0].toUpperCase()}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-red-200 hover:text-red-500"
          >
            Sign out
          </button>
          {/* Mobile hamburger */}
          <button type="button" onClick={() => setMenuOpen((p) => !p)} className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-gray-200">
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          <div className="mt-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => { onNav(item.key); setMenuOpen(false); }}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-left transition ${
                  active === item.key ? 'bg-[#9bc23c] text-[#0d2414]' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button type="button" onClick={onLogout} className="mt-2 rounded-lg px-4 py-2.5 text-sm font-medium text-left text-red-500 hover:bg-red-50">
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── 3D Room Components ───────────────────────────────────────────────────────

function Bed() {
  return (
    <group position={[0, -0.3, -1.2]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.25, 1.4]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[2.1, 0.18, 1.3]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.9} />
      </mesh>
      <mesh position={[-0.55, 0.35, -0.3]} castShadow>
        <boxGeometry args={[0.7, 0.12, 0.45]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
      <mesh position={[0.55, 0.35, -0.3]} castShadow>
        <boxGeometry args={[0.7, 0.12, 0.45]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
      <mesh position={[0, 0.32, 0.25]} castShadow>
        <boxGeometry args={[2.05, 0.08, 0.8]} />
        <meshStandardMaterial color="#1a4a22" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.55, -0.72]} castShadow>
        <boxGeometry args={[2.2, 0.9, 0.1]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.7} />
      </mesh>
    </group>
  );
}

function NightStand({ x }) {
  return (
    <group position={[x, -0.55, -1.2]}>
      <mesh castShadow>
        <boxGeometry args={[0.45, 0.5, 0.4]} />
        <meshStandardMaterial color="#4a3728" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.3, 8]} />
        <meshStandardMaterial color="#c8a96e" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <coneGeometry args={[0.18, 0.22, 12, 1, true]} />
        <meshStandardMaterial color="#f5e6c8" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <pointLight position={[0, 0.55, 0]} intensity={0.8} color="#ffd580" distance={2.5} decay={2} />
    </group>
  );
}

function RoomScene() {
  const groupRef = useRef();
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.07) * 0.03;
    }
  });
  return (
    <group ref={groupRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <MeshReflectorMaterial color="#c8a96e" roughness={0.4} metalness={0.1} mirror={0.25} blur={[200, 80]} mixBlur={0.7} mixStrength={0.4} />
      </mesh>
      <mesh position={[0, 1.2, -2.5]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#f0ebe0" roughness={1} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-3.5, 1.2, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#ede8dd" roughness={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.8, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#f8f5ef" roughness={1} />
      </mesh>
      <mesh position={[0, 2.75, -0.5]}>
        <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
        <meshStandardMaterial color="#fffde0" emissive="#fffde0" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, 2.5, -0.5]} intensity={2.5} color="#fff8e7" distance={7} decay={1.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.79, 0.2]} receiveShadow>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#7a3b10" roughness={1} />
      </mesh>
      <Bed />
      <NightStand x={-1.35} />
      <NightStand x={1.35} />
      <mesh position={[2.8, 1.2, -1.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.8, 1.6]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={0.3} roughness={0} metalness={0.1} />
      </mesh>
      <rectAreaLight position={[2.6, 1.2, -1.5]} rotation={[0, -Math.PI / 2, 0]} width={1.8} height={1.6} intensity={4} color="#c8e8ff" />
      {[-0.95, 0.95].map((x, i) => (
        <mesh key={i} position={[2.79, 1.2, -1.5 + x]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.9, 1.8]} />
          <meshStandardMaterial color="#1a4a22" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[-2.8, -0.3, 0.5]} castShadow>
        <boxGeometry args={[0.5, 1.0, 1.2]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.7} />
      </mesh>
      <mesh position={[-2.78, 0.6, 0.5]}>
        <planeGeometry args={[0.8, 0.9]} />
        <meshStandardMaterial color="#c8d8e0" metalness={0.9} roughness={0.05} />
      </mesh>
      <ambientLight intensity={0.45} color="#fff5e0" />
    </group>
  );
}

function HeroCanvas({ user }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 520, background: 'linear-gradient(180deg,#0d1a10 0%,#1a3020 100%)' }}>
      <Canvas shadows camera={{ position: [2.5, 1.2, 3.5], fov: 52 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
        <Environment preset="apartment" />
        <RoomScene />
        <OrbitControls enableZoom={false} enablePan={false}
          minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.2}
          minAzimuthAngle={-Math.PI / 5} maxAzimuthAngle={Math.PI / 5}
          autoRotate autoRotateSpeed={0.4} />
      </Canvas>
      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[#9bc23c] text-xs font-bold uppercase tracking-[0.3em] mb-3 drop-shadow-lg">
          {getGreeting()}
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-1"
          style={{ textShadow: '0 4px 32px rgba(0,0,0,0.8)' }}>
          Welcome back,
        </h1>
        <h2 className="text-3xl sm:text-4xl font-extrabold"
          style={{ color: '#9bc23c', textShadow: '0 4px 32px rgba(0,0,0,0.7)' }}>
          {user?.name}
        </h2>
        <p className="mt-3 text-white/50 text-sm" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          Room {user?.roomNumber || '—'} · Kuriftu Resort
        </p>
      </div>
      {/* Bottom fade into page bg */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
        style={{ background: 'linear-gradient(to top, #f7f9f2, transparent)' }} />
    </div>
  );
}

// ─── Services Slider ──────────────────────────────────────────────────────────

const SERVICES = [
  { key: 'spa', label: 'Spa & Wellness', emoji: '🧖', desc: 'Rejuvenate with world-class spa treatments and massages', img: '/kuriftulogowithtext.webp', accent: '#f9a8d4', overlay: 'from-rose-950/75 to-pink-900/50' },
  { key: 'gym', label: 'Fitness Center', emoji: '🏋️', desc: '24/7 fully equipped gym with personal trainers available', img: '/kuriftulogo.jpg', accent: '#93c5fd', overlay: 'from-blue-950/75 to-indigo-900/50' },
  { key: 'waterpark', label: 'Water Park', emoji: '🌊', desc: 'Thrilling slides and relaxing pools for all ages', img: '/kuriftulogowithtext.webp', accent: '#67e8f9', overlay: 'from-cyan-950/75 to-teal-900/50' },
  { key: 'entertainment', label: 'Entertainment', emoji: '🎭', desc: 'Live shows, cultural events and vibrant evening activities', img: '/kuriftulogo.jpg', accent: '#fcd34d', overlay: 'from-amber-950/75 to-orange-900/50' },
];

function ServicesSlider() {
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  const go = (idx) => setActive(((idx % SERVICES.length) + SERVICES.length) % SERVICES.length);

  useEffect(() => {
    timer.current = setInterval(() => setActive((p) => (p + 1) % SERVICES.length), 4000);
    return () => clearInterval(timer.current);
  }, []);

  const svc = SERVICES[active];

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ height: 340 }}>
      {SERVICES.map((s, i) => (
        <div key={s.key} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === active ? 1 : 0 }}>
          <img src={s.img} alt={s.label} className="h-full w-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-r ${s.overlay}`} />
        </div>
      ))}
      <div className="relative z-10 flex h-full flex-col justify-end p-8">
        <span className="text-4xl mb-3">{svc.emoji}</span>
        <h3 className="text-2xl font-extrabold text-white mb-2" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
          {svc.label}
        </h3>
        <p className="text-white/75 text-sm max-w-sm leading-relaxed">{svc.desc}</p>
        <div className="mt-5 flex gap-2">
          {SERVICES.map((_, i) => (
            <button key={i} type="button"
              onClick={() => { clearInterval(timer.current); go(i); }}
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: i === active ? 24 : 8, backgroundColor: i === active ? svc.accent : 'rgba(255,255,255,0.35)' }}
            />
          ))}
        </div>
      </div>
      <button type="button" onClick={() => { clearInterval(timer.current); go(active - 1); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white text-xl backdrop-blur-sm transition hover:bg-black/50">
        ‹
      </button>
      <button type="button" onClick={() => { clearInterval(timer.current); go(active + 1); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white text-xl backdrop-blur-sm transition hover:bg-black/50">
        ›
      </button>
    </div>
  );
}

// ─── Room Details ─────────────────────────────────────────────────────────────

const AMENITIES = [
  { icon: '📶', label: 'Free Wi-Fi', desc: 'High-speed 300 Mbps' },
  { icon: '❄️', label: 'Air Conditioning', desc: 'Climate controlled' },
  { icon: '📺', label: 'Smart TV', desc: '55" 4K with streaming' },
  { icon: '🛁', label: 'Luxury Bath', desc: 'Soaking tub & rain shower' },
  { icon: '☕', label: 'Mini Bar', desc: 'Stocked daily' },
  { icon: '🔒', label: 'In-room Safe', desc: 'Digital lock' },
  { icon: '🛎️', label: 'Room Service', desc: '24/7 available' },
  { icon: '🌿', label: 'Garden View', desc: 'Scenic resort grounds' },
];

function RoomDetails({ user }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0d2414]">Your Room</h2>
          <p className="mt-0.5 text-sm text-gray-500">Room {user?.roomNumber || '212'} · Deluxe Suite</p>
        </div>
        <span className="rounded-full bg-[#9bc23c]/15 px-3 py-1 text-xs font-bold text-[#2d5c10]">Active Stay</span>
      </div>

      {/* Room banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl shadow-lg" style={{ height: 200 }}>
        <img src="/kuriftulogowithtext.webp" alt="Your room" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d2414]/80 to-transparent" />
        <div className="absolute bottom-5 left-6">
          <p className="text-white font-bold text-lg">Deluxe Suite · Room {user?.roomNumber || '212'}</p>
          <p className="text-white/60 text-xs mt-0.5">King bed · Garden view · 45 m²</p>
        </div>
      </div>

      {/* Amenities */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AMENITIES.map((a) => (
          <div key={a.label} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xl flex-shrink-0">{a.icon}</span>
            <div>
              <p className="text-xs font-bold text-[#0d2414]">{a.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Policies */}
      <div className="mt-6 rounded-2xl border border-[#9bc23c]/20 bg-[#f0faf2] p-5">
        <h3 className="text-sm font-bold text-[#0d2414] mb-3">Resort Policies</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { label: 'Check-in', value: '3:00 PM' },
            { label: 'Check-out', value: '11:00 AM' },
            { label: 'Pool Hours', value: '8 AM – 8 PM' },
            { label: 'Gym', value: '24 hours' },
            { label: 'Breakfast', value: '7 AM – 10 AM' },
            { label: 'Bar', value: '4 PM – 11 PM' },
          ].map((p) => (
            <div key={p.label} className="flex justify-between rounded-lg bg-white px-3 py-2 text-xs">
              <span className="text-gray-400">{p.label}</span>
              <span className="font-semibold text-[#0d2414]">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({ user, onNav }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9f2' }}>
      {/* 3D hero */}
      <HeroCanvas user={user} />

      {/* CTA */}
      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => onNav('food')}
          className="rounded-xl bg-[#9bc23c] px-5 py-2.5 text-sm font-bold text-[#0d2414] shadow-lg shadow-[#9bc23c]/30 transition hover:bg-[#b4d655] hover:-translate-y-0.5">
          🍽️ Order Food
        </button>
        <button type="button" onClick={() => onNav('services')}
          className="rounded-xl border border-[#9bc23c]/40 bg-white px-5 py-2.5 text-sm font-semibold text-[#0d2414] shadow-sm transition hover:bg-[#f0faf2]">
          🛎️ Request Service
        </button>
      </div>

      {/* Services slider */}
      <div className="mx-auto max-w-7xl px-6 pb-10">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-[#0d2414]">Resort Amenities</h2>
          <p className="mt-1 text-sm text-gray-500">Explore everything Kuriftu has to offer</p>
        </div>
        <ServicesSlider />
      </div>

      {/* Room details */}
      <div className="border-t border-gray-100">
        <RoomDetails user={user} />
      </div>
    </div>
  );
}

// ─── Food Order Page ──────────────────────────────────────────────────────────

const FOOD_CATEGORIES = [
  { key: 'all', label: 'All', emoji: '🍽️' },
  { key: 'popular', label: 'Popular Dishes', emoji: '🔥' },
  { key: 'local', label: 'Local Cuisine', emoji: '🌿' },
  { key: 'drinks', label: 'Drinks', emoji: '🥤' },
  { key: 'international', label: 'International', emoji: '🌍' },
];

// Static menu with categories for demo (backend menu items don't have categories)
const STATIC_MENU = [
  { name: 'Injera with Tibs', price: 180, category: 'local', emoji: '🥩', desc: 'Traditional Ethiopian flatbread with sautéed beef' },
  { name: 'Doro Wat', price: 220, category: 'local', emoji: '🍗', desc: 'Spicy Ethiopian chicken stew with boiled eggs' },
  { name: 'Shiro Fitfit', price: 150, category: 'local', emoji: '🫘', desc: 'Chickpea stew with torn injera pieces' },
  { name: 'Grilled Salmon', price: 380, category: 'international', emoji: '🐟', desc: 'Atlantic salmon with lemon butter sauce' },
  { name: 'Club Sandwich', price: 250, category: 'popular', emoji: '🥪', desc: 'Triple-decker with chicken, bacon and veggies' },
  { name: 'Margherita Pizza', price: 290, category: 'international', emoji: '🍕', desc: 'Classic tomato, mozzarella and fresh basil' },
  { name: 'Caesar Salad', price: 200, category: 'popular', emoji: '🥗', desc: 'Romaine, croutons, parmesan and caesar dressing' },
  { name: 'Pasta Carbonara', price: 270, category: 'international', emoji: '🍝', desc: 'Creamy egg sauce with pancetta and parmesan' },
  { name: 'Fresh Orange Juice', price: 90, category: 'drinks', emoji: '🍊', desc: 'Freshly squeezed Ethiopian oranges' },
  { name: 'Mango Smoothie', price: 110, category: 'drinks', emoji: '🥭', desc: 'Blended mango with yogurt and honey' },
  { name: 'Ethiopian Coffee', price: 70, category: 'drinks', emoji: '☕', desc: 'Traditional ceremony coffee, rich and aromatic' },
  { name: 'Avocado Juice', price: 100, category: 'popular', emoji: '🥑', desc: 'Creamy blended avocado with milk and sugar' },
];

function FoodCard({ item, qty, onAdd, onInc, onDec }) {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md overflow-hidden">
      {/* Emoji banner */}
      <div className="flex h-28 items-center justify-center bg-gradient-to-br from-[#f0faf2] to-[#e8f5d0] text-5xl">
        {item.emoji}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[#0d2414] text-sm leading-tight">{item.name}</h3>
        <p className="mt-1 text-xs text-gray-400 leading-relaxed line-clamp-2">{item.desc}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-extrabold text-[#1d5c28]">ETB {item.price}</span>
          {qty === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-xl bg-[#9bc23c] px-4 py-1.5 text-xs font-bold text-[#0d2414] shadow transition hover:bg-[#b4d655]"
            >
              Add
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={onDec} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-700 font-bold text-sm transition hover:bg-gray-200">−</button>
              <span className="w-5 text-center text-sm font-bold text-[#0d2414]">{qty}</span>
              <button type="button" onClick={onInc} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9bc23c] text-[#0d2414] font-bold text-sm transition hover:bg-[#b4d655]">+</button>
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

  const filtered = activeFilter === 'all'
    ? STATIC_MENU
    : STATIC_MENU.filter((f) => f.category === activeFilter);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = STATIC_MENU.reduce((sum, item) => sum + (cart[item.name] || 0) * item.price, 0);

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
      const items = STATIC_MENU.filter((i) => cart[i.name]);
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
      // still record locally
      const items = STATIC_MENU.filter((i) => cart[i.name]);
      onOrderPlaced(items.map((i) => ({ ...i, qty: cart[i.name] })));
      setCart({});
      setShowCart(false);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9f2' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0d2414]">Food & Dining</h1>
            <p className="text-xs text-gray-400 mt-0.5">Room service available 24/7</p>
          </div>
          {totalItems > 0 && (
            <button
              type="button"
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 rounded-xl bg-[#0d2414] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#1a4a22]"
            >
              🛒 Cart
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#9bc23c] text-[10px] font-bold text-[#0d2414]">
                {totalItems}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="mx-auto max-w-7xl flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FOOD_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveFilter(cat.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                activeFilter === cat.key
                  ? 'bg-[#9bc23c] text-[#0d2414] shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <FoodCard
              key={item.name}
              item={item}
              qty={cart[item.name] || 0}
              onAdd={() => setQty(item.name, 1)}
              onInc={() => setQty(item.name, 1)}
              onDec={() => setQty(item.name, -1)}
            />
          ))}
        </div>
      </div>

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="font-bold text-[#0d2414]">Your Order</h3>
              <button type="button" onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="max-h-72 overflow-y-auto px-5 py-3 space-y-3">
              {STATIC_MENU.filter((i) => cart[i.name]).map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#0d2414]">{item.name}</p>
                      <p className="text-xs text-gray-400">ETB {item.price} each</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setQty(item.name, -1)} className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">−</button>
                    <span className="w-4 text-center text-sm font-bold">{cart[item.name]}</span>
                    <button type="button" onClick={() => setQty(item.name, 1)} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9bc23c] text-sm font-bold text-[#0d2414]">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-lg font-extrabold text-[#0d2414]">ETB {totalPrice.toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={placeOrder}
                disabled={ordering}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#9bc23c] py-3 text-sm font-bold text-[#0d2414] shadow transition hover:bg-[#b4d655] disabled:opacity-50"
              >
                {ordering && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d2414]/20 border-t-[#0d2414]" />}
                {ordering ? 'Placing order...' : 'Place Order'}
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
  { label: 'Extra Pillow', emoji: '🛏️', msg: 'I need an extra pillow please' },
  { label: 'Soft Towels', emoji: '🧺', msg: 'Please bring soft towels to my room' },
  { label: 'Shampoo', emoji: '🧴', msg: 'I need shampoo in my room' },
  { label: 'Conditioner', emoji: '💆', msg: 'Please bring hair conditioner' },
  { label: 'Toilet Paper', emoji: '🧻', msg: 'I need toilet paper please' },
  { label: 'Room Cleaning', emoji: '🧹', msg: 'Please clean my room' },
  { label: 'Toothbrush Kit', emoji: '🪥', msg: 'I need a toothbrush kit' },
  { label: 'Extra Blanket', emoji: '🛋️', msg: 'Please bring an extra blanket' },
];

function GuestServicesPage({ user, onRequestSent }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sendRequest = async (message) => {
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
    } catch {
      // still record locally
    } finally {
      onRequestSent({ type: 'service', message: text, time: new Date().toISOString() });
      setSending(false);
      setSent(true);
      setInput('');
      setTimeout(() => setSent(false), 2500);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRequest(); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9f2' }}>
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Greeting */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0d2414] text-3xl shadow-lg mb-4">
            🌿
          </div>
          <h1 className="text-2xl font-bold text-[#0d2414]">
            {getGreeting()}, {user?.name}
          </h1>
          <p className="mt-2 text-gray-500">What can we help you with today?</p>
        </div>

        {/* Input area */}
        <div className="rounded-2xl border border-[#9bc23c]/30 bg-white p-5 shadow-sm mb-6">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={3}
              placeholder="Type your request here… (e.g. I need extra towels, please clean my room)"
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#9bc23c] focus:ring-2 focus:ring-[#9bc23c]/20 placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => sendRequest()}
              disabled={!input.trim() || sending}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0d2414] text-white shadow transition hover:bg-[#1a4a22] disabled:opacity-40"
            >
              {sending
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                : <svg className="h-5 w-5 rotate-90" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              }
            </button>
          </div>
          {sent && (
            <p className="mt-2 text-xs text-[#2d7a3a] font-medium flex items-center gap-1">
              <span>✓</span> Request sent successfully
            </p>
          )}
        </div>

        {/* Quick requests */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Requests</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_REQUESTS.map((req) => (
              <button
                key={req.label}
                type="button"
                onClick={() => sendRequest(req.msg)}
                disabled={sending}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#9bc23c]/40 hover:shadow-md disabled:opacity-50"
              >
                <span className="text-2xl">{req.emoji}</span>
                <span className="text-xs font-semibold text-[#0d2414] leading-tight">{req.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Requests Page ────────────────────────────────────────────────────────────

function RequestsPage({ requests, onDelete }) {
  const [loading, setLoading] = useState(false);

  const typeLabel = (r) => {
    if (r.type === 'food') return { label: 'Food Order', color: 'bg-amber-50 border-amber-200 text-amber-700', emoji: '🍽️' };
    return { label: 'Guest Service', color: 'bg-[#9bc23c]/10 border-[#9bc23c]/30 text-[#2d5c10]', emoji: '🛎️' };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9f2' }}>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0d2414]">My Requests</h1>
            <p className="text-xs text-gray-400 mt-0.5">{requests.length} request{requests.length !== 1 ? 's' : ''} submitted</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#9bc23c]/40 bg-white py-20 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="font-semibold text-gray-600">No requests yet</p>
            <p className="mt-1 text-sm text-gray-400">Your food orders and service requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req, i) => {
              const t = typeLabel(req);
              return (
                <div key={req.id || i} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-xl">
                    {t.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${t.color}`}>
                        {t.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {req.time ? new Date(req.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{req.message}</p>
                    {req.items && (
                      <p className="mt-1 text-xs text-gray-400">
                        {req.items.map((it) => `${it.qty}x ${it.name}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(req.id || i)}
                    className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-400"
                    aria-label="Delete request"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payments Page ────────────────────────────────────────────────────────────

function PaymentsPage({ user, foodOrders }) {
  const checkInDate = user?.checkInDate ? new Date(user.checkInDate) : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const today = new Date();
  const daysStayed = Math.max(1, Math.ceil((today - checkInDate) / (1000 * 60 * 60 * 24)));

  const ROOM_RATE = 3500; // ETB per night
  const roomTotal = daysStayed * ROOM_RATE;

  const foodTotal = foodOrders.reduce((sum, order) => {
    if (order.items) return sum + order.items.reduce((s, i) => s + i.price * i.qty, 0);
    return sum;
  }, 0);

  const grandTotal = roomTotal + foodTotal;

  const lineItems = [
    { label: `Room (${daysStayed} night${daysStayed !== 1 ? 's' : ''} × ETB ${ROOM_RATE.toLocaleString()})`, amount: roomTotal, icon: '🏨' },
    ...foodOrders.flatMap((order) =>
      order.items
        ? order.items.map((item) => ({
            label: `${item.name} × ${item.qty}`,
            amount: item.price * item.qty,
            icon: '🍽️',
          }))
        : []
    ),
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f9f2' }}>
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header card */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-6" style={{ background: 'linear-gradient(135deg, #0d2414 0%, #1a4a22 100%)' }}>
          <div className="px-6 py-8">
            <div className="flex items-center gap-4 mb-6">
              <img src="/kuriftulogo.jpg" alt="Kuriftu" className="h-12 w-12 rounded-xl object-cover" />
              <div>
                <p className="text-white font-bold text-lg">Kuriftu Resort</p>
                <p className="text-white/50 text-xs">Guest Invoice</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Guest', value: user?.name || '—' },
                { label: 'Room', value: user?.roomNumber || '—' },
                { label: 'Nights', value: daysStayed },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-white/40 text-xs mb-1">{s.label}</p>
                  <p className="text-white font-bold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Total banner */}
          <div className="bg-[#9bc23c] px-6 py-4 flex items-center justify-between">
            <p className="font-bold text-[#0d2414]">Total Amount Due</p>
            <p className="text-2xl font-extrabold text-[#0d2414]">ETB {grandTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#0d2414]">Itemized Bill</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {lineItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-[#0d2414]">ETB {item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-[#9bc23c]/30 px-5 py-4 flex items-center justify-between bg-[#f7f9f2]">
            <span className="font-bold text-[#0d2414]">Grand Total</span>
            <span className="text-xl font-extrabold text-[#1d5c28]">ETB {grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Stay summary */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">Check-in</p>
            <p className="font-bold text-[#0d2414]">
              {checkInDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">Check-out</p>
            <p className="font-bold text-[#0d2414]">
              {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Thank you for staying at Kuriftu Resort · Please visit the front desk for checkout
        </p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [cart, setCart] = useState({});
  const [requests, setRequests] = useState([]);
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };

  const handleOrderPlaced = (items) => {
    const order = {
      id: Date.now(),
      type: 'food',
      message: `Food order: ${items.map((i) => `${i.qty}x ${i.name}`).join(', ')}`,
      items,
      time: new Date().toISOString(),
    };
    setRequests((p) => [order, ...p]);
    pushToast('Order placed successfully!');
    setActivePage('requests');
  };

  const handleRequestSent = (req) => {
    setRequests((p) => [{ id: Date.now(), ...req }, ...p]);
    pushToast('Request sent!');
  };

  const handleDeleteRequest = (id) => {
    setRequests((p) => p.filter((r) => (r.id || r) !== id));
  };

  const handleLogout = () => { logout?.(); window.location.href = '/login'; };

  const foodOrders = requests.filter((r) => r.type === 'food');

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f7f9f2' }}>
      <Navbar active={activePage} onNav={setActivePage} user={user} onLogout={handleLogout} />

      <div key={activePage}>
        {activePage === 'home'     && <HomePage user={user} onNav={setActivePage} />}
        {activePage === 'food'     && <FoodPage user={user} cart={cart} setCart={setCart} onOrderPlaced={handleOrderPlaced} />}
        {activePage === 'services' && <GuestServicesPage user={user} onRequestSent={handleRequestSent} />}
        {activePage === 'requests' && <RequestsPage requests={requests} onDelete={handleDeleteRequest} />}
        {activePage === 'payments' && <PaymentsPage user={user} foodOrders={foodOrders} />}
      </div>

      <Toast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
