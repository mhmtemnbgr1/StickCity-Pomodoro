import React, { useState } from 'react';
import { useCivilization } from '../../store/CivilizationContext.jsx';
import { usePomodoro } from '../../hooks/usePomodoro.js';
import { ClipboardList, Coins, Target, CheckCircle, Smile, Building2, Timer, Check, X, Coffee, Play, Square, Pause, SkipForward } from 'lucide-react';

const DIFFICULTY_LABELS = { easy: 'Kolay', normal: 'Normal', hard: 'Zor' };
const DIFFICULTY_GOLD = { easy: 30, normal: 50, hard: 80 };

export default function TodoPanel() {
  const { state, dispatch } = useCivilization();
  const pomodoro = usePomodoro();
  const [input, setInput] = useState('');
  const [difficulty, setDifficulty] = useState('normal');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    dispatch({ type: 'ADD_TODO', title: input.trim(), difficulty });
    setInput('');
  };

  const handleComplete = (id) => {
    dispatch({ type: 'COMPLETE_TODO', id });
    if (pomodoro.activeId === id) pomodoro.stop();
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_TODO', id });
    if (pomodoro.activeId === id) pomodoro.stop();
  };

  const handlePomodoro = (id) => {
    if (pomodoro.activeId === id) {
      pomodoro.stop();
    } else {
      pomodoro.start(id);
    }
  };

  const pending = state.todos.filter(t => !t.completed);
  const done = state.todos.filter(t => t.completed);

  return (
    <div className="todo-panel">
      {/* Header with form */}
      <div className="panel-header">
        <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClipboardList size={16} /> Görevler
        </span>
        <form className="add-todo-form" onSubmit={handleAdd}>
          <input
            id="todo-input"
            className="todo-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Yeni görev ekle..."
          />
          <div className="difficulty-row">
            {['easy', 'normal', 'hard'].map(d => (
              <button
                key={d}
                type="button"
                className={`diff-btn ${d} ${difficulty === d ? 'active' : ''}`}
                onClick={() => setDifficulty(d)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                {DIFFICULTY_LABELS[d]} <div style={{display: 'flex', alignItems: 'center', gap: 2}}><Coins size={12}/>{DIFFICULTY_GOLD[d]}</div>
              </button>
            ))}
          </div>
          <button id="add-todo-btn" className="add-btn" type="submit">+ Görev Ekle</button>
        </form>
      </div>

      {/* Target */}
      <div className="target-input-wrap">
        <span className="target-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Target size={14} /> Günlük Hedef:
        </span>
        <input
          type="number"
          className="target-input"
          value={state.todayTarget}
          min={1}
          max={50}
          onChange={e => dispatch({ type: 'UPDATE_TARGET', target: parseInt(e.target.value) || 1 })}
        />
        <span className="today-completed-count" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {state.todayCompleted}/{state.todayTarget} bugün <CheckCircle size={14} />
        </span>
      </div>

      {/* Happiness */}
      {state.population.length > 0 && (
        <div className="happiness-section">
          {(() => {
            const avg = state.population.length > 0
              ? Math.round(state.population.reduce((s, p) => s + p.happiness, 0) / state.population.length)
              : 100;
            const color = avg > 70 ? 'var(--green)' : avg > 40 ? 'var(--gold)' : 'var(--red)';
            return (
              <div className="happiness-row">
                <span className="happiness-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Smile size={14} /> Mutluluk
                </span>
                <div className="happiness-track">
                  <div className="happiness-fill" style={{ width: `${avg}%`, background: color }} />
                </div>
                <span className="happiness-pct" style={{ color }}>{avg}%</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Todo list */}
      <div className="todo-list">
        {pending.length === 0 && done.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '0.85rem' }}>
            Henüz görev yok.<br />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
              İlk görevini ekle ve şehrini kur! <Building2 size={16} />
            </div>
          </div>
        )}

        {pending.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            isActivePomodoro={pomodoro.activeId === todo.id}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onPomodoro={handlePomodoro}
            goldBonus={state.goldBonus}
          />
        ))}

        {done.length > 0 && (
          <>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 2px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={14} /> Tamamlananlar ({done.length})
            </div>
            {done.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isActivePomodoro={false}
                onComplete={() => {}}
                onDelete={handleDelete}
                onPomodoro={() => {}}
                goldBonus={state.goldBonus}
              />
            ))}
          </>
        )}
      </div>

      {/* Pomodoro bar at bottom */}
      <PomodoroBar pomodoro={pomodoro} todos={state.todos} />
    </div>
  );
}

function TodoItem({ todo, isActivePomodoro, onComplete, onDelete, onPomodoro, goldBonus }) {
  const goldEarned = Math.floor(
    (todo.difficulty === 'hard' ? 80 : todo.difficulty === 'easy' ? 30 : 50) * (1 + goldBonus)
  );

  return (
    <div className={`todo-item ${todo.difficulty} ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-top">
        <span className="todo-title">{todo.title}</span>
        <div className="todo-actions">
          {!todo.completed && (
            <>
              <button
                className={`icon-btn pomodoro ${isActivePomodoro ? 'active-pomodoro' : ''}`}
                onClick={() => onPomodoro(todo.id)}
                title={isActivePomodoro ? 'Pomodoro Durdur' : 'Pomodoro Başlat'}
              >
                {isActivePomodoro ? <Square size={14} /> : <Play size={14} />}
              </button>
              <button
                className="icon-btn complete"
                onClick={() => onComplete(todo.id)}
                title="Tamamla"
              >
                <Check size={16} />
              </button>
            </>
          )}
          <button
            className="icon-btn delete"
            onClick={() => onDelete(todo.id)}
            title="Sil"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="todo-meta">
        <span className={`difficulty-badge ${todo.difficulty}`}>{DIFFICULTY_LABELS[todo.difficulty]}</span>
        <span className="gold-reward" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          +{goldEarned} <Coins size={10} />
        </span>
      </div>
      {!todo.completed && todo.pomodorosNeeded > 1 && (
        <div className="pomodoro-dots">
          {Array.from({ length: todo.pomodorosNeeded }).map((_, i) => (
            <div key={i} className={`pomodoro-dot ${i < todo.pomodorosDone ? 'done' : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function PomodoroBar({ pomodoro, todos }) {
  const totalSecs = (pomodoro.phase === 'work' ? pomodoro.workMinutes : pomodoro.breakMinutes) * 60;
  const progress = ((totalSecs - pomodoro.seconds) / totalSecs) * 100;
  const activeTodo = todos.find(t => t.id === pomodoro.activeId);

  if (pomodoro.phase === 'idle') {
    const presets = [[15, 3], [25, 5], [50, 10]];
    return (
      <div className="pomodoro-bar">
        <div className="pomodoro-inactive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Timer size={14} /> Bir görevde ▶ tuşuna bas
        </div>
        <div className="duration-row">
          {presets.map(([w, r]) => (
            <button
              key={w}
              type="button"
              className={`duration-chip ${pomodoro.workMinutes === w ? 'active' : ''}`}
              onClick={() => pomodoro.setDurations(w, r)}
            >
              {w}/{r} dk
            </button>
          ))}
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 20;
  const strokeDash = circumference * (1 - progress / 100);

  return (
    <div className="pomodoro-bar">
      <div className="pomodoro-active">
        <svg className="progress-ring" width="48" height="48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--bg-hover)" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke={pomodoro.phase === 'work' ? 'var(--red)' : 'var(--green)'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '24px 24px', transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className={`pomodoro-phase-badge ${pomodoro.phase}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {pomodoro.phase === 'work' ? <Timer size={12} /> : <Coffee size={12} />}
            {pomodoro.phase === 'work' ? 'Çalışma' : 'Mola'}{pomodoro.paused ? ' · Duraklatıldı' : ''}
          </span>
          {activeTodo && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeTodo.title}
            </div>
          )}
        </div>
        <span className="pomodoro-time">{pomodoro.formatted}</span>
      </div>
      <div className="pomodoro-controls">
        {pomodoro.paused ? (
          <button className="ctl-btn" onClick={pomodoro.resume}><Play size={12} /> Devam</button>
        ) : (
          <button className="ctl-btn" onClick={pomodoro.pause}><Pause size={12} /> Duraklat</button>
        )}
        {pomodoro.phase === 'break' && (
          <button className="ctl-btn" onClick={pomodoro.skipBreak}><SkipForward size={12} /> Molayı Atla</button>
        )}
        <button className="stop-btn" onClick={pomodoro.stop} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Square size={12} /> Durdur
        </button>
      </div>
    </div>
  );
}