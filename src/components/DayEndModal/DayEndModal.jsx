import React from 'react';
import { useCivilization } from '../../store/CivilizationContext.jsx';
import { PartyPopper, Shield, Frown, Coins, Sparkles } from 'lucide-react';

export default function DayEndModal() {
  const { state, dispatch } = useCivilization();
  if (!state.showDayEnd || !state.dayEndResult) return null;

  const { type, ratio, happinessLoss, lostCount, passiveIncome, shielded } = state.dayEndResult;

  const isGood = type === 'good';
  const isShielded = type === 'shielded';

  const handleClose = () => dispatch({ type: 'CLOSE_DAY_END' });

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon" style={{ display: 'flex', justifyContent: 'center' }}>
          {isGood ? <PartyPopper size={48} color="var(--green)" /> : isShielded ? <Shield size={48} color="var(--blue)" /> : <Frown size={48} color="var(--red)" />}
        </div>

        <h2 className="modal-title" style={{ color: isGood ? 'var(--green)' : isShielded ? 'var(--blue)' : 'var(--red)' }}>
          {isGood
            ? 'Harika Gün!'
            : isShielded
            ? 'Belediye Korudu!'
            : lostCount > 0
            ? 'Sakinler Taşındı!'
            : 'Zor Bir Gün...'}
        </h2>

        <p className="modal-subtitle">
          {isGood
            ? `Görevlerin %${Math.round(ratio * 100)}'ini tamamladın! Halk mutlu, şehir büyüyor! ${passiveIncome > 0 ? `Pasif gelir: +${passiveIncome} altın` : ''}`
            : isShielded
            ? `Görevlerin %${Math.round(ratio * 100)}'i tamamlandı. Belediye nüfus kaybını engelledi! Mutluluk -${happinessLoss}.`
            : `Görevlerin sadece %${Math.round(ratio * 100)}'i tamamlandı. ${lostCount > 0 ? `${lostCount} sakin şehri terk etti!` : `Halk mutsuzluğu -${happinessLoss} arttı.`}`
          }
        </p>

        <div className="modal-stats">
          <div className="modal-stat-item">
            <span className="modal-stat-value" style={{ color: 'var(--green)' }}>
              {state.dayEndResult.completed || 0}
            </span>
            <span className="modal-stat-label">Tamamlanan</span>
          </div>
          <div className="modal-stat-item">
            <span className="modal-stat-value" style={{ color: 'var(--blue)' }}>
              {state.population.length}
            </span>
            <span className="modal-stat-label">Nüfus</span>
          </div>
          <div className="modal-stat-item">
            <span className="modal-stat-value" style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {state.gold} <Coins size={20} />
            </span>
            <span className="modal-stat-label">Hazine</span>
          </div>
        </div>

        <button
          id="day-end-close-btn"
          className={`modal-btn ${isGood ? 'primary' : 'danger'}`}
          onClick={handleClose}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}
        >
          {isGood ? <><Sparkles size={18} /> Devam Et!</> : 'Anladım, Devam...'}
        </button>
      </div>
    </div>
  );
}
