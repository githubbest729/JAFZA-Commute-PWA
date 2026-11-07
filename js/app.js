/* Jebel Ali & Discovery Gardens Transit Guide - app logic (vanilla ES6+, no dependencies) */
(() => {
  'use strict';

  const D = window.TRANSIT_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (sel, ev, fn, opt) => { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; if (el) el.addEventListener(ev, fn, opt); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const DAY = 1440;
  const MIN = 60000;

  if (!D) {
    document.body.insertAdjacentHTML('afterbegin', '<p style="padding:24px;font-family:sans-serif">Schedule data failed to load. Please reload.</p>');
    return;
  }

  /* ---------- storage (safe: private mode / blocked storage) ---------- */
  const store = {
    get(k, def) { try { const v = localStorage.getItem('jaf.' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem('jaf.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  /* ---------- data lookups ---------- */
  const stopById = Object.fromEntries(D.stops.map((s) => [s.id, s]));
  const routeById = Object.fromEntries(D.routes.map((r) => [r.id, r]));
  const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const sName = (id) => (stopById[id] ? stopById[id].short : id);
  const fName = (id) => (stopById[id] ? stopById[id].name : id);
  const SHELTER = { ac: 'AC Shelter', covered: 'Covered', open: 'Open pole' };
  const fmtAed = (n) => Number(n).toFixed(2);
  const ZONE_TXT = { 1: '1 zone', 2: '2 adjacent zones', 3: 'more than 2 zones' };

  /* ---------- state ---------- */
  const hourNow = new Date().getHours();
  const state = {
    tab: 'home',
    dir: store.get('dir', hourNow < 13 ? 'out' : 'in'),
    area: store.get('area', 'all'),
    shift: store.get('shift', 'now'),
    board: store.get('board', 'auto'),
    theme: store.get('theme', 'standard'),
    favs: store.get('favs', []),
    sheet: null,       // { rid, dir, stop } while the route sheet is open
    wantWake: false,
    swReady: false
  };
  if (!Array.isArray(state.favs)) state.favs = [];
  if (!D.shifts[state.shift]) state.shift = 'now';
  if (!D.areas[state.area]) state.area = 'all';
  if (!['standard', 'sun', 'oled'].includes(state.theme)) state.theme = 'standard';

  /* ---------- schedule engine (100% local) ---------- */
  function seqFor(route, dir) {
    const total = route.stops[route.stops.length - 1][1];
    if (dir === 'out') return route.stops.map(([id, off]) => ({ id, off }));
    return route.stops.slice().reverse().map(([id, off]) => ({ id, off: total - off }));
  }
  const baseCache = new Map();
  function baseTimes(route, dir) {
    const key = route.id + dir;
    if (baseCache.has(key)) return baseCache.get(key);
    const shift = dir === 'in' ? (route.inShift || 5) : 0;
    const out = [];
    route.windows.forEach(([a, b, h]) => { for (let t = toMin(a); t < toMin(b); t += h) out.push(t + shift); });
    baseCache.set(key, out);
    return out;
  }
  const midnight = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function inRange(m, [s, e]) {
    const tod = ((m % DAY) + DAY) % DAY;
    return (tod >= s && tod <= e) || (tod + DAY >= s && tod + DAY <= e);
  }
  /* Next departures (epoch ms) of a route/direction at a stop, optionally inside a shift window. */
  function departures(route, dir, stopId, n, shiftKey) {
    const st = seqFor(route, dir).find((s) => s.id === stopId);
    if (!st) return [];
    const now = Date.now(), m0 = midnight(), limit = now + 36 * 3600e3;
    const range = D.shifts[shiftKey || 'now'].range;
    const out = [];
    const base = baseTimes(route, dir);
    for (let d = -1; d <= 2; d++) {
      for (const t of base) {
        const m = t + st.off + d * DAY;
        const ms = m0 + m * MIN;
        if (ms < now || ms > limit) continue;
        if (range && !inRange(m, range)) continue;
        out.push(ms);
      }
    }
    out.sort((a, b) => a - b);
    return out.slice(0, n);
  }

  /* ---------- formatting ---------- */
  const hm = (ms) => { const d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const dayTag = (ms) => (ms >= midnight() + DAY * MIN ? '<small>+1</small>' : '');
  function cdText(ms) {
    const s = Math.floor((ms - Date.now()) / 1000);
    if (s <= 0) return 'Now';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${pad(m)}m` : `${pad(m)}:${pad(s % 60)}`;
  }
  const minsText = (ms) => { const m = Math.max(0, Math.round((ms - Date.now()) / MIN)); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`; };
  const dirLabel = (r, dir) => { const q = seqFor(r, dir); return `${sName(q[0].id)} → ${sName(q[q.length - 1].id)}`; };
  const favKey = (rid, dir, stop) => `${rid}|${dir}|${stop}`;
  const parseKey = (k) => {
    const [rid, dir, stop] = String(k).split('|');
    const r = routeById[rid];
    if (!r || (dir !== 'out' && dir !== 'in') || !seqFor(r, dir).some((s) => s.id === stop)) return null;
    return { r, dir, stop };
  };
  const isFav = (k) => state.favs.includes(k);

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg, ms) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2600);
  }

  /* ---------- theme ---------- */
  const THEMES = {
    standard: { name: 'Standard', icon: '#i-phone', color: '#0b2545' },
    sun: { name: 'Direct Sunlight', icon: '#i-sun', color: '#000000' },
    oled: { name: 'Low Battery', icon: '#i-battery', color: '#000000' }
  };
  function applyTheme(t, announce) {
    state.theme = t;
    store.set('theme', t);
    document.documentElement.dataset.theme = t;
    $('#meta-theme').content = THEMES[t].color;
    $('#theme-icon').setAttribute('href', THEMES[t].icon);
    $('#btn-theme').setAttribute('aria-label', `Display mode: ${THEMES[t].name}. Tap to change`);
    $$('[data-theme-pick]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themePick === t)));
    if (announce) toast(`${THEMES[t].name} mode`);
  }
  function cycleTheme() {
    const order = ['standard', 'sun', 'oled'];
    applyTheme(order[(order.indexOf(state.theme) + 1) % order.length], true);
  }

  /* ---------- home ---------- */
  function boardStops() {
    const seen = new Set();
    D.routes.forEach((r) => seqFor(r, state.dir).slice(0, -1).forEach((s) => seen.add(s.id)));
    return D.stops.filter((s) => seen.has(s.id));
  }
  function renderControls() {
    $('#dir-hint').textContent = state.dir === 'out'
      ? 'Outbound: Heading towards JAFZA, DIP & Al Furjan terminals.'
      : 'Return: Heading towards Discovery Gardens & Ibn Battuta Metro.';
    $$('#seg-dir [data-dir]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dir === state.dir)));
    $$('#chips-area .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.area === state.area)));
    $$('#chips-shift .chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shift === state.shift)));
  }
  function renderBoardSelect() {
    const opts = boardStops();
    if (state.board !== 'auto' && !opts.some((s) => s.id === state.board)) state.board = 'auto';
    $('#sel-board').innerHTML =
      `<option value="auto">Start of each route</option>` +
      opts.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    $('#sel-board').value = state.board;
  }
  function buildCards() {
    const cards = [];
    D.routes.forEach((r) => {
      if (state.area !== 'all' && !r.areas.includes(state.area)) return;
      const seq = seqFor(r, state.dir);
      const boardId = state.board === 'auto' ? seq[0].id : state.board;
      const idx = seq.findIndex((s) => s.id === boardId);
      if (idx < 0 || idx === seq.length - 1) return;
      cards.push({ r, seq, boardId, idx, deps: departures(r, state.dir, boardId, 3, state.shift) });
    });
    cards.sort((a, b) => (a.deps[0] || Infinity) - (b.deps[0] || Infinity));
    return cards;
  }
  function stopBadges(id, r) {
    const s = stopById[id];
    return `<div class="badges"><span class="b">Bus stop</span><span class="b ${s.shelter}">${SHELTER[s.shelter]}</span>${r ? `<span class="b fare">Silver: AED ${fmtAed(D.fares.zones[r.zones].silver)}</span><button class="b rule" type="button" data-rule aria-label="30 minute Metro transfer rule. Tap for details" title="${esc(D.fares.note)}">30m Metro Transfer Rule</button>` : ''}</div>`;
  }
  function cardHtml(c, dir) {
    const { r, seq, boardId, idx, deps } = c;
    const key = favKey(r.id, dir, boardId);
    const ride = seq[seq.length - 1].off - seq[idx].off;
    const fav = isFav(key);
    return `<article class="route" data-route="${r.id}" data-stop="${boardId}" style="--rc:${r.color}" tabindex="0" role="button"
        aria-label="Route ${r.id}, ${esc(dirLabel(r, dir))}. Open details">
      <div class="route-top">
        <span class="rbadge">${esc(r.id)}</span>
        <div class="rtitle"><strong>${esc(dirLabel(r, dir))}</strong><span>from ${esc(sName(boardId))} &middot; ${ride} min ride</span></div>
        <button class="star ${fav ? 'on' : ''}" type="button" data-fav="${key}" aria-pressed="${fav}" aria-label="${fav ? 'Remove' : 'Save'} ${esc(sName(boardId))} for ${r.id}">
          <svg aria-hidden="true"><use href="#${fav ? 'i-star-fill' : 'i-star'}"/></svg></button>
      </div>
      ${deps.length ? `<div class="route-next">
        <div class="cd" data-dep="${deps[0]}">${cdText(deps[0])}</div>
        <div class="rtimes">${deps.map((d) => `<span class="tm">${hm(d)}${dayTag(d)}</span>`).join('')}</div>
      </div>` : '<div class="empty">No departures in the next 36 hours</div>'}
      ${miniProg(r, dir, boardId, deps[0])}${stopBadges(boardId, r)}
    </article>`;
  }
  function renderHero(cards) {
    const hero = $('#hero');
    const best = cards.find((c) => c.deps[0]);
    const sh = D.shifts[state.shift];
    if (!best) {
      hero.className = 'tile hero is-empty';
      hero.innerHTML = `<div class="eyebrow" style="padding-top:16px">${state.shift === 'now' ? 'Next bus' : esc(sh.label)}</div>
        <div class="hero-main"><span>No buses match this filter</span></div>
        <p class="hero-sub">Try another zone, shift or boarding stop.</p>`;
      return;
    }
    const { r, seq, boardId, deps } = best;
    hero.className = 'tile hero';
    hero.innerHTML = `<div class="banner" style="background:${r.color};color:${r.ink || '#fff'}"><span class="bn">${esc(r.id)}</span><span class="bl">${state.shift === 'now' ? 'Next bus' : 'Next ' + esc(sh.short) + ' shift bus'}</span></div>
      <div class="cd" data-dep="${deps[0]}">${cdText(deps[0])}</div>
      <p class="hero-sub"><b>${esc(sName(boardId))}</b> &rarr; ${esc(sName(seq[seq.length - 1].id))} &middot; departs <b>${hm(deps[0])}</b></p>`;
  }

  /* ---------- bento tiles: heat, Red Line transfer, saved ---------- */
  const CLIM = { hi: [24, 26, 30, 35, 40, 42, 43, 43, 40, 37, 31, 27], lo: [14, 16, 19, 22, 26, 29, 31, 31, 28, 25, 20, 16] };
  function heatNow() {
    const d = new Date(), m = d.getMonth(), h = d.getHours() + d.getMinutes() / 60;
    const hi = CLIM.hi[m], lo = CLIM.lo[m];
    const t = Math.round((hi + lo) / 2 + ((hi - lo) / 2) * Math.cos((2 * Math.PI * (h - 15)) / 24));
    let cls = '', msg = 'Comfortable. Normal waiting is fine';
    if (h >= 11 && h < 16) { cls = t >= 36 ? 'hot' : 'warm'; msg = 'Peak Sun - Board at AC Shelters'; }
    else if (t >= 33) { cls = 'warm'; msg = 'Hot - wait in the shade and carry water'; }
    return { t, cls, msg };
  }
  /* "In 4 min" style relative time (no confusing clock times) */
  function relText(ms) {
    const m = Math.ceil((ms - Date.now()) / MIN);
    if (m <= 0) return 'Now';
    if (m >= 60) return `In ${Math.floor(m / 60)}h ${pad(m % 60)}m`;
    return `In ${m} min`;
  }
  function metroTimes() {
    const now = Date.now(), m0 = midnight(), out = [];
    D.metro.windows.forEach(([a, b, h]) => { for (let t = toMin(a); t < toMin(b); t += h) [0, 1].forEach((d) => { const ms = m0 + (t + d * DAY) * MIN; if (ms >= now) out.push(ms); }); });
    out.sort((x, y) => x - y);
    return out[0] ? [out[0], out[0] + D.metro.otherDirOffset * MIN] : [null, null];
  }
  function renderTiles(cards) {
    if (!$('#tile-status') || !$('#tile-metro') || !$('#tile-saved')) return;
    const hot = heatNow();
    const st = $('#tile-status');
    st.className = 'tile t-status ' + hot.cls;
    st.innerHTML = `<div class="t-eyebrow">Outside now (est.)</div><div class="t-big">${hot.t}&deg;C</div><div class="t-note">${esc(hot.msg)}</div>`;

    let station = 'Ibn Battuta';
    const top = cards[0];
    if (top) { const m = top.seq.map((s) => stopById[s.id]).find((s) => s.metro); if (m) station = m.metroName; }
    const [toUae, toCp] = metroTimes();
    $('#tile-metro').innerHTML = `<div class="t-eyebrow"><i class="mdot"></i>Red Line &middot; ${esc(station)}</div>
      <div class="row2"><span>To UAE Exchange<span class="m cd" ${toUae ? `data-rel="${toUae}"` : ''}>${toUae ? relText(toUae) : '--'}</span></span>
      <span>To Centrepoint<span class="m cd" ${toCp ? `data-rel="${toCp}"` : ''}>${toCp ? relText(toCp) : '--'}</span></span></div>
      <div class="t-note">Approximate train times</div>`;

    const favs = state.favs.map(parseKey).filter(Boolean);
    $('#tile-saved').innerHTML = `<div class="t-eyebrow">Saved routes</div>` + (favs.length
      ? `<div class="favrow">${favs.map(({ r, dir, stop }) => `<button class="fav-badge" type="button" data-open="${favKey(r.id, dir, stop)}" style="background:${r.color};color:${r.ink || '#fff'}">${esc(r.id)} <small>${esc(sName(stop))}</small></button>`).join('')}</div>`
      : `<div class="t-note" style="margin-top:6px">Tap the star on a route to pin it here for one-tap access.</div>`);
  }
  function renderHome() {
    const cards = buildCards();
    renderHero(cards); renderTiles(cards);
    $('#route-list').innerHTML = cards.length
      ? cards.map((c) => cardHtml(c, state.dir)).join('')
      : `<div class="panel empty"><b>No routes here</b>Pick another zone or boarding stop.</div>`;
  }

  /* ---------- favorites ---------- */
  function renderFavs() {
    const items = state.favs.map(parseKey).filter(Boolean);
    $('#fav-count').textContent = `${items.length} saved`;
    $('#fav-list').innerHTML = items.length
      ? items.map(({ r, dir, stop }) => {
        const seq = seqFor(r, dir);
        const deps = departures(r, dir, stop, 3, 'now');
        const key = favKey(r.id, dir, stop);
        return `<article class="route" data-route="${r.id}" data-dir="${dir}" data-stop="${stop}" style="--rc:${r.color}" tabindex="0" role="button" aria-label="Route ${r.id} from ${esc(sName(stop))}. Open details">
          <div class="route-top"><span class="rbadge">${esc(r.id)}</span>
            <div class="rtitle"><strong>${esc(sName(stop))} &rarr; ${esc(sName(seq[seq.length - 1].id))}</strong><span>${esc(fName(stop))}</span></div>
            <button class="star on" type="button" data-fav="${key}" aria-pressed="true" aria-label="Remove favorite"><svg aria-hidden="true"><use href="#i-star-fill"/></svg></button></div>
          ${deps.length ? `<div class="route-next"><div class="cd" data-dep="${deps[0]}">${cdText(deps[0])}</div>
            <div class="rtimes">${deps.map((d) => `<span class="tm">${hm(d)}${dayTag(d)}</span>`).join('')}</div></div>` : '<div class="empty">No more departures soon</div>'}
        </article>`;
      }).join('')
      : `<div class="panel empty"><svg aria-hidden="true" width="44" height="44" style="margin:0 auto 8px;color:var(--gold)"><use href="#i-star"/></svg><b>No favorites yet</b>Tap the star on a route card, or on any stop inside a route, to pin it here and in Pocket mode.<br><button class="btn primary cta" type="button" data-cta="browse">Browse popular JAFZA routes</button></div>`;
  }
  function toggleFav(key) {
    const i = state.favs.indexOf(key);
    if (i >= 0) { state.favs.splice(i, 1); toast('Removed from favorites'); }
    else {
      const p = parseKey(key);
      state.favs.push(key);
      toast(p ? `Saved ${p.r.id} at ${sName(p.stop)}` : 'Saved');
    }
    store.set('favs', state.favs);
    renderAll();
  }

  /* ---------- sheets ---------- */
  let lastFocus = null;
  function openSheet(id) {
    lastFocus = document.activeElement;
    const el = $('#' + id);
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    $('#backdrop').classList.add('show');
    el.scrollTop = 0;
    setTimeout(() => { const f = $('[data-close], .btn', el); if (f) f.focus({ preventScroll: true }); }, 60);
  }
  function closeSheets() {
    $$('.sheet.open').forEach((s) => { s.classList.remove('open'); s.setAttribute('aria-hidden', 'true'); });
    $('#backdrop').classList.remove('show');
    if (state.sheet) { state.sheet = null; resetMeta(); }
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  /* Trip geometry for the route sheet and cards: where is the bus along its journey? */
  function progBar(r, startMs, endMs, offs, total) {
    const pr = Math.min(1, Math.max(0, (Date.now() - startMs) / (endMs - startMs)));
    return `<div class="prog" data-prog data-start="${startMs}" data-end="${endMs}" style="--rc:${r.color}">
      <div class="prog-lbl"><b data-prog-label>${progLabel(pr, startMs)}</b><span>${hm(startMs)} &rarr; ${hm(endMs)}</span></div>
      <div class="prog-track"><span class="prog-fill" style="width:${pr * 100}%"></span>${offs.map((o) => `<i style="left:${(o / total) * 100}%"></i>`).join('')}
        <span class="prog-bus" style="left:${pr * 100}%"><svg aria-hidden="true"><use href="#i-bus"/></svg></span></div></div>`;
  }
  function progLabel(p, startMs) {
    if (Date.now() < startMs) return `Departs in ${minsText(startMs)}`;
    if (p >= 1) return 'Arrived';
    if (p < 0.15) return 'Just departed';
    if (p < 0.8) return 'Mid-route';
    return 'Arriving soon';
  }
  function updateProg() {
    $$('[data-prog]').forEach((el) => {
      const a = +el.dataset.start, b = +el.dataset.end;
      const p = Math.min(1, Math.max(0, (Date.now() - a) / (b - a)));
      const f = $('.prog-fill', el), bus = $('.prog-bus', el), l = $('[data-prog-label]', el);
      if (f) f.style.width = p * 100 + '%';
      if (bus) bus.style.left = p * 100 + '%';
      if (l) l.textContent = progLabel(p, a);
    });
  }
  /* small "bus is on its way" bar on route cards when the next trip is already running */
  function miniProg(r, dir, boardId, dep) {
    if (!dep) return '';
    const seq = seqFor(r, dir), off = seq.find((s) => s.id === boardId).off;
    const start = dep - off * MIN;
    if (off === 0 || start > Date.now()) return '';
    const pr = Math.min(1, (Date.now() - start) / (off * MIN));
    return `<div class="prog" data-prog data-start="${start}" data-end="${dep}" style="--rc:${r.color};margin:0;padding:8px 12px"><div class="prog-lbl"><b data-prog-label>${progLabel(pr, start)}</b><span>bus approaching ${esc(sName(boardId))}</span></div>
      <div class="prog-track" style="margin:18px 8px 6px"><span class="prog-fill" style="width:${pr * 100}%"></span><span class="prog-bus" style="left:${pr * 100}%"><svg aria-hidden="true"><use href="#i-bus"/></svg></span></div></div>`;
  }

  function routeSheetHtml() {
    const { rid, dir, stop } = state.sheet;
    const r = routeById[rid];
    const seq = seqFor(r, dir);
    const total = seq[seq.length - 1].off;
    const m0 = midnight(), now = Date.now();
    const bIdx = seq.findIndex((s) => s.id === stop);
    const bOff = seq[bIdx].off;
    const next = departures(r, dir, stop, 1, 'now')[0];
    const origin = next ? next - bOff * MIN : null;
    const key = favKey(rid, dir, stop);
    const times = seq.map((s) => (origin ? origin + s.off * MIN : null));
    let cur = -1;
    times.forEach((t, i) => { if (t && t <= now) cur = i; });
    const hereIdx = cur >= 0 ? cur : bIdx;

    const stopsHtml = seq.map((s, i) => {
      const st = stopById[s.id], t = times[i];
      const k = favKey(rid, dir, s.id), f = isFav(k);
      const cls = [i < cur ? 'pass' : '', i === hereIdx ? 'here' : '', st.metro ? 'metro' : ''].join(' ');
      return `<li class="${cls}"><span class="node"></span>
        <span class="nm"><strong>${esc(st.name)}</strong>
          <div class="pills">${st.metro ? '<em class="mpill"><b>M</b> Red Line</em>' : ''}${st.shelter === 'ac' ? '<em class="acpill">AC Shelter</em>' : `<em>${SHELTER[st.shelter]}</em>`}${i === bIdx ? '<em>You board here</em>' : ''}${i === cur && cur < seq.length - 1 ? '<em>Bus is here</em>' : ''}</div>
          ${st.walk ? `<span class="walk">${esc(st.walk)}</span>` : ''}</span>
        ${t ? `<time>${hm(t)}</time>` : ''}
        <button class="star ${f ? 'on' : ''}" type="button" data-fav="${k}" aria-pressed="${f}" aria-label="${f ? 'Remove' : 'Save'} ${esc(sName(s.id))}"><svg aria-hidden="true"><use href="#${f ? 'i-star-fill' : 'i-star'}"/></svg></button></li>`;
    }).join('');

    const tms = baseTimes(r, dir).map((t) => t + bOff).sort((a, b) => a - b);
    const byHour = new Map();
    let nextMarked = false;
    tms.forEach((m) => {
      const h = Math.floor(m / 60);
      const past = m0 + m * MIN < now;
      let cls = past ? 'past' : '';
      if (!past && !nextMarked) { cls = 'next'; nextMarked = true; }
      if (!byHour.has(h)) byHour.set(h, []);
      byHour.get(h).push(`<span class="${cls}">${pad(h % 24)}:${pad(m % 60)}</span>`);
    });
    const tt = [...byHour.entries()].map(([h, arr]) => `<div class="tt-row"><div class="tt-h">${pad(h % 24)}${h >= 24 ? '<small>+1</small>' : ''}</div><div class="tt-m">${arr.join('')}</div></div>`).join('');
    const fz = D.fares.zones[r.zones];

    return `<div class="sheet-head" style="--rc:${r.color}">
        <span class="rbadge">${esc(rid)}</span>
        <h2 id="sr-title">${esc(dirLabel(r, dir))}</h2>
        <button class="icon-btn" type="button" data-close aria-label="Close"><svg aria-hidden="true"><use href="#i-close"/></svg></button>
      </div>
      <p class="lead">${esc(r.note)}</p>
      <p class="fare-line">Silver AED ${fmtAed(fz.silver)} &middot; Gold AED ${fmtAed(fz.gold)} <span style="font-weight:500">(${ZONE_TXT[r.zones]})</span></p>
      <p class="fine" style="margin:2px 0 8px">${esc(D.fares.note)}.</p>
      <div class="next-box">
        ${next ? `<div><small>Next from ${esc(sName(stop))}</small><div class="cd" data-dep="${next}">${cdText(next)}</div></div>
        <div><small>Departs</small><b style="font-size:1.4rem;font-variant-numeric:tabular-nums">${hm(next)}</b>${dayTag(next)}</div>` : '<div>No departures in the next 36 hours</div>'}
      </div>
      ${origin ? progBar(r, origin, origin + total * MIN, seq.map((s) => s.off), total) : ''}
      <div class="btn-row">
        <button class="btn primary" type="button" data-share><svg aria-hidden="true"><use href="#i-share"/></svg>Share route</button>
        <button class="btn" type="button" data-fav="${key}"><svg aria-hidden="true"><use href="#${isFav(key) ? 'i-star-fill' : 'i-star'}"/></svg>${isFav(key) ? 'Saved' : 'Save stop'}</button>
      </div>
      <h3 class="h2">Route strip (next trip)</h3>
      <ul class="tl" style="--rc:${r.color}">${stopsHtml}</ul>
      <h3 class="h2">Timetable from ${esc(sName(stop))}</h3>
      <div class="tt">${tt}</div>
      <p class="fine">Estimated times. Confirm with RTA / S'hail for critical trips.</p>`;
  }
  function renderSheet() {
    if (!state.sheet) return;
    const el = $('#sheet-route');
    const top = el.scrollTop;
    $('#sheet-route-body').innerHTML = routeSheetHtml();
    el.scrollTop = top;
  }
  function openRoute(rid, dir, stop) {
    const r = routeById[rid];
    if (!r) return;
    const seq = seqFor(r, dir);
    if (!seq.some((s) => s.id === stop)) stop = seq[0].id;
    state.sheet = { rid, dir, stop };
    renderSheet();
    openSheet('sheet-route');
    const next = departures(r, dir, stop, 1, 'now')[0];
    setMeta(`Route ${rid}: ${dirLabel(r, dir)}`,
      next ? `Next bus from ${sName(stop)} at ${hm(next)} (in ${minsText(next)}).` : `Route ${rid} timetable.`,
      routeUrl(rid, dir, stop));
  }

  /* ---------- meta (dynamic Open Graph) ---------- */
  const metaDefaults = {};
  const metaSel = { 'og:title': 'property', 'og:description': 'property', 'og:url': 'property', 'twitter:title': 'name', 'twitter:description': 'name' };
  function metaEl(k) { return $(`meta[${metaSel[k]}="${k}"]`); }
  function absolutizeMeta() {
    if (!/^https?:/.test(location.protocol)) return;
    ['og:url'].forEach((k) => { const e = metaEl(k) || $(`meta[property="${k}"]`); if (e && /YOUR-USERNAME/.test(e.content)) e.content = new URL('./', location.href).href; });
    $$('meta[property="og:image"], meta[name="twitter:image"]').forEach((e) => { if (/YOUR-USERNAME/.test(e.content)) e.content = new URL('og-image.png', location.href).href; });
    Object.keys(metaSel).forEach((k) => { const e = metaEl(k); if (e) metaDefaults[k] = e.content; });
    metaDefaults.title = document.title;
  }
  function setMeta(title, desc, url) {
    const set = (k, v) => { const e = metaEl(k); if (e && v) e.content = v; };
    set('og:title', title); set('twitter:title', title); set('og:description', desc); set('twitter:description', desc); set('og:url', url);
    document.title = title + ' - JAFZA Commute';
  }
  function resetMeta() {
    Object.keys(metaSel).forEach((k) => { const e = metaEl(k); if (e && metaDefaults[k]) e.content = metaDefaults[k]; });
    if (metaDefaults.title) document.title = metaDefaults.title;
  }

  /* ---------- sharing ---------- */
  const baseUrl = () => new URL('./', location.href).href;
  const routeUrl = (rid, dir, stop) => `${baseUrl()}?route=${encodeURIComponent(rid)}&dir=${dir}&stop=${encodeURIComponent(stop)}`;
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }
  async function share({ title, text, url }) {
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const ok = await copyText(`${text}\n${url}`);
    toast(ok ? 'Link copied to clipboard' : 'Sharing is not available here');
  }
  function shareRoute() {
    if (!state.sheet) return;
    const { rid, dir, stop } = state.sheet;
    const r = routeById[rid];
    const next = departures(r, dir, stop, 1, 'now')[0];
    const text = `Bus ${rid} ${dirLabel(r, dir)}: ` +
      (next ? `next from ${sName(stop)} at ${hm(next)} (in ${minsText(next)}).` : `see timetable.`) + ' Jebel Ali & Discovery Gardens Transit Guide';
    share({ title: `Bus ${rid} timetable`, text, url: routeUrl(rid, dir, stop) });
  }
  const shareApp = () => share({
    title: 'Jebel Ali & Discovery Gardens Transit Guide',
    text: 'Offline bus times for Discovery Gardens, JAFZA and Jebel Ali Industrial.',
    url: baseUrl()
  });

  /* ---------- pocket / glance mode ---------- */
  let wakeLock = null;
  const glanceOpen = () => !$('#glance').hidden;
  function updateWakeUi() {
    const on = !!wakeLock;
    const b = $('#btn-wake');
    b.setAttribute('aria-pressed', String(on));
    $('#wake-text').textContent = 'Keep screen awake: ' + (on ? 'On' : 'Off');
    $('#g-hint').textContent = wakeMsg ? wakeMsg : 'wakeLock' in navigator
      ? (on ? 'Screen will stay on. Prop the phone up and watch the countdown.' : 'Turn on to stop the screen dimming while you wait.')
      : 'Screen Wake Lock is not supported in this browser (iOS needs 16.4 or newer).';
  }
  let wakeMsg = '';
  async function requestWake() {
    wakeMsg = '';
    if (!('wakeLock' in navigator)) { state.wantWake = false; wakeMsg = 'This browser cannot keep the screen awake. Set Settings > Display & Brightness > Auto-Lock to Never (iPhone) or Screen timeout to a longer time (Android) while you wait.'; updateWakeUi(); return; }
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; updateWakeUi(); });
    } catch (e) { wakeLock = null; state.wantWake = false; wakeMsg = 'Keep-awake was refused (low battery or power saver can block it). Raise the Auto-Lock / Screen timeout in system settings instead.'; }
    updateWakeUi();
  }
  async function releaseWake() { state.wantWake = false; if (wakeLock) { try { await wakeLock.release(); } catch (e) { /* ignore */ } } wakeLock = null; updateWakeUi(); }
  function toggleWake() { if (wakeLock) releaseWake(); else { state.wantWake = true; requestWake(); } }

  function glanceItems() {
    const favs = state.favs.map(parseKey).filter(Boolean);
    const sources = favs.length ? favs : D.routes.map((r) => ({ r, dir: state.dir, stop: seqFor(r, state.dir)[0].id }));
    const items = [];
    sources.forEach(({ r, dir, stop }) => departures(r, dir, stop, 2, 'now').forEach((dep) => items.push({ r, dir, stop, dep })));
    items.sort((a, b) => a.dep - b.dep);
    return { items: items.slice(0, 2), fallback: !favs.length };
  }
  function renderGlance() {
    if (!glanceOpen()) return;
    const { items, fallback } = glanceItems();
    $('#g-list').innerHTML = items.length
      ? items.map(({ r, dir, stop, dep }) => `<div class="g-item solid" style="--rc:${r.color};--ink:${r.ink || '#fff'}">
          <span class="rbadge">${esc(r.id)}</span>
          <div class="where"><strong>${esc(sName(stop))} &rarr; ${esc(sName(seqFor(r, dir).slice(-1)[0].id))}</strong><span>departs <b class="dep">${hm(dep)}</b>${fallback ? '' : ' &middot; favorite'}</span></div>
          <div class="cd" data-dep="${dep}">${cdText(dep)}</div></div>`).join('') +
        (fallback ? `<p class="fine g-empty" style="text-align:center">Showing the soonest buses. Star stops to pin your own here.</p>` : '')
      : '<div class="g-empty">No upcoming buses found.</div>';
  }
  function openGlance() {
    lastFocus = document.activeElement;
    $('#glance').hidden = false;
    document.body.style.overflow = 'hidden';
    renderGlance(); updateWakeUi(); tick(true);
    $('#glance-close').focus({ preventScroll: true });
  }
  function closeGlance() {
    $('#glance').hidden = true;
    document.body.style.overflow = '';
    releaseWake();
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  /* ---------- add to home screen ---------- */
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  let deferredPrompt = null;
  function openA2hs() {
    if (!isIOS) $('#a2-note').innerHTML = 'Steps shown for iPhone / iPad Safari. On Android or desktop Chrome, use the browser menu &rarr; <b>Install app</b>.';
    openSheet('sheet-a2hs');
  }

  /* ---------- tabs & render ---------- */
  function showTab(tab) {
    state.tab = tab;
    $$('.view').forEach((v) => v.classList.toggle('is-active', v.id === 'view-' + tab));
    $$('#tabbar [data-tab]').forEach((b) => { const on = b.dataset.tab === tab; b.classList.toggle('is-active', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    window.scrollTo(0, 0);
    renderAll();
  }
  let lastRender = 0;
  function renderAll() {
    lastRender = Date.now();
    if (state.tab === 'home') renderHome();
    if (state.tab === 'favs' || state.tab === 'settings') renderFavs();
    renderSheet();
    renderGlance();
  }

  /* ---------- clock tick ---------- */
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function tick(force) {
    const now = new Date();
    const t = pad(now.getHours()) + ':' + pad(now.getMinutes());
    const dt = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
    $('#clock').textContent = t;
    $('#date').textContent = dt;
    $('#g-clock').textContent = t;
    $('#g-date').textContent = dt;
    updateProg();
    let stale = false;
    $$('[data-rel]').forEach((el) => { const ms = +el.dataset.rel; el.textContent = relText(ms); if (ms <= Date.now()) stale = true; });
    $$('[data-dep]').forEach((el) => {
      const dep = +el.dataset.dep;
      el.textContent = cdText(dep);
      if (dep <= Date.now()) stale = true;
    });
    if (force === true || (stale && Date.now() - lastRender > 900) || Date.now() - lastRender > 30000) renderAll();
  }

  /* ---------- network pill ---------- */
  function updateNet(announce) {
    const on = navigator.onLine;
    const pill = $('#net-pill');
    pill.classList.toggle('is-offline', !on);
    $('#net-text').textContent = on ? (state.swReady ? 'Offline-ready' : 'Online') : (state.swReady ? 'Offline - cached' : 'Offline');
    if (announce) toast(on ? 'Back online' : 'Offline. Schedules still work');
  }


  /* ---------- Nol trip calculator ---------- */
  function updateNolAlert(raw) {
    const el = $('#nol-alert'); if (!el) return;
    const v = raw === '' ? NaN : +raw;
    if (isNaN(v) || v < 0 || v >= D.fares.minBalance) { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = `Nol balance AED ${fmtAed(v)} is below AED ${fmtAed(D.fares.minBalance)}. Top up before boarding.`;
  }
  function calcNol() {
    const out = $('#nol-result');
    const raw = $('#nol-bal').value.replace(',', '.').trim();
    store.set('nol', { bal: raw, card: $('#nol-card').value, zones: $('#nol-zones').value });
    updateNolAlert(raw);
    if (raw === '' || isNaN(+raw) || +raw < 0) { out.className = 'nol-result'; out.textContent = 'Enter your balance to check it.'; return; }
    const bal = +raw, min = D.fares.minBalance;
    const fare = D.fares.zones[$('#nol-zones').value][$('#nol-card').value];
    if (bal < min) {
      out.className = 'nol-result bad';
      out.textContent = `Below AED ${fmtAed(min)} Minimum Balance required to tap in on RTA buses. Top up at least AED ${fmtAed(min - bal)}.`;
    } else if (bal < fare) {
      out.className = 'nol-result warn';
      out.textContent = `Enough to tap in, but this trip costs AED ${fmtAed(fare)}. Top up at least AED ${fmtAed(fare - bal)}.`;
    } else {
      out.className = 'nol-result ok';
      out.textContent = `Balance OK. Trip AED ${fmtAed(fare)}, about AED ${fmtAed(bal - fare)} left afterwards.`;
    }
  }
  function initNol() {
    const sv = store.get('nol', null);
    if (sv) { $('#nol-bal').value = sv.bal || ''; if (sv.card) $('#nol-card').value = sv.card; if (sv.zones) $('#nol-zones').value = sv.zones; }
    ['input', 'change'].forEach((ev) => ['#nol-bal', '#nol-card', '#nol-zones'].forEach((s) => on(s, ev, calcNol)));
    calcNol();
  }

  /* ---------- touch gestures: swipe-to-dismiss sheets + pull-to-refresh ---------- */
  let refreshing = false;
  async function refreshNow() {
    tick(true);
    try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch (e) { /* offline is fine */ }
  }
  function initGestures() {
    // Sheets: drag down from the handle/header (or from the top of the content) to dismiss.
    $$('.sheet').forEach((sheet) => {
      let y0 = 0, t0 = 0, dy = 0, drag = false;
      sheet.addEventListener('touchstart', (e) => {
        if (!sheet.classList.contains('open') || e.touches.length !== 1) return;
        const onHandle = !!e.target.closest('.grab, .sheet-head');
        if (!onHandle && sheet.scrollTop > 0) return;
        y0 = e.touches[0].clientY; t0 = Date.now(); dy = 0; drag = true;
      }, { passive: true });
      sheet.addEventListener('touchmove', (e) => {
        if (!drag) return;
        if (sheet.scrollTop > 0) { y0 = e.touches[0].clientY; dy = 0; sheet.style.transform = ''; return; }
        dy = Math.max(0, e.touches[0].clientY - y0);
        if (dy > 4) { sheet.style.transition = 'none'; sheet.style.transform = `translateY(${dy}px)`; }
      }, { passive: true });
      const end = () => {
        if (!drag) return; drag = false;
        const v = dy / Math.max(1, Date.now() - t0);
        sheet.style.transition = ''; sheet.style.transform = '';          // spring back (or onwards to closed) with the CSS easing
        if (dy > 120 || (v > 0.6 && dy > 30)) closeSheets();
        dy = 0;
      };
      sheet.addEventListener('touchend', end); sheet.addEventListener('touchcancel', end);
    });

    // Pull-to-refresh on the Home route list.
    const ptr = $('#ptr'), txt = $('#ptr-txt'), bus = $('#ptr-bus');
    let py = 0, pull = 0, pulling = false;
    const set = (h) => { ptr.style.height = h + 'px'; bus.style.transform = `rotate(${h * 2.4}deg)`; };
    document.addEventListener('touchstart', (e) => {
      if (state.tab !== 'home' || window.scrollY > 0 || refreshing || $('.sheet.open') || glanceOpen() || e.touches.length !== 1) return;
      py = e.touches[0].clientY; pulling = true; pull = 0; ptr.classList.remove('snap');
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - py;
      if (dy <= 0 || window.scrollY > 0) { pull = 0; set(0); return; }
      pull = Math.min(dy * 0.5, 84); set(pull);
      txt.textContent = pull >= 60 ? 'Release to refresh' : 'Pull to refresh';
    }, { passive: true });
    const release = async () => {
      if (!pulling) return; pulling = false;
      ptr.classList.add('snap');
      if (pull >= 60) {
        refreshing = true; set(56); ptr.classList.add('busy'); txt.textContent = 'Refreshing...';
        await refreshNow();
        setTimeout(() => { ptr.classList.remove('busy'); set(0); txt.textContent = 'Pull to refresh'; refreshing = false; toast('Times refreshed'); }, 700);
      } else set(0);
    };
    document.addEventListener('touchend', release); document.addEventListener('touchcancel', release);
  }

  /* ---------- events ---------- */
  function bind() {
    // build chips
    $('#chips-area').innerHTML = Object.entries(D.areas).map(([k, v]) => `<button class="chip" type="button" data-area="${k}" aria-pressed="false">${esc(v)}</button>`).join('');
    $('#chips-shift').innerHTML = Object.entries(D.shifts).map(([k, v]) => `<button class="chip" type="button" data-shift="${k}" aria-pressed="false" aria-label="${esc(v.label)}">${esc(v.chip || v.label)}</button>`).join('');

    on('#seg-dir', 'click', (e) => {
      const b = e.target.closest('[data-dir]'); if (!b) return;
      state.dir = b.dataset.dir; store.set('dir', state.dir);
      renderControls(); renderBoardSelect(); renderAll();
    });
    on('#chips-area', 'click', (e) => {
      const b = e.target.closest('[data-area]'); if (!b) return;
      state.area = b.dataset.area; store.set('area', state.area); renderControls(); renderAll();
    });
    on('#chips-shift', 'click', (e) => {
      const b = e.target.closest('[data-shift]'); if (!b) return;
      state.shift = b.dataset.shift; store.set('shift', state.shift); renderControls(); renderAll();
    });
    on('#sel-board', 'change', (e) => { state.board = e.target.value; store.set('board', state.board); renderAll(); });

    const cardClick = (e) => {
      if (e.target.closest('[data-rule]')) { e.stopPropagation(); toast(D.fares.note + '.', 4200); return; }
      const fav = e.target.closest('[data-fav]');
      if (fav) { e.stopPropagation(); toggleFav(fav.dataset.fav); return; }
      const card = e.target.closest('[data-route]');
      if (card) openRoute(card.dataset.route, card.dataset.dir || state.dir, card.dataset.stop);
    };
    const cardKey = (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-route]')) { e.preventDefault(); cardClick(e); }
    };
    ['#route-list', '#fav-list'].forEach((s) => { on(s, 'click', cardClick); on(s, 'keydown', cardKey); });

    on('#sheet-route', 'click', (e) => {
      if (e.target.closest('[data-close]')) return closeSheets();
      if (e.target.closest('[data-share]')) return shareRoute();
      const fav = e.target.closest('[data-fav]');
      if (fav) toggleFav(fav.dataset.fav);
    });
    on('#sheet-a2hs', 'click', (e) => { if (e.target.closest('[data-close]')) closeSheets(); });
    on('#a2-never', 'click', () => { store.set('a2hsNever', true); closeSheets(); toast('You can find this in Settings'); });
    on('#backdrop', 'click', closeSheets);

    on('#tabbar', 'click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'tab-glance') return openGlance();
      if (b.dataset.tab) { closeSheets(); showTab(b.dataset.tab); }
    });
    on('#btn-theme', 'click', cycleTheme);
    on('#btn-share-app', 'click', shareApp);
    on('#btn-share-set', 'click', shareApp);
    on('#btn-a2hs', 'click', openA2hs);
    on('#btn-install', 'click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (e) { /* ignore */ }
      deferredPrompt = null; $('#btn-install').hidden = true;
    });
    on('#btn-clear-favs', 'click', () => {
      if (!state.favs.length) return toast('No favorites to clear');
      if (confirm('Remove all favorite stops?')) { state.favs = []; store.set('favs', []); renderAll(); toast('Favorites cleared'); }
    });
    on('#mode-list', 'click', (e) => { const b = e.target.closest('[data-theme-pick]'); if (b) applyTheme(b.dataset.themePick, true); });

    on('#btn-swap', 'click', (e) => {
      state.dir = state.dir === 'out' ? 'in' : 'out'; store.set('dir', state.dir);
      e.currentTarget.classList.toggle('spin'); renderControls(); renderBoardSelect(); renderAll();
    });
    on('#btn-refresh', 'click', async (e) => {
      const b = e.currentTarget; b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin');
      tick(true);
      try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); toast('Times recalculated. Schedule is up to date'); }
      catch (err) { toast('Times recalculated from your clock'); }
    });
    on('#btn-reset', 'click', async () => {
      if (!confirm('Clear saved settings and cached files, then reload?')) return;
      try { Object.keys(localStorage).filter((k) => k.startsWith('jaf.')).forEach((k) => localStorage.removeItem(k)); } catch (err) { /* ignore */ }
      try { (await navigator.serviceWorker.getRegistrations()).forEach((r) => r.unregister()); } catch (err) { /* ignore */ }
      try { (await caches.keys()).forEach((k) => caches.delete(k)); } catch (err) { /* ignore */ }
      setTimeout(() => location.replace(location.pathname), 300);
    });
    on('#fav-list', 'click', (e) => {
      if (!e.target.closest('[data-cta="browse"]')) return;
      state.area = 'industrial'; state.shift = 'now'; store.set('area', state.area); store.set('shift', state.shift);
      renderControls(); showTab('home');
    });
    // gentle haptics on taps (where supported)
    document.addEventListener('click', (e) => {
      if (state.theme === 'oled') return;
      if (e.target.closest('.chip, .tabbar button, .star, .seg button, .btn, .row') && navigator.vibrate) navigator.vibrate(10);
    });
/* ----- bento saved badges ----- */
    on('#tile-saved', 'click', (e) => {
      const b = e.target.closest('[data-open]'); if (!b) return;
      const p = parseKey(b.dataset.open); if (p) openRoute(p.r.id, p.dir, p.stop);
    });
    initGestures();
    on('#nol-alert', 'click', () => { showTab('settings'); setTimeout(() => { const i = $('#nol-bal'); if (i) { i.scrollIntoView({ block: 'center' }); i.focus(); } }, 120); });
    on('#glance-close', 'click', closeGlance);
    on('#btn-wake', 'click', toggleWake);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (glanceOpen()) closeGlance(); else closeSheets();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        tick(true);
        if (state.wantWake && glanceOpen() && !wakeLock) requestWake();   // browsers drop the lock when the tab is hidden
      }
    });
    window.addEventListener('online', () => updateNet(true));
    window.addEventListener('offline', () => updateNet(true));
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('#btn-install').hidden = false; });
    window.addEventListener('appinstalled', () => { deferredPrompt = null; $('#btn-install').hidden = true; toast('Installed'); });

    // keep content clear of the bottom bar (safe area aware)
    const setBar = () => document.documentElement.style.setProperty('--tabbar-h', ($('#tabbar').offsetHeight - parseFloat(getComputedStyle($('#tabbar')).paddingBottom || 0) + 8) + 'px');
    if ('ResizeObserver' in window) new ResizeObserver(setBar).observe($('#tabbar'));
    window.addEventListener('resize', setBar); setBar();
  }

  /* ---------- deep links & shortcuts ---------- */
  function handleLaunch() {
    const q = new URLSearchParams(location.search);
    const action = q.get('action');
    if (action === 'next-jafza') { state.dir = 'out'; state.board = 'auto'; state.shift = 'now'; state.area = 'jafza'; }
    else if (action === 'dg-metro') { state.dir = 'out'; state.board = 'DG_METRO'; state.shift = 'now'; state.area = 'all'; }
    else if (action === 'night') { state.dir = 'in'; state.board = 'auto'; state.shift = 'night'; state.area = 'all'; }
    if (action) { store.set('dir', state.dir); store.set('board', state.board); store.set('shift', state.shift); store.set('area', state.area); }
    const rid = q.get('route');
    if (q.toString()) { try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ } }
    return rid && routeById[rid] ? { rid, dir: q.get('dir') === 'in' ? 'in' : 'out', stop: q.get('stop') || '' } : null;
  }

  /* ---------- init ---------- */
  function init() {
    try { start(); window.__jafBooted = true; }
    catch (e) { console.error(e); if (window.__jafFail) window.__jafFail((e && e.message) + (e && e.stack ? ' @ ' + String(e.stack).split('\n')[1] : '')); }
  }
  function start() {
    const launch = handleLaunch();
    absolutizeMeta();
    applyTheme(state.theme, false);
    bind();
    $('#about-ver').textContent = `App v${D.APP_VERSION} - schedule data ${D.DATA_VERSION}`;
    renderControls(); renderBoardSelect(); renderAll(); tick(true); initNol();
    setInterval(tick, 1000);
    updateNet(false);

    if (launch) setTimeout(() => openRoute(launch.rid, launch.dir, launch.stop), 150);
    else if (isIOS && !isStandalone() && !store.get('a2hsNever', false) && (store.get('a2hsShown', 0) < 3)) {
      setTimeout(() => {
        if ($('.sheet.open') || glanceOpen()) return;   // never interrupt something the user opened
        store.set('a2hsShown', store.get('a2hsShown', 0) + 1); openA2hs();
      }, 3500);
    }

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
        navigator.serviceWorker.ready.then(() => { state.swReady = true; updateNet(false); });
      });
    }
  }
  init();
})();
