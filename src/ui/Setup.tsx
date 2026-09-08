import { useState } from 'react';

/** First run. Two questions, both skippable — a wall in front of a bedtime
 *  story is how you lose the parent who came to try one. */
export default function Setup({ onDone, onSkip }: { onDone: (name: string, age: number) => void; onSkip: () => void }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState(8);
  return (
    <div className="setup">
      <p className="eyebrow">Before the first story</p>
      <h1 className="greet">Who am I choosing for?</h1>
      <p className="sub">Two things, and they stay on this device unless you ask otherwise.
        The age decides which stories are offered; the name is just so the app can talk about your child
        rather than about a user.</p>

      <label className="field">
        <span>Their name</span>
        <input value={name} autoFocus placeholder="Anaya" onChange={e => setName(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && name.trim() && onDone(name, age)} />
      </label>
      <label className="field">
        <span>Their age</span>
        <input type="number" min={3} max={15} value={age} onChange={e => setAge(+e.target.value)} />
      </label>

      <button className="begin" disabled={!name.trim()} onClick={() => onDone(name, age)}>
        {name.trim() ? `Start reading with ${name.trim()}` : 'Start reading'}
      </button>
      <button className="skiplink" onClick={onSkip}>Skip — just show me a story</button>
    </div>
  );
}
