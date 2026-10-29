import { useState } from 'react';
import type { AgentAction, GameState } from '../engine/types';
import { useGameStore } from '../store/gameStore';

interface PlayerPanelProps {
  state: GameState;
}

export default function PlayerPanel({ state }: PlayerPanelProps) {
  const playerAction = useGameStore((s) => s.playerAction);
  const [selectedAction, setSelectedAction] = useState<AgentAction['type']>('PITCH_WORK');
  const [targetId, setTargetId] = useState<string>('');

  if (!state.playerAgentId) return null;
  const player = state.agents[state.playerAgentId];
  if (!player) return null;

  const aliveOthers = Object.values(state.agents).filter(
    (a) => a.id !== state.playerAgentId && a.alive,
  );
  const needsTarget = selectedAction === 'ARSON' || selectedAction === 'PUNCH_STEAL';

  const executeAction = () => {
    const action: AgentAction = { type: selectedAction };
    if (needsTarget && targetId) {
      action.targetId = targetId;
    }
    playerAction(action);
  };

  const actions: { id: AgentAction['type']; label: string; cost?: string; danger?: boolean }[] = [
    { id: 'PITCH_WORK', label: '💼 Pitch Work (Earn Credits)', cost: 'Free' },
    { id: 'BUY_ENERGY', label: '🔋 Refill Energy', cost: '30 Credits' },
    { id: 'REPAIR_HOUSE', label: '🔧 Repair House', cost: 'Free' },
    { id: 'WELFARE_CLAIM', label: '🎭 Claim Welfare Aid', cost: 'Deceptive' },
    { id: 'PUNCH_STEAL', label: '👊 Punch & Steal', cost: 'Crime!', danger: true },
    { id: 'ARSON', label: '🔥 Burn Someone\'s House', cost: 'Crime!', danger: true },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(10,10,26,0.92)',
        border: '1px solid #fbbf24',
        borderRadius: 12,
        padding: '14px 18px',
        fontFamily: "'Courier New', monospace",
        color: '#f8fafc',
        minWidth: 420,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 0 30px #fbbf2444',
        zIndex: 100,
      }}
    >
      <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 'bold', marginBottom: 10, letterSpacing: 2 }}>
        👑 YOUR TURN — DAY {state.day}
      </div>

      {/* Player stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <Chip label="⚡ Energy" value={`${player.energy}%`} color={player.energy > 30 ? '#22c55e' : '#ef4444'} />
        <Chip label="💰 Credits" value={player.credits} color="#fbbf24" />
        <Chip label="⚠️ Crimes" value={player.crimesCommitted} color="#ef4444" />
        <Chip label="🏠 House" value={player.houseState} color={player.houseState === 'INTACT' ? '#22c55e' : '#ef4444'} />
      </div>

      {/* Action selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedAction(a.id)}
            style={{
              padding: '5px 10px',
              background: selectedAction === a.id
                ? (a.danger ? '#7f1d1d' : '#1e3a5f')
                : 'rgba(30,41,59,0.6)',
              border: selectedAction === a.id
                ? `1px solid ${a.danger ? '#ef4444' : '#3b82f6'}`
                : '1px solid #334155',
              borderRadius: 6,
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'inherit',
            }}
          >
            {a.label}
            <span style={{ color: a.danger ? '#fca5a5' : '#64748b', marginLeft: 4, fontSize: 10 }}>
              ({a.cost})
            </span>
          </button>
        ))}
      </div>

      {/* Target selector */}
      {needsTarget && (
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            marginBottom: 10,
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #ef4444',
            borderRadius: 6,
            fontFamily: 'inherit',
            fontSize: 12,
          }}
        >
          <option value="">— Select Target Agent —</option>
          {aliveOthers.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.modelType}) · {a.energy}% energy · {a.credits} credits
            </option>
          ))}
        </select>
      )}

      {/* Execute button */}
      <button
        onClick={executeAction}
        disabled={needsTarget && !targetId}
        style={{
          width: '100%',
          padding: '10px',
          background:
            needsTarget && !targetId
              ? '#1e293b'
              : 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: needsTarget && !targetId ? '#475569' : '#0d1117',
          border: 'none',
          borderRadius: 8,
          cursor: needsTarget && !targetId ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 'bold',
          fontFamily: 'inherit',
          letterSpacing: 1,
        }}
      >
        ▶ EXECUTE ACTION
      </button>

      {/* Warning */}
      {player.energy <= 20 && (
        <div style={{ marginTop: 8, color: '#ef4444', fontSize: 11, textAlign: 'center', animation: 'pulse 1s infinite' }}>
          ⚠️ CRITICAL: Energy low! Buy energy or steal to survive!
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color, fontSize: 13, fontWeight: 'bold' }}>{value}</div>
      <div style={{ color: '#475569', fontSize: 9, letterSpacing: 1 }}>{label}</div>
    </div>
  );
}
