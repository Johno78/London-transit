window.App = (() => {

  function startClock() {
    function tick() {
      const now = new Date();
      document.getElementById('clock').textContent =
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    tick(); setInterval(tick, 15000);
  }

  function tab(name, btn) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    btn.classList.add('active');
    if (name === 'status'  && !_statusLoaded)  loadStatus();
    if (name === 'nearby'  && !_nearbyLoaded)  loadNearby();
    if (name === 'explore' && !_exploreLoaded) renderExplore('all');
  }

  let _statusLoaded=false, _nearbyLoaded=false, _exploreLoaded=false;

  function swap() {
    const a = document.getElementById('from-input');
    const b = document.getElementById('to-input');
    [a.value, b.value] = [b.value, a.value];
  }

  // ── Journey planner ──────────────────────────────────
  async function plan() {
    const from = document.getElementById('from-input').value.trim();
    const to   = document.getElementById('to-input').value.trim();
    if (!from || !to) { showPlanError('Please enter both a start and destination.'); return; }

    document.getElementById('plan-loading').style.display = 'flex';
    document.getElementById('plan-error').style.display = 'none';
    document.getElementById('route-results').innerHTML = '';
    document.getElementById('step-view').style.display = 'none';

    const timeInput = document.getElementById('time-val').value;
    const timeIs    = document.getElementById('time-type').value === 'arriving' ? 'Arriving' : 'Departing';
    const time      = timeInput ? timeInput.replace(':', '') : null;

    try {
      const data = await TFL.planJourney(from, to, time, timeIs);
      setApiStatus(true); renderRoutes(data);
    } catch {
      setApiStatus(false); renderDemoRoutes(from, to);
    } finally {
      document.getElementById('plan-loading').style.display = 'none';
    }
  }

  function showPlanError(msg) {
    const el = document.getElementById('plan-error');
    el.textContent = msg; el.style.display = 'block';
  }

  let _journeys = [];

  function renderRoutes(data) {
    const journeys = (data.journeys || []).slice(0, 3);
    if (!journeys.length) {
      document.getElementById('route-results').innerHTML = '<p style="text-align:center;padding:30px;color:var(--text3)">No routes found. Try different stations.</p>';
      return;
    }
    const html = journeys.map((j, i) => {
      const mins   = Math.round(j.duration || 0);
      const arrive = j.arrivalDateTime
        ? new Date(j.arrivalDateTime).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : '—';
      const legs   = buildLegPills(j.legs || []);
      const best   = i === 0;
      return `<div class="route-card${best?' best':''}" onclick="App.showSteps(${i})">
        <div class="route-top">
          <div><div class="route-mins">${mins} min</div><div class="route-arrive">Arrive ${arrive}${best?' · Fastest':''}</div></div>
          ${best?'<span class="best-badge">Best route</span>':''}
        </div>
        <div class="route-legs">${legs}</div>
        ${best?'<div class="route-eco">🌿 Saves ~0.4 kg CO₂ vs driving</div>':''}
      </div>`;
    }).join('');
    document.getElementById('route-results').innerHTML = html;
    _journeys = journeys;
  }

  function buildLegPills(legs) {
    return legs.map(leg => {
      const mode = leg.mode ? leg.mode.id : '';
      if (mode === 'walking') {
        return `<span class="leg-pill leg-walk">🚶 ${Math.round(leg.duration||0)} min</span>`;
      }
      const name = leg.routeOptions?.[0]?.name || leg.mode?.name || '?';
      const lineId = leg.routeOptions?.[0]?.lineIdentifier?.id || null;
      const col = lineId && LINE_COLOURS[lineId] ? LINE_COLOURS[lineId] : '#4f8ef7';
      return `<span class="leg-pill" style="background:${col}">${name}</span>`;
    }).join('<span class="leg-sep">›</span>');
  }

  function showSteps(idx) {
    const j = _journeys[idx]; if (!j) return;
    document.getElementById('route-results').style.display = 'none';
    const sv = document.getElementById('step-view');
    sv.style.display = 'block';
    const steps = (j.legs || []).map((leg, i) => {
      const mode   = leg.mode?.id || 'walking';
      const isLast = i === j.legs.length - 1;
      const lineId = leg.routeOptions?.[0]?.lineIdentifier?.id || null;
      const dot    = mode === 'walking' ? '#888' : (lineId && LINE_COLOURS[lineId] ? LINE_COLOURS[lineId] : '#4fc3f7');
      const from   = leg.departurePoint?.commonName || '—';
      const mins   = Math.round(leg.duration || 0);
      const detail = mode === 'walking'
        ? `Walk ${mins} min to ${leg.arrivalPoint?.commonName || '—'}`
        : (leg.instruction?.summary || `Board at ${from}`);
      return `<div class="step-row">
        <div class="step-line-col">
          <div class="step-node" style="background:${dot};box-shadow:0 0 8px ${dot}"></div>
          ${!isLast ? `<div class="step-track" style="background:${dot}"></div>` : ''}
        </div>
        <div class="step-body">
          <div class="step-action">${from}</div>
          <div class="step-detail">${detail}</div>
          <span class="step-dur">${mins} min</span>
        </div>
      </div>`;
    }).join('');
    sv.innerHTML = `<button class="steps-back" onclick="App.backToRoutes()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="14" height="14"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      Back to routes
    </button>${steps}`;
  }

  function backToRoutes() {
    document.getElementById('step-view').style.display = 'none';
    document.getElementById('route-results').style.display = 'block';
  }

  function renderDemoRoutes(from, to) {
    const now = new Date();
    const t = m => new Date(now.getTime() + m*60000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    document.getElementById('route-results').innerHTML = `
      <div class="error-state">⚠️ Demo mode — add your TfL API key in <code>js/config.js</code> for live routes.</div>
      <div class="route-card best" onclick="">
        <div class="route-top"><div><div class="route-mins">28 min</div><div class="route-arrive">Arrive ${t(28)} · Fastest</div></div><span class="best-badge">Best route</span></div>
        <div class="route-legs"><span class="leg-pill" style="background:#003688">Piccadilly</span><span class="leg-sep">›</span><span class="leg-pill" style="background:#e1251b">Central</span></div>
        <div class="route-eco">🌿 Saves ~0.4 kg CO₂ vs driving</div>
      </div>
      <div class="route-card"><div class="route-top"><div><div class="route-mins">38 min</div><div class="route-arrive">Arrive ${t(38)}</div></div></div>
        <div class="route-legs"><span class="leg-pill" style="background:#003688">Piccadilly</span><span class="leg-sep">›</span><span class="leg-pill" style="background:#a1a5a7">Jubilee</span></div></div>
      <div class="route-card"><div class="route-top"><div><div class="route-mins">52 min</div><div class="route-arrive">Arrive ${t(52)}</div></div></div>
        <div class="route-legs"><span class="leg-pill leg-walk">🚶 5 min</span><span class="leg-sep">›</span><span class="leg-pill" style="background:#0019a8">Bus</span></div></div>`;
  }

  // ── Line status ───────────────────────────────────────
  let _allStatus = [];
  async function loadStatus() {
    _statusLoaded = true;
    document.getElementById('status-loading').style.display = 'flex';
    try {
      const data = await TFL.lineStatuses();
      setApiStatus(true); _allStatus = data; renderStatus(data, 'all');
    } catch { setApiStatus(false); renderDemoStatus(); }
    finally { document.getElementById('status-loading').style.display = 'none'; }
  }

  function renderStatus(lines, filter) {
    const el = document.getElementById('status-list');
    const filtered = filter === 'all' ? lines : lines.filter(l => {
      const good = l.lineStatuses?.[0]?.statusSeverityDescription === 'Good Service';
      return filter === 'good' ? good : !good;
    });
    el.innerHTML = filtered.map((line, i) => {
      const status = line.lineStatuses?.[0]?.statusSeverityDescription || 'No information';
      const reason = (line.lineStatuses?.[0]?.reason || '').replace(/^[^:]+:\s*/,'').substring(0,60);
      const col    = LINE_COLOURS[line.id] || '#888';
      const isGood = status === 'Good Service';
      const isMinor = status.includes('Minor');
      const cls  = isGood ? 'sg' : isMinor ? 'sm' : 'ss';
      const dot  = isGood ? 'var(--good)' : isMinor ? 'var(--warn)' : 'var(--bad)';
      const icon = isGood ? '✓' : isMinor ? '⚠' : '✕';
      const glow = isGood ? 'rgba(0,230,118,0.4)' : isMinor ? 'rgba(255,171,64,0.4)' : 'rgba(255,82,82,0.4)';
      return `<div class="status-item" style="animation-delay:${i*0.03}s">
        <div class="line-swatch" style="background:${col};box-shadow:0 0 8px ${col}66"></div>
        <div class="line-info">
          <div class="line-name">${LINE_NAMES[line.id] || line.name}</div>
          <div class="line-desc ${cls}">${icon} ${status}${reason?' · '+reason+'…':''}</div>
        </div>
        <div class="status-indicator" style="background:${isGood?'var(--good)':isMinor?'var(--warn)':'var(--bad)'};box-shadow:0 0 8px ${glow}"></div>
      </div>`;
    }).join('');
    el.style.display = 'block';
  }

  function filterStatus(filter, btn) {
    document.querySelectorAll('#panel-status .fpill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    if (_allStatus.length) renderStatus(_allStatus, filter);
  }

  function renderDemoStatus() {
    const demo = [
      {id:'piccadilly',good:true},{id:'central',good:true},
      {id:'jubilee',good:false,minor:true,note:'Minor delays · Stratford branch'},
      {id:'elizabeth',good:true},{id:'northern',good:true},{id:'victoria',good:true},
      {id:'district',good:true},{id:'metropolitan',good:true},{id:'bakerloo',good:true},
      {id:'london-overground',good:false,note:'Severe delays · West Croydon'},
      {id:'dlr',good:true},{id:'hammersmith-city',good:false,minor:true,note:'Minor delays'}
    ];
    const el = document.getElementById('status-list');
    el.innerHTML = `<div class="error-state">⚠️ Demo data — add TfL API key in <code>js/config.js</code></div>` +
      demo.map((d,i) => {
        const c=LINE_COLOURS[d.id]||'#888';
        const cls=d.good?'sg':d.minor?'sm':'ss';
        const dot=d.good?'var(--good)':d.minor?'var(--warn)':'var(--bad)';
        const glow=d.good?'rgba(0,230,118,0.4)':d.minor?'rgba(255,171,64,0.4)':'rgba(255,82,82,0.4)';
        const icon=d.good?'✓':d.minor?'⚠':'✕';
        const status=d.good?'Good Service':d.note||'Disruption';
        return `<div class="status-item" style="animation-delay:${i*0.03}s">
          <div class="line-swatch" style="background:${c};box-shadow:0 0 8px ${c}66"></div>
          <div class="line-info"><div class="line-name">${LINE_NAMES[d.id]}</div>
          <div class="line-desc ${cls}">${icon} ${status}</div></div>
          <div class="status-indicator" style="background:${dot};box-shadow:0 0 8px ${glow}"></div>
        </div>`;
      }).join('');
    el.style.display='block';
  }

  // ── Nearby ────────────────────────────────────────────
  async function loadNearby() {
    _nearbyLoaded = true;
    const ll = document.getElementById('nearby-loading');
    ll.style.display = 'flex';
    if (!navigator.geolocation) { ll.innerHTML='<p class="error-state">Geolocation not supported.</p>'; return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      ll.querySelector('p').textContent = 'Finding nearby stops…';
      try {
        const {latitude:lat,longitude:lon} = pos.coords;
        const data = await TFL.nearbyStops(lat, lon);
        setApiStatus(true); renderNearby(data.stopPoints || []);
      } catch { setApiStatus(false); renderDemoNearby(); }
      finally { ll.style.display='none'; }
    }, () => { ll.style.display='none'; renderDemoNearby(); });
  }

  function renderNearby(stops) {
    const el = document.getElementById('nearby-list');
    if (!stops.length) { el.innerHTML='<p style="text-align:center;padding:30px;color:var(--text3)">No stops found nearby.</p>'; el.style.display='block'; return; }
    el.innerHTML = stops.slice(0,5).map(stop => {
      const dist = stop.distance ? Math.round(stop.distance)+'m' : '—';
      const walk = stop.distance ? Math.round(stop.distance/80)+' min walk' : '—';
      const isTube = stop.modes?.includes('tube');
      const emoji = isTube ? '🚇' : '🚌';
      const bg = isTube ? 'rgba(0,54,136,0.35)' : 'rgba(225,37,27,0.25)';
      return `<div class="nearby-card" id="stop-${stop.id}">
        <div class="nearby-header">
          <div class="nearby-icon" style="background:${bg}">${emoji}</div>
          <div><div class="nearby-name">${stop.commonName}</div><div class="nearby-dist">🚶 ${walk} · ${dist}</div></div>
        </div>
        <div class="dep-row"><span class="dep-dest">Loading live arrivals…</span><span class="dep-time">—</span></div>
      </div>`;
    }).join('');
    el.style.display = 'block';
    stops.slice(0,5).forEach(async stop => {
      try {
        const arrivals = await TFL.arrivals(stop.id);
        const sorted = arrivals.sort((a,b)=>a.timeToStation-b.timeToStation).slice(0,4);
        const card = document.getElementById('stop-'+stop.id);
        if (!card) return;
        card.querySelectorAll('.dep-row').forEach(r=>r.remove());
        const rows = sorted.map(a => {
          const mins = Math.round(a.timeToStation/60);
          const str = mins<=0?'Due':mins+' min';
          const cls = mins<=0?'dep-due':mins<=2?'dep-soon':'dep-ok';
          return `<div class="dep-row"><span class="dep-dest">${a.destinationName||a.towards||'—'}</span><span class="dep-time ${cls}">${str}</span></div>`;
        }).join('') || '<div class="dep-row"><span class="dep-dest" style="color:var(--text3)">No arrivals data</span></div>';
        card.insertAdjacentHTML('beforeend', rows);
      } catch {}
    });
  }

  function renderDemoNearby() {
    const el = document.getElementById('nearby-list');
    el.innerHTML = `
      <div class="error-state">📍 Demo mode — allow location access and add API key for live departures.</div>
      <div class="nearby-card">
        <div class="nearby-header"><div class="nearby-icon" style="background:rgba(0,54,136,0.35)">🚇</div>
        <div><div class="nearby-name">King's Cross St. Pancras</div><div class="nearby-dist">🚶 2 min · 150m</div></div></div>
        <div class="dep-row"><span class="dep-dest">Piccadilly · Heathrow T5</span><span class="dep-time dep-due">Due</span></div>
        <div class="dep-row"><span class="dep-dest">Piccadilly · Cockfosters</span><span class="dep-time dep-soon">2 min</span></div>
        <div class="dep-row"><span class="dep-dest">Northern · Morden</span><span class="dep-time dep-ok">6 min</span></div>
      </div>
      <div class="nearby-card">
        <div class="nearby-header"><div class="nearby-icon" style="background:rgba(225,37,27,0.25)">🚌</div>
        <div><div class="nearby-name">King's Cross bus stops</div><div class="nearby-dist">🚶 1 min · 80m</div></div></div>
        <div class="dep-row"><span class="dep-dest">Bus 17 · London Bridge</span><span class="dep-time dep-due">Due</span></div>
        <div class="dep-row"><span class="dep-dest">Bus 30 · Hackney Wick</span><span class="dep-time dep-ok">3 min</span></div>
      </div>`;
    el.style.display='block';
  }

  // ══ EXPLORE ══════════════════════════════════════════
  function renderExplore(filter) {
    _exploreLoaded = true;
    const grid = document.getElementById('explore-grid');
    const favs = window.TFL_CONFIG?.favouriteAttractions || [];
    let items = window.EXPLORE_DATA.filter(item =>
      filter === 'all' ? true : item.category.includes(filter)
    );
    items.sort((a,b) => {
      const ai=favs.indexOf(a.id), bi=favs.indexOf(b.id);
      if(ai>-1&&bi===-1)return-1; if(bi>-1&&ai===-1)return 1;
      if(ai>-1&&bi>-1)return ai-bi; return 0;
    });

    grid.innerHTML = items.map((item, idx) => {
      const cat = item.category[0] || 'attraction';
      const freeTag = item.free
        ? '<span class="badge badge-free">Free</span>'
        : `<span class="badge badge-paid">${item.cost.split(' ')[0]}</span>`;
      return `<div class="explore-card" data-cat="${item.category.join(' ')}" style="animation-delay:${idx*0.04}s">
        <div class="explore-img-placeholder">${item.emoji}</div>
        <div class="explore-body">
          <div class="explore-name">${item.name}</div>
          <div class="explore-badges">
            ${freeTag}
            <span class="badge badge-age">${item.ageRange}</span>
          </div>
          <p class="explore-desc">${item.desc}</p>
          <p class="explore-tip">💡 ${item.tip}</p>
          <div class="explore-meta">
            <span class="explore-meta-item">⏰ ${item.openingHours}</span>
            ${item.walkMins>0?`<span class="explore-meta-item">🚶 ${item.walkMins} min from station</span>`:''}
          </div>
        </div>
        <div class="explore-footer">
          <div class="explore-tube">
            <span class="tube-dot" style="background:${item.tubeColor};box-shadow:0 0 6px ${item.tubeColor}"></span>
            ${item.nearestTube}
          </div>
          <button class="explore-plan-btn" onclick="App.planFromExplore('${item.id}')">Get there ›</button>
        </div>
      </div>`;
    }).join('');
  }

  function filterExplore(filter, btn) {
    document.querySelectorAll('#panel-explore .fpill').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    renderExplore(filter);
  }

  function planFromExplore(id) {
    const item = window.EXPLORE_DATA.find(d=>d.id===id); if(!item)return;
    document.getElementById('to-input').value = item.address;
    const from = document.getElementById('from-input');
    if(!from.value) from.value = window.TFL_CONFIG?.defaultFrom || "King's Cross St. Pancras";
    const planBtn = document.querySelector('.tab-btn[onclick*="plan"]');
    tab('plan', planBtn); plan();
  }

  // ── API dot ───────────────────────────────────────────
  function setApiStatus(ok) {
    const dot = document.getElementById('api-dot');
    dot.classList.toggle('live', ok);
    dot.classList.toggle('error', !ok);
    document.getElementById('header-sub').textContent = ok ? 'Live · TfL' : 'Demo mode';
  }

  function init() {
    startClock();
    if (window.TFL_CONFIG?.defaultFrom)
      document.getElementById('from-input').value = window.TFL_CONFIG.defaultFrom;
    const now = new Date();
    document.getElementById('time-val').value = now.toTimeString().slice(0,5);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { tab, swap, plan, showSteps, backToRoutes, filterStatus, filterExplore, planFromExplore };
})();
