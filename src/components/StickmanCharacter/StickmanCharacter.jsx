import React, { useMemo } from 'react';
import * as Icons from 'lucide-react';
import { useCivilization } from '../../store/CivilizationContext.jsx';

export default function StickmanCharacter({ stickman, bubbleMessage, freeRoam, isBandit }) {
  const { x, y, direction, happiness, isLeaving, profession } = stickman;
  const { dispatch } = useCivilization();

  const isFlipped = direction === -1;
  const isSad = happiness < 50;

  const color = isBandit ? 'var(--red)' : (isLeaving ? 'var(--text-muted)' : 'var(--text-primary)');
  const strokeW = 4;
  
  // Animation duration
  const walkDur = isBandit ? '0.25s' : (happiness > 60 ? '0.35s' : '0.6s');

  const posStyle = freeRoam
    ? { left: `${x}%`, top: `${y}%`, zIndex: Math.floor(y), transform: `translate(-50%, -100%)`, '--flip': isFlipped ? -1 : 1 }
    : { left: `${x}%`, bottom: `${100 - y}%`, zIndex: Math.floor(y), transform: `translate(-50%, 0)`, '--flip': isFlipped ? -1 : 1 };

  let ProfIcon = Icons.User;
  if (!isBandit && profession) {
    ProfIcon = Icons[profession.iconName] || Icons.User;
  }

  const handleBanditClick = () => {
    if (isBandit) {
      dispatch({ type: 'BANISH_BANDIT', id: stickman.id });
    }
  };

  return (
    <div 
      id={isBandit ? `bandit-${stickman.id}` : `stickman-${stickman.id}`}
      className={`stickman-wrapper ${isLeaving ? 'leaving' : ''} ${isBandit ? 'bandit' : ''}`} 
      style={{ ...posStyle, cursor: isBandit ? 'pointer' : 'default', '--walk-dur': walkDur }}
      title={isBandit ? "Hırsızı Kov!" : `${stickman.name} - ${happiness}% Mutlu`}
      onClick={handleBanditClick}
    >
      
      {/* Speech Bubble (only if not bandit) */}
      {!isBandit && bubbleMessage && (
        <div className="speech-bubble">
          {bubbleMessage}
        </div>
      )}

      {/* Name / Info Tag (only if not bandit) */}
      {!isBandit && !bubbleMessage && freeRoam && (
        <div className="stickman-info-tag">
          <span className="info-name">{stickman.name}</span>
          <div className="info-bar">
            <div className="info-fill" style={{ 
              width: `${happiness}%`, 
              background: happiness > 60 ? 'var(--green)' : happiness > 30 ? 'var(--gold)' : 'var(--red)' 
            }} />
          </div>
        </div>
      )}

      {/* The SVG Stickman */}
      <svg width="32" height="50" viewBox="0 0 32 50" style={{ transform: 'scaleX(var(--flip, 1))', transformOrigin: 'center', overflow: 'visible' }}>
        {/* Shadow */}
        <ellipse cx="16" cy="48" rx="10" ry="2" fill="rgba(0,0,0,0.3)" />

        <g className="stickman-g">
          {/* Head */}
          <circle cx="16" cy="12" r="7" fill="var(--bg-card)" stroke={color} strokeWidth={strokeW} />
          
          {/* Face */}
          {!isBandit ? (
            <g className="face">
              <circle cx="18" cy="10" r="1.2" fill={color} />
              <circle cx="13" cy="10" r="1.2" fill={color} />
              {isSad ? (
                <path d="M 13 14 Q 16 12 19 14" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M 13 13 Q 16 15 19 13" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
              )}
            </g>
          ) : (
            <g className="bandit-face">
              {/* Bandit Mask - aligned with head at cy=12 */}
              <rect x="9" y="8" width="14" height="6" fill={color} rx="3" />
              <circle cx="13" cy="11" r="1.5" fill="white" />
              <circle cx="19" cy="11" r="1.5" fill="white" />
              {/* Menacing grin */}
              <path d="M 12 16 Q 16 19 20 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}

          {/* Body */}
          <line x1="16" y1="19" x2="16" y2="33" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />

          {/* Arms */}
          <line x1="16" y1="23" x2="9"  y2="30" stroke={color} strokeWidth={strokeW} strokeLinecap="round" className="arm-l" />
          <line x1="16" y1="23" x2="23" y2="30" stroke={color} strokeWidth={strokeW} strokeLinecap="round" className="arm-r" />

          {/* Legs */}
          <line x1="16" y1="33" x2="10" y2="46" stroke={color} strokeWidth={strokeW} strokeLinecap="round" className="leg-l" />
          <line x1="16" y1="33" x2="22" y2="46" stroke={color} strokeWidth={strokeW} strokeLinecap="round" className="leg-r" />
        </g>
      </svg>

      {/* Profession icon badge */}
      {!isBandit && profession && (
        <div style={{
          position: 'absolute',
          top: -6,
          right: -8,
          background: 'var(--bg-card)',
          borderRadius: '50%',
          padding: '2px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ProfIcon size={10} color={profession.color} />
        </div>
      )}
    </div>
  );
}
