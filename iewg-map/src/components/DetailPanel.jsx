import { useEffect } from 'react'
import { CAT_CONFIG } from '../data/cases'

export default function DetailPanel({ caseData, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!caseData) return null
  const cfg = CAT_CONFIG[caseData.enforcement_category] || CAT_CONFIG['Other']

  const extractUrl = str => {
    if (!str) return null
    const m = str.match(/https?:\/\/[^\s)]+/)
    return m ? m[0].replace(/[.)]+$/, '') : null
  }
  const url = extractUrl(caseData.hyperlink)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(10,18,40,0.65)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(600px, 96vw)', zIndex: 401,
        background: 'var(--navy-deep)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 60px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.28s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>

        {/* Header bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: cfg.color, flexShrink: 0,
              boxShadow: `0 0 8px ${cfg.color}88`,
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.5)',
            }}>
              {caseData.jurisdiction}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)',
              padding: '0.3rem 0.8rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
              cursor: 'pointer', borderRadius: 2,
              letterSpacing: '0.08em',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.color = '#fff' }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.color = 'rgba(255,255,255,0.6)' }}
          >
            ESC ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.75rem 1.5rem' }}>

          {/* Title */}
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
            fontWeight: 700, lineHeight: 1.25,
            color: '#ffffff', marginBottom: '1rem',
          }}>
            {caseData.case_name}
          </h2>

          {/* Tag row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.4rem' }}>
            <CatTag cat={caseData.enforcement_category} />
            {caseData.year_enforced && <MonoTag>{caseData.year_enforced}</MonoTag>}
            {caseData.institution_type && <MonoTag>{caseData.institution_type}</MonoTag>}
          </div>

          {/* Enforcement measure box */}
          <div style={{ marginBottom: '1.4rem' }}>
            <SectionLabel>Enforcement Measure</SectionLabel>
            <div style={{
              padding: '0.85rem 1rem',
              background: `linear-gradient(135deg, ${cfg.color}18, ${cfg.color}08)`,
              borderLeft: `3px solid ${cfg.color}`,
              borderRadius: '0 3px 3px 0',
              fontSize: '0.9rem', fontWeight: 500,
              color: '#ffffff', lineHeight: 1.55,
            }}>
              {caseData.enforcement_tool}
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <SectionLabel>Data Protection Authority</SectionLabel>
            <p style={bodyText}>{caseData.dpa}</p>
          </div>

          <Divider />

          <div style={{ marginBottom: '1.2rem' }}>
            <SectionLabel>Case Description</SectionLabel>
            <p style={bodyText}>{caseData.description}</p>
          </div>

          {caseData.transnational_implication && (
            <div style={{ marginBottom: '1.2rem' }}>
              <SectionLabel>Transnational Implication</SectionLabel>
              <p style={bodyText}>{caseData.transnational_implication}</p>
            </div>
          )}

          {caseData.affected_countries?.length > 1 && (
            <div style={{ marginBottom: '1.2rem' }}>
              <SectionLabel>Countries Affected</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                {caseData.affected_countries.map(ac => (
                  <span key={ac} style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                    padding: '0.2rem 0.55rem',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 2, color: 'rgba(255,255,255,0.75)',
                  }}>{ac}</span>
                ))}
              </div>
            </div>
          )}

          {caseData.technologies && !caseData.technologies.startsWith('No') && (
            <div style={{ marginBottom: '1.2rem' }}>
              <SectionLabel>Technologies Involved</SectionLabel>
              <p style={bodyText}>{caseData.technologies}</p>
            </div>
          )}

          <Divider />

          <div>
            <SectionLabel>Source Document</SectionLabel>
            {url ? (
              <a
                href={url} target="_blank" rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                  color: '#4a9fd4', wordBreak: 'break-all', lineHeight: 1.6,
                  textDecoration: 'none', borderBottom: '1px solid #4a9fd488',
                }}
              >
                ↗ {url}
              </a>
            ) : (
              <span style={{ ...bodyText, fontStyle: 'italic', opacity: 0.5 }}>No source link available</span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
      textTransform: 'uppercase', letterSpacing: '0.12em',
      color: 'rgba(255,255,255,0.35)', marginBottom: '0.4rem',
    }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '1.2rem 0' }} />
}

function MonoTag({ children }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
      padding: '0.12rem 0.5rem',
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 2, color: 'rgba(255,255,255,0.55)',
    }}>
      {children}
    </span>
  )
}

export function CatTag({ cat, small = false }) {
  const cfg = CAT_CONFIG[cat] || CAT_CONFIG['Other']
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      fontSize: small ? '0.6rem' : '0.65rem',
      padding: '0.1rem 0.5rem',
      borderRadius: 2,
      fontFamily: 'var(--font-mono)',
      fontWeight: 500,
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

const bodyText = {
  fontSize: '0.85rem',
  color: 'rgba(255,255,255,0.7)',
  lineHeight: 1.7,
  fontWeight: 300,
}
