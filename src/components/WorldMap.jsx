import { useEffect, useRef, useCallback, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { COORD_MAP, CAT_CONFIG, CASES } from '../data/cases'

const JURISDICTION_COUNTRIES = [...new Set(CASES.map(c => c.jurisdiction))]

export default function WorldMap({
  filteredCases,
  selectedCaseId,
  hoveredCaseId,
  selectedJurisdiction,
  onSelectJurisdiction,
}) {
  const svgRef = useRef(null)
  const gRef = useRef(null)
  const projRef = useRef(null)
  const containerRef = useRef(null)
  const zoomKRef = useRef(1)
  const [worldData, setWorldData] = useState(null)
  const [dims, setDims] = useState({ w: 900, h: 520 })

  // Load world topology once
  useEffect(() => {
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(w => setWorldData(w))
  }, [])

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDims({ w: Math.max(width, 300), h: Math.max(height, 200) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Build/rebuild SVG base when worldData or dims change
  useEffect(() => {
    if (!svgRef.current || !worldData) return
    const { w, h } = dims

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const proj = d3.geoNaturalEarth1()
      .scale(w / 6.2)
      .translate([w / 2, h / 2 + 10])
    projRef.current = proj

    const pathFn = d3.geoPath().projection(proj)

    const g = svg.append('g').attr('class', 'base-layer')
    gRef.current = g

    // Ocean background handled by SVG bg
    // Countries
    const countries = topojson.feature(worldData, worldData.objects.countries)
    g.append('g')
      .attr('class', 'country-fills')
      .selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('d', pathFn)
      .attr('fill', '#1e3560')
      .attr('stroke', '#243970')
      .attr('stroke-width', 0.5)

    // Country borders mesh
    g.append('path')
      .datum(topojson.mesh(worldData, worldData.objects.countries, (a, b) => a !== b))
      .attr('fill', 'none')
      .attr('stroke', '#2e4d8c')
      .attr('stroke-width', 0.3)
      .attr('d', pathFn)

    // Overlay layer on top
    g.append('g').attr('class', 'overlay-layer')

    // Zoom behaviour
    const zoom = d3.zoom()
      .scaleExtent([1, 14])
      .translateExtent([[0, 0], [w, h]])
      .on('zoom', e => {
        g.attr('transform', e.transform)
        const k = e.transform.k
        zoomKRef.current = k
        g.selectAll('.bubble').attr('transform', d => `translate(${d.cx},${d.cy}) scale(${1 / k})`)
      })

    svg.call(zoom)
    svg.on('dblclick.zoom', () =>
      svg.transition().duration(550).call(zoom.transform, d3.zoomIdentity)
    )
  }, [worldData, dims])

  // Draw dynamic overlay (bubbles + arcs) when selection/filter changes
  useEffect(() => {
    if (!gRef.current || !projRef.current) return
    const g = gRef.current
    const proj = projRef.current

    const overlay = g.select('.overlay-layer')
    overlay.selectAll('*').remove()

    // Active case: hovered wins over selected
    const activeId = hoveredCaseId ?? selectedCaseId
    const activeCase = activeId != null ? CASES.find(c => c.id === activeId) : null

    // Per-jurisdiction stats from filtered cases
    const jurStats = {}
    filteredCases.forEach(c => {
      if (!jurStats[c.jurisdiction]) jurStats[c.jurisdiction] = { count: 0, cats: {} }
      jurStats[c.jurisdiction].count++
      jurStats[c.jurisdiction].cats[c.enforcement_category] =
        (jurStats[c.jurisdiction].cats[c.enforcement_category] || 0) + 1
    })

    const maxCount = Math.max(...Object.values(jurStats).map(d => d.count), 1)

    // Highlighted country set
    const highlightSet = new Set()
    if (activeCase) activeCase.affected_countries.forEach(ac => highlightSet.add(ac))
    else if (selectedJurisdiction) highlightSet.add(selectedJurisdiction)

    // ── Country fill highlights ──────────────────────────────────────────
    const highlightColor = activeCase
      ? CAT_CONFIG[activeCase.enforcement_category]?.color || '#4a7fd4'
      : '#4a9fd4'

    g.select('.country-fills').selectAll('path').each(function(d) {
      let matched = false
      if (highlightSet.size > 0) {
        for (const country of highlightSet) {
          const coords = COORD_MAP[country]
          if (coords && d3.geoContains(d, coords)) { matched = true; break }
        }
      }
      d3.select(this)
        .attr('fill', matched ? highlightColor + '40' : '#1e3560')
        .attr('stroke', matched ? highlightColor : '#243970')
        .attr('stroke-width', matched ? 1.5 : 0.5)
    })

    // ── Connection arcs ──────────────────────────────────────────────────
    if (activeCase && activeCase.affected_countries.length > 1) {
      const originCoords = COORD_MAP[activeCase.jurisdiction]
      if (originCoords) {
        const [ox, oy] = proj(originCoords)
        const catColor = CAT_CONFIG[activeCase.enforcement_category]?.color || '#4a7fd4'

        activeCase.affected_countries.forEach(ac => {
          if (ac === activeCase.jurisdiction) return
          const c2 = COORD_MAP[ac]
          if (!c2) return
          const [tx, ty] = proj(c2)
          const dx = tx - ox, dy = ty - oy
          const len = Math.hypot(dx, dy)
          // Arc control point: perpendicular offset
          const mx = (ox + tx) / 2 - dy * 0.22
          const my = (oy + ty) / 2 + dx * 0.22

          // Glow line
          overlay.append('path')
            .attr('d', `M${ox},${oy} Q${mx},${my} ${tx},${ty}`)
            .attr('fill', 'none')
            .attr('stroke', catColor)
            .attr('stroke-width', 3)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0.18)

          // Main dashed arc
          overlay.append('path')
            .attr('d', `M${ox},${oy} Q${mx},${my} ${tx},${ty}`)
            .attr('fill', 'none')
            .attr('stroke', catColor)
            .attr('stroke-width', 1.4)
            .attr('stroke-dasharray', '5 3')
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0.85)

          // Target dot
          overlay.append('circle')
            .attr('cx', tx).attr('cy', ty).attr('r', 3.5)
            .attr('fill', catColor)
            .attr('opacity', 0.9)
            .attr('stroke', '#0f1d3a')
            .attr('stroke-width', 1)
        })

        // Origin pulse ring
        overlay.append('circle')
          .attr('cx', ox).attr('cy', oy).attr('r', 14)
          .attr('fill', 'none')
          .attr('stroke', catColor)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.4)
      }
    }

    // ── Jurisdiction bubbles ─────────────────────────────────────────────
    JURISDICTION_COUNTRIES.forEach(jur => {
      const coords = COORD_MAP[jur]
      if (!coords) return
      const [cx, cy] = proj(coords)
      const data = jurStats[jur]
      const count = data?.count || 0
      if (count === 0) return

      const cats = data.cats
      const dominant = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other'
      const color = CAT_CONFIG[dominant]?.color || '#4a7fd4'
      const r = 9 + (count / maxCount) * 16
      const isSelected = selectedJurisdiction === jur
      const isHighlighted = highlightSet.has(jur)

      const k = zoomKRef.current
      const bg = overlay.append('g')
        .datum({ cx, cy })
        .attr('class', 'bubble')
        .attr('transform', `translate(${cx},${cy}) scale(${1 / k})`)
        .style('cursor', 'pointer')

      // Outer ring when selected or highlighted
      if (isSelected || isHighlighted) {
        bg.append('circle').attr('r', r + 7)
          .attr('fill', color).attr('opacity', 0.2)
        bg.append('circle').attr('r', r + 4)
          .attr('fill', 'none')
          .attr('stroke', color).attr('stroke-width', 1)
          .attr('opacity', 0.5)
      }

      // Main bubble
      bg.append('circle').attr('r', r)
        .attr('fill', color)
        .attr('fill-opacity', 0.9)
        .attr('stroke', isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)')
        .attr('stroke-width', isSelected ? 2 : 1)

      // Count label
      if (count > 1) {
        bg.append('text')
          .text(count)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', 'white')
          .style('font-family', "'Outfit', sans-serif")
          .style('font-size', '9px')
          .style('font-weight', '600')
          .style('pointer-events', 'none')
      }

      bg.on('click', e => {
        e.stopPropagation()
        onSelectJurisdiction(jur === selectedJurisdiction ? null : jur)
      })
    })

    // Click base layer to clear jurisdiction
    g.select('.country-fills').on('click', () => onSelectJurisdiction(null))

  }, [worldData, filteredCases, selectedCaseId, hoveredCaseId, selectedJurisdiction, onSelectJurisdiction])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {/* Ocean gradient bg */}
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="ocean-grad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#162448" />
            <stop offset="100%" stopColor="#0d1829" />
          </radialGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={dims.w} height={dims.h} fill="url(#ocean-grad)" />
      </svg>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: 12, right: 14,
        fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
        color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em',
        pointerEvents: 'none',
      }}>
        {'ontouchstart' in window || navigator.maxTouchPoints > 0
          ? 'pinch · drag · double-tap to reset'
          : 'scroll · drag · dbl-click to reset'}
      </div>
    </div>
  )
}
