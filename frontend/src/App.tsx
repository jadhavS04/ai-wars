import { useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import CityScene from './components/CityScene';
import HUD from './components/HUD';
import Menu from './components/Menu';
import PlayerPanel from './components/PlayerPanel';

export default function App() {
  const { state, initGame, tick, setSpeed, setPaused, resetGame } = useGameStore();
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const ww = window.innerWidth;
  const wh = window.innerHeight;

  // Game loop driven by requestAnimationFrame
  useEffect(() => {
    if (!state || state.mode === 'GAME_OVER') {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const msPerTick = state.paused ? 99999 : Math.round(1000 / (state.speed * 2));

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (now - lastTimeRef.current >= msPerTick) {
        lastTimeRef.current = now;
        tick();
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state?.paused, state?.speed, state?.mode, tick]);

  // No game state = show menu
  if (!state) {
    return <Menu onStart={(cityMode, mode) => initGame(cityMode, mode)} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#0a0a1a' }}>
      <CityScene
        gameState={state}
        width={ww}
        height={wh}
      />
      <HUD
        state={state}
        onPause={() => setPaused(!state.paused)}
        onSpeedChange={setSpeed}
        onReset={resetGame}
      />
      {state.mode === 'PLAY' && state.winner === null && (
        <PlayerPanel state={state} />
      )}

    </div>
  );
}
