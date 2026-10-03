import { useEffect, useRef } from 'react';
import { useCivilization } from '../store/CivilizationContext.jsx';

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.17);
    });
    setTimeout(() => ctx.close(), 800);
  } catch (e) {}
}

export function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function usePomodoro() {
  const { state, dispatch } = useCivilization();
  const prevPhase = useRef(state.pomodoroPhase);

  // Ticking: remaining time is derived from a timestamp, so a throttled
  // background tab still shows the right value when it wakes up.
  useEffect(() => {
    if (state.pomodoroPhase === 'idle' || state.pomodoroPaused) return;
    const id = setInterval(() => dispatch({ type: 'TICK_POMODORO' }), 500);
    return () => clearInterval(id);
  }, [state.pomodoroPhase, state.pomodoroPaused, dispatch]);

  // Beep on every work<->break switch
  useEffect(() => {
    const prev = prevPhase.current;
    if (prev !== 'idle' && state.pomodoroPhase !== prev && state.pomodoroPhase !== 'idle') beep();
    prevPhase.current = state.pomodoroPhase;
  }, [state.pomodoroPhase]);

  // Show the countdown in the browser tab title
  useEffect(() => {
    if (state.pomodoroPhase === 'idle') {
      document.title = 'StickCity - Şehrini Kur';
      return;
    }
    const label = state.pomodoroPhase === 'work' ? 'Çalışma' : 'Mola';
    document.title = `${formatTime(state.pomodoroSeconds)} · ${label}${state.pomodoroPaused ? ' (duraklatıldı)' : ''}`;
  }, [state.pomodoroPhase, state.pomodoroSeconds, state.pomodoroPaused]);

  return {
    phase: state.pomodoroPhase,
    paused: state.pomodoroPaused,
    seconds: state.pomodoroSeconds,
    activeId: state.activePomodoro,
    workMinutes: state.workMinutes,
    breakMinutes: state.breakMinutes,
    formatted: formatTime(state.pomodoroSeconds),
    start: (todoId) => dispatch({ type: 'START_POMODORO', id: todoId }),
    stop: () => dispatch({ type: 'STOP_POMODORO' }),
    pause: () => dispatch({ type: 'PAUSE_POMODORO' }),
    resume: () => dispatch({ type: 'RESUME_POMODORO' }),
    skipBreak: () => dispatch({ type: 'SKIP_BREAK' }),
    setDurations: (work, rest) => dispatch({ type: 'SET_DURATIONS', work, rest }),
  };
}
