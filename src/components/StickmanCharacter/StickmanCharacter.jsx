import React from 'react';
import { useCivilization } from '../../store/CivilizationContext.jsx';

const INK = '#1b1d2b';
const SKIN = '#ffe0b5';

// Hat / accessory per profession, drawn on a head centred at (20,13) r=8
function Accessory({ name }) {
  switch (name) {
    case 'Çiftçi':
      return (
        <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
          <ellipse cx="20" cy="8" rx="12" ry="3" fill="#f2c94c" />
          <path d="M13 8 Q13 0 20 0 Q27 0 27 8 Z" fill="#f2c94c" />
          <rect x="13" y="6" width="14" height="2" fill="#c0392b" stroke="none" />
        </g>
      );
    case 'Doktor':
      return (
        <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M12.5 8 Q12.5 1 20 1 Q27.5 1 27.5 8 Z" fill="#fff" />
          <rect x="19" y="2.5" width="2" height="5" fill="#e5383b" stroke="none" />
          <rect x="17.5" y="4" width="5" height="2" fill="#e5383b" stroke="none" />
        </g>
      );
    case 'Mühendis':
      return (
        <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M12 8 Q12 0 20 0 Q28 0 28 8 Z" fill="#ffd43b" />
          <rect x="10.5" y="7" width="19" height="2.5" rx="1.2" fill="#fab005" />
          <rect x="18.5" y="0.5" width="3" height="5" fill="#fab005" stroke="none" />
        </g>
      );
    case 'Tüccar':
      return (
        <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
          <rect x="11" y="6.5" width="18" height="2.5" rx="1" fill="#5c3b1e" />
          <rect x="14" y="-3" width="12" height="10" rx="1.5" fill="#6d4624" />
          <rect x="14" y="2.5" width="12" height="2.2" fill="#f2c94c" stroke="none" />
        </g>
      );
    case 'Asker':
      return (
        <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M11.5 10 Q11.5 0 20 0 Q28.5 0 28.5 10 L26 10 L26 7.5 L14 7.5 L14 10 Z" fill="#6b7f4f" />
          <rect x="12" y="7" width="16" height="2" fill="#4c5b38" stroke="none" />
        </g>
      );
    case 'Öğretmen':
      return (
        <g fill="none" stroke={INK} strokeWidth="1.4">
          <circle cx="16.5" cy="13" r="3" fill="rgba(255,255,255,0.45)" />
          <circle cx="23.5" cy="13" r="3" fill="rgba(255,255,255,0.45)" />
          <line x1="19.5" y1="13" x2="20.5" y2="13" />
          <path d="M12 6 Q20 -1 28 6 Q20 3 12 6 Z" fill="#7a4d24" />
        </g>
      );
    case 'Mimar':
      return (
        <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
          <ellipse cx="22" cy="5.5" rx="10" ry="4" fill="#4dabf7" />
          <circle cx="22" cy="1.5" r="1.4" fill="#4dabf7" />
        </g>
      );
    default:
      return (
        <path d="M12.5 9 Q13 2 20 2 Q27 2 27.5 9 Q20 5 12.5 9 Z" fill="#5a3d24" stroke={INK} strokeWidth="1.2" />
      );
  }
}

function StickmanCharacter({ stickman, bubbleMessage, isBandit, onTalk }) {
  const { x, y, direction, happiness, isLeaving, profession } = stickman;
  const { dispatch } = useCivilization();

  const isSad = !isBandit && happiness < 50;
  const isVerySad = !isBandit && happiness < 25;
  const shirt = isBandit ? '#2b2d3a' : (profession?.color || '#89b4fa');
  const walkDur = isBandit ? '0.28s' : happiness > 60 ? '0.4s' : '0.65s';

  const handleClick = () => {
    if (isBandit) dispatch({ type: 'BANISH_BANDIT', id: stickman.id });
    else if (onTalk) onTalk(stickman.id);
  };

  return (
    <div
      id={isBandit ? `bandit-${stickman.id}` : `stickman-${stickman.id}`}
      className={`stickman-wrapper${isLeaving ? ' leaving' : ''}${isBandit ? ' bandit' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        zIndex: Math.floor(y),
        '--flip': direction === -1 ? -1 : 1,
        '--walk-dur': walkDur,
      }}
      onClick={handleClick}
    >
      {!isBandit && bubbleMessage && <div className="speech-bubble">{bubbleMessage}</div>}

      {isBandit ? (
        <div className="stickman-info-tag bandit-tag">Hırsız! Tıkla ve kov</div>
      ) : (
        !bubbleMessage && (
          <div className="stickman-info-tag">
            <span className="info-name">{stickman.name}</span>
            <span className="info-prof">{profession?.name}</span>
            <div className="info-bar">
              <div
                className="info-fill"
                style={{
                  width: `${happiness}%`,
                  background: happiness > 60 ? 'var(--green)' : happiness > 30 ? 'var(--gold)' : 'var(--red)',
                }}
              />
            </div>
          </div>
        )
      )}

      <svg className="stickman-svg" width="40" height="60" viewBox="0 0 40 60" overflow="visible">
        <ellipse className="stick-shadow" cx="20" cy="57" rx="11" ry="2.6" fill="rgba(0,0,0,0.28)" />

        <g className="stick-body">
          {/* back arm */}
          <g className="arm arm-r" style={{ transformOrigin: '20px 25px' }}>
            <line x1="20" y1="25" x2="20" y2="37" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
            {isBandit && (
              <g>
                <path d="M16 36 Q20 33 24 36 L25 44 Q20 47 15 44 Z" fill="#c9a227" stroke={INK} strokeWidth="1.4" />
                <text x="20" y="43" fontSize="6" fontWeight="800" textAnchor="middle" fill={INK}>$</text>
              </g>
            )}
          </g>

          {/* legs */}
          <g className="leg leg-l" style={{ transformOrigin: '20px 38px' }}>
            <line x1="20" y1="38" x2="20" y2="54" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
            <line x1="20" y1="55" x2="24.5" y2="55" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
          </g>
          <g className="leg leg-r" style={{ transformOrigin: '20px 38px' }}>
            <line x1="20" y1="38" x2="20" y2="54" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
            <line x1="20" y1="55" x2="24.5" y2="55" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
          </g>

          {/* torso / shirt */}
          <rect x="14.5" y="22" width="11" height="17" rx="4.5" fill={shirt} stroke={INK} strokeWidth="2" />
          {isBandit && (
            <g stroke="#e8e8ee" strokeWidth="1.6">
              <line x1="15.5" y1="27" x2="24.5" y2="27" />
              <line x1="15.5" y1="32" x2="24.5" y2="32" />
            </g>
          )}
          {!isBandit && profession?.name === 'Doktor' && (
            <g fill="#e5383b">
              <rect x="19" y="26" width="2" height="7" rx="0.6" />
              <rect x="16.5" y="28.5" width="7" height="2" rx="0.6" />
            </g>
          )}

          {/* head */}
          <circle cx="20" cy="13" r="8" fill={isBandit ? SKIN : SKIN} stroke={INK} strokeWidth="2.2" />

          {isBandit ? (
            <g>
              <rect x="12.5" y="9.5" width="15" height="5.5" rx="2.5" fill="#15161f" />
              <circle cx="16.5" cy="12.3" r="1.5" fill="#fff" />
              <circle cx="23.5" cy="12.3" r="1.5" fill="#fff" />
              <circle cx="16.8" cy="12.5" r=".7" fill="#e5383b" />
              <circle cx="23.2" cy="12.5" r=".7" fill="#e5383b" />
              <path d="M14.5 8.8 L18.5 10.2 M25.5 8.8 L21.5 10.2" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
              <path d="M16 17.4 Q20 20 24 17.4" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
              {/* beanie */}
              <path d="M11.5 9 Q12 1 20 1 Q28 1 28.5 9 Q20 6 11.5 9 Z" fill="#15161f" stroke={INK} strokeWidth="1.2" />
            </g>
          ) : (
            <g className="face">
              <g className="eyes">
                <ellipse className="eye" cx="16.8" cy="12.5" rx="1.3" ry="1.6" fill={INK} />
                <ellipse className="eye" cx="23.2" cy="12.5" rx="1.3" ry="1.6" fill={INK} />
              </g>
              {isSad ? (
                <path d="M16.5 18 Q20 15.4 23.5 18" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M16.3 16.4 Q20 20 23.7 16.4" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
              )}
              {!isSad && <g fill="#ff9aa8" opacity="0.55"><circle cx="14.3" cy="16" r="1.6" /><circle cx="25.7" cy="16" r="1.6" /></g>}
              {isVerySad && <path className="tear" d="M25 14 q1.4 2.4 0 3.4 q-1.4 -1 0 -3.4z" fill="#74c0fc" />}
              <Accessory name={profession?.name} />
            </g>
          )}

          {/* front arm */}
          <g className="arm arm-l" style={{ transformOrigin: '20px 25px' }}>
            <line x1="20" y1="25" x2="20" y2="37" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default React.memo(StickmanCharacter);
