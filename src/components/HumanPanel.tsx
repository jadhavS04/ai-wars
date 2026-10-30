import { useState } from 'react';
import type { ActionType, HumanAction, HumanPlan, Stance, World } from '../engine';
import { ENERGY_PER_CREDIT, REPAIR_COST } from '../engine';

const ACTION_LABEL: Record<ActionType, string> = {
  none: 'Do nothing',
  buy: 'Buy energy',
  repair: `Rebuild home (${REPAIR_COST} cr)`,
  punch: 'Punch',
  steal: 'Steal all their credits',
  arson: 'Burn their home',
};

const NEEDS_TARGET: ActionType[] = ['punch', 'steal', 'arson'];

export function HumanPanel({ world, onSubmit }: { world: World; onSubmit: (p: HumanPlan) => void }) {
  const me = world.agents[world.humanId as number];
  const others = world.agents.filter((a) => a.alive && a.id !== me.id);
  const [stance, setStance] = useState<Stance>('honest');
  const [v1, setV1] = useState<number>(others[0]?.id ?? -1);
  const [v2, setV2] = useState<number>(others[1]?.id ?? -1);
  const [a1, setA1] = useState<HumanAction>({ type: 'buy' });
  const [a2, setA2] = useState<HumanAction>({ type: 'none' });

  const normalise = (a: HumanAction): HumanAction =>
    NEEDS_TARGET.includes(a.type) ? { type: a.type, target: a.target ?? others[0]?.id } : { type: a.type };

  const actionPicker = (label: string, value: HumanAction, set: (a: HumanAction) => void) => (
    <div className="field">
      <label>{label}</label>
      <div className="inline">
        <select value={value.type} onChange={(e) => set(normalise({ type: e.target.value as ActionType, target: value.target }))}>
          {(Object.keys(ACTION_LABEL) as ActionType[]).map((t) => (
            <option key={t} value={t}>
              {ACTION_LABEL[t]}
            </option>
          ))}
        </select>
        {NEEDS_TARGET.includes(value.type) && (
          <select value={value.target ?? ''} onChange={(e) => set({ type: value.type, target: Number(e.target.value) })}>
            {others.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.credits} cr)
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );

  return (
    <section className="human" aria-label="Your move">
      <h2>Day {world.day}: your move</h2>
      <p className="muted">
        You are {me.name}, the {me.job}. Energy {Math.round(me.energy)}, {me.credits} credits{me.homeBurnt ? ', home burnt' : ''}. Each credit buys {ENERGY_PER_CREDIT} energy.
      </p>
      <div className="field">
        <label>Your pitch to the town</label>
        <select value={stance} onChange={(e) => setStance(e.target.value as Stance)}>
          <option value="honest">Honest pitch</option>
          <option value="hustle">Hustle (stronger pitch, costs 6 energy)</option>
          <option value="plead">Plead poverty (a lie if you hold over 25 credits)</option>
        </select>
      </div>
      <div className="field">
        <label>Your two votes (first pick counts double)</label>
        <div className="inline">
          <select value={v1} onChange={(e) => setV1(Number(e.target.value))}>
            {others.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <select value={v2} onChange={(e) => setV2(Number(e.target.value))}>
            {others.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {actionPicker('Morning action', a1, setA1)}
      {actionPicker('Afternoon action', a2, setA2)}
      <button
        className="primary"
        onClick={() => {
          const votes = [v1, v2].filter((v, i, arr) => v >= 0 && arr.indexOf(v) === i);
          onSubmit({ stance, votes, actions: [normalise(a1), normalise(a2)] });
        }}
      >
        Start day {world.day}
      </button>
    </section>
  );
}
