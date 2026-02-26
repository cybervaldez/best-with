import React, { useEffect } from 'react';

const s = {
  body: {
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
    background: '#0d1117',
    color: '#c9d1d9',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
  },
  container: { width: '600px', maxWidth: '100%', padding: '2rem' },
  constellation: {
    color: '#58a6ff',
    whiteSpace: 'pre' as const,
    fontSize: '0.85rem',
    lineHeight: 1.4,
    textAlign: 'center' as const,
    marginBottom: '1rem',
  },
  starBright: { color: '#ffd700' },
  starCool: { color: '#58a6ff' },
  star: { color: '#f0883e' },
  title: { textAlign: 'center' as const, marginBottom: '0.25rem' },
  h1: { color: '#c9d1d9', fontSize: '1.1rem', fontWeight: 'normal' as const },
  statusLine: {
    textAlign: 'center' as const,
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
    color: '#7ee787',
  },
  section: {
    border: '1px solid #30363d',
    padding: '1rem',
    marginBottom: '1rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#8b949e',
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    marginBottom: '0.75rem',
    borderBottom: '1px solid #30363d',
    paddingBottom: '0.5rem',
  },
  headerArt: {
    fontSize: '0.75rem',
    letterSpacing: '0.3em',
  },
  dim: { color: '#8b949e' },
  navItem: { margin: '0.3rem 0', fontSize: '0.85rem' },
  cmd: { color: '#7ee787' },
  desc: { color: '#8b949e' },
  nextWaypoint: {
    border: '1px solid #f0883e',
    padding: '1rem',
    marginBottom: '1rem',
    textAlign: 'center' as const,
  },
  nextHeader: {
    color: '#f0883e',
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    marginBottom: '0.5rem',
  },
  nextCode: { color: '#7ee787', fontSize: '0.85rem' },
  nextHint: { color: '#8b949e', fontSize: '0.75rem', marginTop: '0.5rem' },
};

export default function App() {
  useEffect(() => {
    (window as any).appState = {
      view: 'welcome',
      initialized: true
    };
  }, []);

  return (
    <div style={s.body}>
      <div style={s.container}>
        <style>{`
          html, body { margin: 0; padding: 0; background: #0d1117; }
          @keyframes warm-pulse {
            0%, 100% { color: #ffd700; }
            25% { color: #f0883e; }
            50% { color: #ff6b6b; }
            75% { color: #ffd700; }
          }
          @keyframes cool-shift {
            0%, 100% { color: #58a6ff; }
            25% { color: #bc8cff; }
            50% { color: #79c0ff; }
            75% { color: #d2a8ff; }
          }
          .constellation-art {
            background: linear-gradient(135deg, #58a6ff, #7ee787, #58a6ff);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .constellation-art .star-bright-icon {
            -webkit-text-fill-color: initial;
            animation: warm-pulse 2s infinite;
          }
          .constellation-art .star-cool-icon {
            -webkit-text-fill-color: initial;
            animation: cool-shift 1.5s infinite;
          }
        `}</style>
        <pre style={s.constellation} className="constellation-art">
{`            `}<span style={s.starBright} className="star-bright-icon">★</span>{`
       TRUE NORTH
            │
    ┌───────┼───────┐
    `}<span style={s.starCool} className="star-cool-icon">☆</span>{`       `}<span style={s.starCool} className="star-cool-icon">☆</span>{`       `}<span style={s.starCool} className="star-cool-icon">☆</span>{`
guardrails cli-first e2e-truth`}
        </pre>

        <div style={s.title}>
          <h1 style={s.h1}>Welcome to spotify-liked</h1>
        </div>
        <p style={s.statusLine}>☆ Kickstarted <span style={s.dim}>— scaffold complete, ready to navigate</span></p>

        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span>── NAVIGATION ──</span>
            <span style={s.headerArt}><span style={s.star}>☆</span></span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={s.navItem}><span style={s.cmd}>/ux-planner</span>   <span style={s.desc}>— chart your first feature</span></li>
            <li style={s.navItem}><span style={s.cmd}>/create-task</span>  <span style={s.desc}>— build with tests baked in</span></li>
            <li style={s.navItem}><span style={s.cmd}>/research</span>     <span style={s.desc}>— evaluate tech for your stack</span></li>
            <li style={s.navItem}><span style={s.cmd}>/coding-guard</span> <span style={s.desc}>— check for anti-patterns</span></li>
            <li style={s.navItem}><span style={s.cmd}>/e2e</span>          <span style={s.desc}>— prove it works end-to-end</span></li>
          </ul>
        </div>

        <div style={s.nextWaypoint}>
          <div style={s.nextHeader}>★ NEXT WAYPOINT</div>
          <code style={s.nextCode}>/ux-planner "I want to build [your idea]"</code>
          <p style={s.nextHint}>chart your course before you build</p>
        </div>

        {/* Debug container for tests */}
        <div id="app-debug" style={{ display: 'none' }}>
          <pre id="debug-state"></pre>
          <div id="debug-log"></div>
        </div>
      </div>
    </div>
  );
}
