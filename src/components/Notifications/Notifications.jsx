import React from 'react';
import { useCivilization } from '../../store/CivilizationContext.jsx';

export default function Notifications() {
  const { state, dispatch } = useCivilization();
  if (state.notifications.length === 0) return null;

  return (
    <div className="notifications-container">
      {state.notifications.slice(0, 4).map(n => (
        <div
          key={n.id}
          className={`notification ${n.type || ''}`}
          onClick={() => dispatch({ type: 'DISMISS_NOTIFICATION', id: n.id })}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
