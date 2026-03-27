import { useState, useMemo, useCallback } from 'react'
import WorldMap from './components/WorldMap'
import DetailPanel, { CatTag } from './components/DetailPanel'
import { CASES, CAT_CONFIG } from './data/cases'

const ALL_JURISDICTIONS = [...new Set(CASES.map(c => c.jurisdiction))].sort()

export default function App() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(null)
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [hoveredCaseId, setHoveredCaseId] = useState(null)
  const [maxYear, setMaxYear] = useState(2022)
  const [searchQuery, setSearchQuery] = useState('')
  const [detailCase, setDetailCase] = useState(null)

  const mapCases = useMemo(() => CASES.filter(c => {
    const yearOk = !c.year_enforced || parseInt(c.year_enforced) <= maxYear
    const filterOk = activeFilter === 'all' || c.enforcement_category === activeFilter
    const q = searchQuery.toLowerCase().trim()
    const searchOk = !q
      || c.case_name.toLowerCase().includes(q)
      || c.jurisdiction.toLowerCase().includes(q)
      || c.description.toLowerCase().includes(q)
      || c.technologies.toLowerCase().includes(q)
      || c.dpa.toLowerCase().includes(q)
    return yearOk && filterOk && searchOk
  }), [activeFilter, maxYear, searchQuery])

  const filteredCases = useMemo(() => mapCases.filter(c =>
    !selectedJurisdiction || c.jurisdiction === selectedJurisdiction
  ), [mapCases, selectedJurisdiction])

  const byJurisdiction = useMemo(() => {
    const map = {}
    filteredCases.forEach(c => {
      if (!map[c.jurisdiction]) map[c.jurisdiction] = []
      map[c.jurisdiction].push(c)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredCases])

  const openCase = useCallback(c => {
    setSelectedCaseId(c.id)
    setDetailCase(c)
  }, [])

  const closeDetail = useCallback(() => {
    setDetailCase(null)
    setSelectedCaseId(null)
  }, [])

  const handleSelectJurisdiction = useCallback((jur) => {
    setSelectedJurisdiction(jur)
    closeDetail()
  }, [closeDetail])

  const FILTER_CHIPS = [
    { key: 'all', label: 'All Types' },
    ...Object.entries(CAT_CONFIG).map(([k, v]) => ({ key: k, label: v.label })),
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw',
      background: '#f0f3f9',
      overflow: 'hidden',
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        flexShrink: 0,
        background: '#12315d',
        borderBottom: '1px solid rgba(0,0,0,0.15)',
        padding: '0 2rem',
        height: 84,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '1rem',
      }}>
        {/* Left: logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
          <img
            src="/IEWG_Logo.jpg"
            alt="IEWG Logo"
            style={{ height: 72, width: 72, borderRadius: '30%', objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ width: 1, height: 42, background: 'rgba(255,255,255,0.15)' }} />
          <div>
            <h1 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
              fontWeight: 700, color: '#ffffff',
              letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>
              Transnational Data Protection Cases
            </h1>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginTop: '0.3rem',
            }}>
              International Enforcement Cooperation Working Group
            </p>
          </div>
        </div>

        {/* Right: affiliation */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          whiteSpace: 'nowrap',
        }}>
          Global Privacy Assembly
        </p>
      </header>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 350px', overflow: 'hidden' }}>

        {/* ── MAP PANEL ────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>

          {/* Filter chips */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 20,
            display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
          }}>
            {FILTER_CHIPS.map(({ key, label }) => {
              const active = activeFilter === key
              const cfg = key !== 'all' ? CAT_CONFIG[key] : null
              return (
                <FilterChip
                  key={key}
                  active={active}
                  color={cfg?.color}
                  onClick={() => setActiveFilter(key)}
                >
                  {label}
                </FilterChip>
              )
            })}
            {selectedJurisdiction && (
              <FilterChip
                active={true}
                color="#4a9fd4"
                onClick={() => setSelectedJurisdiction(null)}
              >
                ✕ {selectedJurisdiction}
              </FilterChip>
            )}
          </div>

          {/* Year slider */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12, zIndex: 20,
            background: 'rgba(10,28,64,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.65rem 1rem',
            backdropFilter: 'blur(6px)',
            borderRadius: 3,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem',
            }}>
              Up to year
            </div>
            <input
              type="range" min="2018" max="2022" value={maxYear}
              onChange={e => setMaxYear(+e.target.value)}
              style={{ width: 130, accentColor: '#4a9fd4', display: 'block', marginBottom: '0.25rem' }}
            />
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
              color: '#4a9fd4', fontWeight: 500,
            }}>
              {maxYear}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 20,
            background: 'rgba(10,28,64,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.7rem 0.9rem',
            backdropFilter: 'blur(6px)',
            borderRadius: 3,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem',
            }}>
              Enforcement Type
            </div>
            {Object.entries(CAT_CONFIG).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.32rem' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: v.color, flexShrink: 0, boxShadow: `0 0 4px ${v.color}66` }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.65)' }}>{v.label}</span>
              </div>
            ))}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
              color: 'rgba(255,255,255,0.28)', marginTop: '0.5rem',
            }}>
              Size = number of cases
            </div>
          </div>

          <WorldMap
            filteredCases={filteredCases}
            mapCases={mapCases}
            selectedCaseId={selectedCaseId}
            hoveredCaseId={hoveredCaseId}
            selectedJurisdiction={selectedJurisdiction}
            onSelectJurisdiction={handleSelectJurisdiction}
          />
        </div>

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: '#ffffff',
          borderLeft: '1px solid rgba(26,46,90,0.1)',
          overflow: 'hidden',
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '0.9rem 1.25rem',
            borderBottom: '1px solid rgba(26,46,90,0.1)',
            flexShrink: 0,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.95rem',
              fontWeight: 700, color: '#1a2e5a',
            }}>
              Case Registry
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: 'rgba(26,46,90,0.45)',
                letterSpacing: '0.04em',
              }}>
                {selectedJurisdiction
                  ? `Filtered: ${selectedJurisdiction}`
                  : 'Hover a case to see connections on map'}
              </p>
              {selectedJurisdiction && (
                <button
                  onClick={() => setSelectedJurisdiction(null)}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#4a7fd4', letterSpacing: '0.04em', padding: 0,
                  }}
                >
                  ✕ clear
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: '0.7rem 1.25rem', borderBottom: '1px solid rgba(26,46,90,0.1)', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Search cases, technologies, DPAs…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(26,46,90,0.04)',
                border: '1px solid rgba(26,46,90,0.15)',
                padding: '0.45rem 0.75rem',
                fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
                color: '#1a2e5a', outline: 'none', borderRadius: 2,
              }}
            />
          </div>

          {/* Cases list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredCases.length === 0 ? (
              <div style={{
                padding: '2.5rem 1.25rem', textAlign: 'center',
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                color: 'rgba(26,46,90,0.35)',
              }}>
                No cases match current filters.
              </div>
            ) : byJurisdiction.map(([jur, cases]) => (
              <div key={jur} style={{ borderBottom: '1px solid rgba(26,46,90,0.07)' }}>
                {/* Jurisdiction header */}
                <div
                  onClick={() => setSelectedJurisdiction(jur === selectedJurisdiction ? null : jur)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: 'rgba(26,46,90,0.03)',
                    borderBottom: '1px solid rgba(26,46,90,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer',
                    position: 'sticky', top: 0, zIndex: 1,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,46,90,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,46,90,0.03)'}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: selectedJurisdiction === jur ? '#4a7fd4' : 'rgba(26,46,90,0.55)',
                  }}>
                    {jur}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                    color: 'rgba(26,46,90,0.4)',
                    background: 'rgba(26,46,90,0.06)',
                    padding: '0.1rem 0.4rem', borderRadius: 2,
                  }}>
                    {cases.length}
                  </span>
                </div>

                {/* Case rows */}
                {cases.map(c => {
                  const isHovered = hoveredCaseId === c.id
                  const isSelected = selectedCaseId === c.id
                  return (
                    <div
                      key={c.id}
                      onClick={() => openCase(c)}
                      onMouseEnter={() => setHoveredCaseId(c.id)}
                      onMouseLeave={() => setHoveredCaseId(null)}
                      style={{
                        padding: '0.7rem 1.25rem',
                        borderBottom: '1px solid rgba(26,46,90,0.06)',
                        borderLeft: isSelected
                          ? `3px solid ${CAT_CONFIG[c.enforcement_category]?.color || '#4a7fd4'}`
                          : '3px solid transparent',
                        background: isHovered
                          ? 'rgba(74,127,212,0.07)'
                          : isSelected
                          ? 'rgba(74,127,212,0.04)'
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.12s',
                      }}
                    >
                      <div style={{
                        fontSize: '0.8rem', fontWeight: 500,
                        color: '#1a2e5a', lineHeight: 1.35, marginBottom: '0.35rem',
                      }}>
                        {c.case_name}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {c.year_enforced && (
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                            padding: '0.1rem 0.4rem',
                            background: 'rgba(26,46,90,0.06)',
                            border: '1px solid rgba(26,46,90,0.12)',
                            borderRadius: 2, color: 'rgba(26,46,90,0.55)',
                          }}>{c.year_enforced}</span>
                        )}
                        <CatTag cat={c.enforcement_category} small />
                        {c.affected_countries?.length > 1 && (
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                            color: 'rgba(26,46,90,0.4)',
                          }}>
                            {c.affected_countries.length} countries
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DETAIL PANEL ─────────────────────────────────────────────── */}
      {detailCase && <DetailPanel caseData={detailCase} onClose={closeDetail} />}
    </div>
  )
}

function FilterChip({ active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? (color || 'rgba(255,255,255,0.9)') : 'rgba(10,28,64,0.88)',
        border: `1px solid ${active ? (color || 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.18)'}`,
        color: active ? (color ? '#ffffff' : '#0f1d3a') : 'rgba(255,255,255,0.65)',
        padding: '0.3rem 0.75rem',
        fontFamily: 'var(--font-mono)', fontSize: '0.66rem',
        letterSpacing: '0.04em', cursor: 'pointer', borderRadius: 2,
        backdropFilter: 'blur(6px)',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        boxShadow: active && color ? `0 0 10px ${color}44` : 'none',
      }}
    >
      {children}
    </button>
  )
}
