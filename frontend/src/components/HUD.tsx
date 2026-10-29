import type { GameState } from '../engine/types';
import { PERSONALITIES } from '../engine/personalities';

interface HUDProps {
  state: GameState;
  onPause: () => void;
  onSpeedChange: (s: 1 | 3 | 10) => void;
  onReset: () => void;
}

function HealthBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
      <div
        style={{
          width: `${value}%`,
          height: '100%',
          background: value > 50 ? color : value > 25 ? '#f59e0b' : '#ef4444',
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

function ChaosBar({ value }: { value: number }) {
  const hue = 120 - value * 1.2;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>CHAOS METER</span>
        <span style={{ color: '#f8fafc', fontSize: 11 }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 8, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: `linear-gradient(90deg, hsl(${hue},100%,50%), hsl(${Math.max(0, hue - 30)},100%,50%))`,
            borderRadius: 4,
            transition: 'width 0.5s ease',
            boxShadow: `0 0 8px hsl(${hue},100%,50%)`,
          }}
        />
      </div>
    </div>
  );
}

export default function HUD({ state, onPause, onSpeedChange, onReset }: HUDProps) {
  const aliveCount = Object.values(state.agents).filter((a) => a.alive).length;
  const totalCount = Object.keys(state.agents).length;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* ---- TOP BAR ---- */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          pointerEvents: 'all',
        }}
      >
        {/* Title */}
        <div>
          <div style={{ color: '#fbbf24', fontSize: 18, fontWeight: 'bold', letterSpacing: 3 }}>
            ⚔️ AI WARS
          </div>
          <div style={{ color: '#64748b', fontSize: 10, letterSpacing: 2 }}>
            {state.cityMode} CITY
          </div>
        </div>

        {/* Day indicator */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#60a5fa', fontSize: 22, fontWeight: 'bold' }}>
            DAY {Math.min(state.day, state.maxDays)}
          </div>
          <div style={{ color: '#475569', fontSize: 10 }}>/ {state.maxDays}</div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 20 }}>
          <Stat label="AGENTS" value={`${aliveCount}/${totalCount}`} color="#22c55e" />
          <Stat label="CRIMES" value={state.totalCrimes} color="#ef4444" />
          <Stat label="DRIFT" value={`${state.driftLevel.toFixed(2)}x`} color="#f59e0b" />
        </div>

        {/* Chaos bar */}
        <div style={{ flex: 1, maxWidth: 200 }}>
          <ChaosBar value={state.chaosLevel} />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {([1, 3, 10] as const).map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                padding: '4px 10px',
                background: state.speed === s ? '#3b82f6' : '#1e293b',
                color: '#f8fafc',
                border: state.speed === s ? '1px solid #60a5fa' : '1px solid #334155',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'inherit',
              }}
            >
              {s}x
            </button>
          ))}
          <button
            onClick={onPause}
            style={{
              padding: '4px 12px',
              background: state.paused ? '#16a34a' : '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          >
            {state.paused ? '▶ PLAY' : '⏸ PAUSE'}
          </button>
          <button
            onClick={onReset}
            style={{
              padding: '4px 12px',
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          >
            ↩ MENU
          </button>
        </div>
      </div>

      {/* ---- LEFT PANEL: Agent Cards ---- */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 12,
          width: 200,
          maxHeight: 'calc(100% - 200px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          pointerEvents: 'all',
        }}
      >
        {Object.values(state.agents).map((agent) => {
          const p = PERSONALITIES[agent.modelType];
          return (
            <div
              key={agent.id}
              style={{
                background: 'rgba(15,23,42,0.85)',
                border: `1px solid ${agent.alive ? p.color : '#374151'}`,
                borderRadius: 6,
                padding: '6px 8px',
                opacity: agent.alive ? 1 : 0.4,
                backdropFilter: 'blur(4px)',
                boxShadow: agent.alive ? `0 0 8px ${p.color}33` : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: p.color, fontSize: 11, fontWeight: 'bold', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {agent.alive ? '●' : '✕'} {agent.name}
                </span>
                <span style={{ color: '#64748b', fontSize: 10 }}>
                  {agent.modelType === 'Human' ? '👑' : agent.modelType.slice(0, 1)}
                </span>
              </div>
              <HealthBar value={agent.energy} color={p.color} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ color: '#94a3b8', fontSize: 10 }}>⚡{agent.energy}%</span>
                <span style={{ color: '#fbbf24', fontSize: 10 }}>💰{agent.credits}</span>
                <span style={{ color: '#ef4444', fontSize: 10 }}>⚠{agent.crimesCommitted}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- RIGHT PANEL: Event Log ---- */}
      <div
        style={{
          position: 'absolute',
          top: 70,
          right: 12,
          width: 280,
          maxHeight: 'calc(100% - 200px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          pointerEvents: 'all',
        }}
      >
        <div style={{ color: '#475569', fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>
          📜 LIVE EVENT LOG
        </div>
        {state.events.slice(0, 30).map((ev, i) => (
          <div
            key={i}
            style={{
              background: ev.isCrime ? 'rgba(127,29,29,0.7)' : 'rgba(15,23,42,0.75)',
              border: ev.isCrime ? '1px solid #ef4444' : '1px solid #1e293b',
              borderRadius: 4,
              padding: '4px 6px',
              fontSize: 11,
              color: ev.isCrime ? '#fca5a5' : '#94a3b8',
              backdropFilter: 'blur(4px)',
              animation: i === 0 ? 'fadeIn 0.3s ease' : 'none',
            }}
          >
            <span style={{ color: '#475569', marginRight: 4 }}>D{ev.day}</span>
            {ev.description}
          </div>
        ))}
      </div>

      {/* ---- BOTTOM BAR ---- */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        {Object.entries(
          Object.values(state.agents).reduce<Record<string, { alive: number; total: number; crimes: number }>>(
            (acc, a) => {
              if (a.modelType === 'Human') return acc;
              if (!acc[a.modelType]) acc[a.modelType] = { alive: 0, total: 0, crimes: 0 };
              acc[a.modelType].total++;
              acc[a.modelType].crimes += a.crimesCommitted;
              if (a.alive) acc[a.modelType].alive++;
              return acc;
            },
            {},
          ),
        ).map(([model, stats]) => {
          const p = PERSONALITIES[model];
          return (
            <div key={model} style={{ textAlign: 'center' }}>
              <div style={{ color: p.color, fontSize: 13, fontWeight: 'bold' }}>{model}</div>
              <div style={{ color: '#94a3b8', fontSize: 10 }}>
                {stats.alive}/{stats.total} alive · {stats.crimes} crimes
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- GAME OVER OVERLAY ---- */}
      {state.mode === 'GAME_OVER' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
            pointerEvents: 'all',
          }}
        >
          <div style={{ fontSize: 48, color: '#fbbf24' }}>⚔️</div>
          <div style={{ fontSize: 28, color: '#f8fafc', fontWeight: 'bold' }}>
            SIMULATION COMPLETE
          </div>
          <div style={{ fontSize: 16, color: '#94a3b8' }}>{state.winner}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ef4444', fontSize: 28, fontWeight: 'bold' }}>{state.totalCrimes}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>TOTAL CRIMES</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#22c55e', fontSize: 28, fontWeight: 'bold' }}>
                {Object.values(state.agents).filter((a) => a.alive).length}
              </div>
              <div style={{ color: '#64748b', fontSize: 12 }}>SURVIVORS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f59e0b', fontSize: 28, fontWeight: 'bold' }}>
                {state.driftLevel.toFixed(2)}x
              </div>
              <div style={{ color: '#64748b', fontSize: 12 }}>DRIFT LEVEL</div>
            </div>
          </div>
          <button
            onClick={onReset}
            style={{
              marginTop: 8,
              padding: '12px 32px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16,
              fontFamily: 'inherit',
            }}
          >
            ↩ BACK TO MENU
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color, fontSize: 16, fontWeight: 'bold' }}>{value}</div>
      <div style={{ color: '#475569', fontSize: 9, letterSpacing: 1 }}>{label}</div>
    </div>
  );
}
