import React from 'react';
import { useCivilization } from '../../store/CivilizationContext.jsx';
import { ArrowUpCircle } from 'lucide-react';

// SVG building shapes by type
function HouseSmallSVG({ color }) {
  return (
    <svg width="48" height="52" viewBox="0 0 48 52" fill="none">
      <polygon points="24,4 44,24 4,24" fill={color} opacity="0.9" />
      <rect x="6" y="24" width="36" height="28" fill={color} opacity="0.75" />
      <rect x="17" y="34" width="14" height="18" fill="#0d1117" opacity="0.6" rx="2" />
      <rect x="8" y="28" width="8" height="8" fill="#f9e2af" opacity="0.8" rx="1" />
      <rect x="32" y="28" width="8" height="8" fill="#f9e2af" opacity="0.8" rx="1" />
    </svg>
  );
}

function HouseBigSVG({ color }) {
  return (
    <svg width="64" height="68" viewBox="0 0 64 68" fill="none">
      <polygon points="32,4 60,30 4,30" fill={color} opacity="0.9" />
      <rect x="4" y="30" width="56" height="38" fill={color} opacity="0.75" />
      <rect x="22" y="42" width="20" height="26" fill="#0d1117" opacity="0.6" rx="2" />
      <rect x="8" y="34" width="10" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
      <rect x="46" y="34" width="10" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
      <rect x="8" y="48" width="10" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
      <rect x="46" y="48" width="10" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
    </svg>
  );
}

function HospitalSVG({ color }) {
  return (
    <svg width="60" height="72" viewBox="0 0 60 72" fill="none">
      <rect x="2" y="16" width="56" height="56" fill={color} opacity="0.8" rx="2" />
      <rect x="14" y="2" width="32" height="16" fill={color} opacity="0.7" rx="2" />
      {/* Cross */}
      <rect x="26" y="22" width="8" height="20" fill="white" opacity="0.9" rx="2" />
      <rect x="20" y="28" width="20" height="8" fill="white" opacity="0.9" rx="2" />
      {/* Windows */}
      <rect x="6" y="44" width="10" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
      <rect x="44" y="44" width="10" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
      <rect x="6" y="58" width="10" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
      <rect x="44" y="58" width="10" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
      {/* Door */}
      <rect x="22" y="56" width="16" height="16" fill="#0d1117" opacity="0.6" rx="2" />
    </svg>
  );
}

function SchoolSVG({ color }) {
  return (
    <svg width="72" height="64" viewBox="0 0 72 64" fill="none">
      <rect x="2" y="20" width="68" height="44" fill={color} opacity="0.8" rx="2" />
      {/* Roof parts */}
      <polygon points="36,2 10,20 62,20" fill={color} opacity="0.95" />
      {/* Flag */}
      <line x1="36" y1="2" x2="36" y2="-8" stroke="gray" strokeWidth="1.5" />
      {/* Windows row */}
      {[8, 22, 36, 50].map(x => (
        <rect key={x} x={x} y="26" width="12" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
      ))}
      {/* Door */}
      <rect x="28" y="46" width="16" height="18" fill="#0d1117" opacity="0.6" rx="2" />
      {/* Board */}
      <rect x="22" y="22" width="28" height="2" fill="white" opacity="0.3" />
    </svg>
  );
}

function CastleSVG({ color }) {
  return (
    <svg width="80" height="84" viewBox="0 0 80 84" fill="none">
      {/* Main tower */}
      <rect x="16" y="20" width="48" height="64" fill={color} opacity="0.8" />
      {/* Battlements */}
      {[16, 26, 36, 46, 54].map(x => (
        <rect key={x} x={x} y="12" width="8" height="10" fill={color} opacity="0.9" rx="1" />
      ))}
      {/* Side towers */}
      <rect x="0" y="30" width="20" height="54" fill={color} opacity="0.75" />
      <rect x="60" y="30" width="20" height="54" fill={color} opacity="0.75" />
      {/* Tower battlements */}
      {[0, 8].map(x => <rect key={x} x={x} y="22" width="7" height="10" fill={color} opacity="0.9" rx="1" />)}
      {[60, 68].map(x => <rect key={x} x={x} y="22" width="7" height="10" fill={color} opacity="0.9" rx="1" />)}
      {/* Gate */}
      <path d="M32,84 L32,58 Q40,50 48,58 L48,84 Z" fill="#0d1117" opacity="0.7" />
      {/* Windows */}
      <rect x="24" y="38" width="10" height="12" fill="#f9e2af" opacity="0.8" rx="1" />
      <rect x="46" y="38" width="10" height="12" fill="#f9e2af" opacity="0.8" rx="1" />
      {/* Flag */}
      <line x1="40" y1="4" x2="40" y2="20" stroke="#888" strokeWidth="2" />
      <polygon points="40,4 52,9 40,14" fill="#f85149" opacity="0.8" />
    </svg>
  );
}

function MarketSVG({ color }) {
  return (
    <svg width="68" height="56" viewBox="0 0 68 56" fill="none">
      {/* Awning */}
      <path d="M2,20 Q34,8 66,20 L66,28 Q34,16 2,28 Z" fill={color} opacity="0.9" />
      {/* Building */}
      <rect x="2" y="26" width="64" height="30" fill={color} opacity="0.75" rx="1" />
      {/* Stripes on awning */}
      {[12, 22, 32, 42, 52].map(x => (
        <line key={x} x1={x} y1="14" x2={x - 2} y2="28" stroke="white" strokeWidth="1.5" opacity="0.3" />
      ))}
      {/* Windows */}
      <rect x="6" y="30" width="12" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
      <rect x="50" y="30" width="12" height="10" fill="#f9e2af" opacity="0.8" rx="1" />
      {/* Door */}
      <rect x="25" y="38" width="18" height="18" fill="#0d1117" opacity="0.6" rx="2" />
    </svg>
  );
}

const SVG_MAP = {
  house_small: HouseSmallSVG,
  house_big: HouseBigSVG,
  hospital: HospitalSVG,
  school: SchoolSVG,
  castle: CastleSVG,
  market: MarketSVG,
};

export default function SceneBuilding({ building }) {
  const { dispatch } = useCivilization();
  const SVGComp = SVG_MAP[building.svgType] || HouseSmallSVG;
  const level = building.level || 1;
  const upgradeCost = Math.floor(building.cost * (level + 1) * 0.75);

  const handleUpgrade = () => {
    dispatch({ type: 'UPGRADE_BUILDING', uid: building.uid });
  };

  return (
    <div
      className="scene-building"
      title={`${building.name} (Seviye ${level}) - Geliştirmek için ${upgradeCost} Altın`}
      onClick={handleUpgrade}
      style={{
        left: `${building.x}%`,
        top: `${building.y}%`,
        zIndex: Math.floor(building.y),
        transform: 'translate(-50%, -100%)',
        cursor: 'pointer',
      }}
    >
      <SVGComp color={building.color} />
      {level > 1 && (
        <div style={{
          position: 'absolute',
          top: -10,
          right: -10,
          background: 'var(--blue)',
          color: 'white',
          borderRadius: '12px',
          padding: '2px 6px',
          fontSize: '0.6rem',
          fontWeight: 800,
          border: '2px solid var(--border)',
          boxShadow: '1px 1px 0px var(--border)',
          zIndex: 2,
        }}>
          Lv.{level}
        </div>
      )}
      <div className="upgrade-hover" style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--bg-card)',
        padding: '4px 8px',
        borderRadius: 'var(--radius-sm)',
        border: '2px solid var(--border)',
        boxShadow: '2px 2px 0px var(--border)',
        display: 'none',
        whiteSpace: 'nowrap',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        color: 'var(--text-primary)',
        zIndex: 10,
      }}>
        <ArrowUpCircle size={14} color="var(--green)" /> {upgradeCost}
      </div>
    </div>
  );
}
