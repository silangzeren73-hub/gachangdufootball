/* ============================================
   县城赛事工作台 · 本地 JSON · 手机优先
   ============================================ */

const STORAGE_KEY = 'cy-sports-workstation-v1';
const ADMIN_KEY = 'cy-sports-admin';

/* ===== Admin guard ===== */
function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === '1';
}
function initAdminMode() {
  const params = new URLSearchParams(location.search);
  if (params.has('admin')) {
    const v = params.get('admin');
    if (v === '1') localStorage.setItem(ADMIN_KEY, '1');
    else if (v === '0') localStorage.removeItem(ADMIN_KEY);
    const url = new URL(location.href);
    url.searchParams.delete('admin');
    history.replaceState(null, '', url.toString());
  }
  document.body.classList.toggle('admin-mode', isAdmin());
}
function renderAdminBadge() {
  const existing = document.getElementById('adminBadge');
  if (!isAdmin()) {
    if (existing) existing.remove();
    return;
  }
  if (existing) return;
  const badge = document.createElement('div');
  badge.id = 'adminBadge';
  badge.className = 'admin-badge';
  badge.innerHTML = '✏️ 管理员模式 · <a href="?admin=0">退出</a>';
  document.body.appendChild(badge);
}

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

let state = loadState();

/* ===== State ===== */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch (_) {}
  return emptyState();
}
function emptyState() {
  return { version: 1, teams: [], matches: [], sponsors: [] };
}
function normalizeState(s) {
  s = s || {};
  s.teams = Array.isArray(s.teams) ? s.teams : [];
  s.matches = Array.isArray(s.matches) ? s.matches : [];
  s.sponsors = Array.isArray(s.sponsors) ? s.sponsors : [];
  s.dataVersion = s.dataVersion || 0;
  s.updatedAt = s.updatedAt || '';
  return s;
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
// 主场地三语显示：中文 · 别名 · 双藏文（两种说法并列）
function formatVenueNodes(name) {
  if (!name) return [];
  if (name === '津昌体育场' || name === '津昌体育文化中心') {
    return [
      name,
      '（马草坝 · ',
      el('span', { class: 'tibetan', lang: 'bo' }, 'རྟ་རྩྭ་ཐང་།'),
      '（',
      el('span', { class: 'tibetan', lang: 'bo' }, 'སྟག་རྩར་ཐང་།'),
      '））',
    ];
  }
  return [name];
}
function formatVenueText(name) {
  if (!name) return '';
  if (name === '津昌体育场' || name === '津昌体育文化中心') {
    return name + '（马草坝 · རྟ་རྩྭ་ཐང་།（སྟག་རྩར་ཐང་།））';
  }
  return name;
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
const TABS = ['today','schedule','bracket','teams','players','standings','topscorers','discipline','reports','regulations','data'];
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
  if (!isAdmin()) return toast('需要管理员权限');
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

  const cards = countMatchCards(m);
  const cardBadges = (cards.yellow + cards.red > 0)
    ? el('div', { class: 'match-cards' },
        cards.yellow > 0 ? el('span', { class: 'card-badge yellow' }, '🟨 ' + cards.yellow) : null,
        cards.red > 0 ? el('span', { class: 'card-badge red' }, '🟥 ' + cards.red) : null,
      )
    : null;

  // 该场停赛（仅未开赛 / 进行中显示，已结束就不再预报）
  let suspendedRow = null;
  if (m.status === 'scheduled' || m.status === 'live') {
    const sus = getSuspensionsForMatch(m);
    if (sus.length > 0) {
      suspendedRow = el('div', { class: 'match-suspended' },
        el('span', { class: 'match-suspended-icon' }, '🚫'),
        el('span', { class: 'match-suspended-label' }, '该场停赛：'),
        el('span', { class: 'match-suspended-list' },
          ...sus.map((s, i) => {
            const t = getTeam(s.teamId);
            return el('span', { class: 'match-suspended-item' },
              i > 0 ? el('span', { class: 'match-suspended-sep' }, ' · ') : null,
              el('strong', null, t ? (t.shortName || t.name) : '—'),
              ' #' + (s.number || '?'),
              ' ' + (s.name || ''),
              el('span', { class: 'match-suspended-reason' }, '（' + s.reasons.join('/') + '）'),
            );
          }),
        ),
      );
    }
  }

  return el('div', { class: 'match-card' },
    el('div', { class: 'match-meta' },
      el('div', null,
        el('span', { class: 'tag ' + m.sport }, `${sport.emoji} ${sport.label}`),
        ' ',
        el('span', null, fmtDT(m.datetime)),
        ...(m.venue ? [el('span', null, ' · ', ...formatVenueNodes(m.venue))] : []),
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
    cardBadges,
    suspendedRow,
    (m.status === 'forfeit' && m.notes) ? el('div', { class: 'forfeit-note' }, '⚠ ' + m.notes) : null,
    el('div', { class: 'match-actions' },
      isAdmin() ? el('button', { class: 'btn sm', onClick: () => openScoreEntry(m.id) }, '比分') : null,
      isAdmin() ? el('button', { class: 'btn sm ghost', onClick: () => openMatchForm(m.id) }, '编辑') : null,
      el('button', { class: 'btn sm ghost', onClick: () => { activateTab('reports'); setTimeout(() => focusReport(m.id), 50); } }, '战报'),
    ),
  );
}

/* ===== Discipline helpers ===== */
function countMatchCards(m) {
  const events = Array.isArray(m.events) ? m.events : [];
  let yellow = 0, red = 0;
  events.forEach(e => {
    if (e.type === 'yellow') yellow++;
    else if (e.type === 'red') red++;
  });
  return { yellow, red };
}

function teamCardStats(teamId) {
  let yellow = 0, red = 0;
  state.matches.forEach(m => {
    if (m.status !== 'finished' && m.status !== 'forfeit') return;
    const events = Array.isArray(m.events) ? m.events : [];
    events.forEach(e => {
      const side = e.team === 'home' ? m.homeId : (e.team === 'away' ? m.awayId : null);
      if (side !== teamId) return;
      if (e.type === 'yellow') yellow++;
      else if (e.type === 'red') red++;
    });
  });
  return { yellow, red };
}

// Returns array of suspensions for next-match display:
// [{ teamId, name, number, reasons: ['累计 2 黄', '红牌'] }]
function computeUpcomingSuspensions() {
  // Walk all FINISHED matches in chronological order
  const finished = state.matches
    .filter(m => m.status === 'finished' || m.status === 'forfeit')
    .slice()
    .sort((a, b) => (a.datetime || '').localeCompare(b.datetime || ''));

  // For each team, the count of finished matches played (used as "match index")
  const teamMatchCount = {};
  // playerKey -> { teamId, name, number, yellows: number, suspendedUntilTeamIdx: number, reasonStack: [] }
  const tracker = {};

  finished.forEach(m => {
    teamMatchCount[m.homeId] = (teamMatchCount[m.homeId] || 0) + 1;
    teamMatchCount[m.awayId] = (teamMatchCount[m.awayId] || 0) + 1;

    const events = Array.isArray(m.events) ? m.events : [];
    // First pass: group cards by player within this match
    const perPlayer = {};
    events.forEach(e => {
      if (e.type !== 'yellow' && e.type !== 'red') return;
      const teamId = e.team === 'home' ? m.homeId : (e.team === 'away' ? m.awayId : null);
      if (!teamId) return;
      const number = String(e.playerNumber || e.number || '').trim();
      const name = (e.playerName || e.player || '').trim();
      if (!name && !number) return;
      const key = teamId + '|' + number + '|' + name;
      if (!perPlayer[key]) perPlayer[key] = { teamId, name, number, yellows: 0, reds: 0 };
      if (e.type === 'yellow') perPlayer[key].yellows++;
      else perPlayer[key].reds++;
    });

    Object.entries(perPlayer).forEach(([key, info]) => {
      if (!tracker[key]) tracker[key] = {
        teamId: info.teamId, name: info.name, number: info.number,
        yellows: 0, suspendNext: false, reasons: [],
      };
      const t = tracker[key];

      // Rule 6: 1+1 yellow in same match = red, those 2 yellows don't count
      if (info.yellows >= 2 && info.reds === 0) {
        t.suspendNext = true;
        t.reasons = ['同场 2 黄变红'];
        // yellows don't accumulate
      } else if (info.reds > 0) {
        // Direct red (or red after a single yellow in same match)
        t.suspendNext = true;
        t.reasons = ['红牌'];
        if (info.yellows > 0) {
          // Rule 4: single yellow before red — that yellow accumulates
          t.yellows += info.yellows;
          if (t.yellows >= 2) t.reasons.push('累计 2 黄');
        }
      } else if (info.yellows > 0) {
        // Just yellows this match
        t.yellows += info.yellows;
        if (t.yellows >= 2) {
          t.suspendNext = true;
          t.reasons = ['累计 2 黄'];
        }
      }
    });
  });

  // For each tracked player who is "suspendNext", they serve in their team's NEXT match
  // A simpler approach: just list players whose suspendNext === true and haven't yet served
  // To "serve" the suspension, we'd need to track which match they sat out — but we don't have lineup data
  // So we show all currently suspended players; the user can clear via data updates if needed
  const list = [];
  Object.values(tracker).forEach(t => {
    if (t.suspendNext) {
      list.push({
        teamId: t.teamId, name: t.name, number: t.number,
        reasons: t.reasons.length ? t.reasons : ['处罚'],
        yellows: t.yellows,
      });
    }
  });
  return list;
}

// 单场停赛预报：返回这场比赛主客两队应缺席的球员
// 模型：按时序回放每队此前所有完赛 → 红牌 / 累计 2 黄 → 下一场停赛；停赛在「下一场」服完自动清零
function getSuspensionsForMatch(targetMatch) {
  if (!targetMatch) return [];
  const targetDt = targetMatch.datetime || '';
  const teamIds = [targetMatch.homeId, targetMatch.awayId].filter(Boolean);
  const result = [];

  teamIds.forEach(teamId => {
    const priors = state.matches
      .filter(m => (m.status === 'finished' || m.status === 'forfeit')
                && m.id !== targetMatch.id
                && (m.homeId === teamId || m.awayId === teamId)
                && (m.datetime || '').localeCompare(targetDt) < 0)
      .slice()
      .sort((a, b) => (a.datetime || '').localeCompare(b.datetime || ''));

    const tracker = {};
    priors.forEach(m => {
      Object.values(tracker).forEach(t => {
        if (t.pending) { t.pending = false; t.reasons = []; }
      });
      const perPlayer = {};
      (Array.isArray(m.events) ? m.events : []).forEach(e => {
        if (e.type !== 'yellow' && e.type !== 'red') return;
        const eTeam = e.team === 'home' ? m.homeId : (e.team === 'away' ? m.awayId : null);
        if (eTeam !== teamId) return;
        const num = String(e.playerNumber || e.number || '').trim();
        const nm = (e.playerName || e.player || '').trim();
        if (!nm && !num) return;
        const k = num + '|' + nm;
        if (!perPlayer[k]) perPlayer[k] = { name: nm, number: num, y: 0, r: 0 };
        if (e.type === 'yellow') perPlayer[k].y++;
        else perPlayer[k].r++;
      });
      Object.entries(perPlayer).forEach(([k, info]) => {
        if (!tracker[k]) tracker[k] = { name: info.name, number: info.number, yellows: 0, pending: false, reasons: [] };
        const t = tracker[k];
        if (info.y >= 2 && info.r === 0) {
          t.pending = true; t.reasons = ['同场 2 黄变红'];
        } else if (info.r > 0) {
          t.pending = true; t.reasons = ['红牌'];
          if (info.y > 0) {
            t.yellows += info.y;
            if (t.yellows >= 2) { t.reasons.push('累计 2 黄'); t.yellows = 0; }
          }
        } else if (info.y > 0) {
          t.yellows += info.y;
          if (t.yellows >= 2) { t.pending = true; t.reasons = ['累计 2 黄']; t.yellows = 0; }
        }
      });
    });
    Object.values(tracker).forEach(t => {
      if (t.pending) result.push({ teamId, name: t.name, number: t.number, reasons: t.reasons.slice() });
    });
  });
  return result;
}

// 全员牌库：每名拿过牌的球员的累计 + 当前停赛状态
// 状态计算：按该球员所在队伍的完赛比赛时序回放，停赛在下一场服完自动清零
function fullCardLedger() {
  // Pass 1: 收集所有拿过牌的球员（totalYellow / totalRed）
  const players = {};
  state.matches.forEach(m => {
    if (m.status !== 'finished' && m.status !== 'forfeit') return;
    (Array.isArray(m.events) ? m.events : []).forEach(e => {
      if (e.type !== 'yellow' && e.type !== 'red') return;
      const teamId = e.team === 'home' ? m.homeId : (e.team === 'away' ? m.awayId : null);
      if (!teamId) return;
      const num = String(e.playerNumber || e.number || '').trim();
      const nm = (e.playerName || e.player || '').trim();
      if (!nm && !num) return;
      const key = teamId + '|' + num + '|' + nm;
      if (!players[key]) players[key] = { teamId, name: nm, number: num, yellows: 0, reds: 0 };
      if (e.type === 'yellow') players[key].yellows++;
      else players[key].reds++;
    });
  });

  // Pass 2: 对每名球员按队伍时序回放，得出当前 pending 状态
  Object.values(players).forEach(p => {
    const teamPriors = state.matches
      .filter(m => (m.status === 'finished' || m.status === 'forfeit')
                && (m.homeId === p.teamId || m.awayId === p.teamId))
      .slice()
      .sort((a, b) => (a.datetime || '').localeCompare(b.datetime || ''));

    let accY = 0, pending = false, reasons = [];
    teamPriors.forEach(m => {
      if (pending) { pending = false; reasons = []; }
      let y = 0, r = 0;
      (Array.isArray(m.events) ? m.events : []).forEach(e => {
        if (e.type !== 'yellow' && e.type !== 'red') return;
        const eTeam = e.team === 'home' ? m.homeId : (e.team === 'away' ? m.awayId : null);
        if (eTeam !== p.teamId) return;
        const num = String(e.playerNumber || e.number || '').trim();
        const nm = (e.playerName || e.player || '').trim();
        if (num !== p.number || nm !== p.name) return;
        if (e.type === 'yellow') y++; else r++;
      });
      if (y >= 2 && r === 0) {
        pending = true; reasons = ['同场 2 黄变红'];
      } else if (r > 0) {
        pending = true; reasons = ['红牌'];
        if (y > 0) {
          accY += y;
          if (accY >= 2) { reasons.push('累计 2 黄'); accY = 0; }
        }
      } else if (y > 0) {
        accY += y;
        if (accY >= 2) { pending = true; reasons = ['累计 2 黄']; accY = 0; }
      }
    });
    p.accYellow = accY;
    p.status = pending ? '待停下场' : '—';
    p.reasons = pending ? reasons : [];
  });

  return Object.values(players);
}

// Returns daily breakdown of cards: [{ date, items: [{teamId, name, number, type}] }]
function dailyDisciplineBreakdown() {
  const byDate = {};
  state.matches.forEach(m => {
    if (m.status !== 'finished' && m.status !== 'forfeit') return;
    const events = Array.isArray(m.events) ? m.events : [];
    if (!events.length) return;
    const date = (m.datetime || '').slice(0, 10);
    if (!byDate[date]) byDate[date] = [];
    events.forEach(e => {
      if (e.type !== 'yellow' && e.type !== 'red') return;
      const teamId = e.team === 'home' ? m.homeId : (e.team === 'away' ? m.awayId : null);
      if (!teamId) return;
      byDate[date].push({
        teamId, type: e.type,
        name: e.playerName || e.player || '',
        number: e.playerNumber || e.number || '',
        matchId: m.id,
      });
    });
  });
  return Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, items]) => ({ date, items }));
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
    if (isAdmin()) {
      panel.appendChild(el('div', { class: 'btn-row', style: 'justify-content:center;margin-top:10px;' },
        el('button', { class: 'btn', onClick: () => openMatchForm() }, '＋ 安排一场'),
      ));
    }
  } else {
    todayMatches.forEach(m => panel.appendChild(matchCard(m)));
    const strip = sponsorSectionStrip();
    if (strip) panel.appendChild(strip);
  }

  // Poster generator: show button if there's any day with finished matches recently
  const posterDate = mostRecentMatchDate();
  if (posterDate) {
    const ds = posterDate.toLocaleDateString('zh-CN');
    panel.appendChild(el('div', { class: 'card poster-cta' },
      el('div', null,
        el('div', { class: 'poster-cta-title' }, '📸 一键生成朋友圈图'),
        el('div', { class: 'poster-cta-sub' }, ds + ' 赛果 · 含队标 / 比分 / 二维码 / 阿若博巴'),
      ),
      el('button', { class: 'btn accent', onClick: () => openDailyPoster(posterDate) }, '生成'),
    ));
  }

  panel.appendChild(el('div', { class: 'section-sub' }, '快速入口'));
  panel.appendChild(el('div', { class: 'card' },
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn', onClick: () => activateTab('discipline') }, '🟨 风纪'),
      el('button', { class: 'btn ghost', onClick: () => activateTab('standings') }, '📊 积分榜'),
      el('button', { class: 'btn ghost', onClick: () => activateTab('reports') }, '📝 战报'),
      el('button', { class: 'btn ghost', onClick: () => activateTab('regulations') }, '📜 规程'),
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

  // 农特展销 · 底部滚动条带（demo 数据，后续接入 state.vendors）
  const vendorBar = renderVendorMarquee();
  if (vendorBar) panel.appendChild(vendorBar);
};

/* ===== 农特展销 marquee（demo） ===== */
const DEMO_VENDORS = [
  { icon: '🍄', name: '卡若区天圣', tagline: '高原野生菌 · 牦牛肉干', link: '' },
  { icon: '🍯', name: '类乌齐金堂农牧', tagline: '黑青稞蜂蜜 · 现榨核桃油', link: '' },
  { icon: '🧈', name: '昌都康酒业', tagline: '青稞酒 · 礼盒装预订', link: '' },
  { icon: '🌶️', name: '芒康盐井', tagline: '加加面 · 古法红盐', link: '' },
  { icon: '🐂', name: '丁青县农特馆', tagline: '虫草 · 风干牦牛肉', link: '' },
  { icon: '🍵', name: '察雅藏茶坊', tagline: '酥油茶包 · 高原黑茶', link: '' },
];

function renderVendorMarquee() {
  const vendors = (Array.isArray(state.vendors) && state.vendors.length) ? state.vendors : DEMO_VENDORS;
  if (!vendors.length) return null;

  // 复制两份内容，CSS animation 平移 -50% 实现无缝循环
  const buildItems = () => vendors.map(v => {
    const inner = el('div', { class: 'vendor-card-inner' },
      el('div', { class: 'vendor-icon' }, v.icon || '🛒'),
      el('div', { class: 'vendor-text' },
        el('div', { class: 'vendor-name' }, v.name || '展销摊位'),
        el('div', { class: 'vendor-tag' }, v.tagline || ''),
      ),
      el('span', { class: 'vendor-go' }, '查看 ›'),
    );
    if (v.link) {
      return el('a', { class: 'vendor-card', href: v.link, target: '_blank', rel: 'noopener' }, inner);
    }
    return el('button', { class: 'vendor-card', onClick: () => openVendorDetail(v) }, inner);
  });

  const wrap = el('div', { class: 'vendor-marquee' },
    el('div', { class: 'vendor-marquee-head' },
      el('span', { class: 'vendor-marquee-title' }, '🛍 农特展销 · 场边摊位'),
      el('span', { class: 'vendor-marquee-sub' }, '点击直达摊主'),
    ),
    el('div', { class: 'vendor-marquee-viewport' },
      el('div', { class: 'vendor-marquee-track' },
        ...buildItems(),
        ...buildItems(),
      ),
    ),
  );
  return wrap;
}

function openVendorDetail(v) {
  // demo：暂用 alert 占位；正式版可改成 modal（产品图廊 + 二维码 + 复制电话）
  alert(`${v.icon || '🛒'} ${v.name}\n\n${v.tagline}\n\n（暂未配置详情链接 · 正式版会显示产品图 + 联系方式二维码）`);
}

/* ===== Schedule ===== */
renderers.schedule = function() {
  const panel = document.getElementById('tab-schedule');
  clear(panel);

  panel.appendChild(el('div', { class: 'section-head' },
    el('h2', null, '赛程'),
    isAdmin() ? el('button', { class: 'btn sm', onClick: () => openMatchForm() }, '＋ 新建') : null,
  ));

  if (state.matches.length === 0) {
    panel.appendChild(sponsorEmptyHero('还没有比赛'));
    if (isAdmin()) {
      panel.appendChild(el('div', { class: 'btn-row', style: 'justify-content:center;margin-top:10px;' },
        el('button', { class: 'btn', onClick: () => openMatchForm() }, '＋ 新建比赛'),
      ));
    }
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

/* ===== Bracket (淘汰赛对战图) ===== */
const BRACKET_STAGES = [
  { key: 'qf',    label: '八强',   match: /^八强/ },
  { key: 'sf',    label: '半决赛', match: /^半决赛/ },
  { key: 'thirty', label: '3-4 名', match: /^3-4名/ },
  { key: 'final', label: '冠亚军', match: /^冠亚军/ },
];
function findKnockoutMatches() {
  const out = { qf: [], sf: [], thirty: [], final: [] };
  state.matches.forEach(m => {
    const r = m.round || '';
    for (const st of BRACKET_STAGES) {
      if (st.match.test(r)) { out[st.key].push(m); break; }
    }
  });
  Object.keys(out).forEach(k => out[k] = sortMatches(out[k]));
  return out;
}
function isStageLocked(matches) {
  // 当所有比赛的双方都还是 t-tba（待定）时，认为该阶段未解锁
  if (!matches || !matches.length) return false;
  return matches.every(m =>
    (!m.homeId || m.homeId === 't-tba') && (!m.awayId || m.awayId === 't-tba')
  );
}
function isStageAllFinished(matches) {
  if (!matches || !matches.length) return false;
  return matches.every(m => m.status === 'finished' || m.status === 'forfeit');
}
function bracketStageStatus(stageKey, k) {
  // 返回 { state: 'locked'|'live'|'done', hint: '...' }
  const matches = k[stageKey] || [];
  if (matches.length === 0) return { state: 'pending', hint: '尚未安排' };
  if (isStageLocked(matches)) {
    if (stageKey === 'qf') return { state: 'locked', hint: '小组赛全部结束后揭晓' };
    if (stageKey === 'sf') return { state: 'locked', hint: '八强战结束后揭晓' };
    if (stageKey === 'final' || stageKey === 'thirty') return { state: 'locked', hint: '半决赛结束后揭晓' };
    return { state: 'locked', hint: '待解锁' };
  }
  if (isStageAllFinished(matches)) return { state: 'done', hint: '已完成' };
  return { state: 'live', hint: '已解锁' };
}
function bracketColLabel(text, opts) {
  opts = opts || {};
  const cls = 'bracket-col-label'
    + (opts.modifier ? ' ' + opts.modifier : '')
    + (opts.state === 'locked' ? ' locked' : '')
    + (opts.state === 'done' ? ' done' : '')
    + (opts.state === 'live' ? ' live' : '');
  return el('div', { class: cls },
    el('div', { class: 'bracket-col-label-row' },
      opts.state === 'locked' ? el('span', { class: 'bracket-lock' }, '🔒') : null,
      opts.state === 'live' ? el('span', { class: 'bracket-dot' }) : null,
      opts.state === 'done' ? el('span', { class: 'bracket-check' }, '✓') : null,
      el('span', { class: 'bracket-col-label-text' }, text),
    ),
    opts.hint ? el('div', { class: 'bracket-unlock-hint' }, opts.hint) : null,
  );
}
function parseRoundHint(round) {
  // 八强 · A1 vs C2  → ['A1', 'C2']
  // 半决赛 · 26胜 vs 28胜  → ['26胜', '28胜']
  // 3-4名 · 30负 vs 31负  → ['30负', '31负']
  // 冠亚军 · 30胜 vs 31胜  → ['30胜', '31胜']
  const m = (round || '').match(/·\s*(.+?)\s+vs\s+(.+?)\s*$/);
  if (!m) return ['?', '?'];
  return [m[1].trim(), m[2].trim()];
}
function bracketTeamLabel(m, side) {
  // 已经确定的队伍直接显示队名；否则用 round 字段里的位次（如 A1 / 26胜）
  const id = side === 'home' ? m.homeId : m.awayId;
  const t = getTeam(id);
  if (t && t.id !== 't-tba') return t.name;
  const [h, a] = parseRoundHint(m.round);
  const hint = side === 'home' ? h : a;
  // 把 "26胜" 转成 "第 26 场胜者" 之类更易读的描述（可选）
  const nice = hint
    .replace(/^(\d+)胜$/, '$1 号胜者')
    .replace(/^(\d+)负$/, '$1 号负者');
  return nice;
}
function bracketCard(m, opts) {
  opts = opts || {};
  const home = getTeam(m.homeId), away = getTeam(m.awayId);
  const hs = m.homeScore || 0, as = m.awayScore || 0;
  const hasResult = m.status === 'finished' || m.status === 'forfeit';
  const homeWin = hasResult && hs > as;
  const awayWin = hasResult && as > hs;
  const dt = m.datetime ? fmtDT(m.datetime) : '';
  const locked = (!m.homeId || m.homeId === 't-tba') && (!m.awayId || m.awayId === 't-tba');
  return el('div', {
    class: 'bracket-card'
      + (opts.featured ? ' bracket-card-featured' : '')
      + (locked ? ' bracket-card-locked' : ''),
    onClick: () => { activateTab('schedule'); },
  },
    el('div', { class: 'bracket-card-head' },
      el('span', { class: 'bracket-card-tag' }, opts.tag || (m.round || '').split(' · ')[0]),
      el('span', { class: 'bracket-card-time' }, dt),
    ),
    el('div', { class: 'bracket-card-row ' + (homeWin ? 'winner' : (awayWin ? 'loser' : '')) },
      (home && home.id !== 't-tba') ? teamLogo(home, 'sm') : el('span', { class: 'bracket-card-tba' }, '?'),
      el('span', { class: 'bracket-card-name' }, bracketTeamLabel(m, 'home')),
      el('span', { class: 'bracket-card-score' }, hasResult ? String(hs) : ''),
    ),
    el('div', { class: 'bracket-card-row ' + (awayWin ? 'winner' : (homeWin ? 'loser' : '')) },
      (away && away.id !== 't-tba') ? teamLogo(away, 'sm') : el('span', { class: 'bracket-card-tba' }, '?'),
      el('span', { class: 'bracket-card-name' }, bracketTeamLabel(m, 'away')),
      el('span', { class: 'bracket-card-score' }, hasResult ? String(as) : ''),
    ),
    m.status === 'forfeit' ? el('div', { class: 'bracket-card-foot forfeit' }, '弃权 / 判负') :
      hasResult ? el('div', { class: 'bracket-card-foot' }, '已结束') :
      m.status === 'live' ? el('div', { class: 'bracket-card-foot live' }, '进行中') :
      el('div', { class: 'bracket-card-foot pending' }, '待开赛'),
  );
}

renderers.bracket = function() {
  const panel = document.getElementById('tab-bracket');
  clear(panel);
  panel.appendChild(el('div', { class: 'section-head' }, el('h2', null, '对战图')));

  const k = findKnockoutMatches();
  if (k.qf.length + k.sf.length + k.thirty.length + k.final.length === 0) {
    panel.appendChild(sponsorEmptyHero('暂无淘汰赛阶段'));
    return;
  }

  panel.appendChild(el('p', { class: 'muted small', style: 'margin:0 4px 12px;' },
    '小组赛 → 八强 → 半决赛 → 冠亚军决赛 + 3-4 名争夺。比赛结果确定后会自动填入。'
  ));

  // 各阶段当前解锁状态
  const qfStatus     = bracketStageStatus('qf', k);
  const sfStatus     = bracketStageStatus('sf', k);
  const finalStatus  = bracketStageStatus('final', k);
  const thirtyStatus = bracketStageStatus('thirty', k);

  // 顶部汇总：当前到哪个阶段
  const summary = (() => {
    if (finalStatus.state === 'done') return '🏆 比赛已全部结束';
    if (finalStatus.state === 'live' || sfStatus.state === 'done') return '🏆 决赛阶段进行中';
    if (sfStatus.state === 'live' || qfStatus.state === 'done') return '🎯 半决赛阶段';
    if (qfStatus.state === 'live') return '⚔ 八强阶段';
    return '🔒 小组赛进行中，淘汰赛对阵尚未揭晓';
  })();
  panel.appendChild(el('div', { class: 'bracket-summary' }, summary));

  // 半决赛 / 决赛预告海报（match.poster 字段存在且阶段未完成）
  const posterPreviewMatches = state.matches.filter(m =>
    m.poster && m.status !== 'finished' && /^(半决赛|3-4名|冠亚军)/.test(m.round || '')
  );
  if (posterPreviewMatches.length) {
    const sfPreview = el('div', { class: 'bracket-poster-preview card' },
      el('div', { class: 'bracket-poster-preview-title' }, '📣 阶段预告海报'),
      el('div', { class: 'bracket-poster-preview-sub' }, '点击图片可放大保存 · 长按可分享朋友圈'),
      el('div', { class: 'bracket-poster-row' },
        ...posterPreviewMatches.map(m => {
          const home = getTeam(m.homeId);
          const away = getTeam(m.awayId);
          const cap = (home && home.name ? home.shortName || home.name : '?')
            + ' VS ' + (away && away.name ? away.shortName || away.name : '?');
          const dt = m.datetime ? new Date(m.datetime) : null;
          const when = dt ? `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}` : '';
          return el('a', {
            class: 'bracket-poster-thumb',
            href: m.poster,
            target: '_blank',
            rel: 'noopener',
            download: `${m.id}-${cap}.png`,
          },
            el('img', { src: m.poster, alt: cap, loading: 'lazy', referrerpolicy: 'no-referrer' }),
            el('div', { class: 'bracket-poster-cap' },
              el('span', { class: 'bracket-poster-cap-when' }, when),
              el('span', { class: 'bracket-poster-cap-name' }, cap),
            ),
          );
        }),
      ),
    );
    panel.appendChild(sfPreview);
  }

  // ===== 树状图（diamond 布局）=====
  // 上半区: QF1 + QF3 → SF1
  // 下半区: QF2 + QF4 → SF2
  // 决赛在正中
  const qfUpper = [k.qf[0], k.qf[2]].filter(Boolean);
  const qfLower = [k.qf[1], k.qf[3]].filter(Boolean);
  const sfUp = k.sf[0];
  const sfDn = k.sf[1];
  const final = k.final[0];
  const third = k.thirty[0];

  function stageBanner(text, status) {
    if (!status) return el('div', { class: 'bracket-tree-banner' }, text);
    const cls = 'bracket-tree-banner ' + status.state;
    const children = [];
    if (status.state === 'locked') children.push(el('span', { class: 'bracket-lock' }, '🔒'));
    else if (status.state === 'live') children.push(el('span', { class: 'bracket-dot' }));
    else if (status.state === 'done') children.push(el('span', { class: 'bracket-check' }, '✓'));
    children.push(' ' + text);
    if (status.state === 'locked' && status.hint) {
      children.push(el('span', { class: 'bracket-unlock-hint inline' }, '· ' + status.hint));
    }
    return el('div', { class: cls }, ...children);
  }

  const tree = el('div', { class: 'bracket-tree' });

  // ── 上半区 ──
  if (qfUpper.length) {
    tree.appendChild(stageBanner('八强 · 上半区', qfStatus));
    tree.appendChild(el('div', { class: 'bracket-row bracket-row-2' },
      ...qfUpper.map(m => bracketCard(m, { tag: '八强', compact: true })),
    ));
    if (sfUp) tree.appendChild(el('div', { class: 'bracket-link bracket-link-down' }));
  }
  if (sfUp) {
    tree.appendChild(stageBanner('半决赛 · 上', sfStatus));
    tree.appendChild(el('div', { class: 'bracket-row bracket-row-1' },
      bracketCard(sfUp, { tag: '半决赛', compact: true }),
    ));
    if (final) tree.appendChild(el('div', { class: 'bracket-link bracket-link-straight' }));
  }
  // ── 决赛中央 ──
  if (final) {
    tree.appendChild(stageBanner('🏆 冠亚军决赛', finalStatus));
    tree.appendChild(el('div', { class: 'bracket-row bracket-row-final' },
      bracketCard(final, { tag: '决赛', featured: true }),
    ));
    if (sfDn) tree.appendChild(el('div', { class: 'bracket-link bracket-link-straight' }));
  }
  // ── 下半区 ──
  if (sfDn) {
    tree.appendChild(stageBanner('半决赛 · 下', sfStatus));
    tree.appendChild(el('div', { class: 'bracket-row bracket-row-1' },
      bracketCard(sfDn, { tag: '半决赛', compact: true }),
    ));
    if (qfLower.length) tree.appendChild(el('div', { class: 'bracket-link bracket-link-up' }));
  }
  if (qfLower.length) {
    tree.appendChild(stageBanner('八强 · 下半区', qfStatus));
    tree.appendChild(el('div', { class: 'bracket-row bracket-row-2' },
      ...qfLower.map(m => bracketCard(m, { tag: '八强', compact: true })),
    ));
  }

  panel.appendChild(tree);

  // 3-4 名（独立放在树下方）
  if (third) {
    panel.appendChild(el('div', { class: 'bracket-extra' },
      stageBanner('🥉 3-4 名争夺', thirtyStatus),
      el('div', { class: 'bracket-row bracket-row-1' },
        bracketCard(third, { tag: '3-4 名', compact: true }),
      ),
    ));
  }

  // 小组赛阶段提示
  const groupTeams = state.teams.filter(t => t.intro && /[A-D]组/.test(t.intro));
  if (groupTeams.length) {
    panel.appendChild(el('div', { class: 'section-sub' }, '小组赛 · 出线提示'));
    panel.appendChild(el('div', { class: 'card', style: 'font-size:13px;line-height:1.8;' },
      el('p', { style: 'margin:0;' },
        '小组赛阶段 ', el('strong', null, '每组前两名'), ' 晋级八强：',
      ),
      el('ul', { style: 'margin:8px 0 0;padding-left:20px;' },
        el('li', null, '八强对阵：', el('strong', null, 'A1 vs C2 / B1 vs D2 / C1 vs A2 / D1 vs B2'), '（交叉对阵）'),
        el('li', null, '具体晋级名额以「积分榜」最终排名为准'),
      ),
    ));
  }
};

function openMatchForm(matchId) {
  if (!isAdmin()) return toast('需要管理员权限');
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
  if (!isAdmin()) return toast('需要管理员权限');
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
    isAdmin() ? el('button', { class: 'btn sm', onClick: () => openTeamForm() }, '＋ 新建') : null,
  ));

  if (state.teams.length === 0) {
    panel.appendChild(el('div', { class: 'empty' },
      el('p', null, '还没有队伍'),
      isAdmin() ? el('button', { class: 'btn', onClick: () => openTeamForm() }, '＋ 新建队伍') : null,
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
        isAdmin() ? el('div', { class: 'btn-row' },
          el('button', { class: 'btn sm ghost', onClick: () => openTeamForm(t.id) }, '编辑'),
        ) : null,
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
        ...(t.players || []).map(p => el('span', { class: 'player-tag', onClick: isAdmin() ? () => openPlayerForm(p.id, t.id) : null },
          p.number ? el('span', { class: 'num' }, '#' + p.number) : null,
          p.name + (p.position ? ' · ' + p.position : '') + (p.age ? ` · ${p.age}岁` : '')
        )),
        isAdmin() ? el('span', { class: 'player-tag', style: 'color:var(--primary);font-weight:600;', onClick: () => openPlayerForm(null, t.id) }, '＋ 球员') : null,
      ),
    );
    panel.appendChild(card);
  });
};

function openTeamForm(teamId) {
  if (!isAdmin()) return toast('需要管理员权限');
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
  if (!isAdmin()) return toast('需要管理员权限');
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
    isAdmin() ? el('button', { class: 'btn sm', onClick: () => openPlayerForm() }, '＋ 新增') : null,
  ));

  const all = [];
  state.teams.forEach(t => (t.players || []).forEach(p => all.push({ player: p, team: t })));
  if (all.length === 0) {
    panel.appendChild(el('div', { class: 'empty' },
      el('p', null, '还没有球员故事'),
      isAdmin() ? el('button', { class: 'btn', onClick: () => openPlayerForm() }, '＋ 新增球员') : null,
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
          isAdmin() ? el('button', { class: 'btn sm ghost', onClick: () => openPlayerForm(p.id) }, '编辑') : null,
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
    yellow: 0, red: 0,
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
    const events = Array.isArray(m.events) ? m.events : [];
    events.forEach(e => {
      const side = e.team === 'home' ? h : (e.team === 'away' ? a : null);
      if (!side) return;
      if (e.type === 'yellow') side.yellow++;
      else if (e.type === 'red') side.red++;
    });
  });

  // 规程二十四(二)：① 相互交锋胜者前 → ② 净胜球 → ③ 总进球 → ④ 红黄牌少者前 → ⑤ 抽签
  // ① 多队同分时按 FIFA mini-league 规则：只看这些队之间的成绩 → mini-积分 → mini-净胜球 → mini-总进球
  const finishedMatches = state.matches.filter(m => (m.status === 'finished' || m.status === 'forfeit') && m.sport === sport);
  const cmpFallback = (x, y) =>
    (y.gf - y.ga) - (x.gf - x.ga) ||
    y.gf - x.gf ||
    (x.yellow + x.red * 3) - (y.yellow + y.red * 3);
  const tiebreakH2H = (group) => {
    if (group.length <= 1) return group;
    const ids = new Set(group.map(r => r.team.id));
    const mini = {};
    group.forEach(r => mini[r.team.id] = { points: 0, gf: 0, ga: 0 });
    finishedMatches.forEach(m => {
      if (!ids.has(m.homeId) || !ids.has(m.awayId)) return;
      const hs = m.homeScore || 0, as = m.awayScore || 0;
      mini[m.homeId].gf += hs; mini[m.homeId].ga += as;
      mini[m.awayId].gf += as; mini[m.awayId].ga += hs;
      if (hs > as) mini[m.homeId].points += SPORTS[sport].win;
      else if (hs < as) mini[m.awayId].points += SPORTS[sport].win;
      else { mini[m.homeId].points += SPORTS[sport].draw; mini[m.awayId].points += SPORTS[sport].draw; }
    });
    return group.slice().sort((x, y) => {
      const mx = mini[x.team.id], my = mini[y.team.id];
      return (my.points - mx.points)
          || ((my.gf - my.ga) - (mx.gf - mx.ga))
          || (my.gf - mx.gf)
          || cmpFallback(x, y);
    });
  };
  rows.sort((x, y) => y.points - x.points);
  const sorted = [];
  let i0 = 0;
  while (i0 < rows.length) {
    let j0 = i0;
    while (j0 < rows.length && rows[j0].points === rows[i0].points) j0++;
    if (j0 - i0 === 1) sorted.push(rows[i0]);
    else sorted.push(...tiebreakH2H(rows.slice(i0, j0)));
    i0 = j0;
  }
  rows.length = 0;
  rows.push(...sorted);

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
      isBasket ? null : el('th', { title: '黄牌' }, '🟨'),
      isBasket ? null : el('th', { title: '红牌' }, '🟥'),
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
        isBasket ? null : el('td', { class: 'muted' }, String(r.yellow)),
        isBasket ? null : el('td', { class: 'muted' }, String(r.red)),
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

/* ===== Discipline (风纪) ===== */
renderers.discipline = function() {
  const panel = document.getElementById('tab-discipline');
  clear(panel);
  panel.appendChild(el('div', { class: 'section-head' }, el('h2', null, '赛场风纪')));

  // 1) Upcoming suspensions banner
  const suspended = computeUpcomingSuspensions();
  if (suspended.length > 0) {
    const banner = el('div', { class: 'discipline-banner' });
    banner.appendChild(el('div', { class: 'discipline-banner-title' }, '⚠ 下场停赛'));
    const ul = el('ul', { class: 'discipline-banner-list' });
    suspended.forEach(s => {
      const t = getTeam(s.teamId);
      ul.appendChild(el('li', null,
        el('strong', null, t ? (t.shortName || t.name) : '—'),
        ' #', s.number || '?', ' ',
        el('span', null, s.name || '（未登记球员）'),
        el('span', { class: 'discipline-reason' }, ' · ' + s.reasons.join(' / ')),
      ));
    });
    banner.appendChild(ul);
    panel.appendChild(banner);
  }

  // 2) Per-team accumulated cards
  const teams = state.teams.filter(t => (t.sport || 'football') === 'football' && t.id !== 't-tba');
  const teamStats = teams.map(t => ({ team: t, ...teamCardStats(t.id) }));
  teamStats.sort((a, b) => (b.red * 3 + b.yellow) - (a.red * 3 + a.yellow));

  panel.appendChild(el('div', { class: 'section-sub' }, '本届累计 · 按各队红黄牌数'));
  const tbody = el('tbody', null,
    ...teamStats.map((s, i) => el('tr', null,
      el('td', null, String(i + 1)),
      el('td', { class: 'team-name' }, teamLine(s.team)),
      el('td', null, String(s.yellow)),
      el('td', null, String(s.red)),
      el('td', null, el('strong', null, String(s.yellow + s.red))),
    )),
  );
  panel.appendChild(el('div', { class: 'standings-wrap' },
    el('table', { class: 'standings-table' },
      el('thead', null, el('tr', null,
        el('th', null, '#'),
        el('th', null, '队伍'),
        el('th', null, '🟨'),
        el('th', null, '🟥'),
        el('th', null, '合计'),
      )),
      tbody,
    ),
  ));

  // 3) 全员牌库（可按队筛选）
  const ledger = fullCardLedger();
  if (ledger.length > 0) {
    panel.appendChild(el('div', { class: 'section-sub' }, '全员牌库 · 每位球员累计'));

    const teamIdsWithCards = Array.from(new Set(ledger.map(r => r.teamId)));
    const teamOptions = teamIdsWithCards
      .map(id => ({ id, team: getTeam(id) }))
      .sort((a, b) => (a.team?.name || '').localeCompare(b.team?.name || '', 'zh'));

    const filterWrap = el('div', { class: 'cardledger-filter' });
    const select = el('select', { class: 'cardledger-select' });
    select.appendChild(el('option', { value: '__all' }, '全部队伍'));
    teamOptions.forEach(({ id, team }) => {
      select.appendChild(el('option', { value: id }, team ? (team.shortName || team.name) : id));
    });
    filterWrap.appendChild(el('span', { class: 'cardledger-filter-label' }, '筛选：'));
    filterWrap.appendChild(select);
    panel.appendChild(filterWrap);

    const tableWrap = el('div', { class: 'standings-wrap cardledger-wrap' });
    const renderTable = (filterTeamId) => {
      clear(tableWrap);
      const rows = ledger
        .filter(r => filterTeamId === '__all' ? true : r.teamId === filterTeamId)
        .sort((a, b) => {
          // 按队伍 → 状态优先 → 号码
          const teamA = (getTeam(a.teamId)?.name) || '';
          const teamB = (getTeam(b.teamId)?.name) || '';
          if (teamA !== teamB) return teamA.localeCompare(teamB, 'zh');
          if (a.status !== b.status) return a.status === '待停下场' ? -1 : 1;
          return (parseInt(a.number) || 999) - (parseInt(b.number) || 999);
        });

      if (rows.length === 0) {
        tableWrap.appendChild(el('div', { class: 'empty' }, el('p', null, '没有匹配的球员')));
        return;
      }

      const tbody = el('tbody', null,
        ...rows.map(r => {
          const team = getTeam(r.teamId);
          return el('tr', { class: r.status === '待停下场' ? 'cardledger-pending' : '' },
            el('td', { class: 'team-name' }, team ? (team.shortName || team.name) : r.teamId),
            el('td', null, '#' + (r.number || '?')),
            el('td', null, r.name || '—'),
            el('td', null, r.yellows > 0 ? el('span', { class: 'cardledger-y' }, String(r.yellows)) : '—'),
            el('td', null, r.reds > 0 ? el('span', { class: 'cardledger-r' }, String(r.reds)) : '—'),
            el('td', null,
              r.status === '待停下场'
                ? el('span', { class: 'cardledger-status-pending' }, '🚫 待停下场', r.reasons.length ? el('small', null, ' · ' + r.reasons.join('/')) : null)
                : el('span', { class: 'cardledger-status-ok' }, '—'),
            ),
          );
        }),
      );
      tableWrap.appendChild(el('table', { class: 'standings-table cardledger-table' },
        el('thead', null, el('tr', null,
          el('th', null, '队伍'),
          el('th', null, '#'),
          el('th', null, '球员'),
          el('th', null, '🟨'),
          el('th', null, '🟥'),
          el('th', null, '当前状态'),
        )),
        tbody,
      ));
    };
    select.addEventListener('change', () => renderTable(select.value));
    panel.appendChild(tableWrap);
    renderTable('__all');
  }

  // 4) Daily breakdown
  const daily = dailyDisciplineBreakdown();
  if (daily.length === 0) {
    panel.appendChild(el('div', { class: 'empty' }, el('p', null, '暂无红黄牌记录')));
  } else {
    panel.appendChild(el('div', { class: 'section-sub' }, '按日明细'));
    daily.forEach(({ date, items }) => {
      const card = el('div', { class: 'card discipline-day' });
      card.appendChild(el('div', { class: 'discipline-day-title' }, date));
      const grouped = {};
      items.forEach(it => {
        if (!grouped[it.teamId]) grouped[it.teamId] = [];
        grouped[it.teamId].push(it);
      });
      Object.entries(grouped).forEach(([teamId, list]) => {
        const t = getTeam(teamId);
        const row = el('div', { class: 'discipline-row' });
        row.appendChild(el('div', { class: 'discipline-team' }, t ? (t.shortName || t.name) : teamId));
        const tags = el('div', { class: 'discipline-tags' });
        list.forEach(it => {
          tags.appendChild(el('span', { class: 'discipline-tag ' + it.type },
            it.type === 'red' ? '🟥' : '🟨',
            ' #' + (it.number || '?'),
            ' ' + (it.name || ''),
          ));
        });
        row.appendChild(tags);
        card.appendChild(row);
      });
      panel.appendChild(card);
    });
  }

  // Footer: rule note
  panel.appendChild(el('div', { class: 'rule-note' },
    '📜 规程：红牌或累计 2 黄 = 自动停下场；同场 1 黄+1 红 = 黄需累计；同场 1+1 黄变红 = 按红计、2 黄不累计；小组赛黄牌带入下一阶段。',
  ));
};

/* ===== Regulations (规程) ===== */
const REGULATION_CARDS = [
  {
    title: '⚽ 比赛规则',
    items: [
      '全场 90 分钟（上下半场各 45 分钟），中场休息 ≤ 15 分钟',
      '每队上场 11 人，1 名必须为守门员；替补名单最多 7 人',
      '常规时间可换人 5 次，被换下不得再次上场',
      '场上不足 7 人 → 自然中止，判对方 3:0 胜（实际比分超过 3:0 以实际为准）',
      '比赛用球：5 号足球；场地：人工草',
    ],
  },
  {
    title: '🟨🟥 红黄牌',
    items: [
      '红牌 = 自然停下场（纪委会可追加处罚）',
      '同场累计 2 黄 = 自然停下场',
      '同一阶段两场累计 2 黄 = 自动停下场',
      '同场 1 黄后吃红 = 停下场，先前黄牌仍累计',
      '同场 1+1 黄变红 = 按红计，2 黄不累计',
      '小组赛黄牌带入淘汰赛阶段累计',
    ],
  },
  {
    title: '📊 积分排名',
    items: [
      '胜 = 3 分，平 = 1 分，负 = 0 分',
      '同分排序顺序：',
      '①相互交锋胜者前',
      '②净胜球多者前',
      '③总进球多者前',
      '④红黄牌少者前',
      '⑤抽签',
    ],
  },
  {
    title: '👤 参赛资格',
    items: [
      '本地户籍 / 长期居住 / 本地就职 1 年以上',
      '出生年限：1986-01-01 至 2008-01-01',
      '专业及退役运动员不允许参赛',
      '每名运动员只能代表 1 支队伍参赛',
      '弄虚作假 → 取消全队资格 + 成绩',
    ],
  },
  {
    title: '🏆 奖项',
    items: [
      '前三名：奖金 + 奖杯 + 奖牌 + 证书',
      '道德风尚奖、优秀组织奖',
      '最佳射手、最佳守门员、优秀裁判员',
      '最终奖励办法视实际参赛队数另行调整',
    ],
  },
  {
    title: '👕 服装号码',
    items: [
      '深、浅 2 套统一颜色比赛服 + 护袜',
      '号码范围 1-99，1 号必须为守门员',
      '背号高 25-35cm，胸前/裤腿小号 10-15cm',
      '胸前号码上方需印代表单位简称（如"昌都"）',
      '禁止金属底/钢钉皮面鞋，必须戴护腿板',
      '队长袖标宽 6cm，颜色与上衣明显有别',
    ],
  },
  {
    title: '📅 关键日程',
    items: [
      '比赛场地：津昌体育场（马草坝 · རྟ་རྩྭ་ཐང་།）',
      '报名截止：2026-05-10 17:00',
      '报到：2026-05-29 至 30（昌都市教育局社会体育部）',
      '赛前联席会：2026-05-31 10:00（教育局综合楼 101）',
      '主办：中共昌都市委员会 · 昌都市人民政府',
      '承办：昌都市教育局（昌都市体育局）',
    ],
  },
  {
    title: '⚖ 申诉与处罚',
    items: [
      '申诉：赛后 2 小时内口头 + 24 小时内书面',
      '执行《中国足球协会纪律准则》',
      '弃赛/罢赛 → 全部比赛判对方 3:0',
      '兴奋剂按国家体育总局《反兴奋剂管理办法》执行',
    ],
  },
];

renderers.regulations = function() {
  const panel = document.getElementById('tab-regulations');
  clear(panel);
  panel.appendChild(el('div', { class: 'section-head' },
    el('h2', null, '竞赛规程速查'),
  ));
  panel.appendChild(el('p', { class: 'muted small', style: 'margin: -8px 0 12px;' },
    '依据《2026 年昌都市第二届全民运动会足球选拔赛竞赛规程》整理 · 11 人制男子足球',
  ));

  const grid = el('div', { class: 'reg-grid' });
  REGULATION_CARDS.forEach(card => {
    const c = el('div', { class: 'reg-card' });
    c.appendChild(el('h3', null, card.title));
    const ul = el('ul', null);
    card.items.forEach(it => ul.appendChild(el('li', null, it)));
    c.appendChild(ul);
    grid.appendChild(c);
  });
  panel.appendChild(grid);
};

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
    lines.push(`${fmtDT(m.datetime)}${m.venue ? ' · ' + formatVenueText(m.venue) : ''}`);
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
      `今晚${m.venue ? formatVenueText(m.venue) : '县城球场'}，${homeName} ${hs}-${as} ${awayName}，${tone}`,
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
    lines.push(`${fmtDT(m.datetime)}，${m.venue ? formatVenueText(m.venue) : '县城球场'}迎来一场${sport.label}对决。${homeName}对阵${awayName}，最终${winner ? winner.name + '以 ' + Math.max(hs,as) + '-' + Math.min(hs,as) + ' 获胜' : '双方 ' + hs + '-' + as + ' 战平'}。`);
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

/* ===== Daily poster (朋友圈图) ===== */
function mostRecentMatchDate() {
  const finishedDates = state.matches
    .filter(m => (m.status === 'finished' || m.status === 'forfeit') && m.datetime)
    .map(m => m.datetime.slice(0, 10));
  if (finishedDates.length === 0) return null;
  finishedDates.sort();
  const last = finishedDates[finishedDates.length - 1];
  return new Date(last + 'T12:00');
}

function buildPosterDOM(date, matches) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const wd = ['日','一','二','三','四','五','六'][date.getDay()];

  const root = el('div', { class: 'poster-root' });

  // Header: ball + tournament title (CN + subtitle + BO)
  root.appendChild(el('div', { class: 'poster-header' },
    el('div', { class: 'poster-emoji' }, '⚽'),
    el('div', { class: 'poster-title-wrap' },
      el('div', { class: 'poster-title' }, '昌都市第二届全民运动会'),
      el('div', { class: 'poster-subtitle' }, '暨西藏自治区第十四届运动会选拔赛'),
      el('div', { class: 'poster-title-bo tibetan', lang: 'bo' },
        'ཆབ་མདོ་སྐབས་གཉིས་པའི་དམངས་ཡོངས་ལུས་རྩལ་འགྲན་ཚོགས།'),
    ),
  ));
  root.appendChild(el('div', { class: 'poster-divider' },
    el('span', { class: 'poster-divider-diamond' }),
  ));

  // Date band
  root.appendChild(el('div', { class: 'poster-date-band' },
    el('div', { class: 'poster-date-main' },
      el('span', { class: 'poster-month' }, month + '月'),
      el('span', { class: 'poster-day' }, String(day)),
      el('span', { class: 'poster-day-label' }, '日 赛果'),
    ),
    el('div', { class: 'poster-weekday' }, '星期' + wd),
  ));

  const rounds = [...new Set(matches.map(m => m.round || '').filter(Boolean))];
  if (rounds.length) {
    root.appendChild(el('div', { class: 'poster-round-row' },
      ...rounds.map(r => el('span', { class: 'poster-round-chip' }, r)),
    ));
  }

  // Matches
  const list = el('div', { class: 'poster-matches' });
  matches.forEach(m => {
    const home = getTeam(m.homeId);
    const away = getTeam(m.awayId);
    const hs = m.homeScore || 0;
    const as = m.awayScore || 0;
    const isForfeit = m.status === 'forfeit';
    const homeWin = hs > as, awayWin = as > hs;
    const groupText = (m.round || '').split('·').pop().trim() || '';

    const homeLogo = home && home.logoImage
      ? el('img', { class: 'poster-team-logo', src: home.logoImage, referrerpolicy: 'no-referrer' })
      : el('div', { class: 'poster-team-logo placeholder' }, '⚽');
    const awayLogo = away && away.logoImage
      ? el('img', { class: 'poster-team-logo', src: away.logoImage, referrerpolicy: 'no-referrer' })
      : el('div', { class: 'poster-team-logo placeholder' }, '⚽');
    const homeBo = home && home.shortNameBo;
    const awayBo = away && away.shortNameBo;

    const row = el('div', { class: 'poster-match' },
      groupText ? el('div', { class: 'poster-group-chip' + (isForfeit ? ' forfeit' : '') },
        groupText + (isForfeit ? ' · 判负' : '')) : null,
      el('div', { class: 'poster-team home' + (homeWin ? ' win' : '') },
        homeLogo,
        el('div', { class: 'poster-team-names' },
          el('div', { class: 'poster-team-name' }, home ? (home.shortName || home.name) : '主队'),
          homeBo ? el('div', { class: 'poster-team-name-bo tibetan', lang: 'bo' }, homeBo) : null,
        ),
      ),
      el('div', { class: 'poster-score' },
        el('span', { class: 'poster-score-num' + (homeWin ? ' win' : '') }, String(hs)),
        el('span', { class: 'poster-score-sep' }, ':'),
        el('span', { class: 'poster-score-num' + (awayWin ? ' win' : '') }, String(as)),
      ),
      el('div', { class: 'poster-team away' + (awayWin ? ' win' : '') },
        el('div', { class: 'poster-team-names' },
          el('div', { class: 'poster-team-name' }, away ? (away.shortName || away.name) : '客队'),
          awayBo ? el('div', { class: 'poster-team-name-bo tibetan', lang: 'bo' }, awayBo) : null,
        ),
        awayLogo,
      ),
    );
    list.appendChild(row);
  });
  root.appendChild(list);

  // Host / organizer block (gold-outlined, prominent)
  root.appendChild(el('div', { class: 'poster-host-block' },
    el('div', { class: 'poster-host-line' }, '主办  中共昌都市委员会 · 昌都市人民政府'),
    el('div', { class: 'poster-host-line' }, '承办  昌都市教育局（昌都市体育局）'),
  ));

  // Sponsor block (brand-red, label + dashed lines + centered LOGO)
  root.appendChild(el('div', { class: 'poster-sponsor-block' },
    el('div', { class: 'poster-sponsor-label-row' },
      el('span', { class: 'poster-sponsor-dash' }),
      el('span', { class: 'poster-sponsor-label' }, '本届赛事冠名'),
      el('span', { class: 'poster-sponsor-dash' }),
    ),
    el('img', { class: 'poster-sponsor-logo', src: 'logos/sponsors/aruobaba.png', referrerpolicy: 'no-referrer' }),
  ));

  // Footer: URL + venue + QR
  const qrImg = el('img', { class: 'poster-qr', alt: 'QR' });
  root.appendChild(el('div', { class: 'poster-footer' },
    el('div', { class: 'poster-footer-text' },
      el('div', { class: 'poster-url' }, 'chamdosport.com'),
      el('div', { class: 'poster-venue' }, '津昌体育场 · 马草坝'),
      el('div', { class: 'poster-venue-bo tibetan', lang: 'bo' },
        'རྟ་རྩྭ་ཐང་།（སྟག་རྩར་ཐང་།）'),
    ),
    qrImg,
  ));

  return { root, qrImg };
}

async function openDailyPoster(date) {
  const matches = sortMatches(state.matches.filter(m =>
    isSameDay(m.datetime, date) && (m.status === 'finished' || m.status === 'forfeit')
  ));
  if (matches.length === 0) {
    return toast('当天还没有结束的比赛');
  }
  if (typeof html2canvas === 'undefined' || typeof qrcode === 'undefined') {
    return toast('海报组件加载中，稍等 2 秒再试');
  }

  toast('生成中...');

  const offscreen = document.createElement('div');
  offscreen.className = 'poster-offscreen';
  const { root, qrImg } = buildPosterDOM(date, matches);
  offscreen.appendChild(root);
  document.body.appendChild(offscreen);

  try {
    let qrDataUrl = '';
    try {
      const qr = qrcode(0, 'M');
      qr.addData('https://chamdosport.com');
      qr.make();
      qrDataUrl = qr.createDataURL(6, 4);
    } catch (e) {}
    if (qrDataUrl) qrImg.src = qrDataUrl;

    const allImgs = Array.from(root.querySelectorAll('img'));
    await Promise.all(allImgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(resolve => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, 4000);
      });
    }));

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }

    const canvas = await html2canvas(root, {
      width: 1080,
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      scale: 1.5,
      logging: false,
    });

    document.body.removeChild(offscreen);

    const dataUrl = canvas.toDataURL('image/png');
    showPosterModal(dataUrl, date);
  } catch (e) {
    if (offscreen.parentNode) document.body.removeChild(offscreen);
    toast('海报生成失败：' + (e && e.message || e));
  }
}

function showPosterModal(dataUrl, date) {
  const ds = date.toISOString().slice(0, 10);
  const img = el('img', { src: dataUrl, class: 'poster-preview-img' });
  const body = el('div', { class: 'poster-modal-body' },
    el('div', { class: 'poster-hint' }, '👆 长按图片即可保存到相册 · 或点下方按钮下载'),
    img,
    el('div', { class: 'btn-row', style: 'margin-top: 14px; flex-direction: column; gap: 8px;' },
      el('a', { class: 'btn block', href: dataUrl, download: `昌都足球-${ds}-赛果.png` }, '📥 下载 PNG'),
      el('button', { class: 'btn block ghost', onClick: closeModal }, '关闭'),
    ),
  );
  openModal('今日朋友圈图', body);
}

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
    el('p', { class: 'muted small', style: 'margin:0;' }, '清空所有比赛、队伍、球员、风纪记录'),
    el('div', { class: 'btn-row mt-12' },
      el('button', { class: 'btn danger', onClick: () => {
        if (!confirmDel('确定清空全部数据？')) return;
        state = emptyState();
        save();
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
  initAdminMode();
  renderAdminBadge();
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
