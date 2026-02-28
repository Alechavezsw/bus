(function () {
  'use strict';

  const DAY_TYPES = {
    weekday: 'Lunes a viernes',
    saturday: 'Sábados',
    sunday: 'Domingos y feriados'
  };

  let data = { lines: [], network: '', city: '' };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const searchInput = $('#search');
  const deptFilter = $('#dept-filter');
  const linesList = $('#lines-list');
  const stopsList = $('#stops-list');
  const drawer = $('#drawer');
  const drawerBackdrop = $('#drawer-backdrop');
  const drawerTitle = $('#drawer-title');
  const drawerContent = $('#drawer-content');
  const drawerClose = $('#drawer-close');

  async function loadData() {
    try {
      const res = await fetch('data/lines.json');
      if (!res.ok) throw new Error('No se pudo cargar datos');
      const raw = await res.json();
      const allLines = (raw.lines || []).concat(raw.numericLines || []);
      data = {
        network: raw.network || 'Red Tulum',
        city: raw.city || 'San Juan',
        departments: raw.departments || [],
        lines: allLines.map(l => ({
          ...l,
          stops: l.stops || [],
          schedules: l.schedules || {},
          description: l.description || (l.departments && l.departments.length ? l.departments.join(', ') : ''),
          moovitUrl: l.moovitUrl || (l.shortName ? 'https://moovitapp.com/san_juan-6137/lines/' + encodeURIComponent(l.shortName) : null)
        }))
      };
      return data;
    } catch (e) {
      console.error(e);
      data = { lines: [], departments: [], network: 'Red Tulum', city: 'San Juan' };
      return data;
    }
  }

  function buildStopsIndex() {
    const byName = new Map();
    data.lines.forEach(line => {
      (line.stops || []).forEach(stop => {
        const key = stop.id;
        if (!byName.has(key)) {
          byName.set(key, { stop, lines: [] });
        }
        byName.get(key).lines.push(line);
      });
    });
    return byName;
  }

  function filterByDepartment(lines, dept) {
    if (!dept || !dept.trim()) return lines;
    return lines.filter(line => (line.departments || []).includes(dept));
  }

  function filterBySearch(text, dept) {
    const q = (text || '').trim().toLowerCase();
    let lines = data.lines;
    if (dept) lines = filterByDepartment(lines, dept);
    if (q) {
      lines = lines.filter(
        line =>
          (line.shortName && line.shortName.toString().toLowerCase().includes(q)) ||
          (line.name && line.name.toLowerCase().includes(q)) ||
          (line.description && line.description.toLowerCase().includes(q)) ||
          (line.departments && line.departments.some(d => d.toLowerCase().includes(q)))
      );
    }
    const allStops = buildStopsIndex();
    const stops = new Map();
    allStops.forEach((val, key) => {
      if (dept && !val.lines.some(l => (l.departments || []).includes(dept))) return;
      if (q) {
        const nameMatch = val.stop.name.toLowerCase().includes(q);
        const lineMatch = val.lines.some(
          l =>
            (l.shortName && l.shortName.toString().toLowerCase().includes(q)) ||
            (l.name && l.name.toLowerCase().includes(q))
        );
        if (!nameMatch && !lineMatch) return;
      }
      stops.set(key, val);
    });
    return { lines, stops };
  }

  function renderLines(lines) {
    if (!lines.length) {
      linesList.innerHTML = '<li class="empty-state">No hay líneas que coincidan con la búsqueda.</li>';
      return;
    }
    linesList.innerHTML = lines
      .map(
        line => `
      <li class="line-card">
        <a href="#" data-line-id="${line.id}" data-action="line">
          <span class="line-badge" style="background:${line.color || '#2b6b8c'}">${line.shortName}</span>
          <div class="line-info">
            <h3>${escapeHtml(line.name)}</h3>
            <p>${escapeHtml(line.description || '')}</p>
          </div>
        </a>
      </li>`
      )
      .join('');
  }

  function renderStops(stopsMap) {
    const entries = [...stopsMap.entries()];
    if (!entries.length) {
      stopsList.innerHTML = '<li class="empty-state">No hay paradas que coincidan con la búsqueda.</li>';
      return;
    }
    stopsList.innerHTML = entries
      .map(([_, { stop, lines }]) => {
        const pills = lines
          .map(
            l =>
              `<span class="line-pill" style="background:${l.color || '#2b6b8c'}">${l.shortName}</span>`
          )
          .join('');
        return `
      <li class="stop-card">
        <a href="#" data-stop-id="${stop.id}" data-line-ids="${lines.map(l => l.id).join(',')}" data-action="stop">
          ${escapeHtml(stop.name)}
          <div class="lines-badges">${pills}</div>
        </a>
      </li>`;
      })
      .join('');
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function openDrawer(title, html) {
    drawerTitle.textContent = title;
    drawerContent.innerHTML = html;
    drawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop.setAttribute('aria-hidden', 'false');
    drawer.classList.add('open');
    drawerBackdrop.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawerBackdrop.classList.remove('visible');
    drawer.setAttribute('aria-hidden', 'true');
    drawerBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function renderSchedule(schedules) {
    if (!schedules || typeof schedules !== 'object') {
      return '<p class="empty-state">Sin horarios cargados.</p>';
    }
    let html = '';
    for (const [dayType, times] of Object.entries(schedules)) {
      const label = DAY_TYPES[dayType] || dayType;
      const list = Array.isArray(times) ? times : [];
      html += `<h3>${escapeHtml(label)}</h3><div class="schedule-grid">`;
      list.forEach(t => {
        html += `<span class="schedule-time">${escapeHtml(String(t))}</span>`;
      });
      html += '</div>';
    }
    return html || '<p class="empty-state">Sin horarios cargados.</p>';
  }

  function showLineDetail(line) {
    const hasStops = (line.stops || []).length > 0;
    const hasSchedules = line.schedules && Object.keys(line.schedules).length > 0;
    let stopsHtml = '';
    if (line.departments && line.departments.length) {
      stopsHtml += `<p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:0.75rem;">Pasa por: ${escapeHtml(line.departments.join(', '))}</p>`;
    }
    if (hasStops) {
      stopsHtml += `
      <h3>Paradas</h3>
      <ol class="drawer-stops">
        ${(line.stops || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(s => `<li>${escapeHtml(s.name)}</li>`).join('')}
      </ol>`;
    }
    if (hasSchedules) {
      stopsHtml += `<h3>Horarios</h3>${renderSchedule(line.schedules)}`;
    }
    if (!hasStops && !hasSchedules) {
      stopsHtml += '<p class="empty-state">Consultar horarios y paradas en la app oficial o en Moovit.</p>';
    }
    if (line.moovitUrl) {
      stopsHtml += `<a href="${escapeHtml(line.moovitUrl)}" target="_blank" rel="noopener noreferrer" class="drawer-moovit">Ver recorrido en Moovit</a>`;
    }
    openDrawer(`${line.name}${line.description ? ' – ' + line.description : ''}`, stopsHtml);
  }

  function showStopDetail(stopId, lineIds) {
    const ids = lineIds ? lineIds.split(',').filter(Boolean) : [];
    const lines = data.lines.filter(l => ids.includes(l.id));
    let html = '<p>Líneas que pasan por esta parada:</p>';
    lines.forEach(line => {
      html += `
        <div class="line-card" style="margin-bottom: 1rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;">
            <span class="line-badge" style="background:${line.color || '#2b6b8c'}">${line.shortName}</span>
            <div>
              <strong>${escapeHtml(line.name)}</strong>
              <p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.2rem;">${escapeHtml(line.description || '')}</p>
            </div>
          </div>
          <div style="padding:0 1rem 1rem;">
            <h3 style="font-size:0.85rem;text-transform:uppercase;color:var(--text-muted);margin-bottom:0.5rem;">Horarios</h3>
            ${renderSchedule(line.schedules)}
          </div>
        </div>
      `;
    });
    const stopName = (() => {
      for (const line of data.lines) {
        const s = (line.stops || []).find(s => s.id === stopId);
        if (s) return s.name;
      }
      return 'Parada';
    })();
    openDrawer(stopName, html);
  }

  function refresh() {
    const dept = deptFilter ? deptFilter.value : '';
    const { lines, stops } = filterBySearch(searchInput ? searchInput.value : '', dept);
    renderLines(lines);
    renderStops(stops);
  }

  function fillDeptFilter() {
    if (!deptFilter || !data.departments || !data.departments.length) return;
    const current = deptFilter.value;
    deptFilter.innerHTML = '<option value="">Todos los departamentos</option>' +
      data.departments.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    if (current) deptFilter.value = current;
  }

  function initTabs() {
    $$('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        $$('.tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $('#panel-lines').classList.toggle('active', tab === 'lines');
        $('#panel-stops').classList.toggle('active', tab === 'stops');
        $('#panel-lines').hidden = tab !== 'lines';
        $('#panel-stops').hidden = tab !== 'stops';
      });
    });
  }

  function initClicks() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[data-action]');
      if (!a) return;
      e.preventDefault();
      const action = a.dataset.action;
      if (action === 'line') {
        const line = data.lines.find(l => l.id === a.dataset.lineId);
        if (line) showLineDetail(line);
      } else if (action === 'stop') {
        showStopDetail(a.dataset.stopId, a.dataset.lineIds);
      }
    });
  }

  function init() {
    initTabs();
    initClicks();
    if (searchInput) {
      searchInput.addEventListener('input', refresh);
      searchInput.addEventListener('search', refresh);
    }
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);
    if (deptFilter) deptFilter.addEventListener('change', refresh);
    loadData().then(() => {
      fillDeptFilter();
      refresh();
    });
  }

  init();
})();
