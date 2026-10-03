import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useCivilization } from '../../store/CivilizationContext.jsx';
import { MOTIVATIONAL_MESSAGES, UNHAPPY_MESSAGES } from '../../data/messages.js';
import StickmanCharacter from '../StickmanCharacter/StickmanCharacter.jsx';
import SceneBuilding from './SceneBuilding.jsx';
import Scenery from './Scenery.jsx';
import { Users, AlertTriangle, MessageCircle, CloudRain, Sun } from 'lucide-react';

// Walkable ground (percent of canvas)
const ZONE = { xMin: 5, xMax: 95, yMin: 38, yMax: 91 };
const SPEED_PX = 120; // px/s per unit of `speed`

const rand = (a, b) => a + Math.random() * (b - a);

function insideBuilding(x, y, buildings) {
  return buildings.some(b => Math.abs(x - b.x) < 4.5 && y < b.y + 1.5 && y > b.y - 13);
}

function pickTarget(actor, buildings) {
  for (let i = 0; i < 10; i++) {
    const tx = rand(ZONE.xMin, ZONE.xMax);
    const ty = rand(ZONE.yMin, ZONE.yMax);
    if (!insideBuilding(tx, ty, buildings)) {
      actor.tx = tx;
      actor.ty = ty;
      return;
    }
  }
  actor.tx = rand(ZONE.xMin, ZONE.xMax);
  actor.ty = rand(ZONE.yMin, ZONE.yMax);
}

// Moves an actor toward its target (px-correct), then makes it idle for a bit.
function stepActor(a, dt, size, buildings, isBandit) {
  if (a.wait > 0) {
    a.wait -= dt;
    a.moving = false;
    return;
  }
  if (a.tx == null || a.ty == null) pickTarget(a, buildings);

  const dxp = ((a.tx - a.x) * size.w) / 100;
  const dyp = ((a.ty - a.y) * size.h) / 100;
  const dist = Math.hypot(dxp, dyp);
  const slow = !isBandit && a.happiness < 30 ? 0.6 : 1;
  const step = (a.speed * SPEED_PX * slow * dt) / 1000;

  if (dist <= step) {
    a.x = a.tx;
    a.y = a.ty;
    a.tx = null;
    a.wait = isBandit ? rand(200, 900) : rand(900, 4200);
    a.moving = false;
    return;
  }
  a.x += ((dxp / dist) * step * 100) / size.w;
  a.y += ((dyp / dist) * step * 100) / size.h;
  if (Math.abs(dxp) > 1) a.direction = dxp > 0 ? 1 : -1;
  a.moving = true;
}

function applyToDom(prefix, a) {
  const el = document.getElementById(`${prefix}-${a.id}`);
  if (!el) return;
  el.style.left = `${a.x}%`;
  el.style.top = `${a.y}%`;
  el.style.zIndex = Math.floor(a.y);
  el.style.setProperty('--flip', a.direction === -1 ? -1 : 1);
  el.dataset.moving = a.moving ? '1' : '0';
}

const RAIN_DROPS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  left: (i * 37) % 100,
  delay: -((i * 13) % 10) / 10,
  dur: 0.55 + ((i * 7) % 5) / 10,
}));

export default function CityCanvas() {
  const { state, dispatch } = useCivilization();
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 1000, h: 560 });
  const localPopRef = useRef([...state.population]);
  const localBanditsRef = useRef([...(state.bandits || [])]);
  const buildingsRef = useRef(state.buildings);
  const popRef = useRef(state.population);
  const customMsgsRef = useRef(state.customMessages || []);

  const [bubbleStates, setBubbleStates] = useState({});
  const [customInput, setCustomInput] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const bubbleTimers = useRef({});

  // Keep refs in sync with reducer state
  useEffect(() => {
    popRef.current = state.population;
    localPopRef.current = [...state.population];
  }, [state.population]);
  useEffect(() => { localBanditsRef.current = [...(state.bandits || [])]; }, [state.bandits]);
  useEffect(() => { buildingsRef.current = state.buildings; }, [state.buildings]);
  useEffect(() => { customMsgsRef.current = state.customMessages || []; }, [state.customMessages]);

  // Track canvas pixel size for px-accurate movement
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) sizeRef.current = { w: width, h: height };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animation loop (60fps via direct DOM writes)
  useEffect(() => {
    let raf;
    let last = performance.now();
    const loop = (time) => {
      const dt = Math.min(time - last, 50);
      last = time;
      const size = sizeRef.current;
      const buildings = buildingsRef.current;
      for (const p of localPopRef.current) {
        stepActor(p, dt, size, buildings, false);
        applyToDom('stickman', p);
      }
      for (const b of localBanditsRef.current) {
        stepActor(b, dt, size, buildings, true);
        applyToDom('bandit', b);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const say = useCallback((id, msg) => {
    setBubbleStates(prev => ({ ...prev, [id]: msg }));
    clearTimeout(bubbleTimers.current[id]);
    bubbleTimers.current[id] = setTimeout(() => {
      setBubbleStates(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 3500);
  }, []);

  const pickMessage = useCallback((stickman) => {
    const custom = customMsgsRef.current;
    if (custom.length > 0 && Math.random() < 0.4) return custom[Math.floor(Math.random() * custom.length)];
    const pool = stickman.happiness < 50 ? UNHAPPY_MESSAGES : MOTIVATIONAL_MESSAGES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  // Random speech bubbles
  useEffect(() => {
    const interval = setInterval(() => {
      const pop = popRef.current;
      if (pop.length === 0) return;
      const s = pop[Math.floor(Math.random() * pop.length)];
      say(s.id, pickMessage(s));
    }, 4500);
    return () => {
      clearInterval(interval);
      Object.values(bubbleTimers.current).forEach(clearTimeout);
    };
  }, [say, pickMessage]);

  const handleTalk = useCallback((id) => {
    const s = popRef.current.find(p => p.id === id);
    if (s) say(id, pickMessage(s));
  }, [say, pickMessage]);

  // Idle penalty: while no pomodoro is running happiness slowly decays
  useEffect(() => {
    if (state.pomodoroPhase !== 'idle') return;
    const decay = setInterval(() => dispatch({ type: 'DECAY_HAPPINESS' }), 60000);
    return () => clearInterval(decay);
  }, [state.pomodoroPhase, dispatch]);

  const avgHappiness = state.population.length > 0
    ? Math.round(state.population.reduce((s, p) => s + p.happiness, 0) / state.population.length)
    : 100;

  const handleAddCustomMessage = (e) => {
    e.preventDefault();
    if (customInput.trim()) {
      dispatch({ type: 'ADD_CUSTOM_MESSAGE', message: customInput.trim() });
      setCustomInput('');
      setIsInputVisible(false);
    }
  };

  const rain = useMemo(() => RAIN_DROPS, []);

  return (
    <div className={`city-canvas weather-${state.weather}`} ref={canvasRef}>
      <div className="field-bg" />
      <div className="field-path path-h" />
      <div className="field-path path-v" />
      <div className="field-plaza" />

      <div className="cloud cloud-1" />
      <div className="cloud cloud-2" />
      <div className="cloud cloud-3" />

      <Scenery />

      {state.buildings.map(b => (
        <SceneBuilding key={b.uid} building={b} />
      ))}

      {state.population.length === 0 && (
        <div className="empty-city-hint">
          <Users size={48} />
          <p>Görevleri tamamla,<br />halkını büyüt!</p>
        </div>
      )}

      {state.population.map(s => (
        <StickmanCharacter
          key={s.id}
          stickman={s}
          bubbleMessage={bubbleStates[s.id] || null}
          onTalk={handleTalk}
        />
      ))}

      {(state.bandits || []).map(b => (
        <StickmanCharacter key={b.id} stickman={b} isBandit />
      ))}

      {state.weather === 'storm' && (
        <div className="rain" aria-hidden="true">
          {rain.map(d => (
            <i key={d.id} style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }} />
          ))}
        </div>
      )}

      {/* Weather badge */}
      {state.weather !== 'clear' && (
        <div className={`weather-badge ${state.weather}`}>
          {state.weather === 'storm' ? <><CloudRain size={14} /> Fırtına</> : <><Sun size={14} /> Altın Çağ (+%50 altın)</>}
        </div>
      )}

      {avgHappiness < 40 && state.population.length > 0 && (
        <div className="unhappy-banner">
          <AlertTriangle size={14} /> Halk mutsuz! Pomodoro başlat!
        </div>
      )}

      <div className="note-ui">
        {isInputVisible ? (
          <form onSubmit={handleAddCustomMessage} className="note-form">
            <input
              type="text"
              autoFocus
              maxLength={60}
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="Şehre bir not bırak..."
            />
            <button type="submit" className="note-send">Gönder</button>
            <button type="button" className="note-cancel" onClick={() => setIsInputVisible(false)}>İptal</button>
          </form>
        ) : (
          <button className="note-fab" onClick={() => setIsInputVisible(true)} title="Şehre Not Bırak">
            <MessageCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
