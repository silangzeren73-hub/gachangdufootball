/* ============================================
   县城赛事工作台 · 本地 JSON · 手机优先
   ============================================ */

const STORAGE_KEY = 'cy-sports-workstation-v1';
const SHOOT_KEY = 'cy-sports-shoot-v1';

const SPORTS = {
  football: { label: '足球', emoji: '⚽', win: 3, draw: 1, loss: 0 },
  basketball: { label: '篮球', emoji: '🏀', win: 2, draw: 0, loss: 1 },
};

const EVENT_TYPES = {
  goal:   { label: '进球',   icon: '⚽' },
  assist: { label: '助攻',   icon: '🅰️' },
  yellow: { label: '黄牌',   icon: '🟨' },
  red:    { label: '红牌',   icon: '🟥' },
  sub:    { label: '换人',   icon: '🔁' },
  save:   { label: '扑救',   icon: '🧤' },
  three:  { label: '三分',   icon: '3️⃣' },
  block:  { label: '盖帽',   icon: '🛑' },
  steal:  { label: '抢断',   icon: '✋' },
  note:   { label: '关键时刻', icon: '📌' },
};

const RATING_KEYS = [
  { key: 'stamina',   label: '体能' },
  { key: 'core',      label: '核心球员' },
  { key: 'chemistry', label: '磨合度' },
  { key: 'bench',     label: '替补深度' },
  { key: 'venue',     label: '场地适应' },
  { key: 'morale',    label: '战意' },
];

let state = loadState();
let shootState = loadShootState();

/* ===== State ===== */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch (_) {}
  return emptyState();
}
function loadShootState() {
  try {
    const raw = localStorage.getItem(SHOOT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {};
}
function emptyState() {
  return { version: 1, teams: [], matches: [], analyses: [], sponsors: [] };
}
function normalizeState(s) {
  s = s || {};
  s.teams = Array.isArray(s.teams) ? s.teams : [];
  s.matches = Array.isArray(s.matches) ? s.matches : [];
  s.analyses = Array.isArray(s.analyses) ? s.analyses : [];
  s.sponsors = Array.isArray(s.sponsors) ? s.sponsors : [];
  s.dataVersion = s.dataVersion || 0;
  s.updatedAt = s.updatedAt || '';
  return s;
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function saveShoot() {
  localStorage.setItem(SHOOT_KEY, JSON.stringify(shootState));
}
function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ===== Sponsor helpers ===== */
function getTitleSponsor() {
  return (state.sponsors || []).find(s => s.level === 'title') || (state.sponsors || [])[0] || null;
}
function levelLabel(level) {
  return ({ title: '冠名', partner: '合作伙伴', support: '支持单位', thanks: '特别鸣谢' })[level] || '合作伙伴';
}
function levelLabelEn(level) {
  return ({ title: 'TITLE SPONSOR', partner: 'OFFICIAL PARTNER', support: 'SUPPORTING PARTNER', thanks: 'SPECIAL THANKS' })[level] || 'OFFICIAL PARTNER';
}
function renderTopSponsorStrip() {
  const strip = document.getElementById('sponsorStrip');
  if (!strip) return;
  const s = getTitleSponsor();
  if (!s) { strip.hidden = true; return; }
  strip.hidden = false;
  clear(strip);
  strip.appendChild(el('div', { class: 'sponsor-strip-inner' },
    el('div', { class: 'sponsor-strip-label' },
      el('span', { class: 'sponsor-strip-cn' }, '本届赛事' + levelLabel(s.level)),
      el('span', { class: 'sponsor-strip-en' }, levelLabelEn(s.level)),
    ),
    el('div', { class: 'sponsor-strip-brand' },
      s.logo ? el('img', { src: s.logo, alt: s.name, class: 'sponsor-strip-logo' }) : null,
      s.slogan ? el('span', { class: 'sponsor-strip-slogan' }, s.slogan) : null,
    ),
  ));
}
function sponsorPresentsHeading(text) {
  // 用作"X 呈现 / 今日赛程"这种小标题前置行
  const s = getTitleSponsor();
  if (!s) return el('div', { class: 'section-sub' }, text);
  return el('div', { class: 'sponsor-presents' },
    el('span', { class: 'sponsor-presents-prefix' }, s.name + ' 呈现'),
    el('span', { class: 'sponsor-presents-bar' }),
    el('span', { class: 'sponsor-presents-title' }, text),
  );
}
function sponsorEmptyHero(centerText) {
  // 空白状态用的深色 hero
  const s = getTitleSponsor();
  if (!s) {
    return el('div', { class: 'empty' }, el('p', null, centerText || '暂无内容'));
  }
  return el('div', { class: 'sponsor-hero' },
    s.logo ? el('img', { src: s.logo, alt: s.name, class: 'sponsor-hero-logo' }) : null,
    el('div', { class: 'sponsor-hero-presents' }, s.name + ' 呈现'),
    s.sloganTibetan ? el('div', { class: 'sponsor-hero-tibetan', lang: 'bo' }, s.sloganTibetan) : null,
    s.slogan ? el('div', { class: 'sponsor-hero-slogan' }, s.slogan) : null,
    el('div', { class: 'sponsor-hero-divider' }),
    el('div', { class: 'sponsor-hero-center' }, centerText || ''),
  );
}
function sponsorSectionStrip() {
  // 比赛卡片区域结尾的窄条
  const s = getTitleSponsor();
  if (!s) return null;
  return el('div', { class: 'sponsor-section-strip' },
    el('span', { class: 'sponsor-section-line' }),
    el('span', { class: 'sponsor-section-text' }, '本届赛事' + levelLabel(s.level) + '：' + s.name),
    el('span', { class: 'sponsor-section-line' }),
  );
}
function sponsorBrandCard() {
  // 位置 ⑥：品牌呈现卡片
  const s = getTitleSponsor();
  if (!s || !s.brandHero) return null;
  const h = s.brandHero;
  return el('div', { class: 'sponsor-brand-card' },
    el('div', { class: 'sponsor-brand-head' },
      s.logo ? el('img', { src: s.logo, alt: s.name, class: 'sponsor-brand-head-logo' }) : null,
      el('div', { class: 'sponsor-brand-head-text' },
        el('div', { class: 'sponsor-brand-head-label' }, '本届赛事' + levelLabel(s.level) + ' · 品牌呈现'),
        el('div', { class: 'sponsor-brand-head-name' },
          s.name,
          s.nameTibetan ? el('span', { class: 'sponsor-brand-head-tibetan', lang: 'bo' }, ' ' + s.nameTibetan) : null,
        ),
      ),
    ),
    h.image ? el('div', { class: 'sponsor-brand-hero-img' },
      el('img', { src: h.image, alt: h.title || s.name, loading: 'lazy' })
    ) : null,
    (h.title || h.subtitle || h.desc) ? el('div', { class: 'sponsor-brand-caption' },
      h.title ? el('h3', { class: 'sponsor-brand-title' }, h.title) : null,
      h.subtitle ? el('div', { class: 'sponsor-brand-subtitle' }, h.subtitle) : null,
      h.desc ? el('p', { class: 'sponsor-brand-desc' }, h.desc) : null,
    ) : null,
  );
}
function sponsorProductRow() {
  // 位置 ⑦：产品系列
  const s = getTitleSponsor();
  if (!s || !Array.isArray(s.products) || s.products.length === 0) return null;
  const wrap = el('div', { class: 'sponsor-products-wrap' });
  wrap.appendChild(el('div', { class: 'sponsor-products-head' },
    el('span', { class: 'sponsor-products-line' }),
    el('span', { class: 'sponsor-products-title' }, s.name + ' · 产品系列'),
    el('span', { class: 'sponsor-products-line' }),
  ));
  const grid = el('div', { class: 'sponsor-products-grid' });
  s.products.forEach(p => {
    grid.appendChild(el('div', { class: 'sponsor-product-card' },
      p.image ? el('div', { class: 'sponsor-product-img' },
        el('img', { src: p.image, alt: p.name, loading: 'lazy' })
      ) : null,
      el('div', { class: 'sponsor-product-text' },
        el('div', { class: 'sponsor-product-name' }, p.name),
        p.spec ? el('div', { class: 'sponsor-product-spec' }, p.spec) : null,
        p.tagline ? el('div', { class: 'sponsor-product-tagline' }, p.tagline) : null,
      ),
    ));
  });
  wrap.appendChild(grid);
  return wrap;
}

function sponsorPageFooter(tabName) {
  // 每个非「今日」tab 底部的赞助页脚，3 张产品图轮着出
  const s = getTitleSponsor();
  if (!s) return null;
  const features = [...((s.products || []).map(p => ({
    image: p.image, name: p.name, spec: p.spec, tagline: p.tagline,
  })))];
  if (s.brandHero && s.brandHero.image) {
    features.push({
      image: s.brandHero.image,
      name: s.brandHero.title || s.name,
      spec: s.brandHero.subtitle || '',
      tagline: s.brandHero.desc || '',
    });
  }
  let featured = null;
  if (features.length) {
    const h = (tabName || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    featured = features[h % features.length];
  }
  return el('div', { class: 'sponsor-page-footer' },
    el('div', { class: 'sponsor-page-footer-left' },
      s.logo ? el('img', { src: s.logo, alt: s.name, class: 'sponsor-page-footer-logo' }) : null,
      el('div', { class: 'sponsor-page-footer-text' },
        el('div', { class: 'sponsor-page-footer-label' }, '本届赛事' + levelLabel(s.level) + ' · ' + levelLabelEn(s.level)),
        s.slogan ? el('div', { class: 'sponsor-page-footer-slogan' }, s.slogan) : null,
      ),
    ),
    featured ? el('div', { class: 'sponsor-page-footer-product' },
      el('img', { src: featured.image, alt: featured.name, loading: 'lazy' }),
      featured.name ? el('span', { class: 'sponsor-page-footer-product-name' }, featured.name) : null,
    ) : null,
  );
}

/* ===== Utils ===== */
function el(tag, attrs, ...children) {
  const n = document.createElement(tag);
  attrs = attrs || {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      n.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v === true) {
      n.setAttribute(k, '');
    } else {
      n.setAttribute(k, v);
    }
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    n.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return n;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.hidden = true), 2000);
}
function getTeam(id) { return state.teams.find(t => t.id === id); }
function getMatch(id) { return state.matches.find(m => m.id === id); }
function teamName(id) { const t = getTeam(id); return t ? t.name : '（未指定）'; }
function teamLogo(teamOrId, size) {
  const t = typeof teamOrId === 'string' ? getTeam(teamOrId) : teamOrId;
  const sizeClass = size === 'sm' ? ' logo-sm' : size === 'lg' ? ' logo-lg' : '';
  const bannedClass = (t && t.banned) ? ' logo-banned' : '';
  // 1) If team has an image logo, render as <img>
  if (t && t.logoImage) {
    return el('span', {
      class: 'team-logo team-logo-img' + sizeClass + bannedClass,
      title: t.name,
    }, el('img', { src: t.logoImage, alt: t.name, loading: 'lazy' }));
  }
  // 2) Fallback: colored circle with short name
  const short = (t && t.shortName) || (t && t.name ? t.name.slice(0, 2) : '?');
  const color = (t && t.logoColor) || '#64748b';
  const bg = (t && t.logoBg) || '#f1f5f9';
  return el('span', {
    class: 'team-logo' + sizeClass + bannedClass,
    style: `background:${bg};color:${color};border-color:${color};`,
    title: t ? t.name : '',
  }, short);
}
function teamLine(teamOrId, opts) {
  opts = opts || {};
  const t = typeof teamOrId === 'string' ? getTeam(teamOrId) : teamOrId;
  if (!t) return el('span', { class: 'team-with-logo muted' }, '（未指定）');
  return el('span', { class: 'team-with-logo' },
    teamLogo(t, opts.size),
    el('span', { class: 'team-with-logo-name' }, opts.short ? (t.shortName || t.name) : t.name),
  );
}
function fmtDT(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  const pad = n => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function isSameDay(dt, date) {
  const d = new Date(dt);
  return d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate();
}
function sortMatches(arr) {
  return arr.slice().sort((a, b) => {
    const dt = new Date(a.datetime) - new Date(b.datetime);
    if (dt !== 0) return dt;
    // same time: actual scheduled/finished games before forfeit virtual ones
    const order = { live: 0, scheduled: 1, finished: 2, forfeit: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });
}
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast('已复制'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('已复制'); } catch (_) { toast('复制失败'); }
    document.body.removeChild(ta);
  }
}
function confirmDel(msg) { return window.confirm(msg || '确定删除？'); }

/* ===== Tabs ===== */
const TABS = ['today','schedule','teams','players','standings','topscorers','insights','reports','shootlist','data'];
const renderers = {};

function runRenderer(name) {
  if (!renderers[name]) return;
  renderers[name]();
  // 「今日」页已经有完整品牌呈现 ⑥+⑦，不再加 footer
  if (name === 'today' || name === 'data') return;
  const panel = document.getElementById('tab-' + name);
  if (!panel) return;
  const footer = sponsorPageFooter(name);
  if (footer) panel.appendChild(footer);
}

function activateTab(name) {
  if (!TABS.includes(name)) name = 'today';
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'tab-' + name);
  });
  if (location.hash.slice(1) !== name) {
    history.replaceState(null, '', '#' + name);
  }
  runRenderer(name);
  const active = document.querySelector('.tab-btn.active');
  if (active) active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}

function renderAll() {
  renderTopSponsorStrip();
  Object.keys(renderers).forEach(name => { try { runRenderer(name); } catch (_) {} });
}

/* ===== Modal ===== */
function openModal(title, bodyNode) {
  document.getElementById('modalTitle').textContent = title;
  const body = document.getElementById('modalBody');
  clear(body);
  body.appendChild(bodyNode);
  document.getElementById('modal').hidden = false;
}
function closeModal() {
  document.getElementById('modal').hidden = true;
}

/* ===== Quick add menu ===== */
function openQuickAdd() {
  const wrap = el('div', { class: 'btn-row', style: 'flex-direction: column; gap:10px;' },
    el('button', { class: 'btn block', onClick: () => { closeModal(); openTeamForm(); } }, '＋ 新增队伍'),
    el('button', { class: 'btn block accent', onClick: () => { closeModal(); openMatchForm(); } }, '＋ 新增比赛'),
    el('button', { class: 'btn block ghost', onClick: () => { closeModal(); activateTab('schedule'); toast('选择比赛点击录入比分'); } }, '⚽ 录入比分'),
    el('button', { class: 'btn block ghost', onClick: () => { closeModal(); openPlayerForm(); } }, '👤 球员故事'),
  );
  openModal('快速录入', wrap);
}

/* ===== Match card UI ===== */
function matchCard(m) {
  const sport = SPORTS[m.sport] || SPORTS.football;
  const home = getTeam(m.homeId);
  const away = getTeam(m.awayId);
  const statusLabel = m.status === 'live' ? '进行中'
    : m.status === 'finished' ? '已结束'
    : m.status === 'forfeit' ? '判负/弃权'
    : '未开始';
  const scoreNode = m.status === 'scheduled'
    ? el('div', { class: 'match-score vs' }, 'VS')
    : el('div', { class: 'match-score' + (m.status === 'forfeit' ? ' forfeit' : '') }, `${m.homeScore ?? 0} : ${m.awayScore ?? 0}`);

  return el('div', { class: 'match-card' },
    el('div', { class: 'match-meta' },
      el('div', null,
        el('span', { class: 'tag ' + m.sport }, `${sport.emoji} ${sport.label}`),
        ' ',
        el('span', null, fmtDT(m.datetime)),
        m.venue ? el('span', null, ' · ' + m.venue) : null,
        m.round ? el('span', null, ' · ' + m.round) : null,
      ),
      el('span', { class: 'match-status ' + m.status }, statusLabel),
    ),
    el('div', { class: 'match-teams' },
      el('div', { class: 'match-team' },
        home ? teamLogo(home, 'lg') : null,
        el('div', { class: 'match-team-text' },
          el('div', { class: 'match-team-name' }, home ? home.name : '主队'),
          home && home.region ? el('span', { class: 'region' }, home.region) : null,
        ),
      ),
      scoreNode,
      el('div', { class: 'match-team' },
        away ? teamLogo(away, 'lg') : null,
        el('div', { class: 'match-team-text' },
          el('div', { class: 'match-team-name' }, away ? away.name : '客队'),
          away && away.region ? el('span', { class: 'region' }, away.region) : null,
        ),
      ),
    ),
    (m.status === 'forfeit' && m.notes) ? el('div', { class: 'forfeit-note' }, '⚠ ' + m.notes) : null,
    el('div', { class: 'match-actions' },
      el('button', { class: 'btn sm', onClick: () => openScoreEntry(m.id) }, '比分'),
      el('button', { class: 'btn sm ghost', onClick: () => openMatchForm(m.id) }, '编辑'),
      el('button', { class: 'btn sm ghost', onClick: () => { activateTab('insights'); setTimeout(() => focusInsight(m.id), 50); } }, '看点'),
      el('button', { class: 'btn sm ghost', onClick: () => { activateTab('reports'); setTimeout(() => focusReport(m.id), 50); } }, '战报'),
    ),
  );
}

/* ===== Today ===== */
renderers.today = function() {
  const panel = document.getElementById('tab-today');
  clear(panel);

  const today = new Date();
  const todayMatches = sortMatches(state.matches.filter(m => isSameDay(m.datetime, today)));

  panel.appendChild(el('div', { class: 'stat-row' },
    el('div', { class: 'stat' },
      el('div', { class: 'stat-num' }, String(todayMatches.length)),
      el('div', { class: 'stat-label' }, '今日比赛'),
    ),
    el('div', { class: 'stat' },
      el('div', { class: 'stat-num' }, String(state.teams.length)),
      el('div', { class: 'stat-label' }, '参赛队伍'),
    ),
    el('div', { class: 'stat' },
      el('div', { class: 'stat-num' }, String(state.matches.filter(m => m.status === 'finished').length)),
      el('div', { class: 'stat-label' }, '已结束'),
    ),
  ));

  panel.appendChild(sponsorPresentsHeading('今日赛程'));
  if (todayMatches.length === 0) {
    panel.appendChild(sponsorEmptyHero('今天没有比赛'));
    panel.appendChild(el('div', { class: 'btn-row', style: 'justify-content:center;margin-top:10px;' },
      el('button', { class: 'btn', onClick: () => openMatchForm() }, '＋ 安排一场'),
    ));
  } else {
    todayMatches.forEach(m => panel.appendChild(matchCard(m)));
    const strip = sponsorSectionStrip();
    if (strip) panel.appendChild(strip);
  }

  panel.appendChild(el('div', { class: 'section-sub' }, '快速入口'));
  panel.appendChild(el('div', { class: 'card' },
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn', onClick: () => activateTab('shootlist') }, '📷 拍摄清单'),
      el('button', { class: 'btn ghost', onClick: () => activateTab('standings') }, '📊 积分榜'),
      el('button', { class: 'btn ghost', onClick: () => activateTab('reports') }, '📝 战报'),
      el('button', { class: 'btn ghost', onClick: () => activateTab('data') }, '💾 数据'),
    ),
  ));

  // 位置 ⑥ + ⑦：品牌呈现 + 产品系列
  const brandCard = sponsorBrandCard();
  if (brandCard) panel.appendChild(brandCard);
  const productRow = sponsorProductRow();
  if (productRow) panel.appendChild(productRow);

  if (state.teams.length === 0 && state.matches.length === 0) {
    panel.appendChild(el('div', { class: 'card', style: 'margin-top:14px;border:1px dashed var(--border);text-align:center;' },
      el('p', { class: 'muted' }, '还没有数据？先去「数据」页导入示例。'),
      el('button', { class: 'btn ghost sm', onClick: () => activateTab('data') }, '前往'),
    ));
  }
};

/* ===== Schedule ===== */
renderers.schedule = function() {
  const panel = document.getElementById('tab-schedule');
  clear(panel);

  panel.appendChild(el('div', { class: 'section-head' },
    el('h2', null, '赛程'),
    el('button', { class: 'btn sm', onClick: () => openMatchForm() }, '＋ 新建')
  ));

  if (state.matches.length === 0) {
    panel.appendChild(sponsorEmptyHero('还没有比赛'));
    panel.appendChild(el('div', { class: 'btn-row', style: 'justify-content:center;margin-top:10px;' },
      el('button', { class: 'btn', onClick: () => openMatchForm() }, '＋ 新建比赛'),
    ));
    return;
  }

  const grouped = {};
  sortMatches(state.matches).forEach(m => {
    const key = m.datetime ? new Date(m.datetime).toLocaleDateString('zh-CN') : '未排期';
    (grouped[key] = grouped[key] || []).push(m);
  });
  const dateKeys = Object.keys(grouped);
  dateKeys.forEach((date, idx) => {
    panel.appendChild(el('div', { class: 'section-sub' }, date));
    grouped[date].forEach(m => panel.appendChild(matchCard(m)));
    // 每天结束后插入冠名条带（最后一天不重复）
    if (idx < dateKeys.length - 1) {
      const strip = sponsorSectionStrip();
      if (strip) panel.appendChild(strip);
    }
  });
  const finalStrip = sponsorSectionStrip();
  if (finalStrip) panel.appendChild(finalStrip);
};

function openMatchForm(matchId) {
  const m = matchId ? getMatch(matchId) : null;
  const isEdit = !!m;

  const form = el('form', null);

  const sportSel = el('select', { name: 'sport' },
    el('option', { value: 'football' }, '⚽ 足球'),
    el('option', { value: 'basketball' }, '🏀 篮球'),
  );
  sportSel.value = m ? m.sport : 'football';

  const homeSel = el('select', { name: 'homeId' });
  const awaySel = el('select', { name: 'awayId' });
  function refillTeamSelects() {
    [homeSel, awaySel].forEach(s => clear(s));
    [homeSel, awaySel].forEach(s => s.appendChild(el('option', { value: '' }, '选择队伍')));
    const sport = sportSel.value;
    state.teams.filter(t => !t.sport || t.sport === sport).forEach(t => {
      homeSel.appendChild(el('option', { value: t.id }, t.name + (t.region ? ` (${t.region})` : '')));
      awaySel.appendChild(el('option', { value: t.id }, t.name + (t.region ? ` (${t.region})` : '')));
    });
    if (m) { homeSel.value = m.homeId || ''; awaySel.value = m.awayId || ''; }
  }
  sportSel.addEventListener('change', refillTeamSelects);
  refillTeamSelects();

  const dtInput = el('input', { type: 'datetime-local', name: 'datetime', value: m && m.datetime ? m.datetime.slice(0,16) : '' });
  const venueInput = el('input', { type: 'text', name: 'venue', value: m ? m.venue || '' : '', placeholder: '例如 县体育中心 1 号场' });
  const roundInput = el('input', { type: 'text', name: 'round', value: m ? m.round || '' : '', placeholder: '例如 小组赛第 2 轮 / 半决赛' });

  const statusSel = el('select', { name: 'status' },
    el('option', { value: 'scheduled' }, '未开始'),
    el('option', { value: 'live' }, '进行中'),
    el('option', { value: 'finished' }, '已结束'),
  );
  statusSel.value = m ? m.status : 'scheduled';

  form.appendChild(el('div', { class: 'form-group' }, el('label', null, '项目'), sportSel));
  form.appendChild(el('div', { class: 'form-row' },
    el('div', { class: 'form-group' }, el('label', null, '主队'), homeSel),
    el('div', { class: 'form-group' }, el('label', null, '客队'), awaySel),
  ));
  form.appendChild(el('div', { class: 'form-row' },
    el('div', { class: 'form-group' }, el('label', null, '开赛时间'), dtInput),
    el('div', { class: 'form-group' }, el('label', null, '状态'), statusSel),
  ));
  form.appendChild(el('div', { class: 'form-group' }, el('label', null, '场地'), venueInput));
  form.appendChild(el('div', { class: 'form-group' }, el('label', null, '阶段 / 轮次'), roundInput));

  const actions = el('div', { class: 'form-actions' },
    isEdit ? el('button', { type: 'button', class: 'btn danger', onClick: () => {
      if (!confirmDel('确定删除该场比赛？')) return;
      state.matches = state.matches.filter(x => x.id !== m.id);
      state.analyses = state.analyses.filter(a => a.matchId !== m.id);
      save(); closeModal(); renderAll(); toast('已删除');
    }}, '删除') : null,
    el('button', { type: 'button', class: 'btn ghost', onClick: closeModal }, '取消'),
    el('button', { type: 'submit', class: 'btn' }, '保存'),
  );
  form.appendChild(actions);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      sport: fd.get('sport'),
      homeId: fd.get('homeId'),
      awayId: fd.get('awayId'),
      datetime: fd.get('datetime'),
      venue: fd.get('venue').trim(),
      round: fd.get('round').trim(),
      status: fd.get('status'),
    };
    if (!data.homeId || !data.awayId) return toast('请选择主客队');
    if (data.homeId === data.awayId) return toast('主客队不能相同');
    if (isEdit) {
      Object.assign(m, data);
    } else {
      state.matches.push({
        id: uid('m-'), ...data,
        homeScore: 0, awayScore: 0,
        events: [], mvp: '', notes: '',
      });
    }
    save(); closeModal(); renderAll(); toast(isEdit ? '已保存' : '已创建');
  });

  openModal(isEdit ? '编辑比赛' : '新建比赛', form);
}

/* ===== Score entry ===== */
function openScoreEntry(matchId) {
  const m = getMatch(matchId);
  if (!m) return;
  const wrap = el('div');

  const stepBtn = (sign, side) => el('button', { type: 'button', class: 'btn sm ghost', onClick: () => {
    const key = side + 'Score';
    m[key] = Math.max(0, (m[key] || 0) + sign);
    save(); renderBody();
  } }, sign > 0 ? '＋' : '－');

  function renderBody() {
    clear(wrap);
    wrap.appendChild(el('div', { class: 'match-teams', style: 'background:#f8fafc;padding:14px;border-radius:8px;' },
      el('div', null,
        el('div', { class: 'match-team center' }, teamName(m.homeId)),
        el('div', { class: 'btn-row center', style: 'justify-content:center;margin-top:6px;' }, stepBtn(-1, 'home'), stepBtn(1, 'home')),
      ),
      el('div', { class: 'match-score' }, `${m.homeScore || 0} : ${m.awayScore || 0}`),
      el('div', null,
        el('div', { class: 'match-team center' }, teamName(m.awayId)),
        el('div', { class: 'btn-row center', style: 'justify-content:center;margin-top:6px;' }, stepBtn(-1, 'away'), stepBtn(1, 'away')),
      ),
    ));

    const statusSel = el('select', null,
      el('option', { value: 'scheduled' }, '未开始'),
      el('option', { value: 'live' }, '进行中'),
      el('option', { value: 'finished' }, '已结束'),
    );
    statusSel.value = m.status;
    statusSel.addEventListener('change', () => { m.status = statusSel.value; save(); renderers.schedule(); renderers.today(); renderers.standings(); });
    wrap.appendChild(el('div', { class: 'form-group mt-12' }, el('label', null, '比赛状态'), statusSel));

    const mvpInput = el('input', { type: 'text', placeholder: '最佳球员姓名', value: m.mvp || '' });
    mvpInput.addEventListener('change', () => { m.mvp = mvpInput.value.trim(); save(); });
    wrap.appendChild(el('div', { class: 'form-group' }, el('label', null, '最佳球员 MVP'), mvpInput));

    const noteTa = el('textarea', { placeholder: '复盘 / 临场调整 / 关键时刻' }, m.notes || '');
    noteTa.addEventListener('change', () => { m.notes = noteTa.value.trim(); save(); });
    wrap.appendChild(el('div', { class: 'form-group' }, el('label', null, '比赛备注'), noteTa));

    // ===== Events =====
    wrap.appendChild(el('div', { class: 'section-sub' }, '关键事件'));

    const eventForm = el('div', { class: 'card', style: 'background:#f8fafc;' });
    const eventType = el('select', null,
      ...Object.entries(EVENT_TYPES).map(([k, v]) => el('option', { value: k }, `${v.icon} ${v.label}`))
    );
    const teamSel = el('select', null,
      el('option', { value: 'home' }, teamName(m.homeId)),
      el('option', { value: 'away' }, teamName(m.awayId)),
    );
    const playerInput = el('input', { type: 'text', placeholder: '球员姓名' });
    const minuteInput = el('input', { type: 'text', placeholder: '分钟', style: 'width:72px;' });
    const noteInput = el('input', { type: 'text', placeholder: '备注 (可选)' });

    eventForm.appendChild(el('div', { class: 'form-row' },
      el('div', { class: 'form-group' }, el('label', null, '类型'), eventType),
      el('div', { class: 'form-group' }, el('label', null, '队伍'), teamSel),
    ));
    eventForm.appendChild(el('div', { class: 'form-row' },
      el('div', { class: 'form-group' }, el('label', null, '球员'), playerInput),
      el('div', { class: 'form-group' }, el('label', null, '分钟'), minuteInput),
    ));
    eventForm.appendChild(el('div', { class: 'form-group' }, el('label', null, '备注'), noteInput));
    eventForm.appendChild(el('button', { type: 'button', class: 'btn sm', onClick: () => {
      const ev = {
        id: uid('e-'),
        type: eventType.value,
        team: teamSel.value,
        player: playerInput.value.trim(),
        minute: minuteInput.value.trim(),
        note: noteInput.value.trim(),
      };
      if (!ev.player) return toast('请输入球员');
      m.events = m.events || [];
      m.events.push(ev);
      // Auto-bump score on football goal
      if (ev.type === 'goal' && m.sport === 'football') {
        m[ev.team + 'Score'] = (m[ev.team + 'Score'] || 0) + 1;
      }
      save();
      playerInput.value = ''; minuteInput.value = ''; noteInput.value = '';
      renderBody();
    } }, '＋ 添加事件'));
    wrap.appendChild(eventForm);

    const log = el('div', { class: 'event-log' });
    (m.events || []).slice().reverse().forEach(ev => {
      const type = EVENT_TYPES[ev.type] || EVENT_TYPES.note;
      log.appendChild(el('div', { class: 'event-item' },
        el('span', { class: 'event-min' }, ev.minute ? ev.minute + "'" : '-'),
        el('div', null,
          el('span', { class: 'event-icon' }, type.icon + ' '),
          el('strong', null, ev.player),
          ' · ',
          el('span', { class: 'muted small' }, teamName(ev.team === 'home' ? m.homeId : m.awayId)),
          ev.note ? el('div', { class: 'small muted' }, ev.note) : null,
        ),
        el('button', { class: 'event-del', onClick: () => {
          m.events = m.events.filter(x => x.id !== ev.id);
          save(); renderBody();
        } }, '×'),
      ));
    });
    if ((m.events || []).length === 0) {
      log.appendChild(el('div', { class: 'empty small' }, '暂无事件'));
    }
    wrap.appendChild(log);
  }

  renderBody();
  openModal('录入比分 · ' + (m.round || fmtDT(m.datetime)), wrap);
}

/* ===== Teams ===== */
renderers.teams = function() {
  const panel = document.getElementById('tab-teams');
  clear(panel);
  panel.appendChild(el('div', { class: 'section-head' },
    el('h2', null, '队伍'),
    el('button', { class: 'btn sm', onClick: () => openTeamForm() }, '＋ 新建'),
  ));

  if (state.teams.length === 0) {
    panel.appendChild(el('div', { class: 'empty' },
      el('p', null, '还没有队伍'),
      el('button', { class: 'btn', onClick: () => openTeamForm() }, '＋ 新建队伍'),
    ));
    return;
  }

  state.teams.filter(t => t.id !== 't-tba').forEach(t => {
    const sport = SPORTS[t.sport] || SPORTS.football;
    const card = el('div', { class: 'card' + (t.banned ? ' banned-card' : '') },
      el('div', { class: 'match-meta' },
        el('div', { class: 'team-card-head' },
          teamLogo(t, 'lg'),
          el('div', null,
            el('span', { class: 'tag ' + (t.sport || 'football') }, `${sport.emoji} ${sport.label}`),
            ' ',
            el('strong', null, t.name),
            t.region ? el('span', { class: 'muted small' }, ' · ' + t.region) : null,
            t.banned ? el('span', { class: 'tag banned' }, '⛔ ' + (t.banReason || '已禁赛')) : null,
          ),
        ),
        el('div', { class: 'btn-row' },
          el('button', { class: 'btn sm ghost', onClick: () => openTeamForm(t.id) }, '编辑'),
        ),
      ),
      t.captain ? el('div', { class: 'small muted' }, '队长：' + t.captain) : null,
      t.intro ? el('div', { class: 'small mt-8' }, t.intro) : null,
      (() => {
        const ps = (t.players || []).filter(p => p.age);
        if (ps.length === 0) return null;
        const ages = ps.map(p => p.age);
        const avg = (ages.reduce((a,b)=>a+b,0)/ages.length).toFixed(1);
        return el('div', { class: 'team-age-stats small muted' },
          `👥 共 ${t.players.length} 人 · 平均 ${avg} 岁 · 最年轻 ${Math.min(...ages)} 岁 · 最年长 ${Math.max(...ages)} 岁`
        );
      })(),
      el('div', { class: 'player-list' },
        ...(t.players || []).map(p => el('span', { class: 'player-tag', onClick: () => openPlayerForm(p.id, t.id) },
          p.number ? el('span', { class: 'num' }, '#' + p.number) : null,
          p.name + (p.position ? ' · ' + p.position : '') + (p.age ? ` · ${p.age}岁` : '')
        )),
        el('span', { class: 'player-tag', style: 'color:var(--primary);font-weight:600;', onClick: () => openPlayerForm(null, t.id) }, '＋ 球员'),
      ),
    );
    panel.appendChild(card);
  });
};

function openTeamForm(teamId) {
  const t = teamId ? getTeam(teamId) : null;
  const isEdit = !!t;
  const form = el('form', null);

  const sportSel = el('select', { name: 'sport' },
    el('option', { value: 'football' }, '⚽ 足球'),
    el('option', { value: 'basketball' }, '🏀 篮球'),
  );
  sportSel.value = t ? t.sport || 'football' : 'football';

  form.appendChild(el('div', { class: 'form-group' }, el('label', null, '项目'), sportSel));
  form.appendChild(el('div', { class: 'form-group' },
    el('label', null, '队名'),
    el('input', { type: 'text', name: 'name', value: t ? t.name : '', required: true, placeholder: '例如 城东 FC' }),
  ));
  form.appendChild(el('div', { class: 'form-row' },
    el('div', { class: 'form-group' },
      el('label', null, '地区'),
      el('input', { type: 'text', name: 'region', value: t ? t.region || '' : '', placeholder: '例如 城东街道' }),
    ),
    el('div', { class: 'form-group' },
      el('label', null, '队长'),
      el('input', { type: 'text', name: 'captain', value: t ? t.captain || '' : '' }),
    ),
  ));
  form.appendChild(el('div', { class: 'form-group' },
    el('label', null, '队伍简介'),
    el('textarea', { name: 'intro', placeholder: '历史、风格、口号…' }, t ? t.intro || '' : ''),
  ));

  const actions = el('div', { class: 'form-actions' },
    isEdit ? el('button', { type: 'button', class: 'btn danger', onClick: () => {
      if (!confirmDel('删除队伍会清空相关比赛吗？只删除队伍。')) return;
      state.teams = state.teams.filter(x => x.id !== t.id);
      save(); closeModal(); renderAll(); toast('已删除');
    } }, '删除') : null,
    el('button', { type: 'button', class: 'btn ghost', onClick: closeModal }, '取消'),
    el('button', { type: 'submit', class: 'btn' }, '保存'),
  );
  form.appendChild(actions);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      sport: fd.get('sport'),
      name: fd.get('name').trim(),
      region: fd.get('region').trim(),
      captain: fd.get('captain').trim(),
      intro: fd.get('intro').trim(),
    };
    if (!data.name) return toast('请输入队名');
    if (isEdit) {
      Object.assign(t, data);
    } else {
      state.teams.push({ id: uid('t-'), ...data, players: [] });
    }
    save(); closeModal(); renderAll(); toast(isEdit ? '已保存' : '已创建');
  });

  openModal(isEdit ? '编辑队伍' : '新建队伍', form);
}

/* ===== Players ===== */
function getPlayer(playerId) {
  for (const t of state.teams) {
    const p = (t.players || []).find(p => p.id === playerId);
    if (p) return { player: p, team: t };
  }
  return null;
}

function openPlayerForm(playerId, teamId) {
  const found = playerId ? getPlayer(playerId) : null;
  const p = found ? found.player : null;
  const isEdit = !!p;
  let currentTeamId = teamId || (found && found.team.id) || (state.teams[0] && state.teams[0].id);

  const form = el('form', null);

  const teamSel = el('select', { name: 'teamId' },
    ...state.teams.map(t => el('option', { value: t.id }, t.name)),
  );
  teamSel.value = currentTeamId || '';

  form.appendChild(el('div', { class: 'form-group' }, el('label', null, '所属队伍'), teamSel));
  form.appendChild(el('div', { class: 'form-row' },
    el('div', { class: 'form-group' }, el('label', null, '姓名'),
      el('input', { type: 'text', name: 'name', value: p ? p.name : '', required: true })),
    el('div', { class: 'form-group' }, el('label', null, '号码'),
      el('input', { type: 'text', name: 'number', value: p ? p.number || '' : '' })),
  ));
  form.appendChild(el('div', { class: 'form-row' },
    el('div', { class: 'form-group' }, el('label', null, '位置'),
      el('input', { type: 'text', name: 'position', value: p ? p.position || '' : '', placeholder: '前锋 / 后卫…' })),
    el('div', { class: 'form-group' }, el('label', null, '职业'),
      el('input', { type: 'text', name: 'profession', value: p ? p.profession || '' : '', placeholder: '快递员 / 老师…' })),
  ));
  form.appendChild(el('div', { class: 'form-group' }, el('label', null, '家乡'),
    el('input', { type: 'text', name: 'hometown', value: p ? p.hometown || '' : '' })));
  form.appendChild(el('div', { class: 'form-group' }, el('label', null, '经历 / 故事'),
    el('textarea', { name: 'experience', placeholder: '球场之外 + 球场上的关键经历' }, p ? p.experience || '' : '')));
  form.appendChild(el('div', { class: 'form-group' }, el('label', null, '技术特点'),
    el('textarea', { name: 'skills', placeholder: '速度 / 传球 / 投射…' }, p ? p.skills || '' : '')));

  const actions = el('div', { class: 'form-actions' },
    isEdit ? el('button', { type: 'button', class: 'btn danger', onClick: () => {
      if (!confirmDel('删除该球员？')) return;
      found.team.players = found.team.players.filter(x => x.id !== p.id);
      save(); closeModal(); renderAll(); toast('已删除');
    } }, '删除') : null,
    el('button', { type: 'button', class: 'btn ghost', onClick: closeModal }, '取消'),
    el('button', { type: 'submit', class: 'btn' }, '保存'),
  );
  form.appendChild(actions);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.teams.length === 0) return toast('先创建队伍');
    const fd = new FormData(form);
    const data = {
      name: fd.get('name').trim(),
      number: fd.get('number').trim(),
      position: fd.get('position').trim(),
      profession: fd.get('profession').trim(),
      hometown: fd.get('hometown').trim(),
      experience: fd.get('experience').trim(),
      skills: fd.get('skills').trim(),
    };
    if (!data.name) return toast('请输入姓名');
    const newTeamId = fd.get('teamId');
    if (isEdit) {
      Object.assign(p, data);
      if (newTeamId && newTeamId !== found.team.id) {
        found.team.players = found.team.players.filter(x => x.id !== p.id);
        const newTeam = getTeam(newTeamId);
        if (newTeam) { newTeam.players = newTeam.players || []; newTeam.players.push(p); }
      }
    } else {
      const team = getTeam(newTeamId);
      if (!team) return toast('队伍不存在');
      team.players = team.players || [];
      team.players.push({ id: uid('p-'), ...data });
    }
    save(); closeModal(); renderAll(); toast(isEdit ? '已保存' : '已创建');
  });

  openModal(isEdit ? '编辑球员' : '新建球员', form);
}

/* ===== Player story library ===== */
renderers.players = function() {
  const panel = document.getElementById('tab-players');
  clear(panel);

  panel.appendChild(el('div', { class: 'section-head' },
    el('h2', null, '球员故事库'),
    el('button', { class: 'btn sm', onClick: () => openPlayerForm() }, '＋ 新增'),
  ));

  const all = [];
  state.teams.forEach(t => (t.players || []).forEach(p => all.push({ player: p, team: t })));
  if (all.length === 0) {
    panel.appendChild(el('div', { class: 'empty' },
      el('p', null, '还没有球员故事'),
      el('button', { class: 'btn', onClick: () => openPlayerForm() }, '＋ 新增球员'),
    ));
    return;
  }

  // Filter by team
  const filterSel = el('select', null, el('option', { value: '' }, '全部队伍'),
    ...state.teams.map(t => el('option', { value: t.id }, t.name)));
  const filterWrap = el('div', { class: 'form-group' }, el('label', null, '筛选'), filterSel);
  panel.appendChild(filterWrap);

  const listWrap = el('div');
  panel.appendChild(listWrap);

  function renderList() {
    clear(listWrap);
    const filtered = all.filter(x => !filterSel.value || x.team.id === filterSel.value);
    filtered.forEach(({ player: p, team: t }) => {
      const card = el('div', { class: 'story-card' },
        el('div', { class: 'story-head' },
          el('div', null,
            p.number ? el('span', { style: 'color:var(--primary);font-weight:700;margin-right:6px;' }, '#' + p.number) : null,
            el('span', { class: 'story-name' }, p.name),
            p.position ? el('span', { class: 'muted small' }, ' · ' + p.position) : null,
          ),
          el('span', { class: 'story-team' }, t.name),
        ),
        el('div', { class: 'story-meta' },
          p.profession ? el('span', null, '💼 ' + p.profession) : null,
          p.hometown ? el('span', null, '📍 ' + p.hometown) : null,
        ),
        p.experience ? el('div', { class: 'story-text' }, p.experience) : null,
        p.skills ? el('div', { class: 'story-text muted small mt-8' }, '🎯 ' + p.skills) : null,
        el('div', { class: 'btn-row mt-12' },
          el('button', { class: 'btn sm ghost', onClick: () => openPlayerForm(p.id) }, '编辑'),
          el('button', { class: 'btn sm', onClick: () => openVideoTopic(p, t) }, '生成短视频选题'),
        ),
      );
      listWrap.appendChild(card);
    });
  }
  filterSel.addEventListener('change', renderList);
  renderList();
};

function openVideoTopic(p, t) {
  const topics = generateVideoTopics(p, t);
  const wrap = el('div');
  wrap.appendChild(el('p', { class: 'muted small' }, '基于球员资料自动生成的短视频选题，可直接复制使用。'));
  topics.forEach(line => {
    wrap.appendChild(el('div', { class: 'card' },
      el('div', null, line),
      el('div', { class: 'btn-row mt-8' },
        el('button', { class: 'btn sm ghost', onClick: () => copyText(line) }, '复制'),
      ),
    ));
  });
  openModal(p.name + ' · 选题', wrap);
}

function generateVideoTopics(p, t) {
  const arr = [];
  const head = `《${p.name}的双面人生》`;
  if (p.profession) arr.push(`${head} 白天${p.profession}，晚上${SPORTS[t.sport]?.label || '球场'}主角`);
  if (p.hometown) arr.push(`从${p.hometown}走到${t.region || '县城'}赛场，${p.name}的回家路`);
  if (p.skills) arr.push(`${p.name}的招牌：${p.skills}`);
  if (p.experience) arr.push(`「${p.experience.slice(0, 28)}…」——${p.name}的球场故事`);
  arr.push(`${t.name} ${p.number ? '#' + p.number + ' ' : ''}${p.name}：开赛前 30 秒人物纪录`);
  arr.push(`${p.name} 慢动作集锦 + 队友一句话评价`);
  return arr;
}

/* ===== Standings ===== */
renderers.standings = function() {
  const panel = document.getElementById('tab-standings');
  clear(panel);
  panel.appendChild(el('div', { class: 'section-head' }, el('h2', null, '积分榜')));

  ['football', 'basketball'].forEach(sport => {
    const teams = state.teams.filter(t => (t.sport || 'football') === sport && t.id !== 't-tba');
    if (teams.length === 0) return;
    // Try grouping by intro field like "A组" / "B组"
    const groupKeys = ['A', 'B', 'C', 'D'];
    const grouped = {};
    teams.forEach(t => {
      const m = (t.intro || '').match(/([A-D])组/);
      const g = m ? m[1] : '其他';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(t);
    });
    const hasGroups = groupKeys.some(k => grouped[k] && grouped[k].length > 0);
    if (hasGroups) {
      panel.appendChild(el('div', { class: 'section-sub' }, `${SPORTS[sport].emoji} ${SPORTS[sport].label} · 小组积分`));
      groupKeys.forEach(k => {
        if (!grouped[k]) return;
        panel.appendChild(el('div', { class: 'group-label' }, `${k}组`));
        panel.appendChild(buildStandings(sport, grouped[k]));
      });
      if (grouped['其他']) {
        panel.appendChild(el('div', { class: 'group-label' }, '其他'));
        panel.appendChild(buildStandings(sport, grouped['其他']));
      }
    } else {
      panel.appendChild(el('div', { class: 'section-sub' }, `${SPORTS[sport].emoji} ${SPORTS[sport].label}`));
      panel.appendChild(buildStandings(sport, teams));
    }
  });

  if (state.teams.length === 0) {
    panel.appendChild(el('div', { class: 'empty' },
      el('p', null, '还没有队伍数据'),
    ));
  }
};

function buildStandings(sport, teams) {
  const rows = teams.map(t => ({
    team: t,
    games: 0, wins: 0, draws: 0, losses: 0,
    gf: 0, ga: 0, points: 0,
  }));
  const byId = {};
  rows.forEach(r => (byId[r.team.id] = r));

  state.matches.filter(m => (m.status === 'finished' || m.status === 'forfeit') && m.sport === sport).forEach(m => {
    const h = byId[m.homeId], a = byId[m.awayId];
    if (!h || !a) return;
    const hs = m.homeScore || 0, as = m.awayScore || 0;
    h.games++; a.games++;
    h.gf += hs; h.ga += as; a.gf += as; a.ga += hs;
    if (hs > as) { h.wins++; a.losses++; h.points += SPORTS[sport].win; a.points += SPORTS[sport].loss; }
    else if (hs < as) { a.wins++; h.losses++; a.points += SPORTS[sport].win; h.points += SPORTS[sport].loss; }
    else { h.draws++; a.draws++; h.points += SPORTS[sport].draw; a.points += SPORTS[sport].draw; }
  });

  rows.sort((x, y) =>
    y.points - x.points ||
    (y.gf - y.ga) - (x.gf - x.ga) ||
    y.gf - x.gf ||
    y.wins - x.wins
  );

  const isBasket = sport === 'basketball';
  const table = el('table', { class: 'standings-table' },
    el('thead', null, el('tr', null,
      el('th', null, '#'),
      el('th', null, '队伍'),
      el('th', null, '场'),
      el('th', null, '胜'),
      isBasket ? null : el('th', null, '平'),
      el('th', null, '负'),
      el('th', null, isBasket ? '得分' : '进'),
      el('th', null, isBasket ? '失分' : '失'),
      el('th', null, '差'),
      el('th', null, '积分'),
    )),
    el('tbody', null,
      ...rows.map((r, i) => el('tr', null,
        el('td', null, el('span', { class: 'rank-badge top' + (i + 1) }, String(i + 1))),
        el('td', { class: 'team-name' }, teamLine(r.team)),
        el('td', null, String(r.games)),
        el('td', null, String(r.wins)),
        isBasket ? null : el('td', null, String(r.draws)),
        el('td', null, String(r.losses)),
        el('td', null, String(r.gf)),
        el('td', null, String(r.ga)),
        el('td', null, String(r.gf - r.ga)),
        el('td', null, el('strong', { style: 'color:var(--primary);' }, String(r.points))),
      )),
    ),
  );

  return el('div', { class: 'standings-wrap' }, table);
}

/* ===== Top Scorers / Assists ===== */
renderers.topscorers = function() {
  const panel = document.getElementById('tab-topscorers');
  clear(panel);
  panel.appendChild(el('div', { class: 'section-head' }, el('h2', null, '射手榜 · 助攻榜')));

  // Aggregate goals and assists from finished matches
  const goalMap = {};   // key: name|teamId -> { name, teamId, count }
  const assistMap = {};
  const matches = state.matches.filter(m => (m.sport || 'football') === 'football');
  matches.forEach(m => {
    (m.events || []).forEach(ev => {
      const name = (ev.player || '').trim();
      if (!name) return;
      const teamId = ev.team === 'away' ? m.awayId : m.homeId;
      const key = name + '|' + teamId;
      if (ev.type === 'goal') {
        if (!goalMap[key]) goalMap[key] = { name, teamId, count: 0 };
        goalMap[key].count++;
      } else if (ev.type === 'assist') {
        if (!assistMap[key]) assistMap[key] = { name, teamId, count: 0 };
        assistMap[key].count++;
      }
    });
  });

  const goalList = Object.values(goalMap).sort((a, b) => b.count - a.count);
  const assistList = Object.values(assistMap).sort((a, b) => b.count - a.count);

  function buildBoard(title, list, unit) {
    const wrap = el('div', { class: 'leader-board' });
    wrap.appendChild(el('div', { class: 'section-sub' }, title));
    if (list.length === 0) {
      wrap.appendChild(el('div', { class: 'empty' },
        el('p', null, '比赛尚未开始，等待数据录入'),
      ));
      return wrap;
    }
    const table = el('table', { class: 'standings-table' },
      el('thead', null, el('tr', null,
        el('th', null, '#'),
        el('th', null, '球员'),
        el('th', null, '队伍'),
        el('th', null, unit),
      )),
      el('tbody', null,
        ...list.map((r, i) => el('tr', null,
          el('td', null, el('span', { class: 'rank-badge top' + (i + 1) }, String(i + 1))),
          el('td', { class: 'team-name' }, r.name),
          el('td', null, teamLine(r.teamId, { short: true })),
          el('td', null, el('strong', { style: 'color:var(--primary);' }, String(r.count))),
        )),
      ),
    );
    wrap.appendChild(el('div', { class: 'standings-wrap' }, table));
    return wrap;
  }

  panel.appendChild(buildBoard('⚽ 射手榜', goalList, '进球'));
  panel.appendChild(buildBoard('🅰️ 助攻榜', assistList, '助攻'));

  // Combined contribution board
  const combMap = {};
  Object.values(goalMap).forEach(r => {
    const k = r.name + '|' + r.teamId;
    combMap[k] = { name: r.name, teamId: r.teamId, goals: r.count, assists: 0 };
  });
  Object.values(assistMap).forEach(r => {
    const k = r.name + '|' + r.teamId;
    if (!combMap[k]) combMap[k] = { name: r.name, teamId: r.teamId, goals: 0, assists: 0 };
    combMap[k].assists = r.count;
  });
  const combList = Object.values(combMap)
    .map(r => Object.assign({}, r, { total: r.goals + r.assists }))
    .sort((a, b) => b.total - a.total || b.goals - a.goals);

  if (combList.length > 0) {
    const wrap = el('div', { class: 'leader-board' });
    wrap.appendChild(el('div', { class: 'section-sub' }, '🏅 进攻贡献榜 (进球+助攻)'));
    const table = el('table', { class: 'standings-table' },
      el('thead', null, el('tr', null,
        el('th', null, '#'),
        el('th', null, '球员'),
        el('th', null, '队伍'),
        el('th', null, '进'),
        el('th', null, '助'),
        el('th', null, '合计'),
      )),
      el('tbody', null,
        ...combList.map((r, i) => el('tr', null,
          el('td', null, el('span', { class: 'rank-badge top' + (i + 1) }, String(i + 1))),
          el('td', { class: 'team-name' }, r.name),
          el('td', null, teamLine(r.teamId, { short: true })),
          el('td', null, String(r.goals)),
          el('td', null, String(r.assists)),
          el('td', null, el('strong', { style: 'color:var(--primary);' }, String(r.total))),
        )),
      ),
    );
    wrap.appendChild(el('div', { class: 'standings-wrap' }, table));
    panel.appendChild(wrap);
  }
};

/* ===== G4 Insights ===== */
renderers.insights = function() {
  const panel = document.getElementById('tab-insights');
  clear(panel);
  panel.appendChild(el('div', { class: 'section-head' },
    el('h2', null, 'G4 赛前看点'),
  ));

  if (state.matches.length === 0) {
    panel.appendChild(el('div', { class: 'empty' }, el('p', null, '先在「赛程」里安排一场比赛')));
    return;
  }

  const upcoming = state.matches.filter(m => m.status !== 'finished');
  const pool = upcoming.length ? upcoming : state.matches;
  const matchSel = el('select', null,
    ...sortMatches(pool).map(m =>
      el('option', { value: m.id }, `${fmtDT(m.datetime)} · ${teamName(m.homeId)} vs ${teamName(m.awayId)}`))
  );
  panel.appendChild(el('div', { class: 'form-group' }, el('label', null, '选择比赛'), matchSel));

  const editor = el('div');
  panel.appendChild(editor);

  function render(mId) {
    clear(editor);
    const m = getMatch(mId);
    if (!m) return;
    let an = state.analyses.find(a => a.matchId === mId);
    if (!an) {
      an = {
        matchId: mId,
        home: defaultRatings(),
        away: defaultRatings(),
        keyPoints: '',
      };
      state.analyses.push(an);
    }

    function ratingsBlock(label, teamId, side) {
      const block = el('div', { class: 'rating-block' });
      block.appendChild(el('h4', null, label + ' · ' + teamName(teamId)));
      const grid = el('div', { class: 'rating-group' });
      RATING_KEYS.forEach(({ key, label }) => {
        const val = an[side][key] != null ? an[side][key] : 3;
        const valSpan = el('span', null, String(val));
        const range = el('input', { type: 'range', min: '1', max: '5', step: '1', value: String(val) });
        range.addEventListener('input', () => {
          an[side][key] = Number(range.value);
          valSpan.textContent = range.value;
          save();
        });
        grid.appendChild(el('div', { class: 'rating-item' },
          el('label', null, label, valSpan),
          range,
        ));
      });
      block.appendChild(grid);
      return block;
    }

    editor.appendChild(ratingsBlock('主队', m.homeId, 'home'));
    editor.appendChild(ratingsBlock('客队', m.awayId, 'away'));

    const ta = el('textarea', { placeholder: '人工补充看点 (可选)' }, an.keyPoints || '');
    ta.addEventListener('change', () => { an.keyPoints = ta.value.trim(); save(); });
    editor.appendChild(el('div', { class: 'form-group' }, el('label', null, '看点补充'), ta));

    const out = el('div', { class: 'insight-output' });
    function regen() {
      out.textContent = renderInsight(m, an);
    }
    editor.appendChild(el('div', { class: 'btn-row' },
      el('button', { class: 'btn', onClick: regen }, '🪄 生成看点'),
      el('button', { class: 'btn ghost', onClick: () => copyText(out.textContent) }, '复制'),
    ));
    editor.appendChild(out);
    regen();
  }

  matchSel.addEventListener('change', () => render(matchSel.value));
  render(matchSel.value);

  panel._setMatch = (id) => { matchSel.value = id; render(id); };
};
function defaultRatings() {
  const o = {};
  RATING_KEYS.forEach(k => (o[k.key] = 3));
  return o;
}
function focusInsight(matchId) {
  activateTab('insights');
  setTimeout(() => {
    const panel = document.getElementById('tab-insights');
    if (panel._setMatch) panel._setMatch(matchId);
  }, 30);
}

function renderInsight(m, an) {
  const home = getTeam(m.homeId), away = getTeam(m.awayId);
  const sport = SPORTS[m.sport] || SPORTS.football;
  const homeName = home ? home.name : '主队';
  const awayName = away ? away.name : '客队';
  const ratingDelta = {};
  RATING_KEYS.forEach(k => (ratingDelta[k.key] = (an.home[k.key] || 3) - (an.away[k.key] || 3)));

  const lines = [];
  lines.push(`【${sport.emoji} ${sport.label} · ${fmtDT(m.datetime)}】`);
  lines.push(`${homeName}${home && home.region ? `（${home.region}）` : ''} VS ${awayName}${away && away.region ? `（${away.region}）` : ''}`);
  if (m.venue) lines.push(`📍 场地：${m.venue}`);
  lines.push('');
  lines.push('—— 看点 ——');

  function reason(key, delta) {
    const t = delta > 0 ? homeName : awayName;
    const o = delta > 0 ? awayName : homeName;
    const map = {
      stamina:   `${t}体能更占优，比赛后段更难被拖住`,
      core:      `${t}的核心球员能稳定持球解决问题，关键回合更可靠`,
      chemistry: `${t}阵容磨合时间长，配合更默契，少失误`,
      bench:     `${t}替补深度更厚，临场换人空间更大`,
      venue:     `${t}更熟悉这块场地的草皮 / 木地板`,
      morale:    `${t}战意更强，开局更敢上`,
    };
    return map[key];
  }
  const sorted = Object.entries(ratingDelta).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  sorted.slice(0, 4).forEach(([key, delta]) => {
    if (delta === 0) {
      const label = RATING_KEYS.find(k => k.key === key).label;
      lines.push(`• ${label}：两队接近，会成为胶着点`);
    } else {
      lines.push(`• ${reason(key, delta)}`);
    }
  });
  if (m.round) lines.push(`• 阶段：${m.round}，输赢分量不同`);

  const sumH = Object.values(an.home).reduce((a, b) => a + b, 0);
  const sumA = Object.values(an.away).reduce((a, b) => a + b, 0);
  lines.push('');
  if (Math.abs(sumH - sumA) <= 2) {
    lines.push('🔮 预判：六维差距很小，建议作为「悬念局」做内容包装');
  } else if (sumH > sumA) {
    lines.push(`🔮 预判：${homeName} 综合占优，关注 ${awayName} 是否能打出 1-2 个高光瞬间`);
  } else {
    lines.push(`🔮 预判：${awayName} 综合占优，关注 ${homeName} 主场战意能否抵消差距`);
  }
  if (an.keyPoints) { lines.push(''); lines.push('—— 补充 ——'); lines.push(an.keyPoints); }

  return lines.join('\n');
}

/* ===== Reports ===== */
let _reportTpl = 'official';
let _reportMatchId = null;

renderers.reports = function() {
  const panel = document.getElementById('tab-reports');
  clear(panel);
  panel.appendChild(el('div', { class: 'section-head' }, el('h2', null, '战报生成器')));

  if (state.matches.length === 0) {
    panel.appendChild(el('div', { class: 'empty' }, el('p', null, '还没有比赛')));
    return;
  }

  const finished = state.matches.filter(m => m.status === 'finished');
  const pool = finished.length ? finished : state.matches;
  const matchSel = el('select', null,
    ...sortMatches(pool).map(m =>
      el('option', { value: m.id }, `${fmtDT(m.datetime)} · ${teamName(m.homeId)} ${m.homeScore||0}:${m.awayScore||0} ${teamName(m.awayId)}`))
  );
  if (_reportMatchId && pool.find(p => p.id === _reportMatchId)) matchSel.value = _reportMatchId;
  panel.appendChild(el('div', { class: 'form-group' }, el('label', null, '选择比赛'), matchSel));

  const tabs = el('div', { class: 'report-tabs' });
  const TPLS = [
    { k: 'official', label: '官方战报' },
    { k: 'douyin',   label: '抖音文案' },
    { k: 'wechat',   label: '朋友圈' },
    { k: 'article',  label: '公众号' },
  ];
  TPLS.forEach(t => {
    const b = el('button', { class: 'report-tab' + (t.k === _reportTpl ? ' active' : ''), onClick: () => {
      _reportTpl = t.k;
      tabs.querySelectorAll('.report-tab').forEach((x, i) => x.classList.toggle('active', TPLS[i].k === _reportTpl));
      regenerate();
    } }, t.label);
    tabs.appendChild(b);
  });
  panel.appendChild(tabs);

  const output = el('div', { class: 'report-output' });
  panel.appendChild(output);
  panel.appendChild(el('div', { class: 'btn-row mt-12' },
    el('button', { class: 'btn', onClick: () => copyText(output.textContent) }, '复制文案'),
    el('button', { class: 'btn ghost', onClick: regenerate }, '重新生成'),
  ));

  function regenerate() {
    const m = getMatch(matchSel.value);
    if (!m) return;
    _reportMatchId = m.id;
    output.textContent = buildReport(m, _reportTpl);
  }
  matchSel.addEventListener('change', regenerate);
  regenerate();

  panel._setMatch = (id) => {
    if (matchSel.querySelector(`option[value="${id}"]`)) {
      matchSel.value = id;
      regenerate();
    }
  };
};

function focusReport(matchId) {
  _reportMatchId = matchId;
  activateTab('reports');
  setTimeout(() => {
    const panel = document.getElementById('tab-reports');
    if (panel._setMatch) panel._setMatch(matchId);
  }, 30);
}

function sponsorReportFooter(tpl) {
  const s = getTitleSponsor();
  if (!s) return [];
  if (tpl === 'douyin') {
    return ['', '本场由 ' + s.name + ' 冠名呈现 🍻', '#' + s.name];
  }
  if (tpl === 'wechat') {
    return ['', '——本场由 ' + s.name + ' 冠名呈现 · ' + (s.slogan || '')];
  }
  if (tpl === 'article') {
    return ['', '---', '', `> 本场比赛由 **${s.name}** 冠名呈现。`, '> ' + (s.slogan || '')];
  }
  // official 默认
  const lines = ['', '——————————', `【本场冠名】${s.name}`];
  if (s.slogan) lines.push(s.slogan);
  return lines;
}

function buildReport(m, tpl) {
  const sport = SPORTS[m.sport] || SPORTS.football;
  const home = getTeam(m.homeId), away = getTeam(m.awayId);
  const hs = m.homeScore || 0, as = m.awayScore || 0;
  const winner = hs > as ? home : hs < as ? away : null;
  const loser = hs > as ? away : hs < as ? home : null;
  const homeName = home ? home.name : '主队';
  const awayName = away ? away.name : '客队';
  const goals = (m.events || []).filter(e => e.type === 'goal');
  const keyEvents = (m.events || []).filter(e => ['red','yellow','three','block','save','note'].includes(e.type));
  const sponsorLines = sponsorReportFooter(tpl);

  if (tpl === 'official') {
    const lines = [];
    lines.push(`${sport.emoji} ${m.round ? m.round + ' · ' : ''}${homeName} ${hs}-${as} ${awayName}`);
    lines.push(`${fmtDT(m.datetime)}${m.venue ? ' · ' + m.venue : ''}`);
    lines.push('');
    if (winner) {
      lines.push(`${winner.name} 以 ${Math.max(hs,as)}-${Math.min(hs,as)} 战胜 ${loser.name}。`);
    } else {
      lines.push(`双方 ${hs}-${as} 战平，握手言和。`);
    }
    if (goals.length) {
      lines.push('');
      lines.push('【进球】');
      goals.forEach(g => {
        lines.push(`第 ${g.minute || '?'} 分钟 ${g.player}（${teamName(g.team === 'home' ? m.homeId : m.awayId)}）${g.note ? '，' + g.note : ''}`);
      });
    }
    if (keyEvents.length) {
      lines.push('');
      lines.push('【关键事件】');
      keyEvents.forEach(e => {
        const t = EVENT_TYPES[e.type];
        lines.push(`${e.minute ? '第 ' + e.minute + ' 分钟 ' : ''}${t.label}：${e.player}（${teamName(e.team === 'home' ? m.homeId : m.awayId)}）${e.note ? '，' + e.note : ''}`);
      });
    }
    if (m.mvp) { lines.push(''); lines.push(`【MVP】${m.mvp}`); }
    if (m.notes) { lines.push(''); lines.push('【复盘】' + m.notes); }
    sponsorLines.forEach(l => lines.push(l));
    return lines.join('\n');
  }

  if (tpl === 'douyin') {
    const hook = winner
      ? `${winner.name} 拿下！${Math.max(hs,as)}-${Math.min(hs,as)} 干掉 ${loser.name} 👊`
      : `${hs}-${as} 平了！${homeName} VS ${awayName} 真的拉扯`;
    const lines = [hook];
    if (m.mvp) lines.push(`MVP：${m.mvp} 🔥`);
    if (goals.length) lines.push(`关键球：${goals.map(g => g.player).slice(0,3).join(' / ')}`);
    lines.push('');
    lines.push('#县城足球 #基层联赛 #' + (home?.region || '县城') + ' #' + homeName + ' #' + awayName);
    sponsorLines.forEach(l => lines.push(l));
    return lines.join('\n');
  }

  if (tpl === 'wechat') {
    const tone = winner ? `${winner.name} 赢了！` : `平了。`;
    const lines = [
      `今晚${m.venue || '县城球场'}，${homeName} ${hs}-${as} ${awayName}，${tone}`,
      m.mvp ? `MVP ${m.mvp} 表现拉满。` : '',
      m.notes ? m.notes : '',
      '现场氛围拉满，下一场继续来 🔥',
    ].filter(Boolean);
    sponsorLines.forEach(l => lines.push(l));
    return lines.join('\n');
  }

  if (tpl === 'article') {
    const lines = [];
    lines.push(`# ${homeName} ${hs}-${as} ${awayName} | ${m.round || sport.label + '战报'}`);
    lines.push('');
    lines.push(`${fmtDT(m.datetime)}，${m.venue || '县城球场'}迎来一场${sport.label}对决。${homeName}对阵${awayName}，最终${winner ? winner.name + '以 ' + Math.max(hs,as) + '-' + Math.min(hs,as) + ' 获胜' : '双方 ' + hs + '-' + as + ' 战平'}。`);
    if (goals.length) {
      lines.push('');
      lines.push('**进球时刻**');
      goals.forEach(g => lines.push(`- 第 ${g.minute || '?'} 分钟，${g.player}破门（${teamName(g.team === 'home' ? m.homeId : m.awayId)}）`));
    }
    if (m.mvp) { lines.push(''); lines.push(`**最佳球员**：${m.mvp}`); }
    if (m.notes) { lines.push(''); lines.push('**赛后复盘**'); lines.push(m.notes); }
    lines.push('');
    lines.push('下场比赛见。');
    sponsorLines.forEach(l => lines.push(l));
    return lines.join('\n');
  }
  return '';
}

/* ===== Shoot list ===== */
const SHOT_TEMPLATES = {
  football: {
    pre:   ['场地空镜 + 比分牌', '入场镜头 / 列队握手', '队员热身（颠球、传切）', '教练赛前布置', '看台球迷与横幅', '队长入场特写'],
    live:  ['开球瞬间（多机位）', '每个进球 + 庆祝', '关键扑救 / 解围', '黄红牌 + 球员表情', '替补登场拥抱', '替补席教练反应', '半场比分牌+全景'],
    post:  ['终场比分牌特写', '胜队庆祝 / 失利方反应', 'MVP 简短采访（30 秒）', '球员谢场 / 鞠躬', '颁奖（若有）', '球迷散场氛围'],
  },
  basketball: {
    pre:   ['场馆空镜 + 比分牌', '球员热身投篮', '教练战术板讲解', '替补席摆放', '观众入场氛围', '主力出场特写'],
    live:  ['跳球 / 开球', '每次得分（三分要单独慢动作）', '盖帽 / 抢断', '暂停席内反应', '罚球瞬间', '关键犯规吹罚', '节末比分牌'],
    post:  ['终场比分牌', '胜方庆祝（拥抱、击掌）', 'MVP 30 秒采访', '球员谢场', '颁奖（若有）', '球迷出场镜头'],
  },
};

renderers.shootlist = function() {
  const panel = document.getElementById('tab-shootlist');
  clear(panel);
  panel.appendChild(el('div', { class: 'section-head' },
    el('h2', null, '拍摄清单'),
    el('button', { class: 'btn sm ghost', onClick: () => { shootState = {}; saveShoot(); renderers.shootlist(); toast('已重置'); } }, '重置'),
  ));

  const today = new Date();
  const todayMatches = sortMatches(state.matches.filter(m => isSameDay(m.datetime, today)));
  const pool = todayMatches.length ? todayMatches : state.matches.filter(m => m.status !== 'finished').slice(0, 3);

  if (pool.length === 0) {
    panel.appendChild(el('div', { class: 'empty' }, el('p', null, '没有待拍比赛')));
    return;
  }

  pool.forEach(m => {
    panel.appendChild(el('div', { class: 'section-sub' },
      `${fmtDT(m.datetime)} · ${teamName(m.homeId)} VS ${teamName(m.awayId)}`));
    const tpl = SHOT_TEMPLATES[m.sport] || SHOT_TEMPLATES.football;
    const PHASES = [
      { k: 'pre',  title: '🎬 赛前', items: tpl.pre },
      { k: 'live', title: '🔥 赛中', items: tpl.live },
      { k: 'post', title: '🏁 赛后', items: tpl.post },
    ];
    PHASES.forEach(phase => {
      const sec = el('div', { class: 'shoot-section' });
      sec.appendChild(el('h4', null, phase.title));
      const ul = el('ul', { class: 'shoot-list' });
      phase.items.forEach((text, idx) => {
        const key = `${m.id}|${phase.k}|${idx}`;
        const checked = !!shootState[key];
        const li = el('li', { class: checked ? 'done' : '' });
        const cb = el('input', { type: 'checkbox' });
        cb.checked = checked;
        cb.addEventListener('change', () => {
          shootState[key] = cb.checked;
          saveShoot();
          li.classList.toggle('done', cb.checked);
        });
        const label = el('label', null, text);
        label.addEventListener('click', () => { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); });
        li.appendChild(cb);
        li.appendChild(label);
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      panel.appendChild(sec);
    });
  });
};

/* ===== Data import / export ===== */
renderers.data = function() {
  const panel = document.getElementById('tab-data');
  clear(panel);
  panel.appendChild(el('div', { class: 'section-head' }, el('h2', null, '数据')));

  const stats = `${state.teams.length} 支队伍 · ${state.matches.length} 场比赛 · ${state.teams.reduce((s,t)=>s+(t.players||[]).length,0)} 名球员`;

  panel.appendChild(el('div', { class: 'card' },
    el('h3', { style: 'margin:0 0 6px;font-size:15px;' }, '当前数据'),
    el('p', { class: 'muted small', style: 'margin:0;' }, stats),
    el('div', { class: 'btn-row mt-12' },
      el('button', { class: 'btn', onClick: exportJson }, '📥 导出 JSON'),
      el('button', { class: 'btn ghost', onClick: () => document.getElementById('importFile').click() }, '📤 导入 JSON'),
    ),
  ));

  panel.appendChild(el('div', { class: 'card' },
    el('h3', { style: 'margin:0 0 6px;font-size:15px;' }, '示例数据'),
    el('p', { class: 'muted small', style: 'margin:0;' }, '从 data.json 载入示例（覆盖当前数据）'),
    el('div', { class: 'btn-row mt-12' },
      el('button', { class: 'btn ghost', onClick: loadSampleData }, '载入示例'),
    ),
  ));

  panel.appendChild(el('div', { class: 'card' },
    el('h3', { style: 'margin:0 0 6px;font-size:15px;color:var(--danger);' }, '危险区'),
    el('p', { class: 'muted small', style: 'margin:0;' }, '清空所有比赛、队伍、球员、看点'),
    el('div', { class: 'btn-row mt-12' },
      el('button', { class: 'btn danger', onClick: () => {
        if (!confirmDel('确定清空全部数据？')) return;
        state = emptyState();
        shootState = {};
        save(); saveShoot();
        renderAll();
        toast('已清空');
      } }, '清空全部'),
    ),
  ));
};

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().slice(0, 10);
  a.download = `县城赛事_${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      state = normalizeState(data);
      save();
      renderAll();
      toast('已导入');
    } catch (err) {
      toast('导入失败：JSON 格式错误');
    }
  };
  reader.readAsText(file);
}

function loadSampleData() {
  fetch('data.json')
    .then(r => r.json())
    .then(data => {
      state = normalizeState(data);
      save();
      renderAll();
      toast('已载入示例');
    })
    .catch(() => toast('载入失败：请确认 data.json 与本页同目录，并通过 http 服务打开'));
}

/* ===== Boot ===== */
function bindEvents() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
  window.addEventListener('hashchange', () => {
    const name = location.hash.slice(1);
    if (TABS.includes(name)) activateTab(name);
  });
  document.getElementById('quickAddBtn').addEventListener('click', openQuickAdd);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
  document.getElementById('importFile').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importJson(f);
    e.target.value = '';
  });
}

function boot() {
  bindEvents();
  const initial = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'today';
  activateTab(initial);
  renderAll();
  // Always fetch remote data.json and compare versions.
  // If remote has a newer dataVersion (or local has no data), replace state.
  fetch('data.json?ts=' + Date.now())
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (!data) return;
      const remoteVersion = data.dataVersion || 0;
      const localVersion = state.dataVersion || 0;
      const noLocalData = state.teams.length === 0 && state.matches.length === 0;
      if (noLocalData || remoteVersion > localVersion) {
        state = normalizeState(data);
        save();
        renderAll();
        if (!noLocalData && data.updatedAt) {
          toast('已同步最新数据：' + data.updatedAt);
        } else if (noLocalData) {
          toast('已载入赛程数据');
        }
      }
    })
    .catch(() => {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
