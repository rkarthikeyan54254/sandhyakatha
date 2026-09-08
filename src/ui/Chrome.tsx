export type Tab = 'tonight' | 'shelf' | 'map' | 'why';

export function Header({ onWhy }: { onWhy: () => void }) {
  return (
    <header className="bar">
      <svg className="flame" viewBox="0 0 22 26" aria-hidden="true">
        <path d="M3 22h16" stroke="#a97c3a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <path d="M5 22c0-2.6 2.7-3.4 6-3.4s6 .8 6 3.4" fill="#2b2338" stroke="#a97c3a" strokeWidth="1.2" />
        <g className="f">
          <path d="M11 5c2.6 3.1 3.8 5 3.8 7.2A3.8 3.8 0 0 1 11 16a3.8 3.8 0 0 1-3.8-3.8C7.2 10 8.4 8.1 11 5z" fill="#f0b458" />
          <path d="M11 9.4c1.2 1.6 1.7 2.5 1.7 3.4A1.7 1.7 0 0 1 11 14.5a1.7 1.7 0 0 1-1.7-1.7c0-.9.5-1.8 1.7-3.4z" fill="#fff0d0" />
        </g>
      </svg>
      <span className="wordmark"><b>Sandhya Katha</b><i>संध्या कथा</i></span>
      <span className="spacer" />
      <button className="iconbtn" onClick={onWhy} aria-label="Why this exists" title="Why this exists">
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="10" cy="10" r="8" /><path d="M10 9v5M10 6.2v.1" strokeLinecap="round" />
        </svg>
      </button>
    </header>
  );
}

const TABS: [Tab, string][] = [['tonight', 'Tonight'], ['shelf', 'Shelf'], ['map', 'Map'], ['why', 'Why']];

export function Tabs({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="tabs">
      {TABS.map(([k, label]) => (
        <button key={k} aria-current={tab === k} onClick={() => onTab(k)}>
          <span className="dot" />{label}
        </button>
      ))}
    </nav>
  );
}
