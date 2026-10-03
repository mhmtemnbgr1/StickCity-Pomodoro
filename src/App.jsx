import React from 'react';
import { CivilizationProvider, useCivilization } from './store/CivilizationContext.jsx';
import { CIVILIZATION_LEVELS } from './data/buildings.js';
import TodoPanel from './components/TodoPanel/TodoPanel.jsx';
import CityCanvas from './components/CityCanvas/CityCanvas.jsx';
import BuildingPanel from './components/BuildingPanel/BuildingPanel.jsx';
import DayEndModal from './components/DayEndModal/DayEndModal.jsx';
import Notifications from './components/Notifications/Notifications.jsx';
import { Coins, Users, Smile, Meh, Frown, Timer, Moon } from 'lucide-react';
import * as Icons from 'lucide-react';

function getCivLevel(completedTotal, buildingsCount) {
  let level = CIVILIZATION_LEVELS[0];
  for (const l of CIVILIZATION_LEVELS) {
    if (completedTotal >= l.requiredTodos && buildingsCount >= l.requiredBuildings) {
      level = l;
    }
  }
  return level;
}

function AppInner() {
  const { state, dispatch } = useCivilization();

  const civLevel = getCivLevel(state.completedTodosTotal, state.buildings.length);
  const avgHappiness = state.population.length > 0
    ? Math.round(state.population.reduce((s, p) => s + p.happiness, 0) / state.population.length)
    : 100;

  const handleDayEnd = () => {
    dispatch({ type: 'DAY_END' });
  };

  const LevelIcon = Icons[civLevel.iconName] || Icons.Circle;

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header-bar">
        <h1 className="logo">StickCity</h1>

        <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {LevelIcon && <LevelIcon size={20} color={civLevel.color} />}
          <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: civLevel.color }}>
            {civLevel.name}
          </span>
          {civLevel.level < CIVILIZATION_LEVELS.length && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Sonraki: {CIVILIZATION_LEVELS[civLevel.level]?.requiredTodos} görev
            </span>
          )}
        </div>

        <div className="header-stats">
          <div className="stat-pill gold">
            <Coins size={16} /> <span>{state.gold}</span>
          </div>
          <div className="stat-pill pop">
            <Users size={16} /> <span>{state.population.length}/{state.populationCap}</span>
          </div>
          <div
            className="stat-pill"
            style={{
              borderColor: 'var(--border)',
              color: avgHappiness > 70 ? 'var(--green)' : avgHappiness > 40 ? '#f59e0b' : 'var(--red)',
            }}
          >
            {avgHappiness > 70 ? <Smile size={16} /> : avgHappiness > 40 ? <Meh size={16} /> : <Frown size={16} />}{' '}
            <span>{avgHappiness}%</span>
          </div>
          <div className="stat-pill" style={{ borderColor: 'var(--border)', color: 'var(--purple)' }}>
            <Timer size={16} /> <span>{state.pomodoroCount}</span>
          </div>
          <button
            id="day-end-btn"
            className="day-end-btn"
            onClick={handleDayEnd}
            disabled={state.dayEnded}
            title={state.dayEnded ? 'Bugün zaten bitti' : 'Günü değerlendir'}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Moon size={16} /> Günü Bitir
          </button>
        </div>
      </header>

      {/* Left: Todo Panel */}
      <aside className="left-panel">
        <TodoPanel />
      </aside>

      {/* Center: City Canvas */}
      <main className="city-area">
        <CityCanvas />
      </main>

      {/* Bottom: Building Panel */}
      <footer className="bottom-panel">
        <BuildingPanel />
      </footer>

      {/* Overlays */}
      <DayEndModal />
      <Notifications />
    </div>
  );
}

export default function App() {
  return (
    <CivilizationProvider>
      <AppInner />
    </CivilizationProvider>
  );
}
