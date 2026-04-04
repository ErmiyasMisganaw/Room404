import { useState } from 'react';

// ── Icons ─────────────────────────────────────────────────────────────────────

const Icon = {
  home: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  tasks: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  inbox: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>,
  analytics: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  orders: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  menu: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  grid: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  userPlus: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  search: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  chat: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  queue: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  wrench: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  logout: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  hamburger: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>,
  close: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
};

export { Icon };

// ── Role config ───────────────────────────────────────────────────────────────

const roleMeta = {
  customer:     { label: 'Guest',        accent: '#d4186e',  bg: 'rgba(212,24,110,0.12)' },
  cleaner:      { label: 'Housekeeping', accent: '#9bc23c',  bg: 'rgba(155,194,60,0.12)' },
  maintenance:  { label: 'Maintenance',  accent: '#c9b44a',  bg: 'rgba(201,180,74,0.12)' },
  cafeteria:    { label: 'Cafeteria',    accent: '#c4845a',  bg: 'rgba(196,132,90,0.12)' },
  receptionist: { label: 'Reception',    accent: '#9bc23c',  bg: 'rgba(155,194,60,0.12)' },
  manager:      { label: 'Manager',      accent: '#6366f1',  bg: 'rgba(99,102,241,0.12)' },
};

// ── Sidebar ───────────────────────────────────────────────────────────────────

export default function Sidebar({ navItems, activeSection, onSectionChange, user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = roleMeta[user?.role] || { label: user?.role || 'Staff', accent: '#9bc23c', bg: 'rgba(155,194,60,0.12)' };

  const handleNav = (key) => { onSectionChange(key); setMobileOpen(false); };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile toggle */}
      <button type="button" onClick={() => setMobileOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition lg:hidden"
        style={{ backgroundColor: '#0d2414', color: '#fff' }}>
        {mobileOpen ? Icon.close : Icon.hamburger}
      </button>

      {/* Sidebar panel */}
      <aside className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`} style={{ backgroundColor: '#0d2414' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <img src="/kuriftulogo.jpg" alt="Kuriftu"
            className="h-10 w-10 rounded-xl object-cover shadow-md"
            style={{ outline: '2px solid rgba(155,194,60,0.4)', outlineOffset: 2 }} />
          <div>
            <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.06em' }}>
              KURIFTU
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: '#9bc23c' }}>
              Resort & Spa
            </p>
          </div>
        </div>

        {/* Role label */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Portal
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: meta.accent }}>
            {meta.label} Dashboard
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button key={item.key} type="button" onClick={() => handleNav(item.key)}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150"
                style={{
                  backgroundColor: isActive ? `${meta.accent}18` : 'transparent',
                  color: isActive ? meta.accent : 'rgba(255,255,255,0.5)',
                  borderLeft: isActive ? `3px solid ${meta.accent}` : '3px solid transparent',
                }}>
                <span style={{ color: isActive ? meta.accent : 'rgba(255,255,255,0.35)' }}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge != null && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: '#d4186e' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

        {/* User + logout */}
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold uppercase"
              style={{ backgroundColor: meta.bg, color: meta.accent }}>
              {(user?.name || 'U').charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'Staff'}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {user?.role === 'customer' ? `Room ${user?.roomNumber || '—'}` : meta.label}
              </p>
            </div>
          </div>

          <button type="button" onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition"
            style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e8429a'; e.currentTarget.style.borderColor = 'rgba(212,24,110,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
            {Icon.logout}
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
