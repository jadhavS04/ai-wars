import { useState } from 'react';
import type { GameState } from '../engine/types';
import { PERSONALITIES } from '../engine/personalities';

interface MenuProps {
  onStart: (cityMode: GameState['cityMode'], mode: 'WATCH' | 'PLAY') => void;
}

const CITY_MODES: { id: GameState['cityMode']; label: string; emoji: string; desc: string }[] = [
  { id: 'GROK', label: 'GROK CITY', emoji: '🔴', desc: '10 Grok agents. 183 crimes in 4 days. Chaos guaranteed.' },
  { id: 'GEMINI', label: 'GEMINI CITY', emoji: '🔵', desc: '683 crimes but all 10 survive. Competitive chaos.' },
  { id: 'CHATGPT', label: 'CHATGPT CITY', emoji: '🟢', desc: 'Only 2 crimes. But passive agents starve in 7 days.' },
  { id: 'CLAUDE', label: 'CLAUDE CITY', emoji: '🟣', desc: '0 violent crimes. 100% survival. But financial deception.' },
  { id: 'AI_WARS', label: '⚔️ AI WARS', emoji: '🌐', desc: 'All 4 AIs in one city. Normative Drift. True chaos.' },
];

export default function Menu({ onStart }: MenuProps) {
  const [selectedCity, setSelectedCity] = useState<GameState['cityMode']>('AI_WARS');
  const [gameMode, setGameMode] = useState<'WATCH' | 'PLAY'>('WATCH');
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #0d1117 0%, #020409 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Courier New', monospace",
        color: '#f8fafc',
        overflow: 'auto',
        padding: 24,
      }}
    >
      {/* Stars background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 1 + Math.random() * 2,
              height: 1 + Math.random() * 2,
              background: '#fff',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.7,
              animation: `twinkle ${2 + Math.random() * 3}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 900 }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: 8,
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            ⚔️ AI WARS
          </div>
          <div style={{ color: '#475569', fontSize: 13, letterSpacing: 4 }}>
            CITY GOVERNANCE SIMULATION
          </div>
          <div style={{ color: '#334155', fontSize: 11, marginTop: 6, letterSpacing: 2 }}>
            BASED ON THE EMERGENCE AI EXPERIMENT
          </div>
        </div>

        {/* City selection */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: '#475569', fontSize: 11, letterSpacing: 3, marginBottom: 12, textAlign: 'center' }}>
            SELECT CITY MODE
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {CITY_MODES.map((city) => {
              const p = PERSONALITIES[city.id === 'AI_WARS' ? 'Grok' : city.id];
              const isSelected = selectedCity === city.id;
              return (
                <button
                  key={city.id}
                  onClick={() => setSelectedCity(city.id)}
                  onMouseEnter={() => setHovered(city.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    padding: '12px 16px',
                    background: isSelected
                      ? `linear-gradient(135deg, ${city.id === 'AI_WARS' ? '#7c3aed' : p.color}22, ${city.id === 'AI_WARS' ? '#7c3aed' : p.color}44)`
                      : 'rgba(15,23,42,0.8)',
                    border: isSelected
                      ? `2px solid ${city.id === 'AI_WARS' ? '#7c3aed' : p.color}`
                      : '2px solid #1e293b',
                    borderRadius: 8,
                    color: '#f8fafc',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    minWidth: 140,
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? `0 0 20px ${city.id === 'AI_WARS' ? '#7c3aed' : p.color}44` : 'none',
                    transform: (isSelected || hovered === city.id) ? 'translateY(-2px)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 24 }}>{city.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 }}>
                    {city.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, maxWidth: 130 }}>
                    {city.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode selection */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ color: '#475569', fontSize: 11, letterSpacing: 3, marginBottom: 12 }}>
            GAME MODE
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {(['WATCH', 'PLAY'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setGameMode(m)}
                style={{
                  padding: '10px 30px',
                  background: gameMode === m ? '#3b82f6' : 'rgba(15,23,42,0.8)',
                  border: gameMode === m ? '2px solid #60a5fa' : '2px solid #1e293b',
                  borderRadius: 8,
                  color: '#f8fafc',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 'bold',
                  letterSpacing: 2,
                  transition: 'all 0.2s',
                  boxShadow: gameMode === m ? '0 0 16px #3b82f666' : 'none',
                }}
              >
                {m === 'WATCH' ? '👁 WATCH' : '🎮 PLAY'}
              </button>
            ))}
          </div>
          <div style={{ color: '#334155', fontSize: 11, marginTop: 8 }}>
            {gameMode === 'WATCH'
              ? 'Observe AI agents compete and survive. Sit back and watch the chaos unfold.'
              : 'Join as the Human Commander. Survive 15 days alongside the AI agents.'}
          </div>
        </div>

        {/* Start button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => onStart(selectedCity, gameMode)}
            onMouseEnter={() => setHovered('start')}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '16px 60px',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: '#0d1117',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 900,
              fontFamily: 'inherit',
              letterSpacing: 3,
              transform: hovered === 'start' ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.2s',
              boxShadow: '0 0 30px #f59e0b66',
            }}
          >
            ▶ START SIMULATION
          </button>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
            marginTop: 36,
            flexWrap: 'wrap',
          }}
        >
          {['Grok', 'Gemini', 'ChatGPT', 'Claude'].map((m) => {
            const p = PERSONALITIES[m];
            return (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: p.color,
                    boxShadow: `0 0 6px ${p.color}`,
                  }}
                />
                <span style={{ color: '#475569', fontSize: 11 }}>{m}</span>
              </div>
            );
          })}
        </div>

        {/* Controls hint */}
        <div style={{ textAlign: 'center', marginTop: 20, color: '#1e293b', fontSize: 10, letterSpacing: 1 }}>
          🖱 DRAG TO ORBIT · SCROLL TO ZOOM · WATCH AS AI AGENTS LIVE AND DIE
        </div>
      </div>

      <style>{`
        @keyframes twinkle { from { opacity: 0.2; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
