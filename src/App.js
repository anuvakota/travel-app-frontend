import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

const theme = {
  bg: '#f8f7f4', surface: '#ffffff', surfaceHover: '#f0ede8',
  border: '#e0dbd2', accent: '#1a3a5c', accentDark: '#0f2540',
  accentLight: '#2563eb', text: '#1a1a1a', muted: '#888', soft: '#555',
};

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');`;

const globalStyle = `
  ${fonts}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${theme.bg}; color: ${theme.text}; font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${theme.bg}; }
  ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 2px; }
  select option { background: #fff; color: #1a1a1a; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .fade-up { animation: fadeUp 0.6s ease forwards; }
  .fade-in { animation: fadeIn 0.4s ease forwards; }
  .nav-link { color: ${theme.muted}; cursor: pointer; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase; transition: color 0.2s; text-decoration: none; background: none; border: none; font-family: 'DM Sans', sans-serif; }
  .nav-link:hover, .nav-link.active { color: ${theme.accent}; }
  .btn-primary { background: ${theme.accent}; color: #fff; border: none; padding: 0.75rem 1.75rem; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 0.9rem; border-radius: 6px; cursor: pointer; transition: background 0.2s, transform 0.1s; letter-spacing: 0.02em; }
  .btn-primary:hover { background: ${theme.accentDark}; transform: translateY(-1px); }
  .btn-outline { background: transparent; color: ${theme.accent}; border: 2px solid ${theme.accent}; padding: 0.75rem 1.75rem; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; border-radius: 6px; cursor: pointer; transition: background 0.2s, color 0.2s; }
  .btn-outline:hover { background: ${theme.accent}; color: #fff; }
  .card { background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: 12px; transition: box-shadow 0.2s, transform 0.2s; }
  .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
  .tab { background: none; border: none; color: ${theme.muted}; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; padding: 0.5rem 0; border-bottom: 2px solid transparent; transition: color 0.2s, border-color 0.2s; }
  .tab.active { color: ${theme.accent}; border-bottom-color: ${theme.accent}; }
  .tab:hover { color: ${theme.text}; }
  input, select { background: #fff; border: 1px solid ${theme.border}; color: ${theme.text}; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; padding: 0.75rem 1rem; border-radius: 6px; outline: none; transition: border-color 0.2s; width: 100%; }
  input:focus, select:focus { border-color: ${theme.accent}; }
  input::placeholder { color: ${theme.muted}; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.2s ease; }
  .modal { background: #fff; border-radius: 16px; padding: 2.5rem; width: 90%; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); animation: fadeUp 0.3s ease; }
  .chip { background: #fff; border: 1.5px solid ${theme.border}; color: ${theme.soft}; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .chip:hover, .chip.selected { background: ${theme.accent}; border-color: ${theme.accent}; color: #fff; }
  .search-chip { background: ${theme.surface}; border: 1px solid ${theme.border}; color: ${theme.soft}; padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
  .search-chip:hover { border-color: ${theme.accent}; color: ${theme.accent}; }
  .search-chip.active { background: ${theme.accent}; border-color: ${theme.accent}; color: #fff; }
`;

// ─── AUTH CONTEXT ────────────────────────────────────────
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('globr_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('globr_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const r = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('globr_token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (email, password, name) => {
    const r = await axios.post(`${API}/auth/register`, { email, password, name });
    localStorage.setItem('globr_token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } }); } catch {}
    localStorage.removeItem('globr_token');
    setToken(null);
    setUser(null);
  };

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// ─── AUTH MODAL ──────────────────────────────────────────
function AuthModal({ onClose, defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(form.email, form.password, form.name);
      }
      onClose();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: theme.accent }}>
              {mode === 'login' ? 'Welcome back.' : 'Create account.'}
            </h2>
            <p style={{ color: theme.muted, fontSize: '0.83rem', marginTop: 3 }}>
              {mode === 'login' ? 'Sign in to access your trips & saved places.' : 'Your trips and plans will be saved to your account.'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: theme.muted, cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '0.75rem', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Full Name</label>
              <input value={form.name} onChange={set('name')} placeholder="Your name" onKeyDown={handleKey} autoFocus />
            </div>
          )}
          <div>
            <label style={{ fontSize: '0.75rem', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" onKeyDown={handleKey} autoFocus={mode === 'login'} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'} onKeyDown={handleKey} />
          </div>
        </div>
        {error && (
          <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.83rem', color: '#c0392b' }}>
            {error}
          </div>
        )}
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', marginTop: '1.25rem', padding: '0.85rem', fontSize: '0.95rem', opacity: loading ? 0.7 : 1 }}>
          {loading ? '…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
        </button>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.83rem', color: theme.muted }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '0.83rem', fontFamily: 'DM Sans, sans-serif', textDecoration: 'underline', padding: 0 }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── ACCOUNT DROPDOWN ────────────────────────────────────
function AccountDropdown({ onClose, setPage }) {
  const { user, logout } = useAuth();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleLogout = async () => { await logout(); onClose(); };
  const go = (page) => { setPage(page); onClose(); };
  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <div ref={ref} style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: '#fff', border: `1px solid ${theme.border}`, borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', minWidth: 220, zIndex: 200, animation: 'slideUp 0.15s ease', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: theme.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>{initial}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: '0.9rem', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
          <div style={{ fontSize: '0.75rem', color: theme.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
        </div>
      </div>
      {[{ label: '✦ My Trips', page: 'mytrips' }, { label: '🗺 Plan a Trip', page: 'plan' }, { label: '👥 Friends', page: 'friends' }].map(item => (
        <button key={item.page} onClick={() => go(item.page)}
          style={{ width: '100%', padding: '0.7rem 1.25rem', background: 'none', border: 'none', textAlign: 'left', color: theme.soft, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'background 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.background = theme.bg}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          {item.label}
        </button>
      ))}
      <div style={{ height: 1, background: theme.border }} />
      <button onClick={handleLogout}
        style={{ width: '100%', padding: '0.7rem 1.25rem', background: 'none', border: 'none', textAlign: 'left', color: '#c0392b', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'background 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        Sign Out
      </button>
    </div>
  );
}

// ─── NAV ────────────────────────────────────────────────
function Nav({ page, setPage }) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const initial = user?.name?.[0]?.toUpperCase() || '';

  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 3rem', background: 'rgba(248,247,244,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${theme.border}`, zIndex: 50 }}>
        <span onClick={() => setPage('home')} style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontStyle: 'italic', cursor: 'pointer', color: theme.accent }}>Globr.</span>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {['explore', 'plan', 'mytrips', 'friends'].map(p => (
            <button key={p} className={`nav-link ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
              {p === 'mytrips' ? 'My Trips' : p === 'friends' ? 'Friends' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <div style={{ position: 'relative' }}>
            {user ? (
              <button onClick={() => setShowDropdown(d => !d)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: `1.5px solid ${theme.border}`, borderRadius: 24, padding: '0.35rem 0.75rem 0.35rem 0.4rem', cursor: 'pointer', transition: 'border-color 0.2s', fontFamily: 'DM Sans, sans-serif' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: theme.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{initial}</div>
                <span style={{ fontSize: '0.82rem', color: theme.soft }}>{user.name.split(' ')[0]}</span>
                <span style={{ fontSize: '0.65rem', color: theme.muted }}>▾</span>
              </button>
            ) : (
              <button onClick={() => setShowAuth(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: theme.accent, border: 'none', borderRadius: 20, padding: '0.45rem 1.1rem', cursor: 'pointer', color: '#fff', fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, letterSpacing: '0.03em', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = theme.accentDark}
                onMouseLeave={e => e.currentTarget.style.background = theme.accent}>
                Sign In
              </button>
            )}
            {showDropdown && <AccountDropdown onClose={() => setShowDropdown(false)} setPage={setPage} />}
          </div>
        </div>
      </nav>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}

// ─── PLACES AUTOCOMPLETE INPUT ──────────────────────────
function PlacesAutocompleteInput({ value, onChange, placeholder, onKeyDown, style }) {
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!value || value.length < 2) { setSuggestions([]); setShow(false); return; }
    debounceRef.current = setTimeout(() => {
      if (!window.google?.maps?.places) return;
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions({ input: value, types: ['(cities)'] }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions); setShow(true); setHighlighted(-1);
        } else { setSuggestions([]); setShow(false); }
      });
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (prediction) => {
    const cityName = prediction.structured_formatting?.main_text || prediction.description.split(',')[0];
    const secondary = prediction.structured_formatting?.secondary_text || '';
    const fullName = secondary ? `${cityName}, ${secondary.split(',')[0].trim()}` : cityName;
    onChange({ target: { value: fullName } });
    setSuggestions([]);
    setShow(false);
  };

  const handleKeyDown = (e) => {
    if (show && suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); return; }
      if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); select(suggestions[highlighted]); return; }
      if (e.key === 'Escape') { setShow(false); return; }
    }
    onKeyDown?.(e);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={inputRef}>
      <input value={value} onChange={onChange} placeholder={placeholder} onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShow(true)} style={style} autoComplete="off" />
      {show && suggestions.length > 0 && (
        <div ref={dropdownRef} style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: `1px solid ${theme.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'hidden', animation: 'slideUp 0.15s ease' }}>
          {suggestions.map((p, i) => (
            <div key={p.place_id} onMouseDown={(e) => { e.preventDefault(); select(p); }}
              style={{ padding: '0.65rem 1rem', cursor: 'pointer', background: highlighted === i ? theme.bg : '#fff', borderBottom: i < suggestions.length - 1 ? `1px solid ${theme.border}` : 'none', transition: 'background 0.1s' }}
              onMouseEnter={() => setHighlighted(i)}>
              <div style={{ fontSize: '0.9rem', color: theme.text, fontWeight: highlighted === i ? 500 : 400 }}>📍 {p.structured_formatting?.main_text || p.description.split(',')[0]}</div>
              <div style={{ fontSize: '0.75rem', color: theme.muted, marginTop: 1 }}>{p.structured_formatting?.secondary_text || ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HOME ────────────────────────────────────────────────
function HomePage({ setPage }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ height: '100vh', background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%), url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80) center/cover no-repeat', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '0 4rem', position: 'relative' }}>
        <div className="fade-up" style={{ maxWidth: 680 }}>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Your travel companion</p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2.8rem, 6vw, 5rem)', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 700, color: '#fff' }}>Plan your next<br /><span style={{ fontStyle: 'italic' }}>adventure.</span></h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: 460, lineHeight: 1.7 }}>Discover destinations, plan trips, and rank your experiences.</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => setPage('plan')} style={{ background: '#fff', color: theme.accent, border: 'none', padding: '1rem 2.5rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '1rem', borderRadius: '6px', cursor: 'pointer' }}>Plan a Trip</button>
            <button onClick={() => setPage('explore')} style={{ background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.7)', padding: '1rem 2.5rem', fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', borderRadius: '6px', cursor: 'pointer' }}>Need to Explore →</button>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>scroll to explore</div>
      </div>
      <ScrollSection
        eyebrow="Need help planning a trip?"
        heading={<>Globr will plan your <span style={{ fontStyle: 'italic' }}>whole trip.</span></>}
        body="Search destinations and organize everything day by day — flights, food, activities, all in one place."
        ctaLabel="Start Planning →"
        onClick={() => setPage('plan')}
        bg={theme.bg}
        accent={theme.accent}
      />

      <ScrollSection
        eyebrow="Already have a place in mind?"
        heading={<>Jump straight to <span style={{ fontStyle: 'italic' }}>exploring.</span></>}
        body="Not sure where to go? Answer a few questions and we'll find the perfect destination for you."
        ctaLabel="Explore Destinations →"
        onClick={() => setPage('explore')}
        bg={theme.surface}
        accent={theme.accent}
      />

      <ScrollSection
        eyebrow="Back from your trip?"
        heading={<>Rate it, or use your <span style={{ fontStyle: 'italic' }}>friends' ratings.</span></>}
        body="Rank your experiences with our ELO system — and let your friends' rankings help shape your next itinerary."
        ctaLabel="See My Trips →"
        onClick={() => setPage('mytrips')}
        bg={theme.bg}
        accent={theme.accent}
      />
    </div>
  );
}

// ─── SCROLL REVEAL SECTION ───────────────────────────────
function ScrollSection({ eyebrow, heading, body, ctaLabel, onClick, bg, accent }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: '90vh', background: bg, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{
        maxWidth: 640,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>
        <p style={{ color: accent, fontSize: '0.85rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>{eyebrow}</p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.15, color: theme.text, marginBottom: '1.5rem' }}>{heading}</h2>
        <p style={{ color: theme.soft, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>{body}</p>
        <button className="btn-primary" onClick={onClick} style={{ padding: '0.9rem 2.25rem', fontSize: '1rem' }}>{ctaLabel}</button>
      </div>
    </div>
  );
}

// ─── EXPLORE PAGE ─────────────────────────────────────────
function ExplorePage({ setPage, setPrefillCity }) {
  const [hometown, setHometown] = useState('');
  const [hometownConfirmed, setHometownConfirmed] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ season: '', duration: '', distance: '' });
  const [destinations, setDestinations] = useState([]);
  const [loadingDests, setLoadingDests] = useState(false);
  const [destError, setDestError] = useState(null);

  const distanceOptions = [
    { key: 'nearby', label: `Nearby (< 2hrs from ${hometown || 'home'})` },
    { key: 'domestic', label: `Within my country` },
    { key: 'international', label: 'International' },
    { key: 'anywhere', label: 'Anywhere in the world' },
  ];

  const questions = [
    { key: 'season', q: 'When are you looking to travel?', options: ['Winter (Dec–Feb)', 'Spring (Mar–May)', 'Summer (Jun–Aug)', 'Fall (Sep–Nov)', 'Flexible'] },
    { key: 'duration', q: 'How long is the trip?', options: ['Weekend (2–3 days)', 'Short (4–6 days)', '1 Week', '2 Weeks', '1 Month+'] },
    { key: 'distance', q: `How far from ${hometown || 'home'} are you willing to travel?`, options: distanceOptions.map(d => d.label) },
  ];

  const getSuggestions = async () => {
    const distKey = distanceOptions.find(d => d.label === answers.distance)?.key || 'anywhere';
    setStep(3); setLoadingDests(true); setDestError(null);
    try {
      const res = await axios.get(`${API}/destinations`, { params: { hometown, distance: distKey, season: answers.season, duration: answers.duration } });
      setDestinations(res.data.destinations || []);
    } catch { setDestError('Could not load destinations. Please try again.'); }
    finally { setLoadingDests(false); }
  };

  const q = questions[step];
  return (
    <div style={{ minHeight: '100vh', padding: '8rem 3rem 4rem', maxWidth: 700, margin: '0 auto' }}>
      <div className="fade-up">
        <p style={{ color: theme.accent, fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>Explore</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', marginBottom: '0.5rem' }}>Find your next<br /><span style={{ fontStyle: 'italic' }}>destination.</span></h1>
        <p style={{ color: theme.soft, marginBottom: '3rem' }}>Answer a few questions and we'll find the perfect fit.</p>
        {!hometownConfirmed ? (
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', fontWeight: 400 }}>First, where are you based?</h2>
            <p style={{ color: theme.muted, fontSize: '0.85rem', marginBottom: '1.5rem' }}>This helps us figure out what's nearby, domestic, and international for you.</p>
            <div style={{ display: 'flex', gap: '1rem', maxWidth: 420 }}>
              <PlacesAutocompleteInput value={hometown} onChange={e => setHometown(e.target.value)} placeholder="Your city or town" onKeyDown={e => e.key === 'Enter' && hometown && setHometownConfirmed(true)} />
              <button className="btn-primary" disabled={!hometown} onClick={() => setHometownConfirmed(true)} style={{ opacity: hometown ? 1 : 0.4, whiteSpace: 'nowrap' }}>Got it →</button>
            </div>
          </div>
        ) : step < 3 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <span style={{ color: theme.muted, fontSize: '0.8rem' }}>From:</span>
              <span style={{ background: theme.surface, border: `1px solid ${theme.border}`, padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', color: theme.soft }}>{hometown}</span>
              <button onClick={() => { setHometownConfirmed(false); setStep(0); setAnswers({ season: '', duration: '', distance: '' }); }} style={{ background: 'none', border: 'none', color: theme.muted, cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>change</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>{questions.map((_, i) => <div key={i} style={{ height: 2, flex: 1, background: i <= step ? theme.accent : theme.border, borderRadius: 1, transition: 'background 0.3s' }} />)}</div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: 400 }}>{q.q}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2.5rem' }}>
              {q.options.map(opt => <button key={opt} className={`chip ${answers[q.key] === opt ? 'selected' : ''}`} onClick={() => setAnswers({ ...answers, [q.key]: opt })}>{opt}</button>)}
            </div>
            <button className="btn-primary" disabled={!answers[q.key]} onClick={() => step < 2 ? setStep(step + 1) : getSuggestions()} style={{ opacity: answers[q.key] ? 1 : 0.4 }}>{step < 2 ? 'Next →' : 'Find Destinations →'}</button>
          </div>
        ) : (
          <div className="fade-up">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 400 }}>Perfect picks for you ✦</h2>
            <p style={{ color: theme.muted, fontSize: '0.85rem', marginBottom: '1.5rem' }}>Based on your location in {hometown} · {answers.season} · {answers.duration}</p>
            {loadingDests && <div style={{ color: theme.muted, fontSize: '0.9rem', animation: 'pulse 1.5s infinite' }}>Finding destinations…</div>}
            {destError && <div style={{ color: '#c0392b', fontSize: '0.9rem' }}>{destError}</div>}
            {!loadingDests && !destError && destinations.length === 0 && <div style={{ color: theme.muted, fontSize: '0.9rem' }}>No destinations found. Try different preferences.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {destinations.map((dest, i) => (
                <div key={dest.city} className="card" onClick={() => { setPrefillCity(dest.city); setPage('plan'); }}
                  style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animationDelay: `${i * 0.08}s` }}>
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{dest.city}</span>
                      {dest.country && dest.country !== dest.city && <span style={{ fontSize: '0.8rem', color: theme.muted }}>{dest.country}</span>}
                    </div>
                    {dest.weather && <div style={{ fontSize: '0.78rem', color: theme.accent, marginBottom: '0.2rem' }}>🌤 {dest.weather}</div>}
                    {dest.reason && <div style={{ fontSize: '0.8rem', color: theme.soft, lineHeight: 1.5 }}>{dest.reason}</div>}
                  </div>
                  <span style={{ color: theme.accent, fontSize: '1.2rem', flexShrink: 0 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SEARCH PANEL ────────────────────────────────────────
const TYPE_ICON = { cafe: '☕', restaurant: '🍽️', bakery: '🥐', activity: '📍', hotel: '🏨', other: '📌' };
// Filters shown depend on which big tab is active
const FILTERS_BY_TAB = {
  activities: [
    { value: 'all', label: 'All' },
    { value: 'museums', label: '🏛️ Museums' },
    { value: 'thrilling', label: '🎢 Thrilling' },
    { value: 'sightseeing', label: '📸 Sightseeing' },
    { value: 'nature', label: '🥾 Hiking & Nature' },
  ],
  food: [
    { value: 'all', label: 'All' },
    { value: 'cafe', label: '☕ Café' },
    { value: 'restaurant', label: '🍽️ Restaurant' },
    { value: 'bakery', label: '🥐 Bakery' },
    { value: 'dinein', label: '🍷 Dine-in' },
    { value: 'fastfood', label: '🍔 Fast Food' },
  ],
  hotels: [
    { value: 'all', label: 'All' },
    { value: 'luxury', label: '✨ Luxury' },
    { value: 'budget', label: '💰 Budget' },
    { value: 'boutique', label: '🏨 Boutique' },
  ],
};
const TYPE_KEYWORDS = {
  cafe: ['cafe', 'coffee', 'espresso', 'tea'],
  restaurant: ['restaurant', 'kitchen', 'dining', 'bistro', 'brasserie', 'grill', 'tavern', 'eatery'],
  bakery: ['bakery', 'pastry', 'patisserie', 'bread'],
  activity: ['museum', 'park', 'attraction', 'tour', 'gallery', 'zoo', 'aquarium'],
  hotel: ['hotel', 'inn', 'resort', 'lodge', 'hostel', 'motel', 'suites'],
};

function inferType(item) {
  const name = (item.name || '').toLowerCase();
  for (const [type, kws] of Object.entries(TYPE_KEYWORDS)) {
    if (kws.some(k => name.includes(k))) return type;
  }
  return 'other';
}

function PlaceSearchPanel({ data, loading: parentLoading, mode, saved, setSaved, itinerary, setItinerary, selectedDay, activeTab, city }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [liveResults, setLiveResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const debounceRef = useRef(null);

  const getCategory = () => {
    if (['hotel', 'luxury', 'budget', 'boutique'].includes(typeFilter)) return 'lodging';
    if (['restaurant', 'cafe', 'bakery', 'dinein', 'fastfood'].includes(typeFilter)) return 'restaurant';
    if (['activity', 'museums', 'thrilling', 'sightseeing', 'nature'].includes(typeFilter)) return 'tourist_attraction';
    if (activeTab === 'food') return 'restaurant';
    if (activeTab === 'hotels') return 'lodging';
    return 'tourist_attraction';
  };

  // Reset the chip filter back to "All" whenever the big tab changes,
  // since a food filter wouldn't make sense on the activities tab.
  useEffect(() => { setTypeFilter('all'); }, [activeTab]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const typed = query.trim();
    // When a type chip is active but nothing is typed, use an implicit query
    // so the backend returns a FULL list for that category (e.g. all cafés).
    const implicitByType = {
      // activities
      museums: 'museums and galleries',
      thrilling: 'adventure thrill activities zip line kayaking water sports',
      sightseeing: 'sightseeing landmarks scenic attractions',
      nature: 'hiking trails nature parks scenic outdoors',
      // food
      cafe: 'cafe coffee shop',
      restaurant: 'restaurant',
      bakery: 'bakery',
      dinein: 'sit down restaurant fine dining',
      fastfood: 'fast food',
      // hotels
      luxury: 'luxury hotels',
      budget: 'budget affordable hotels',
      boutique: 'boutique hotels',
      // legacy
      activity: 'things to do', hotel: 'hotel',
    };
    const effective = typed.length >= 2 ? typed : (typeFilter !== 'all' ? implicitByType[typeFilter] : '');
    if (!effective) { setLiveResults(null); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`${API}/activities`, { params: { city, category: getCategory(), min_rating: 0, query: effective } });
        const all = res.data.activities || [];
        if (typed.length >= 2) {
          const q = typed.toLowerCase();
          const matched = all.filter(item => (item.name || '').toLowerCase().includes(q) || (item.address || '').toLowerCase().includes(q));
          setLiveResults(matched.length > 0 ? matched : all);
        } else {
          // Chip-driven fetch: show the whole category list, no name-narrowing
          setLiveResults(all);
        }
      } catch { setLiveResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, activeTab, typeFilter, city]);

  const loading = parentLoading || searching;

  const results = (() => {
    let base = liveResults !== null ? liveResults : data;
    // Only narrow the generic pre-loaded list; chip fetches are already category-specific
    if (liveResults === null && !query.trim() && typeFilter !== 'all') {
      const kws = TYPE_KEYWORDS[typeFilter] || [];
      const narrowed = base.filter(item => kws.some(k => (item.name || '').toLowerCase().includes(k) || (item.address || '').toLowerCase().includes(k)));
      if (narrowed.length >= 2) base = narrowed;
    }
    return [...base].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  })();

  const isAdded = (item) => {
    if (mode === 'itinerary') return !!(selectedDay && itinerary[selectedDay]?.find(p => p.name === item.name));
    return !!saved.find(s => s.name === item.name);
  };

  const handleToggle = (item) => {
    if (mode === 'itinerary') {
      if (!selectedDay) return;
      setItinerary(prev => {
        const already = prev[selectedDay]?.find(p => p.name === item.name);
        if (already) return { ...prev, [selectedDay]: prev[selectedDay].filter(p => p.name !== item.name) };
        return { ...prev, [selectedDay]: [...(prev[selectedDay] || []), item] };
      });
    } else {
      setSaved(prev => prev.find(s => s.name === item.name) ? prev.filter(s => s.name !== item.name) : [...prev, item]);
    }
  };

  const handleRemove = (name) => {
    if (mode === 'itinerary') setItinerary(prev => ({ ...prev, [selectedDay]: prev[selectedDay].filter(p => p.name !== name) }));
    else setSaved(prev => prev.filter(s => s.name !== name));
  };

  const trayItems = mode === 'itinerary' ? (itinerary[selectedDay] || []) : saved;

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: theme.muted, fontSize: 13, pointerEvents: 'none' }}>🔍</span>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${activeTab}…`}
          style={{ paddingLeft: 32, paddingRight: query ? 32 : 12, fontSize: '0.88rem', borderRadius: 8, padding: '0.6rem 1rem 0.6rem 32px' }} />
        {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: theme.muted, padding: 0, lineHeight: 1 }}>×</button>}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {(FILTERS_BY_TAB[activeTab] || FILTERS_BY_TAB.activities).map(f => (
          <button key={f.value} className={`search-chip ${typeFilter === f.value ? 'active' : ''}`}
            onClick={() => setTypeFilter(typeFilter === f.value ? 'all' : f.value)}>{f.label}</button>
        ))}
      </div>
      <p style={{ fontSize: '0.72rem', color: theme.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
        {loading ? 'Loading…' : query ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"` : `${results.length} places · ranked by rating`}
        {mode === 'itinerary' && !selectedDay && <span style={{ color: theme.accent, marginLeft: 8 }}>← select a day to add</span>}
      </p>
      {loading ? (
        <div style={{ color: theme.muted, padding: '1rem 0', animation: 'pulse 1.5s infinite' }}>Loading places...</div>
      ) : results.length === 0 ? (
        <div style={{ color: theme.muted, padding: '1.5rem 0', textAlign: 'center', fontSize: '0.9rem' }}>No places found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
          {results.map((item, i) => {
            const added = isAdded(item);
            const top3 = i < 3;
            const typeKey = inferType(item);
            const categoryTag = activeTab === 'food' ? 'restaurant' : activeTab === 'hotels' ? 'lodging' : 'tourist_attraction';
            return (
              <div key={item.name + i} onClick={() => setSelectedPlace({ ...item, _category: categoryTag })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: theme.surface, border: `1px solid ${added ? theme.accent : theme.border}`, borderRadius: 8, transition: 'border-color 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: top3 ? theme.accent : theme.bg, color: top3 ? '#fff' : theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 20, border: `1px solid ${theme.border}`, color: theme.muted, flexShrink: 0 }}>{TYPE_ICON[typeKey]} {typeKey}</span>
                  </div>
                  <span style={{ fontSize: 11, color: theme.muted }}>⭐ {item.rating}{item.price_level != null ? ` · ${'$'.repeat(item.price_level)}` : ''} · {item.address}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); handleToggle(item); }} disabled={mode === 'itinerary' && !selectedDay}
                  style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, border: `1px solid ${added ? theme.accent : theme.border}`, background: added ? theme.accent : theme.surface, color: added ? '#fff' : theme.muted, cursor: mode === 'itinerary' && !selectedDay ? 'not-allowed' : 'pointer', fontSize: added ? 12 : 17, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', opacity: mode === 'itinerary' && !selectedDay ? 0.4 : 1 }}>
                  {added ? '✓' : '+'}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {trayItems.length > 0 && (
        <div style={{ marginTop: '0.9rem', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: '10px 12px', animation: 'slideUp 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: theme.text }}>{mode === 'itinerary' ? `${selectedDay} · added` : 'Saved places'}</span>
            <span style={{ fontSize: 11, color: theme.muted }}>{trayItems.length} place{trayItems.length !== 1 ? 's' : ''}</span>
          </div>
          {trayItems.map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '3px 0' }}>
              <span style={{ color: theme.muted }}>{TYPE_ICON[inferType(p)]}</span>
              <span style={{ fontWeight: 500, color: theme.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: theme.muted }}>⭐ {p.rating}</span>
              <button onClick={() => handleRemove(p.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.muted, fontSize: 15, padding: '0 0 0 4px', lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}
      {selectedPlace && (
        <PlaceDetailDrawer place={selectedPlace} city={city} onClose={() => setSelectedPlace(null)} onToggle={handleToggle} isAdded={isAdded(selectedPlace)} />
      )}
    </div>
  );
}

// ─── PLACE DETAIL DRAWER ────────────────────────────────
function PlaceDetailDrawer({ place, city, onClose, onToggle, isAdded }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!place) return;
    setLoading(true); setError(null); setDetails(null);
    axios.get(`${API}/place-details`, { params: { name: place.name, city, category: place._category || 'tourist_attraction' } })
      .then(r => setDetails(r.data))
      .catch(() => setError('Could not load details.'))
      .finally(() => setLoading(false));
  }, [place, city]);

  if (!place) return null;

  const PRICE_STARS = { 0: 'Free', 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
  const LINK_LABELS = { website: '🌐 Website', google_maps: '🗺 Google Maps', opentable: '🍽 OpenTable', yelp: '⭐ Yelp', booking_com: '🏨 Booking.com', tripadvisor: '✈ TripAdvisor', viator: '🎟 Viator' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, animation: 'fadeIn 0.2s ease' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, background: theme.surface, zIndex: 201, overflowY: 'auto', boxShadow: '-4px 0 40px rgba(0,0,0,0.12)', animation: 'slideInRight 0.25s ease' }}>
        {details?.photos?.[0] && (
          <div style={{ height: 200, background: `url(${details.photos[0]}) center/cover`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))' }} />
          </div>
        )}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1, paddingRight: '1rem' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: theme.text, marginBottom: 4 }}>{place.name}</h2>
              <p style={{ fontSize: '0.8rem', color: theme.muted }}>{place.address}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: theme.muted, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {place.rating && <span style={{ fontSize: 13, color: theme.text }}>⭐ {place.rating} <span style={{ color: theme.muted }}>({(place.total_ratings || 0).toLocaleString()} reviews)</span></span>}
            {place.price_level != null && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, border: `1px solid ${theme.border}`, color: theme.muted }}>{PRICE_STARS[place.price_level]}</span>}
            {details?.hours?.open_now != null && (
              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: details.hours.open_now ? '#eaf3de' : '#fcebeb', color: details.hours.open_now ? '#2a6030' : '#8a3020' }}>
                {details.hours.open_now ? 'Open now' : 'Closed'}
              </span>
            )}
          </div>
          <button onClick={() => onToggle(place)}
            style={{ width: '100%', padding: '0.7rem', marginBottom: '1.5rem', borderRadius: 8, border: `1.5px solid ${isAdded ? theme.accent : theme.border}`, background: isAdded ? theme.accent : 'transparent', color: isAdded ? '#fff' : theme.accent, fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
            {isAdded ? '✓ Added to itinerary' : '+ Add to itinerary'}
          </button>
          {loading && <div style={{ color: theme.muted, fontSize: '0.85rem', animation: 'pulse 1.5s infinite' }}>Loading details…</div>}
          {error && <div style={{ color: '#c0392b', fontSize: '0.85rem' }}>{error}</div>}
          {details && <>
            <Section title="About"><p style={{ fontSize: '0.88rem', color: theme.soft, lineHeight: 1.7 }}>{details.description}</p></Section>
            <Section title="Cost"><p style={{ fontSize: '0.88rem', color: theme.soft }}>{details.cost?.estimate}</p></Section>
            {details.hours?.weekday_text?.length > 0 && (
              <Section title="Hours">{details.hours.weekday_text.map((h, i) => <p key={i} style={{ fontSize: '0.82rem', color: theme.soft, lineHeight: 1.8 }}>{h}</p>)}</Section>
            )}
            {details.menu && (
              <Section title="Menu & Dining">
                {details.menu.features?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.75rem' }}>
                    {details.menu.features.map(f => <span key={f} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.soft }}>{f}</span>)}
                  </div>
                )}
                {details.menu.likely_menu_url && <a href={details.menu.likely_menu_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: theme.accent, textDecoration: 'none', display: 'block', marginBottom: 4 }}>🍴 View menu →</a>}
                {details.menu.yelp_menu && <a href={details.menu.yelp_menu} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: theme.accent, textDecoration: 'none' }}>⭐ Yelp menu →</a>}
              </Section>
            )}
            {Object.keys(details.links || {}).length > 0 && (
              <Section title="Book & Reserve">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(details.links).map(([key, url]) => (
                    <a key={key} href={url} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 0.9rem', borderRadius: 8, border: `1px solid ${theme.border}`, fontSize: '0.85rem', color: theme.text, textDecoration: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = theme.bg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {LINK_LABELS[key] || key}
                      <span style={{ marginLeft: 'auto', color: theme.muted, fontSize: 12 }}>↗</span>
                    </a>
                  ))}
                </div>
              </Section>
            )}
            {details.phone && <Section title="Contact"><p style={{ fontSize: '0.88rem', color: theme.soft }}>{details.phone}</p></Section>}
          </>}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.muted, marginBottom: '0.5rem' }}>{title}</p>
      {children}
      <div style={{ height: 1, background: theme.border, marginTop: '1rem' }} />
    </div>
  );
}

// ─── GOOGLE MAP WITH LABELED PINS ───────────────────────
function GoogleMapWithPins({ places, legs, apiKey, travelMode, loading }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  useEffect(() => {
    if (!window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true; script.defer = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else { initMap(); }
    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, []);

  useEffect(() => {
    if (window.google?.maps && mapInstanceRef.current) updateMarkersAndRoute();
  }, [places, legs, travelMode]);

  const initMap = () => {
    if (!mapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 10, center: { lat: 40.7128, lng: -74.006 },
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
    });
    mapInstanceRef.current = map;
    updateMarkersAndRoute();
  };

  const updateMarkersAndRoute = () => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    const geocoder = new window.google.maps.Geocoder();
    const bounds = new window.google.maps.LatLngBounds();
    const coords = [];
    places.forEach((place, i) => {
      const letter = LETTERS[i] || String(i + 1);
      geocoder.geocode({ address: place.address || place.name }, (results, status) => {
        if (status !== 'OK' || !results[0]) return;
        const pos = results[0].geometry.location;
        coords[i] = pos; bounds.extend(pos);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#1a3a5c"/><circle cx="18" cy="18" r="11" fill="white"/><text x="18" y="23" text-anchor="middle" font-family="'DM Sans',sans-serif" font-size="11" font-weight="700" fill="#1a3a5c">${letter}</text></svg>`;
        const marker = new window.google.maps.Marker({
          position: pos, map,
          icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new window.google.maps.Size(36, 44), anchor: new window.google.maps.Point(18, 44) },
          title: place.name, zIndex: i === 0 ? 100 : 50,
        });
        const iw = new window.google.maps.InfoWindow({ content: `<div style="font-family:'DM Sans',sans-serif;padding:4px 2px;max-width:200px"><div style="font-weight:600;font-size:13px;color:#1a3a5c;margin-bottom:2px">${letter}. ${place.name}</div><div style="font-size:11px;color:#888">${place.address || ''}</div></div>` });
        marker.addListener('click', () => iw.open(map, marker));
        markersRef.current[i] = marker;
        const filled = coords.filter(Boolean);
        if (filled.length === places.length) { map.fitBounds(bounds); drawRoute(map, filled, travelMode); }
      });
    });
  };

  const drawRoute = (map, coordsList, mode) => {
    if (coordsList.length < 2) return;
    const ds = new window.google.maps.DirectionsService();
    const dr = new window.google.maps.DirectionsRenderer({ map, suppressMarkers: true, polylineOptions: { strokeColor: '#1a3a5c', strokeWeight: 4, strokeOpacity: 0.85 } });
    const gmMode = mode === 'driving' ? window.google.maps.TravelMode.DRIVING : mode === 'transit' ? window.google.maps.TravelMode.TRANSIT : window.google.maps.TravelMode.WALKING;
    ds.route({ origin: coordsList[0], destination: coordsList[coordsList.length - 1], waypoints: coordsList.slice(1, -1).map(loc => ({ location: loc, stopover: true })), travelMode: gmMode, optimizeWaypoints: false },
      (result, status) => { if (status === 'OK') { dr.setDirections(result); polylineRef.current = dr; } });
  };

  return <div ref={mapRef} style={{ width: '100%', height: '100%', display: 'block', opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }} />;
}

// ─── MAP IT MODAL ────────────────────────────────────────
function MapItModal({ places, city, onClose }) {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [travelMode, setTravelMode] = useState('driving');
  const [orderedPlaces, setOrderedPlaces] = useState([]);
  const [mapKey, setMapKey] = useState(0);
  const dragIndex = useRef(null);
  const dragOverIndex = useRef(null);

  useEffect(() => {
    const flat = Array.isArray(places)
      ? places
      : Object.entries(places).sort(([a], [b]) => parseInt(a.replace('Day ', '')) - parseInt(b.replace('Day ', ''))).flatMap(([day, items]) => items.map(item => ({ ...item, _day: day })));
    setOrderedPlaces(flat);
  }, []);

  useEffect(() => {
    if (orderedPlaces.length < 2) { setLoading(false); return; }
    fetchRoute(travelMode, orderedPlaces);
  }, [travelMode, orderedPlaces]);

  const fetchRoute = async (mode, places) => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API}/route`, { params: { places: places.map(p => p.address || `${p.name}, ${city}`).join('|'), mode, city } });
      setRouteData(res.data); setMapKey(k => k + 1);
    } catch (e) {
      const detail = e?.response?.data?.detail || '';
      setRouteData({ legs: [], total_duration: 0, total_distance: 0, api_key: '' });
      setError(detail.includes('ZERO_RESULTS') ? `No ${mode} route found. Try driving or transit.` : 'Could not load route.');
      setMapKey(k => k + 1);
    } finally { setLoading(false); }
  };

  const onDragStart = (i) => { dragIndex.current = i; };
  const onDragEnter = (i) => { dragOverIndex.current = i; };
  const onDragEnd = () => {
    const from = dragIndex.current, to = dragOverIndex.current;
    if (from === null || to === null || from === to) return;
    const updated = [...orderedPlaces];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setOrderedPlaces(updated);
    dragIndex.current = null; dragOverIndex.current = null;
  };

  const MODES = [{ key: 'walking', icon: '🚶', label: 'Walk' }, { key: 'driving', icon: '🚗', label: 'Drive' }, { key: 'transit', icon: '🚇', label: 'Transit' }];
  const fmt = (secs) => { if (!secs) return '—'; const m = Math.round(secs / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`; };
  const fmtDist = (meters) => { if (!meters) return ''; return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`; };
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <>
      <style>{`.stop-card { transition: opacity 0.15s, transform 0.15s; } .stop-card[draggable]:hover .drag-handle { opacity: 1 !important; }`}</style>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, animation: 'fadeIn 0.2s ease' }} />
      <div style={{ position: 'fixed', inset: '2rem', background: theme.surface, zIndex: 301, borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'fadeUp 0.3s ease' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: theme.text }}>Your {city} Route 🗺</h2>
            <p style={{ color: theme.muted, fontSize: '0.8rem', marginTop: 2 }}>{orderedPlaces.length} stops{routeData?.total_duration ? ` · ${fmt(routeData.total_duration)} total · ${fmtDist(routeData.total_distance)}` : ''} <span style={{ marginLeft: 8, color: theme.border }}>· drag to reorder</span></p>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem', background: theme.bg, padding: '3px', borderRadius: 8, border: `1px solid ${theme.border}` }}>
            {MODES.map(m => <button key={m.key} onClick={() => setTravelMode(m.key)} style={{ padding: '0.3rem 0.75rem', borderRadius: 6, border: 'none', background: travelMode === m.key ? theme.accent : 'transparent', color: travelMode === m.key ? '#fff' : theme.muted, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>{m.icon} {m.label}</button>)}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: theme.muted, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: 310, flexShrink: 0, overflowY: 'auto', borderRight: `1px solid ${theme.border}`, padding: '1rem' }}>
            {error && <div style={{ color: '#c0392b', fontSize: '0.82rem', lineHeight: 1.6, padding: '0.5rem 0', marginBottom: '0.5rem' }}>{error}</div>}
            {orderedPlaces.map((place, i) => {
              const leg = routeData?.legs?.[i - 1];
              const letter = LETTERS[i] || String(i + 1);
              return (
                <div key={place.name + i}>
                  {i > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 4px 14px' }}>
                      <div style={{ width: 1, height: 16, background: theme.border }} />
                      <span style={{ fontSize: '0.72rem', color: theme.accent, background: '#eef2ff', padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{loading ? '…' : leg ? `${fmt(leg.duration_secs)} · ${fmtDist(leg.distance_meters)}` : '—'}</span>
                    </div>
                  )}
                  <div className="stop-card" draggable onDragStart={() => onDragStart(i)} onDragEnter={() => onDragEnter(i)} onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 10px', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, cursor: 'grab', userSelect: 'none' }}>
                    <div className="drag-handle" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '3px 2px', opacity: 0.3, transition: 'opacity 0.15s', flexShrink: 0, marginTop: 2 }}>
                      {[0, 1, 2].map(j => <div key={j} style={{ width: 14, height: 1.5, background: theme.muted, borderRadius: 1 }} />)}
                    </div>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: theme.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{letter}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 500, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{TYPE_ICON[inferType(place)]} {place.name}</div>
                      {place._day && <div style={{ fontSize: '0.68rem', color: theme.accentLight, marginTop: 1 }}>{place._day}</div>}
                      {place.address && <div style={{ fontSize: '0.68rem', color: theme.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.address}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
            {routeData && !loading && orderedPlaces.length >= 2 && (
              <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', background: theme.accent, borderRadius: 8, color: '#fff' }}>
                <div style={{ fontSize: '0.68rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total journey</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{fmt(routeData.total_duration)}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: 2 }}>{fmtDist(routeData.total_distance)} · {orderedPlaces.length} stops</div>
              </div>
            )}
          </div>
          <div style={{ flex: 1, position: 'relative', background: theme.bg }}>
            {(routeData?.api_key || window.google?.maps) && orderedPlaces.length >= 1 && (
              <GoogleMapWithPins key={mapKey} places={orderedPlaces} legs={routeData?.legs || []} apiKey={routeData?.api_key || ''} travelMode={travelMode} loading={loading} />
            )}
            {loading && <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', border: `1px solid ${theme.border}`, borderRadius: 20, padding: '0.5rem 1.25rem', fontSize: '0.82rem', color: theme.accent, animation: 'pulse 1.5s infinite', whiteSpace: 'nowrap' }}>🗺 Updating route…</div>}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── TRIP VIEW MODAL ─────────────────────────────────────
function TripViewModal({ trip, onClose }) {
  const itinerary = trip.itinerary || {};
  const allPlaces = Object.values(itinerary).flat();
  const days = Object.keys(itinerary).sort((a, b) => parseInt(a.replace('Day ', '')) - parseInt(b.replace('Day ', '')));

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, animation: 'fadeIn 0.2s ease' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: theme.surface, zIndex: 301, borderRadius: 16, width: '90%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'fadeUp 0.3s ease' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: theme.accent }}>{trip.city}</h2>
            <p style={{ color: theme.muted, fontSize: '0.83rem', marginTop: 3 }}>{trip.start_date} → {trip.end_date} · {trip.mode === 'itinerary' ? '📅 Itinerary' : '☰ List'}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: theme.muted, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '1.5rem 2rem' }}>
          {trip.mode === 'itinerary' && days.length > 0 ? (
            days.map(day => {
              const places = itinerary[day] || [];
              return (
                <div key={day} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: theme.accent, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '0.75rem' }}>{day}</div>
                  {places.length === 0 ? (
                    <div style={{ color: theme.muted, fontSize: '0.85rem' }}>No places added</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {places.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
                          <span style={{ color: theme.accent, fontSize: '0.75rem', minWidth: 20, fontWeight: 500 }}>{i + 1}.</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{p.name}</div>
                            {p.address && <div style={{ fontSize: '0.75rem', color: theme.muted }}>{p.address}</div>}
                          </div>
                          {p.rating && <span style={{ fontSize: '0.75rem', color: theme.muted }}>⭐ {p.rating}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : allPlaces.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {allPlaces.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
                  <span style={{ color: theme.accent, fontSize: '0.75rem', minWidth: 20, fontWeight: 500 }}>{i + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{p.name}</div>
                    {p.address && <div style={{ fontSize: '0.75rem', color: theme.muted }}>{p.address}</div>}
                  </div>
                  {p.rating && <span style={{ fontSize: '0.75rem', color: theme.muted }}>⭐ {p.rating}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: theme.muted, fontSize: '0.9rem' }}>No places saved for this trip.</div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── PLAN PAGE ───────────────────────────────────────────
function PlanPage({ prefillCity, editTrip }) {
  const { user, authHeader } = useAuth();
  const [city, setCity] = useState(editTrip?.city || prefillCity || '');
  const [startDate, setStartDate] = useState(editTrip?.start_date || '');
  const [endDate, setEndDate] = useState(editTrip?.end_date || '');
  const [showModal, setShowModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [mode, setMode] = useState(null);
  const [activities, setActivities] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [food, setFood] = useState([]);
  const [activeTab, setActiveTab] = useState('activities');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState([]);
  const [itinerary, setItinerary] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [rankedSaved, setRankedSaved] = useState({ activities: [], food: [], hotels: [] });
  const [submitting, setSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [foodType, setFoodType] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');

  const cuisineKeywords = { 'Italian': ['italian', 'pizza', 'pasta', 'trattoria', 'osteria'], 'Asian': ['chinese', 'japanese', 'sushi', 'thai', 'korean', 'asian', 'ramen', 'pho', 'dim sum'], 'Mexican': ['mexican', 'taco', 'burrito', 'cantina'], 'American': ['burger', 'bbq', 'steakhouse', 'diner', 'american', 'grill'], 'Seafood': ['seafood', 'oyster', 'fish', 'lobster', 'crab', 'sushi'], 'Cafe': ['cafe', 'coffee', 'bakery', 'pastry', 'espresso'], 'Mediterranean': ['mediterranean', 'greek', 'lebanese', 'turkish', 'middle eastern'], 'Indian': ['indian', 'curry', 'tandoor', 'biryani'] };
  const foodTypeKeywords = { 'restaurant': ['restaurant', 'kitchen', 'dining', 'bistro', 'brasserie', 'grill', 'tavern', 'eatery'], 'cafe': ['cafe', 'coffee', 'bakery', 'tea', 'espresso', 'pastry', 'brunch'], 'snack': ['bar', 'snack', 'food', 'oyster', 'boardwalk', 'stand', 'truck'] };

  const getDays = () => {
    if (!startDate || !endDate) return [];
    const days = []; let cur = new Date(startDate); const end = new Date(endDate); let i = 1;
    while (cur <= end) { days.push({ label: `Day ${i}`, date: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }); cur.setDate(cur.getDate() + 1); i++; }
    return days;
  };

  const handleModeSelect = async (selectedMode) => {
    setMode(selectedMode); setShowModal(false); setLoading(true);
    const days = getDays();
    const init = {};
    days.forEach(d => { init[d.label] = editTrip?.itinerary?.[d.label] || []; });
    setItinerary(init);
    if (days.length > 0) setSelectedDay(days[0].label);
    try {
      const [actRes, foodRes, hotelRes] = await Promise.all([
        axios.get(`${API}/activities`, { params: { city, min_rating: 3.5, category: 'tourist_attraction' } }),
        axios.get(`${API}/activities`, { params: { city, min_rating: 3.5, category: 'restaurant' } }),
        axios.get(`${API}/activities`, { params: { city, min_rating: 3.5, category: 'lodging' } }),
      ]);
      setActivities(actRes.data.activities || []);
      setFood(foodRes.data.activities || []);
      setHotels(hotelRes.data.activities || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSaveTrip = async () => {
    if (!user) { setShowAuthPrompt(true); return; }
    setSaving(true);
    try {
      let itineraryData;
      if (mode === 'itinerary') {
        itineraryData = itinerary;
      } else {
        const allRanked = [...rankedSaved.activities, ...rankedSaved.food, ...rankedSaved.hotels];
        itineraryData = { 'Saved': allRanked.length > 0 ? allRanked : saved };
      }
      // Editing a trip someone shared with me (edit permission) → update theirs in place
      if (editTrip?.share_id && editTrip?.permission === 'edit') {
        await axios.put(`${API}/shared-trips/${editTrip.id}`, {
          city, start_date: startDate, end_date: endDate,
          itinerary: itineraryData,
        }, { headers: authHeader });
      } else {
        await axios.post(`${API}/trips`, {
          city, start_date: startDate, end_date: endDate, mode,
          itinerary: itineraryData,
        }, { headers: authHeader });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const getFilteredFood = () => {
    let filtered = food;
    if (foodType !== 'all') { const kws = foodTypeKeywords[foodType] || []; const n = filtered.filter(item => kws.some(k => item.name.toLowerCase().includes(k) || item.address.toLowerCase().includes(k))); if (n.length >= 3) filtered = n; }
    if (cuisineFilter !== 'all') { const kws = cuisineKeywords[cuisineFilter] || []; const n = filtered.filter(item => kws.some(k => item.name.toLowerCase().includes(k))); if (n.length >= 2) filtered = n; }
    if (priceFilter !== 'all') { const pm = { '$': 0, '$$': 1, '$$$': 2, '$$$$': 3 }; const n = filtered.filter(item => (item.price_level ?? 2) <= (pm[priceFilter] ?? 4)); if (n.length >= 2) filtered = n; }
    return filtered;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const [actRank, foodRank, hotelRank] = await Promise.allSettled([
        axios.get(`${API}/rankings/${user?.id || 'user1'}/${city}`),
        axios.get(`${API}/rankings/${user?.id || 'user1'}/${city}`),
        axios.get(`${API}/rankings/${user?.id || 'user1'}/${city}`),
      ]);
      const savedActivities = saved.filter(s => activities.find(a => a.name === s.name));
      const savedFood = saved.filter(s => food.find(a => a.name === s.name));
      const savedHotels = saved.filter(s => hotels.find(a => a.name === s.name));
      const sortByElo = (items, rankRes) => {
        const rankings = rankRes.status === 'fulfilled' ? rankRes.value.data.rankings || [] : [];
        return [...items].sort((a, b) => { const aR = rankings.find(r => r.name === a.name); const bR = rankings.find(r => r.name === b.name); if (aR && bR) return bR.elo_score - aR.elo_score; return (b.rating || 0) - (a.rating || 0); });
      };
      setRankedSaved({ activities: sortByElo(savedActivities, actRank), food: sortByElo(savedFood, foodRank), hotels: sortByElo(savedHotels, hotelRank) });
      setSubmitted(true);
    } catch {
      setRankedSaved({ activities: [...saved.filter(s => activities.find(a => a.name === s.name))].sort((a, b) => (b.rating || 0) - (a.rating || 0)), food: [...saved.filter(s => food.find(a => a.name === s.name))].sort((a, b) => (b.rating || 0) - (a.rating || 0)), hotels: [...saved.filter(s => hotels.find(a => a.name === s.name))].sort((a, b) => (b.rating || 0) - (a.rating || 0)) });
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const allItineraryPlaces = Object.values(itinerary).flat();
  const tabs = [{ key: 'activities', label: 'Activities', data: activities }, { key: 'food', label: 'Food', data: food }, { key: 'hotels', label: 'Hotels', data: hotels }];
  const currentData = activeTab === 'food' ? getFilteredFood() : (tabs.find(t => t.key === activeTab)?.data || []);
  const days = getDays();

  const SaveTripButton = ({ style = {} }) => (
    <button onClick={handleSaveTrip} disabled={saving}
      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: saveSuccess ? '#eaf3de' : theme.surface, color: saveSuccess ? '#2a6030' : theme.accent, border: `1.5px solid ${saveSuccess ? '#2a6030' : theme.accent}`, padding: '0.5rem 1.1rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s', opacity: saving ? 0.7 : 1, ...style }}>
      {saveSuccess ? '✓ Saved!' : saving ? 'Saving…' : '💾 Save Trip'}
    </button>
  );

  const ListView = () => {
    if (submitted) {
      const sections = [{ key: 'activities', label: 'Activities', data: rankedSaved.activities, icon: '🗺️' }, { key: 'food', label: 'Food', data: rankedSaved.food, icon: '🍽️' }, { key: 'hotels', label: 'Hotels', data: rankedSaved.hotels, icon: '🏨' }].filter(s => s.data.length > 0);
      const allRankedPlaces = [...rankedSaved.activities, ...rankedSaved.food, ...rankedSaved.hotels];
      return (
        <div className="fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', marginBottom: '0.25rem' }}>Your {city} picks ✦</h2>
              <p style={{ color: theme.muted, fontSize: '0.85rem' }}>Ranked by community ELO · {saved.length} places saved</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {allRankedPlaces.length >= 2 && (
                <button onClick={() => setShowMap(true)}
                  style={{ background: '#eef2ff', color: theme.accent, border: `1.5px solid ${theme.accent}`, padding: '0.5rem 1.25rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = theme.accent; }}>
                  🗺 Map It
                </button>
              )}
              <SaveTripButton />
              <button className="btn-outline" onClick={() => setSubmitted(false)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>← Edit</button>
            </div>
          </div>
          {sections.map(section => (
            <div key={section.key} style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: `1px solid ${theme.border}` }}>
                <span>{section.icon}</span>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: theme.accent }}>{section.label}</h3>
                <span style={{ color: theme.muted, fontSize: '0.8rem' }}>({section.data.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {section.data.map((item, i) => (
                  <div key={i} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: i === 0 ? '1.3rem' : '1rem', color: i === 0 ? theme.accent : theme.muted, minWidth: 28, textAlign: 'center' }}>{i === 0 ? '✦' : `#${i + 1}`}</span>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{item.name}</div><div style={{ color: theme.muted, fontSize: '0.8rem' }}>⭐ {item.rating} · {item.address}</div></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', gap: '2rem', borderBottom: `1px solid ${theme.border}`, marginBottom: '1.25rem' }}>
          {tabs.map(t => (
            <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.label}
              {saved.filter(s => (t.key === 'activities' ? activities : t.key === 'food' ? food : hotels).find(a => a.name === s.name)).length > 0 && (
                <span style={{ background: theme.accent, color: '#fff', borderRadius: '10px', padding: '0.1rem 0.4rem', fontSize: '0.7rem', marginLeft: '0.3rem' }}>
                  {saved.filter(s => (t.key === 'activities' ? activities : t.key === 'food' ? food : hotels).find(a => a.name === s.name)).length}
                </span>
              )}
            </button>
          ))}
        </div>
        {activeTab === 'food' && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['all', 'restaurant', 'cafe', 'snack'].map(type => <button key={type} className={`chip ${foodType === type ? 'selected' : ''}`} onClick={() => setFoodType(type)} style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>{type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}</button>)}
            </div>
            <div style={{ width: 1, height: 20, background: theme.border }} />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['all', '$', '$$', '$$$', '$$$$'].map(price => <button key={price} className={`chip ${priceFilter === price ? 'selected' : ''}`} onClick={() => setPriceFilter(price)} style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>{price === 'all' ? 'Any Price' : price}</button>)}
            </div>
            <div style={{ width: 1, height: 20, background: theme.border }} />
            <select value={cuisineFilter} onChange={e => setCuisineFilter(e.target.value)} style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '20px', cursor: 'pointer' }}>
              <option value="all">All Cuisines</option>
              {Object.keys(cuisineKeywords).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <PlaceSearchPanel data={currentData} loading={loading} mode="list" saved={saved} setSaved={setSaved} itinerary={itinerary} setItinerary={setItinerary} selectedDay={selectedDay} activeTab={activeTab} city={city} />
        {saved.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', paddingTop: '1rem', marginTop: '1rem', borderTop: `1px solid ${theme.border}` }}>
            <span style={{ color: theme.muted, fontSize: '0.85rem' }}>{saved.length} place{saved.length > 1 ? 's' : ''} selected</span>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ padding: '0.75rem 2rem' }}>
              {submitting ? 'Ranking...' : 'See My Ranked List →'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const ItineraryView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 320px)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '1.5rem', borderBottom: `1px solid ${theme.border}`, marginBottom: '1rem' }}>
            {tabs.map(t => <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>)}
          </div>
          <PlaceSearchPanel data={currentData} loading={loading} mode="itinerary" saved={saved} setSaved={setSaved} itinerary={itinerary} setItinerary={setItinerary} selectedDay={selectedDay} activeTab={activeTab} city={city} />
        </div>
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {days.map(d => (
              <button key={d.label} onClick={() => setSelectedDay(d.label)}
                style={{ background: selectedDay === d.label ? theme.accent : theme.surface, border: `1px solid ${selectedDay === d.label ? theme.accent : theme.border}`, color: selectedDay === d.label ? theme.bg : theme.soft, padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif' }}>
                {d.label} <span style={{ opacity: 0.7 }}>{d.date}</span>
              </button>
            ))}
          </div>
          {selectedDay && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '0.8rem', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>{selectedDay} · {days.find(d => d.label === selectedDay)?.date}</div>
              {(itinerary[selectedDay] || []).length === 0 ? (
                <div style={{ color: theme.muted, fontSize: '0.85rem', padding: '1rem 0', borderTop: `1px solid ${theme.border}` }}>Search and click + to add places.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {itinerary[selectedDay].map((place, i) => (
                    <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 4, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: theme.accent, fontSize: '0.75rem', minWidth: 20 }}>{i + 1}.</span>
                      <span style={{ flex: 1, fontSize: '0.85rem' }}>{place.name}</span>
                      <button onClick={() => setItinerary(prev => ({ ...prev, [selectedDay]: prev[selectedDay].filter(p => p.name !== place.name) }))} style={{ background: 'none', border: 'none', color: theme.muted, cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {allItineraryPlaces.length >= 2 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: `1px solid ${theme.border}` }}>
          <SaveTripButton />
          <button onClick={() => setShowMap(true)}
            style={{ background: theme.accent, color: '#fff', border: 'none', padding: '0.75rem 1.75rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = theme.accentDark}
            onMouseLeave={e => e.currentTarget.style.background = theme.accent}>
            🗺 Map It — {allItineraryPlaces.length} stops
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '8rem 3rem 4rem', maxWidth: mode === 'itinerary' ? 1100 : 900, margin: '0 auto' }}>
      <div className="fade-up">
        <p style={{ color: theme.accent, fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>Plan</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', marginBottom: '2.5rem' }}>Plan your <span style={{ fontStyle: 'italic' }}>trip.</span></h1>
        {!mode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 560 }}>
            <div>
              <label style={{ color: theme.muted, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Where are you going?</label>
              <PlacesAutocompleteInput value={city} onChange={e => setCity(e.target.value)} placeholder="City or destination" />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}><label style={{ color: theme.muted, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>From</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={{ color: theme.muted, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>To</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
            {!user && (
              <div style={{ padding: '0.85rem 1rem', background: '#fefbf0', border: '1px solid #f0d070', borderRadius: 8, fontSize: '0.83rem', color: '#7a6020', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💡</span>
                <span>Sign in to save your trips and plans to your account.</span>
              </div>
            )}
            <button className="btn-primary" onClick={() => { if (city && startDate && endDate) setShowModal(true); }} style={{ marginTop: '0.5rem', alignSelf: 'flex-start', padding: '0.9rem 2rem' }}>Start Planning →</button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem' }}>{city}</span>
                <span style={{ color: theme.muted, fontSize: '0.9rem' }}>{startDate} → {endDate}</span>
                <span style={{ color: theme.border, fontSize: '0.9rem' }}>·</span>
                <span style={{ color: theme.soft, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{mode === 'itinerary' ? '📅 Itinerary' : '☰ List'}</span>
              </div>
              <button className="btn-outline" onClick={() => setMode(null)} style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>← Back</button>
            </div>
            {mode === 'list' ? <ListView /> : <ItineraryView />}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', marginBottom: '0.75rem' }}>How would you like to organize?</h2>
            <p style={{ color: theme.soft, fontSize: '0.9rem', marginBottom: '2rem' }}>Choose how you want to plan your {city} trip.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="card btn-outline" style={{ flex: 1, padding: '1.5rem', textAlign: 'left', border: `1px solid ${theme.border}` }} onClick={() => handleModeSelect('list')}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>☰</div>
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>List</div>
                <div style={{ color: theme.muted, fontSize: '0.8rem' }}>Browse food, activities & hotels by category</div>
              </button>
              <button className="card btn-outline" style={{ flex: 1, padding: '1.5rem', textAlign: 'left', border: `1px solid ${theme.border}` }} onClick={() => handleModeSelect('itinerary')}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅</div>
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Itinerary</div>
                <div style={{ color: theme.muted, fontSize: '0.8rem' }}>Assign places to specific days</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthPrompt && <AuthModal onClose={() => setShowAuthPrompt(false)} defaultMode="register" />}

      {showMap && (
        <MapItModal
          places={mode === 'itinerary' ? itinerary : [...rankedSaved.activities, ...rankedSaved.food, ...rankedSaved.hotels]}
          city={city}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}

// ─── SHARE MODAL ─────────────────────────────────────────
function ShareModal({ trip, authHeader, onClose }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState('');
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const sendEmailShare = async () => {
    if (!email.trim()) { setError('Enter an email address'); return; }
    setError(''); setSending(true);
    try {
      await axios.post(`${API}/share`, { trip_id: trip.id, recipient_email: email.trim(), permission }, { headers: authHeader });
      setEmailSent(email.trim());
      setEmail('');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Could not share. Try again.');
    } finally { setSending(false); }
  };

  const createLink = async () => {
    setError(''); setCreatingLink(true);
    try {
      const r = await axios.post(`${API}/share`, { trip_id: trip.id, create_link: true, permission }, { headers: authHeader });
      const token = r.data.share_token;
      setShareLink(`${window.location.origin}/shared/${token}`);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Could not create link.');
    } finally { setCreatingLink(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const permToggle = (
    <div style={{ display: 'flex', gap: '0.5rem', background: theme.bg, padding: 4, borderRadius: 8, border: `1px solid ${theme.border}` }}>
      {[{ k: 'view', label: '👁 View only' }, { k: 'edit', label: '✏️ Can edit' }].map(opt => (
        <button key={opt.k} onClick={() => setPermission(opt.k)}
          style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: 'none', background: permission === opt.k ? theme.accent : 'transparent', color: permission === opt.k ? '#fff' : theme.soft, cursor: 'pointer', fontSize: '0.83rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, transition: 'all 0.15s' }}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: theme.accent }}>Share {trip.city}</h2>
            <p style={{ color: theme.muted, fontSize: '0.83rem', marginTop: 3 }}>Send this trip to a friend with view or edit access.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: theme.muted, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ margin: '1.5rem 0 1rem' }}>
          <label style={{ fontSize: '0.72rem', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Permission</label>
          {permToggle}
        </div>

        {/* Email share */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.72rem', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Share by email</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="friend@example.com"
              onKeyDown={e => e.key === 'Enter' && sendEmailShare()} />
            <button className="btn-primary" onClick={sendEmailShare} disabled={sending} style={{ whiteSpace: 'nowrap', padding: '0.75rem 1.25rem', opacity: sending ? 0.7 : 1 }}>
              {sending ? '…' : 'Send'}
            </button>
          </div>
          {emailSent && <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#2a6030' }}>✓ Shared with {emailSent} ({permission === 'edit' ? 'can edit' : 'view only'})</div>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
          <span style={{ fontSize: '0.75rem', color: theme.muted }}>or</span>
          <div style={{ flex: 1, height: 1, background: theme.border }} />
        </div>

        {/* Link share */}
        <div>
          <label style={{ fontSize: '0.72rem', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Share by link</label>
          {!shareLink ? (
            <button onClick={createLink} disabled={creatingLink}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: `1.5px solid ${theme.accent}`, background: 'transparent', color: theme.accent, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem', fontWeight: 500, opacity: creatingLink ? 0.7 : 1 }}>
              {creatingLink ? 'Creating…' : `🔗 Create ${permission === 'edit' ? 'edit' : 'view'} link`}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input readOnly value={shareLink} style={{ fontSize: '0.8rem', color: theme.soft }} onFocus={e => e.target.select()} />
              <button className="btn-primary" onClick={copyLink} style={{ whiteSpace: 'nowrap', padding: '0.75rem 1.25rem', background: copied ? '#2a6030' : theme.accent }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {error && <div style={{ marginTop: '1rem', padding: '0.6rem 0.9rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.83rem', color: '#c0392b' }}>{error}</div>}
      </div>
    </div>
  );
}

// ─── MY TRIPS ────────────────────────────────────────────
function MyTripsPage({ goToPlan }) {
  const { user, authHeader } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [filter, setFilter] = useState('all');
  const [activeTrip, setActiveTrip] = useState(null);
  const [matchupIndex, setMatchupIndex] = useState(0);
  const [rankings, setRankings] = useState([]);
  const [showRankings, setShowRankings] = useState(false);
  const [savedTrips, setSavedTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [activeTab, setActiveTab] = useState('saved');
  const [viewTrip, setViewTrip] = useState(null);
  const [shareTrip, setShareTrip] = useState(null);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [loadingShared, setLoadingShared] = useState(false);

  const staticTrips = [
    { id: 's1', city: 'Paris', country: 'France', start: '2024-03-10', end: '2024-03-17', rating: 9.3, year: '2024', places: ['Eiffel Tower', 'Louvre Museum', 'Montmartre', 'Seine River Cruise'] },
    { id: 's2', city: 'Tokyo', country: 'Japan', start: '2023-11-01', end: '2023-11-10', rating: 9.7, year: '2023', places: ['Shibuya Crossing', 'Senso-ji Temple', 'Shinjuku Gyoen', 'Tsukiji Market'] },
    { id: 's3', city: 'Barcelona', country: 'Spain', start: '2023-06-15', end: '2023-06-22', rating: 8.8, year: '2023', places: ['Sagrada Familia', 'Park Güell', 'La Boqueria', 'Gothic Quarter'] },
  ];

  useEffect(() => {
    if (user) {
      setLoadingTrips(true);
      axios.get(`${API}/trips`, { headers: authHeader })
        .then(r => setSavedTrips(r.data || []))
        .catch(() => {})
        .finally(() => setLoadingTrips(false));

      setLoadingShared(true);
      axios.get(`${API}/shared-with-me`, { headers: authHeader })
        .then(r => setSharedWithMe(r.data || []))
        .catch(() => {})
        .finally(() => setLoadingShared(false));
    }
  }, [user]);

  const deleteTrip = async (id) => {
    try {
      await axios.delete(`${API}/trips/${id}`, { headers: authHeader });
      setSavedTrips(prev => prev.filter(t => t.id !== id));
    } catch {}
  };

  const startMatchup = (trip) => { setActiveTrip(trip); setMatchupIndex(0); setShowRankings(false); };
  const handleVote = async (winner, loser, trip) => {
    try { await axios.post(`${API}/matchup`, { user_id: user?.id || 'user1', winner_name: winner, loser_name: loser, city: trip.city, category: 'tourist_attraction' }); } catch {}
    if (matchupIndex + 2 >= trip.places.length) {
      try { const res = await axios.get(`${API}/rankings/${user?.id || 'user1'}/${trip.city}`); setRankings(res.data.rankings || []); } catch { setRankings(trip.places.map((p, i) => ({ rank: i + 1, name: p, elo_score: 1000 - i * 32, matches: 1 }))); }
      setShowRankings(true);
    } else { setMatchupIndex(matchupIndex + 2); }
  };

  if (activeTrip && !showRankings) {
    const p1 = activeTrip.places[matchupIndex]; const p2 = activeTrip.places[matchupIndex + 1];
    return (
      <div style={{ minHeight: '100vh', padding: '8rem 3rem 4rem', maxWidth: 700, margin: '0 auto' }}>
        <button className="btn-outline" onClick={() => setActiveTrip(null)} style={{ marginBottom: '2rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>← Back</button>
        <p style={{ color: theme.accent, fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>Ranking · {activeTrip.city}</p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: '0.5rem' }}>Which did you prefer?</h2>
        <p style={{ color: theme.muted, marginBottom: '2.5rem', fontSize: '0.9rem' }}>Round {Math.floor(matchupIndex / 2) + 1} of {Math.floor(activeTrip.places.length / 2)}</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[p1, p2].map((place, i) => (
            <div key={i} className="card" onClick={() => handleVote(place, i === 0 ? p2 : p1, activeTrip)} style={{ flex: 1, padding: '2rem', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✦</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{place}</div>
              <div style={{ color: theme.muted, fontSize: '0.8rem', marginTop: '0.5rem' }}>Tap to vote</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showRankings) {
    return (
      <div style={{ minHeight: '100vh', padding: '8rem 3rem 4rem', maxWidth: 700, margin: '0 auto' }}>
        <button className="btn-outline" onClick={() => { setActiveTrip(null); setShowRankings(false); }} style={{ marginBottom: '2rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>← Back</button>
        <p style={{ color: theme.accent, fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>Results</p>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: '2rem' }}>Your {activeTrip.city} Rankings</h2>
        {rankings.map((r, i) => (
          <div key={i} className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: i === 0 ? theme.accent : theme.muted, minWidth: 30 }}>{i === 0 ? '✦' : `#${r.rank}`}</span>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 500 }}>{r.name}</div><div style={{ color: theme.muted, fontSize: '0.8rem' }}>{r.matches} matchup{r.matches !== 1 ? 's' : ''}</div></div>
            <div style={{ color: theme.accent, fontWeight: 600 }}>{r.elo_score}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '8rem 3rem 4rem', maxWidth: 900, margin: '0 auto' }}>
      <div className="fade-up">
        <p style={{ color: theme.accent, fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>My Trips</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem' }}>Your <span style={{ fontStyle: 'italic' }}>travels.</span></h1>
        </div>

        {!user ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✦</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: '0.5rem', color: theme.accent }}>Sign in to see your trips</h3>
            <p style={{ color: theme.soft, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>Create an account to save trips, itineraries, and revisit your plans.</p>
            <button className="btn-primary" onClick={() => setShowAuth(true)}>Sign In or Create Account →</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '2rem', borderBottom: `1px solid ${theme.border}`, marginBottom: '2rem' }}>
              <button className={`tab ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
                Saved Plans {savedTrips.length > 0 && <span style={{ background: theme.accent, color: '#fff', borderRadius: 10, padding: '0.1rem 0.4rem', fontSize: '0.7rem', marginLeft: '0.3rem' }}>{savedTrips.length}</span>}
              </button>
              <button className={`tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>Past Trips</button>
              <button className={`tab ${activeTab === 'shared' ? 'active' : ''}`} onClick={() => setActiveTab('shared')}>
                Shared With Me {sharedWithMe.length > 0 && <span style={{ background: theme.accent, color: '#fff', borderRadius: 10, padding: '0.1rem 0.4rem', fontSize: '0.7rem', marginLeft: '0.3rem' }}>{sharedWithMe.length}</span>}
              </button>
            </div>

            {activeTab === 'saved' && (
              <div>
                {loadingTrips ? (
                  <div style={{ color: theme.muted, animation: 'pulse 1.5s infinite' }}>Loading your trips…</div>
                ) : savedTrips.length === 0 ? (
                  <div style={{ color: theme.muted, padding: '2rem 0', fontSize: '0.9rem' }}>No saved trips yet. Plan a trip and save it to see it here.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {savedTrips.map((trip) => {
                      const itinerary = trip.itinerary || {};
                      const allPlaces = Object.values(itinerary).flat();
                      return (
                        <div key={trip.id} className="card" style={{ padding: '1.5rem 2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem' }}>{trip.city}</h2>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 20, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.soft }}>{trip.mode === 'itinerary' ? '📅 Itinerary' : '☰ List'}</span>
                              </div>
                              <div style={{ color: theme.muted, fontSize: '0.8rem', marginBottom: '0.75rem' }}>{trip.start_date} → {trip.end_date}</div>
                              {allPlaces.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                  {allPlaces.slice(0, 5).map(p => <span key={p.name} style={{ background: theme.bg, border: `1px solid ${theme.border}`, padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', color: theme.soft }}>{p.name}</span>)}
                                  {allPlaces.length > 5 && <span style={{ fontSize: '0.75rem', color: theme.muted, padding: '0.2rem 0.4rem' }}>+{allPlaces.length - 5} more</span>}
                                </div>
                              )}
                              <div style={{ fontSize: '0.72rem', color: theme.muted }}>Saved {new Date(trip.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', marginLeft: '1rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => setViewTrip(trip)}
                                  style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.soft, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.soft; }}>
                                  👁 View
                                </button>
                                <button onClick={() => goToPlan(trip)}
                                  style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: `1.5px solid ${theme.accent}`, background: 'transparent', color: theme.accent, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, transition: 'all 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = '#fff'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent; }}>
                                  ✏️ Edit
                                </button>
                                <button onClick={() => setShareTrip(trip)}
                                  style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.soft, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.soft; }}>
                                  🔗 Share
                                </button>
                              </div>
                              <button onClick={() => deleteTrip(trip.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.muted, fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif', padding: '0.2rem 0', transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#c0392b'}
                                onMouseLeave={e => e.currentTarget.style.color = theme.muted}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'past' && (
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {['all', '2024', '2023'].map(y => <button key={y} className={`chip ${filter === y ? 'selected' : ''}`} onClick={() => setFilter(y)}>{y === 'all' ? 'All' : y}</button>)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {staticTrips.filter(t => filter === 'all' || t.year === filter).map((trip) => (
                    <div key={trip.id} className="card" style={{ padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}><h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem' }}>{trip.city}</h2><span style={{ color: theme.muted, fontSize: '0.85rem' }}>{trip.country}</span></div>
                          <div style={{ color: theme.muted, fontSize: '0.8rem', marginBottom: '1rem' }}>{trip.start} → {trip.end}</div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{trip.places.map(p => <span key={p} style={{ background: theme.bg, border: `1px solid ${theme.border}`, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', color: theme.soft }}>{p}</span>)}</div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: '2rem' }}>
                          <div style={{ fontSize: '2rem', fontWeight: 700, color: theme.accent, fontFamily: 'Playfair Display, serif' }}>{trip.rating}</div>
                          <div style={{ color: theme.muted, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trip Score</div>
                          <button className="btn-primary" onClick={() => startMatchup(trip)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Rank Places</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'shared' && (
              <div>
                {loadingShared ? (
                  <div style={{ color: theme.muted, animation: 'pulse 1.5s infinite' }}>Loading shared trips…</div>
                ) : sharedWithMe.length === 0 ? (
                  <div style={{ color: theme.muted, padding: '2rem 0', fontSize: '0.9rem' }}>No trips have been shared with you yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sharedWithMe.map((trip) => {
                      const itinerary = trip.itinerary || {};
                      const allPlaces = Object.values(itinerary).flat();
                      return (
                        <div key={trip.share_id} className="card" style={{ padding: '1.5rem 2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem' }}>{trip.city}</h2>
                                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, background: trip.permission === 'edit' ? '#eaf3de' : theme.bg, border: `1px solid ${theme.border}`, color: trip.permission === 'edit' ? '#2a6030' : theme.soft }}>
                                  {trip.permission === 'edit' ? '✏️ Can edit' : '👁 View only'}
                                </span>
                              </div>
                              <div style={{ color: theme.muted, fontSize: '0.8rem', marginBottom: '0.5rem' }}>{trip.start_date} → {trip.end_date}</div>
                              {trip.shared_by && <div style={{ fontSize: '0.75rem', color: theme.accent, marginBottom: '0.75rem' }}>Shared by {trip.shared_by.name}</div>}
                              {allPlaces.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  {allPlaces.slice(0, 5).map(p => <span key={p.name} style={{ background: theme.bg, border: `1px solid ${theme.border}`, padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', color: theme.soft }}>{p.name}</span>)}
                                  {allPlaces.length > 5 && <span style={{ fontSize: '0.75rem', color: theme.muted, padding: '0.2rem 0.4rem' }}>+{allPlaces.length - 5} more</span>}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                              <button onClick={() => setViewTrip(trip)}
                                style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.soft, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}>
                                👁 View
                              </button>
                              {trip.permission === 'edit' && (
                                <button onClick={() => goToPlan(trip)}
                                  style={{ padding: '0.4rem 0.9rem', borderRadius: 6, border: `1.5px solid ${theme.accent}`, background: 'transparent', color: theme.accent, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                                  ✏️ Edit
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {viewTrip && <TripViewModal trip={viewTrip} onClose={() => setViewTrip(null)} />}
      {shareTrip && <ShareModal trip={shareTrip} authHeader={authHeader} onClose={() => setShareTrip(null)} />}
    </div>
  );
}

// ─── FRIENDS PAGE ─────────────────────────────────────────
function FriendsPage() {
  const [tab, setTab] = useState('friends');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const friends = [
    {
      name: 'Sofia M.', recentTrip: 'Kyoto', rating: 9.5, avatar: 'S',
      rankings: [
        { name: 'Fushimi Inari Shrine', city: 'Kyoto', score: 9.8, category: 'activities' },
        { name: 'Arashiyama Bamboo Grove', city: 'Kyoto', score: 9.6, category: 'activities' },
        { name: 'Kinkaku-ji (Golden Pavilion)', city: 'Kyoto', score: 9.4, category: 'activities' },
        { name: 'Nishiki Market', city: 'Kyoto', score: 9.1, category: 'food' },
        { name: 'Gion District', city: 'Kyoto', score: 8.8, category: 'activities' },
        { name: 'Kiyomizu-dera', city: 'Kyoto', score: 8.5, category: 'activities' },
      ],
    },
    {
      name: 'James R.', recentTrip: 'Buenos Aires', rating: 8.9, avatar: 'J',
      rankings: [
        { name: 'La Cabrera (Steakhouse)', city: 'Buenos Aires', score: 9.5, category: 'food' },
        { name: 'Recoleta Cemetery', city: 'Buenos Aires', score: 9.1, category: 'activities' },
        { name: 'San Telmo Market', city: 'Buenos Aires', score: 8.8, category: 'food' },
        { name: 'Teatro Colón', city: 'Buenos Aires', score: 8.5, category: 'activities' },
        { name: 'Caminito, La Boca', city: 'Buenos Aires', score: 8.1, category: 'activities' },
      ],
    },
    {
      name: 'Aisha K.', recentTrip: 'Lisbon', rating: 9.1, avatar: 'A',
      rankings: [
        { name: 'Belém Tower', city: 'Lisbon', score: 9.6, category: 'activities' },
        { name: 'Time Out Market', city: 'Lisbon', score: 9.3, category: 'food' },
        { name: 'Jerónimos Monastery', city: 'Lisbon', score: 9.1, category: 'activities' },
        { name: 'Alfama District', city: 'Lisbon', score: 8.8, category: 'activities' },
        { name: 'Pastéis de Belém', city: 'Lisbon', score: 8.5, category: 'food' },
        { name: 'LX Factory', city: 'Lisbon', score: 8.2, category: 'activities' },
      ],
    },
  ];
  const publicProfiles = [{ name: 'travelwith_mia', trips: 24, topCity: 'Tokyo', avatar: 'M' }, { name: 'nomad.kai', trips: 47, topCity: 'Bali', avatar: 'K' }, { name: 'explorerette', trips: 31, topCity: 'Paris', avatar: 'E' }];
  return (
    <div style={{ minHeight: '100vh', padding: '8rem 3rem 4rem', maxWidth: 800, margin: '0 auto' }}>
      <div className="fade-up">
        <p style={{ color: theme.accent, fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>Community</p>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', marginBottom: '2.5rem' }}>Friends &amp; <span style={{ fontStyle: 'italic' }}>travelers.</span></h1>
        <div style={{ display: 'flex', gap: '2rem', borderBottom: `1px solid ${theme.border}`, marginBottom: '2rem' }}>
          <button className={`tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>My Friends</button>
          <button className={`tab ${tab === 'public' ? 'active' : ''}`} onClick={() => setTab('public')}>Public</button>
        </div>
        {tab === 'friends' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {friends.map((f, i) => (
              <div key={i} className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: theme.accent, color: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>{f.avatar}</div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 500 }}>{f.name}</div><div style={{ color: theme.muted, fontSize: '0.8rem' }}>Recently visited {f.recentTrip}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ color: theme.accent, fontWeight: 600 }}>{f.rating}</div><div style={{ color: theme.muted, fontSize: '0.75rem' }}>avg score</div></div>
                <button className="btn-outline" onClick={() => setSelectedFriend(f)} style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>View Rankings</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {publicProfiles.map((p, i) => (
              <div key={i} className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: theme.surface, border: `1px solid ${theme.border}`, color: theme.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>{p.avatar}</div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 500 }}>@{p.name}</div><div style={{ color: theme.muted, fontSize: '0.8rem' }}>{p.trips} trips · Top city: {p.topCity}</div></div>
                <button className="btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>Follow</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedFriend && <FriendRankingsModal friend={selectedFriend} onClose={() => setSelectedFriend(null)} />}
    </div>
  );
}

// ─── FRIEND RANKINGS MODAL ───────────────────────────────
function FriendRankingsModal({ friend, onClose }) {
  const medal = (i) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`);
  const catColor = { activities: '#2a6030', food: '#9a5b1e', hotels: '#1e4d6b' };
  const catLabel = { activities: 'Activity', food: 'Food', hotels: 'Stay' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: theme.accent, color: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>{friend.avatar}</div>
            <div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: theme.accent, lineHeight: 1.1 }}>{friend.name}</h2>
              <p style={{ color: theme.muted, fontSize: '0.83rem', marginTop: 2 }}>Ranked places in {friend.recentTrip}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: theme.muted, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
          {friend.rankings.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', background: i < 3 ? theme.surface : theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
              <div style={{ fontSize: i < 3 ? '1.3rem' : '0.85rem', fontWeight: 600, color: theme.soft, minWidth: 32, textAlign: 'center' }}>{medal(i)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{r.name}</div>
                <span style={{ fontSize: '0.7rem', color: catColor[r.category] || theme.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{catLabel[r.category] || r.category}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: theme.accent, fontFamily: 'Playfair Display, serif', fontSize: '1.05rem' }}>{r.score.toFixed(1)}</div>
                <div style={{ fontSize: '0.65rem', color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>out of 10</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function SharedLinkPage({ token }) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/shared/${token}`)
      .then(r => setTrip(r.data))
      .catch(e => setError(e?.response?.data?.detail || 'This share link is invalid or has been removed.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ padding: '6rem 2rem', textAlign: 'center', color: theme.muted }}>Loading shared trip…</div>;
  if (error) return (
    <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: theme.accent, marginBottom: '0.75rem' }}>Link not found</h2>
      <p style={{ color: theme.muted }}>{error}</p>
      <button className="btn-primary" onClick={() => { window.history.pushState({}, '', '/'); window.location.reload(); }} style={{ marginTop: '1.5rem' }}>Go to homepage</button>
    </div>
  );

  const itinerary = trip.itinerary || {};
  const dayKeys = Object.keys(itinerary);
  const isItinerary = trip.mode === 'itinerary';

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 2rem 5rem' }}>
      <p style={{ color: theme.accent, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Shared Trip</p>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 5vw, 3rem)', color: theme.text, marginBottom: '0.5rem' }}>{trip.city}</h1>
      <div style={{ color: theme.muted, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{trip.start_date} → {trip.end_date}</div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '2.5rem' }}>
        {trip.shared_by && <span style={{ fontSize: '0.85rem', color: theme.soft }}>Shared by {trip.shared_by.name}</span>}
        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, background: trip.permission === 'edit' ? '#eaf3de' : theme.bg, border: `1px solid ${theme.border}`, color: trip.permission === 'edit' ? '#2a6030' : theme.soft }}>
          {trip.permission === 'edit' ? '✏️ Editable' : '👁 View only'}
        </span>
      </div>

      {dayKeys.length === 0 ? (
        <div style={{ color: theme.muted }}>No places saved for this trip.</div>
      ) : isItinerary ? (
        dayKeys.map(day => (
          <div key={day} style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.25rem', color: theme.accent, marginBottom: '0.75rem' }}>{day}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(itinerary[day] || []).map((p, i) => (
                <div key={i} className="card" style={{ padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  {p.category && <span style={{ fontSize: '0.75rem', color: theme.muted, textTransform: 'capitalize' }}>{p.category}</span>}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {Object.values(itinerary).flat().map((p, i) => (
            <div key={i} className="card" style={{ padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              {p.category && <span style={{ fontSize: '0.75rem', color: theme.muted, textTransform: 'capitalize' }}>{p.category}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────
export default function App() {
  // Detect a /shared/<token> deep link
  const sharedMatch = typeof window !== 'undefined' && window.location.pathname.match(/^\/shared\/(.+)$/);
  const sharedToken = sharedMatch ? sharedMatch[1] : null;
  const [page, setPage] = useState('home');
  const [prefillCity, setPrefillCity] = useState('');
  const [editTrip, setEditTrip] = useState(null);

  const goToPlan = (trip = null) => {
    setEditTrip(trip);
    setPage('plan');
  };

  return (
    <AuthProvider>
      <style>{globalStyle}</style>
      <div style={{ background: theme.bg, minHeight: '100vh' }}>
        <Nav page={page} setPage={(p) => { if (sharedToken) { window.history.pushState({}, '', '/'); } setPage(p); }} />
        {sharedToken ? (
          <SharedLinkPage token={sharedToken} />
        ) : (
          <>
            {page === 'home' && <HomePage setPage={setPage} />}
            {page === 'explore' && <ExplorePage setPage={setPage} setPrefillCity={setPrefillCity} />}
            {page === 'plan' && <PlanPage prefillCity={prefillCity} editTrip={editTrip} />}
            {page === 'mytrips' && <MyTripsPage goToPlan={goToPlan} />}
            {page === 'friends' && <FriendsPage />}
          </>
        )}
      </div>
    </AuthProvider>
  );
}