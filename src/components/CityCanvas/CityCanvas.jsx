import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCivilization } from '../../store/CivilizationContext.jsx';
import { MOTIVATIONAL_MESSAGES, UNHAPPY_MESSAGES } from '../../data/messages.js';
import StickmanCharacter from '../StickmanCharacter/StickmanCharacter.jsx';
import SceneBuilding from './SceneBuilding.jsx';
import { Users, AlertTriangle, MessageCircle } from 'lucide-react';

// Decorative trees placed randomly around the edges
const TREES = Array.from({ length: 24 }, (_, i) => {
  const isTop = i % 2 === 0;
  const x = 2 + (i * 7) % 96;
  const y = isTop ? 10 + (Math.random() * 15) : 80 + (Math.random() * 15);
  return {
    id: i,
    x,
    y,
    scale: 0.7 + (i % 3) * 0.2,
  };
});

export default function CityCanvas() {
  const { state, dispatch } = useCivilization();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const populationRef = useRef(state.population);
  const banditsRef = useRef(state.bandits || []);
  const [localPop, setLocalPop] = useState(state.population);
  const [localBandits, setLocalBandits] = useState(state.bandits || []);
  const [bubbleStates, setBubbleStates] = useState({}); // id -> message
  const customMsgsRef = useRef(state.customMessages || []);
  const [customInput, setCustomInput] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);

  const localPopRef = useRef([...state.population]);
  const localBanditsRef = useRef([...(state.bandits || [])]);

  // Sync population and bandits from state
  useEffect(() => {
    populationRef.current = state.population;
    localPopRef.current = [...state.population];
    setLocalPop(state.population);
  }, [state.population]);

  useEffect(() => {
    banditsRef.current = state.bandits || [];
    localBanditsRef.current = [...(state.bandits || [])];
    setLocalBandits(state.bandits || []);
  }, [state.bandits]);

  useEffect(() => {
    customMsgsRef.current = state.customMessages || [];
  }, [state.customMessages]);

  // Animation loop for stickman movement (Smooth 60FPS via DOM refs)
  useEffect(() => {
    let lastTime = performance.now();
    
    const loop = (time) => {
      const dt = time - lastTime;
      // Cap dt to prevent massive jumps when tab is inactive
      const delta = Math.min(dt, 50); 
      lastTime = time;
      
      // Update stickmen
      if (localPopRef.current.length > 0) {
        localPopRef.current.forEach(p => {
          p.x += p.direction * p.speed * (delta / 50);
          p.vy = p.vy || 0;
          p.y += p.vy * (delta / 50);

          if (p.x < 4) { p.x = 4; p.direction = 1; }
          if (p.x > 96) { p.x = 96; p.direction = -1; }
          if (p.y < 15) { p.y = 15; p.vy = Math.abs(p.vy) * 0.8; }
          if (p.y > 90) { p.y = 90; p.vy = -Math.abs(p.vy) * 0.8; }
          if (Math.random() < 0.01) p.vy = (Math.random() - 0.5) * 0.12;

          const el = document.getElementById(`stickman-${p.id}`);
          if (el) {
            el.style.left = `${p.x}%`;
            el.style.top = `${p.y}%`;
            el.style.zIndex = Math.floor(p.y);
            el.style.transform = `translate(-50%, -100%)`;
            el.style.setProperty('--flip', p.direction === -1 ? -1 : 1);
          }
        });
      }

      // Update bandits
      if (localBanditsRef.current.length > 0) {
        localBanditsRef.current.forEach(b => {
          b.x += b.direction * b.speed * (delta / 50);
          
          if (b.x < 4) { b.x = 4; b.direction = 1; }
          if (b.x > 96) { b.x = 96; b.direction = -1; }

          const el = document.getElementById(`bandit-${b.id}`);
          if (el) {
            el.style.left = `${b.x}%`;
            el.style.top = `${b.y}%`;
            el.style.zIndex = Math.floor(b.y);
            el.style.transform = `translate(-50%, -100%)`;
            el.style.setProperty('--flip', b.direction === -1 ? -1 : 1);
          }
        });
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Random speech bubbles
  useEffect(() => {
    const showBubble = () => {
      const pop = populationRef.current;
      if (pop.length === 0) return;
      const stickman = pop[Math.floor(Math.random() * pop.length)];
      
      let msg;
      const customMsgs = customMsgsRef.current;
      // 40% chance to show a custom message if available
      if (customMsgs.length > 0 && Math.random() < 0.4) {
        msg = customMsgs[Math.floor(Math.random() * customMsgs.length)];
      } else {
        const msgs = stickman.happiness < 50 ? UNHAPPY_MESSAGES : MOTIVATIONAL_MESSAGES;
        msg = msgs[Math.floor(Math.random() * msgs.length)];
      }

      setBubbleStates(prev => ({ ...prev, [stickman.id]: msg }));
      setTimeout(() => {
        setBubbleStates(prev => {
          const next = { ...prev };
          delete next[stickman.id];
          return next;
        });
      }, 3500);
    };

    const interval = setInterval(showBubble, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  // Idle Penalty: If not working, happiness decays over time
  useEffect(() => {
    if (state.pomodoroPhase !== 'idle') return;
    
    // Every 60 seconds of idle time, happiness decays by 1
    const decayInterval = setInterval(() => {
      dispatch({ type: 'DECAY_HAPPINESS' });
    }, 60000);

    return () => clearInterval(decayInterval);
  }, [state.pomodoroPhase, dispatch]);

  const avgHappiness = localPop.length > 0
    ? Math.round(localPop.reduce((s, p) => s + p.happiness, 0) / localPop.length)
    : 100;

  const handleAddCustomMessage = (e) => {
    e.preventDefault();
    if (customInput.trim()) {
      dispatch({ type: 'ADD_CUSTOM_MESSAGE', message: customInput.trim() });
      setCustomInput('');
      setIsInputVisible(false);
    }
  };

  return (
    <div className={`city-canvas weather-${state.weather}`} ref={canvasRef}>
      {/* Green field background */}
      <div className="field-bg" />

      {/* Dirt paths */}
      <div className="field-path path-h" />
      <div className="field-path path-v" />

      {/* Decorative trees */}
      {TREES.map(t => (
        <div
          key={t.id}
          className="deco-tree"
          style={{ left: `${t.x}%`, top: `${t.y}%`, zIndex: Math.floor(t.y), transform: `translate(-50%,-100%) scale(${t.scale})` }}
        >
          <div className="tree-crown" />
          <div className="tree-trunk" />
        </div>
      ))}

      {/* Scene buildings */}
      {state.buildings.map(b => (
        <SceneBuilding key={b.uid} building={b} />
      ))}

      {/* Empty hint */}
      {localPop.length === 0 && (
        <div className="empty-city-hint">
          <div className="hint-icon" style={{ display: 'flex', justifyContent: 'center' }}>
            <Users size={48} color="var(--text-muted)" />
          </div>
          <p>Görevleri tamamla,<br />halkını büyüt!</p>
        </div>
      )}

      {/* Stickmen — freely roaming the field */}
      {localPop.map(stickman => (
        <StickmanCharacter
          key={stickman.id}
          stickman={stickman}
          bubbleMessage={bubbleStates[stickman.id] || null}
          freeRoam
        />
      ))}

      {/* Bandits */}
      {localBandits.map(bandit => (
        <StickmanCharacter
          key={bandit.id}
          stickman={bandit}
          freeRoam
          isBandit
        />
      ))}

      {/* Happiness overlay */}
      {avgHappiness < 40 && localPop.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 8, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 20,
          padding: '4px 14px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--red)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 100
        }}>
          <AlertTriangle size={14} /> Halk mutsuz! Görevleri tamamla!
        </div>
      )}

      {/* Custom Note UI */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 100 }}>
        {isInputVisible ? (
          <form onSubmit={handleAddCustomMessage} style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              autoFocus
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="Şehre bir not bırak..."
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font)',
                fontSize: '0.75rem',
                outline: 'none',
                boxShadow: '2px 2px 0px var(--border)'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--border)',
                background: 'var(--green)',
                color: 'white',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                fontWeight: 700,
                boxShadow: '2px 2px 0px var(--border)'
              }}
            >
              Gönder
            </button>
            <button
              type="button"
              onClick={() => setIsInputVisible(false)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                fontWeight: 700,
                boxShadow: '2px 2px 0px var(--border)'
              }}
            >
              İptal
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsInputVisible(true)}
            title="Şehre Not Bırak"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '2px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              boxShadow: '2px 2px 0px var(--border)',
              transition: 'transform 0.1s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translate(-1px, -1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translate(0, 0)'}
          >
            <MessageCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
