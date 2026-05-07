import { useEffect, useRef } from 'react';
import { useCivilization } from '../store/CivilizationContext.jsx';

export function usePomodoro() {
  const { state, dispatch } = useCivilization();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (state.pomodoroPhase !== 'idle') {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK_POMODORO' });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [state.pomodoroPhase, dispatch]);

  const start = (todoId) => dispatch({ type: 'START_POMODORO', id: todoId });
  const stop = () => dispatch({ type: 'STOP_POMODORO' });

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return {
    phase: state.pomodoroPhase,
    seconds: state.pomodoroSeconds,
    activeId: state.activePomodoro,
    formatted: formatTime(state.pomodoroSeconds),
    start,
    stop,
  };
}
