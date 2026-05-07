import React from 'react';
import { useCivilization } from '../../store/CivilizationContext.jsx';
import { BUILDINGS } from '../../data/buildings.js';
import { Hammer, Coins, Calendar, PartyPopper, Zap, AlertCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function BuildingPanel() {
  const { state, dispatch } = useCivilization();

  const handleBuy = (building) => {
    if (state.gold < building.cost) return;
    dispatch({ type: 'BUY_BUILDING', building });
  };

  const ratio = state.todayTarget > 0
    ? Math.min(1, state.todayCompleted / state.todayTarget)
    : 0;

  const ownedCounts = BUILDINGS.reduce((acc, b) => {
    acc[b.id] = state.buildings.filter(sb => sb.id === b.id).length;
    return acc;
  }, {});

  return (
    <div className="building-panel">
      <span className="panel-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Hammer size={16} /> İnşaat
      </span>

      <div className="buildings-scroll">
        {BUILDINGS.map(b => {
          const canAfford = state.gold >= b.cost;
          const owned = ownedCounts[b.id] || 0;
          const BuildingIcon = Icons[b.iconName] || Icons.Box;

          return (
            <div
              key={b.id}
              className={`building-card ${!canAfford ? 'cannot-afford' : ''}`}
              onClick={() => handleBuy(b)}
              title={canAfford ? `${b.name} satın al` : `Yetersiz altın (${b.cost - state.gold} daha lazım)`}
            >
              {owned > 0 && <span className="building-owned">×{owned}</span>}
              <span className="building-emoji"><BuildingIcon size={28} color={b.color} /></span>
              <span className="building-name">{b.name}</span>
              <span className="building-desc">{b.description}</span>
              <span className="building-cost">
                <Coins size={12} /> {b.cost}
              </span>
            </div>
          );
        })}
      </div>

      {/* Today's progress */}
      <div className="progress-section">
        <span className="progress-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={14} /> Bugün: {state.todayCompleted}/{state.todayTarget} görev
        </span>
        <div className="progress-bar-wrap">
          <div
            className="progress-bar-fill"
            style={{
              width: `${ratio * 100}%`,
              background: ratio >= 0.8
                ? 'linear-gradient(90deg, var(--green-dim), var(--green))'
                : ratio >= 0.5
                ? 'linear-gradient(90deg, var(--gold-dim), var(--gold))'
                : 'linear-gradient(90deg, var(--red), var(--orange))',
            }}
          />
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {ratio >= 0.8 ? <><PartyPopper size={12}/> Harika gidiyor!</> : ratio >= 0.5 ? <><Zap size={12}/> Devam et!</> : <><AlertCircle size={12}/> Daha hızlı!</>}
        </span>
      </div>
    </div>
  );
}
