'use strict';
/* =========================================================
   Rocket Life — PWA ส่วนตัว (เก็บข้อมูลในเครื่อง + ไฟล์สำรอง)
   โครงไฟล์: 1-core (ข้อมูล วันที่ ไอคอน กฎ) · 2-views (หน้าจอ) · 3-sheets (แผ่นเด้ง + การกระทำ)
   ========================================================= */

const KEY = 'rocketlife.v1';
const SCHEMA = 1;

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* ---------- icons (เส้น stroke วาดเอง ไม่ใช้อิโมจิ) ---------- */
const P = {
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  cal: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4',
  sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5',
  note: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5',
  stats: 'M5 20V12M12 20V5M19 20v-9',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  dots9: 'M6 6h.01M12 6h.01M18 6h.01M6 12h.01M12 12h.01M18 12h.01M6 18h.01M12 18h.01M18 18h.01',
  plus: 'M12 5v14M5 12h14',
  back: 'M19 12H5M11 6l-6 6 6 6',
  edit: 'M4 20h4L19 9l-4-4L4 16z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  check: 'M5 12l5 5 9-10',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  right: 'M9 6l6 6-6 6',
  left: 'M15 6l-6 6 6 6',
  warn: 'M12 3 2 20h20zM12 10v4M12 17v.5',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5',
  person: 'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8M4 21c0-4 4-6 8-6s8 2 8 6',
  home: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5',
  building: 'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h3a1 1 0 0 1 1 1v11M2 21h20M8 7h4M8 11h4M8 15h4',
  leave: 'M4 14a8 8 0 0 1 16 0zM12 14v6M9 20h6M12 6V4',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14M20 20l-4-4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z',
  bang: 'M12 4v10M12 19v.5',
  clock: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 8v4l3 2',
  minus: 'M6 12h12',
  hourglass: 'M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9',
  circle: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16',
  box: 'M3 5h18v4H3zM5 9v10h14V9M10 13h4',
  down: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  up: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  table: 'M4 4h16v16H4zM4 9h16M9 9v11',
  moon: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z',
  tags: 'M4 6h16M4 12h10M4 18h7',
  infographic: 'M5 20V12M10 20V8M15 20V4M20 20v-6',
  article: 'M6 3h9l4 4v14H6zM9 9h4M9 13h7M9 17h7',
  close: 'M6 6l12 12M18 6 6 18',
  login: 'M10 17l5-5-5-5M15 12H3M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5',
  logout: 'M15 17l5-5-5-5M20 12H8M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  card: 'M3 6h18v12H3zM3 10h18',
  lift: 'M5 3h14v18H5zM9 9l3-3 3 3M9 15l3 3 3-3',
  coin: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v11',
  parking: 'M4 4h16v16H4zM10 16V8h3a2.5 2.5 0 0 1 0 5h-3',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
  chat: 'M4 5h16v11H9l-5 4z',
  train: 'M5 3h14v14H5zM5 11h14M8 21l2-4M16 21l-2-4',
};
const ic = (name, size = 20, sw = 1.8, extra = '') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}><path d="${P[name] || ''}"/></svg>`;
const flower = (color, size = 12, center = null) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><g fill="${color}"><circle cx="12" cy="6" r="4.2"/><circle cx="17.7" cy="10.2" r="4.2"/><circle cx="15.5" cy="17" r="4.2"/><circle cx="8.5" cy="17" r="4.2"/><circle cx="6.3" cy="10.2" r="4.2"/></g>${center ? `<circle cx="12" cy="12" r="3" fill="${center}"/>` : ''}</svg>`;

/* ---------- ค่าคงที่ตามดีไซน์ ---------- */
const STATUS = {
  todo: { label: 'ต้องทำ', icon: 'circle', tone: 'p4' },
  doing: { label: 'กำลังทำ', icon: 'hourglass', tone: 'p2' },
  waiting: { label: 'รอข้อมูล', icon: 'clock', tone: 'p3' },
  revise: { label: 'รอแก้ไข', icon: 'edit', tone: 'p1' },
  done: { label: 'เสร็จแล้ว', icon: 'check', tone: 'p4' },
  archived: { label: 'Archive', icon: 'box', tone: 'p4' },
};
const PRIORITY = {
  1: { label: 'สำคัญ · ด่วน', icon: 'bang', cls: 'p1' },
  2: { label: 'สำคัญ · ไม่ด่วน', icon: 'star', cls: 'p2' },
  3: { label: 'ไม่สำคัญ · ด่วน', icon: 'clock', cls: 'p3' },
  4: { label: 'ไม่สำคัญ · ไม่ด่วน', icon: 'minus', cls: 'p4' },
};
const CATEGORIES = { infographic: { label: 'อินโฟกราฟิก', icon: 'infographic' }, article: { label: 'บทความ', icon: 'article' } };
const WORKTYPE = {
  office: { label: 'ออฟฟิศ', icon: 'building' },
  wfh: { label: 'WFH', icon: 'home' },
  onsite: { label: 'นอกสถานที่', icon: 'pin' },
  leave: { label: 'ลา', icon: 'leave' },
};
const LEAVE_KIND = { leave: 'ลา', off: 'หยุด', sick: 'ป่วย' };
const MOODS = [
  { label: 'แย่มาก', desc: 'วันที่หนักมาก ต้องพักให้เต็มที่', color: '#5B5B66' },
  { label: 'เหนื่อย งานหนัก', desc: 'งานเยอะ แต่ผ่านมาได้แล้ว', color: '#A1A1AA' },
  { label: 'เฉย ๆ', desc: 'วันธรรมดา ไม่มีอะไรพิเศษ', color: '#F2B84B' },
  { label: 'สบาย ๆ วันเบา ๆ', desc: 'วันเบา ๆ ได้หายใจบ้าง', color: '#F08A4B' },
  { label: 'ดีมาก', desc: 'วันที่ดีมาก ทำได้เกินคาด', color: '#C9A7F5' },
];
const TRANSIT = {
  bts: { label: 'BTS', color: '#2E9E4F' },
  mrt: { label: 'MRT', color: '#1F4FA8' },
  arl: { label: 'ARL', color: '#C8302F' },
  bus: { label: 'รถเมล์', color: '#E08A1E' },
  car: { label: 'รถ / เดิน', color: '#71717A' },
};

/* ---------- วันที่ (ภาษาไทย ปี พ.ศ.) ---------- */
const TH_DAY = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const TH_DAY_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_MON_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateOf = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => keyOf(new Date());
const addDays = (k, n) => { const d = dateOf(k); d.setDate(d.getDate() + n); return keyOf(d); };
const diffDays = (a, b) => Math.round((dateOf(b) - dateOf(a)) / 86400000);
const be = (y) => y + 543;
const fmtShort = (k) => { if (!k) return ''; const d = dateOf(k); return `${d.getDate()} ${TH_MON[d.getMonth()]}`; };
const fmtDay = (k) => { const d = dateOf(k); return `${TH_DAY[d.getDay()]} ${d.getDate()} ${TH_MON[d.getMonth()]}`; };
const fmtFull = (k) => { const d = dateOf(k); return `${TH_DAY_FULL[d.getDay()]} ${d.getDate()} ${TH_MON[d.getMonth()]} ${be(d.getFullYear())}`; };
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const hmToMin = (hm) => { if (!hm) return null; const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const minToHM = (m) => `${pad(Math.floor(m / 60))}:${pad(Math.round(m % 60))}`;
const fmtDur = (min) => `${Math.floor(min / 60)} ชม. ${Math.round(min % 60)} น.`;
const mondayOf = (k) => { const d = dateOf(k); const off = (d.getDay() + 6) % 7; d.setDate(d.getDate() - off); return keyOf(d); };

/* ---------- ที่เก็บข้อมูล (ในเครื่อง) ---------- */
const blank = () => ({
  schemaVersion: SCHEMA,
  projects: [], tasks: [], todos: [], timeLogs: [], appts: [],
  places: [], people: [], notes: [],
  settings: { theme: 'system', lastBackup: null, lastRollover: null, lastCheckinPrompt: null, todayOrder: {} },
});
let db = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const d = JSON.parse(raw);
    return { ...blank(), ...d, settings: { ...blank().settings, ...(d.settings || {}) } };
  } catch (e) { console.warn('load failed', e); return blank(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('บันทึกไม่สำเร็จ พื้นที่ในเครื่องอาจเต็ม'); }
}
const byId = (list, id) => db[list].find((x) => x.id === id);

/* ---------- กฎอัตโนมัติ (ทำตอนเปิดแอป) ---------- */
function runDailyRules() {
  const t = today();
  // งานที่ไม่เสร็จ เลื่อนมาวันนี้เอง
  db.tasks.forEach((x) => { if (!x.done && x.plannedFor && x.plannedFor < t) { x.movedFrom = x.plannedFor; x.plannedFor = t; } });
  db.todos.forEach((x) => { if (!x.done && x.date < t) { x.movedFrom = x.date; x.date = t; } });
  // โปรเจกต์ที่ log ว่าเสร็จแล้ว วันถัดไปเข้า Archive เอง
  db.projects.forEach((p) => { if (p.status === 'done' && p.doneAt && p.doneAt < t) { p.status = 'archived'; p.archivedAt = t; } });
  db.settings.lastRollover = t;
  save();
}

/* ---------- ค่าที่คำนวณสด (ไม่เก็บซ้ำ) ---------- */
const tasksOf = (pid) => db.tasks.filter((x) => x.projectId === pid).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
function progress(p) {
  const ts = tasksOf(p.id);
  if (!ts.length) return ['done', 'archived'].includes(p.status) ? 1 : 0;
  return ts.filter((x) => x.done).length / ts.length;
}
const logOf = (k) => db.timeLogs.find((x) => x.date === k);
function logMinutes(l) {
  if (!l || l.type === 'leave' || !l.in || !l.out) return 0;
  return Math.max(0, hmToMin(l.out) - hmToMin(l.in));
}
function dueSoon(dueKey) { if (!dueKey) return false; const d = diffDays(today(), dueKey); return d >= 0 && d <= 1; }
function todayItems(k = today()) {
  const tasks = db.tasks.filter((x) => x.plannedFor === k).map((x) => ({ kind: 'task', ref: x }));
  const todos = db.todos.filter((x) => x.date === k).map((x) => ({ kind: 'todo', ref: x }));
  const order = db.settings.todayOrder[k] || [];
  const all = [...tasks, ...todos];
  all.sort((a, b) => {
    const ia = order.indexOf(a.ref.id), ib = order.indexOf(b.ref.id);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
  return all;
}
function isWfhFriday(k) {
  const d = dateOf(k);
  if (d.getDay() !== 5) return false;
  const l = logOf(k);
  return !(l && (l.type === 'office' || l.type === 'onsite'));
}

/* ---------- ทั่วไป ---------- */
let toastTimer;
function toast(msg) {
  let el = $('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2200);
}
function applyTheme() {
  const t = db.settings.theme;
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}
function download(name, text, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const priChip = (n) => n ? `<span class="chip ${PRIORITY[n].cls}">${ic(PRIORITY[n].icon, 12, 2.2)}${PRIORITY[n].label}</span>` : '';
const statusChip = (s, cls = '') => `<span class="chip ${cls}" style="border:1px solid currentColor;font-weight:500">${ic(STATUS[s].icon, 12, 2)}${STATUS[s].label}</span>`;
/* =========================================================
   หน้าจอ (views) — แต่ละฟังก์ชันคืน HTML ของหน้านั้น
   ========================================================= */
const ui = { projFilter: 'all', calMonth: null, calSel: null, recTab: 'place', recQuery: '', statPeriod: 'week', archiveYear: null };

/* ---------- เมนูล่าง ---------- */
function renderTabbar(active) {
  const tab = (href, key, icon, label) => active === key
    ? `<a href="${href}" class="on" aria-current="page"><span class="pillic">${ic(icon, 22)}</span>${label}</a>`
    : `<a href="${href}">${ic(icon, 22)}${label}</a>`;
  $('#tabbar').innerHTML =
    tab('#/projects', 'projects', 'folder', 'โปรเจกต์') +
    tab('#/calendar', 'calendar', 'cal', 'ปฏิทิน') +
    `<a href="#/today" class="center" ${active === 'today' ? 'aria-current="page"' : ''} aria-label="วันนี้"><span class="ring"></span><span class="fab">${ic('sun', 28)}</span><span class="lb" style="${active === 'today' ? 'color:var(--ink);font-weight:600' : ''}">วันนี้</span></a>` +
    tab('#/records', 'records', 'note', 'บันทึก') +
    tab('#/stats', 'stats', 'stats', 'สถิติ');
}

/* ---------- วันนี้ ---------- */
function viewToday() {
  const t = today();
  const log = logOf(t);
  const phase = !log ? 'before' : (log.type === 'leave' || log.out) ? 'done' : 'working';
  const items = todayItems(t);
  const doneN = items.filter((i) => i.ref.done).length;
  const alerts = db.projects.filter((p) => !['done', 'archived'].includes(p.status) && dueSoon(p.due)).length;

  // แถบสัปดาห์
  const mon = mondayOf(t);
  const week = [...Array(7)].map((_, i) => {
    const k = addDays(mon, i); const d = dateOf(k); const l = logOf(k);
    const due = db.projects.some((p) => p.due === k && !['done', 'archived'].includes(p.status));
    const isT = k === t;
    return `<button data-act="goCalendar" data-k="${k}" class="${isT ? 'today' : ''}" aria-label="${fmtFull(k)}">
      <span class="n">${TH_DAY[d.getDay()]}</span><span class="d ${i >= 5 && !isT ? 'wk' : ''}">${d.getDate()}</span>
      <span class="dots">${l && l.mood != null ? flower(MOODS[l.mood].color, 10) : ''}${due ? '<span class="dot" style="background:var(--warn)"></span>' : ''}</span></button>`;
  }).join('');

  let status = '';
  if (phase === 'before') {
    status = `<button class="card row" data-act="openCheckin" style="border:1px dashed var(--ink-3);text-align:left;gap:12px">
      <span class="av" style="width:40px;height:40px;background:var(--purple-soft);color:var(--purple-ink)">${ic('clock', 20)}</span>
      <span style="flex:1"><b style="font-size:15px">ยังไม่ได้เช็กอิน</b><br><span class="muted">แตะเพื่อเริ่มงานวันนี้</span></span>${ic('right', 16, 2)}</button>`;
  } else if (phase === 'working') {
    status = `<div class="checkbar"><div class="row" style="gap:10px"><span class="pulse"></span><div><div style="font-weight:600">เช็กอินแล้ว · ${esc(log.in)}</div><div style="font-size:12px;color:var(--on-dark-2)">${WORKTYPE[log.type]?.label || ''}</div></div></div><button data-act="openCheckout">เช็กเอาต์</button></div>`;
  } else {
    const wkMin = weekMinutes(mondayOf(t)), lastMin = weekMinutes(addDays(mondayOf(t), -7));
    const diff = (wkMin - lastMin) / 60;
    status = `<div class="card dark hero">
      <div class="between"><span class="chip" style="background:rgba(255,255,255,.12)">${ic('check', 14, 2)}เลิกงานแล้ว</span><span style="font-size:13px;color:var(--on-dark-2)">${WORKTYPE[log.type]?.label || ''}</span></div>
      <div class="row" style="gap:24px"><div><div style="font-size:12px;color:var(--on-dark-2)">เช็กอิน</div><div style="font-size:28px;font-weight:700;line-height:1.2">${esc(log.in || '-')}</div></div><div><div style="font-size:12px;color:var(--on-dark-2)">เช็กเอาต์</div><div style="font-size:28px;font-weight:700;line-height:1.2">${esc(log.out || '-')}</div></div></div>
      ${log.type !== 'leave' ? `<div style="padding:12px 14px;border-radius:18px;background:rgba(255,255,255,.12)"><div style="font-weight:600">วันนี้อยู่${log.type === 'wfh' ? 'ทำงาน' : 'ออฟฟิศ'} ${fmtDur(logMinutes(log))}</div><div style="font-size:12px;color:var(--on-dark-2)">สัปดาห์นี้รวม ${(wkMin / 60).toFixed(1)} ชม. · ${diff >= 0 ? 'มากกว่า' : 'น้อยกว่า'}สัปดาห์ก่อน ${Math.abs(diff).toFixed(1)} ชม.</div></div>` : ''}
      <div class="grid2"><div style="padding:12px;border-radius:18px;background:var(--purple);color:#1E1E20"><div style="font-size:22px;font-weight:700">${doneN}/${items.length}</div><div style="font-size:12px">to-do ที่ปิดได้</div></div>
      <div style="padding:12px;border-radius:18px;background:rgba(255,255,255,.12)"><div style="font-size:22px;font-weight:700">${items.length - doneN}</div><div style="font-size:12px;color:var(--on-dark-2)">จะเลื่อนไปพรุ่งนี้ให้</div></div></div>
      ${log.mood != null ? `<div class="row" style="padding:8px 12px;border-radius:12px;background:rgba(201,167,245,.18);font-size:13px">${flower(MOODS[log.mood].color, 16)}<b style="color:var(--purple)">${MOODS[log.mood].label}</b>${log.note ? `<span style="color:var(--on-dark-2)">· ${esc(log.note)}</span>` : ''}</div>` : ''}
      <button class="link-btn" data-act="openCheckout" style="color:var(--purple);height:auto;text-align:left;padding:0">แก้เวลา / ความรู้สึก</button>
    </div>`;
  }

  const list = items.length ? items.map((it) => todoRow(it)).join('') : `<div class="empty">ยังไม่มี to-do วันนี้ · กด "เพิ่ม" เพื่อดึงงานย่อยจากโปรเจกต์</div>`;

  return `
  <header class="top">
    <div><div class="sub">${fmtFull(t)}</div><h1 class="h1">${phase === 'done' ? 'เก่งมาก, Blue' : 'สวัสดี, Blue'}</h1></div>
    <div class="row"><button class="icon-btn" data-act="openAlerts" aria-label="แจ้งเตือนในแอป">${ic('bell')}${alerts ? '<span class="badge-dot"></span>' : ''}</button>
    <a class="icon-btn solid" href="#/settings" aria-label="ตั้งค่า">${ic('dots9', 20, 2.6)}</a></div>
  </header>
  <div class="week">${week}</div>
  ${status}
  <div class="between"><h2 class="h2">To-do วันนี้ <span style="color:var(--purple-ink)">${doneN}/${items.length}</span></h2>
  <button class="pill-btn" data-act="openPick">${ic('plus', 16, 2)}เพิ่ม</button></div>
  <div class="stack" id="todo-list">${list}</div>`;
}
function weekMinutes(monKey) {
  let m = 0; for (let i = 0; i < 7; i++) m += logMinutes(logOf(addDays(monKey, i))); return m;
}
function todoRow({ kind, ref }) {
  const proj = kind === 'task' ? byId('projects', ref.projectId) : null;
  const pri = kind === 'task' ? (ref.priority || proj?.priority) : ref.priority;
  const due = !ref.done && (dueSoon(ref.due) || (proj && dueSoon(proj.due)));
  const tick = ref.done ? `<button class="tick on" data-act="toggleItem" data-kind="${kind}" data-id="${ref.id}" aria-label="ยกเลิกเสร็จ">${ic('check', 16, 2.6)}</button>`
    : `<button class="tick" data-act="toggleItem" data-kind="${kind}" data-id="${ref.id}" aria-label="ทำเสร็จ"></button>`;
  return `<div class="todo ${ref.done ? 'done' : ''} ${due ? 'due' : ''}" data-id="${ref.id}">
    ${tick}
    <button class="grow" data-act="editItem" data-kind="${kind}" data-id="${ref.id}">
      <span class="t">${esc(ref.title)}</span>
      <span class="meta">${priChip(pri)}<span class="muted" style="font-size:12px">${proj ? esc(proj.name) : 'to-do ลอย'}${ref.movedFrom ? ' · เลื่อนมาจาก ' + fmtShort(ref.movedFrom) : ''}</span>
      ${due ? `<span class="due-tag">${ic('warn', 12, 2.2)}ใกล้กำหนดส่ง</span>` : ''}</span>
    </button>
    <button class="grip" aria-label="ลากเพื่อจัดลำดับ" data-grip>${ic('grip', 18, 3)}</button>
  </div>`;
}

/* ---------- โปรเจกต์ ---------- */
function viewProjects() {
  const active = db.projects.filter((p) => p.status !== 'archived');
  const count = (s) => active.filter((p) => p.status === s).length;
  const stats = [
    ['all', 'ทั้งหมด', active.length, 'dots9'], ['doing', 'กำลังทำ', count('doing'), 'hourglass'], ['todo', 'ต้องทำ', count('todo'), 'circle'],
    ['waiting', 'รอข้อมูล', count('waiting'), 'clock'], ['revise', 'รอแก้ไข', count('revise'), 'edit'],
  ];
  const sg = stats.map(([k, l, n, i]) => `<button class="stat ${ui.projFilter === k ? 'on' : ''}" data-act="projFilter" data-k="${k}"><span class="ic">${ic(i, 16, 2)}</span><span><span class="num">${n}</span><br><span class="lb">${l}</span></span></button>`).join('')
    + `<a class="stat" href="#/archive" style="text-decoration:none;color:inherit"><span class="ic">${ic('box', 16, 2)}</span><span><span class="num">${db.projects.filter((p) => p.status === 'archived').length}</span><br><span class="lb">Archive</span></span></a>`;
  const list = active.filter((p) => ui.projFilter === 'all' || p.status === ui.projFilter)
    .sort((a, b) => (a.priority || 9) - (b.priority || 9) || (a.due || 'z').localeCompare(b.due || 'z'));
  const cards = list.length ? list.map(projectCard).join('') : `<div class="empty">ยังไม่มีโปรเจกต์ในหมวดนี้</div>`;
  return `
  <header class="top"><h1 class="h1">โปรเจกต์</h1>
    <div class="row"><a class="icon-btn" href="#/records" aria-label="ค้นหา">${ic('search')}</a></div></header>
  <div class="statgrid">${sg}</div>
  <button class="pill-btn" style="height:48px;justify-content:center;border-style:dashed" data-act="openProject">${ic('plus', 18, 2)}โปรเจกต์ใหม่</button>
  <div class="stack">${cards}</div>`;
}
function projectCard(p) {
  const tone = p.priority === 1 ? 'dark' : p.status === 'doing' ? 'purple' : 'grey';
  const pr = progress(p); const ts = tasksOf(p.id);
  const cats = (p.categories || []).map((c) => CATEGORIES[c]?.label).filter(Boolean).join(' · ');
  return `<a class="pcard ${tone}" href="#/project/${p.id}"><div class="in">
    <div class="row" style="flex-wrap:wrap">${statusChip(p.status)}${priChip(p.priority)}</div>
    <div class="title">${esc(p.name)}</div>
    <div class="row" style="gap:10px"><div class="bar"><i style="width:${Math.round(pr * 100)}%"></i></div><b style="font-size:12px">${Math.round(pr * 100)}%</b><span style="font-size:12px">${ts.filter((x) => x.done).length}/${ts.length}</span></div>
    <div class="between" style="font-size:12px;opacity:.85"><span>${esc(cats)}</span>${p.due ? `<span class="row" style="gap:4px">${ic('clock', 12, 2)}ส่ง ${fmtShort(p.due)}</span>` : ''}</div>
  </div></a>`;
}
function viewProject(id) {
  const p = byId('projects', id);
  if (!p) return `<div class="empty">ไม่พบโปรเจกต์นี้</div>`;
  const ts = tasksOf(id); const pr = progress(p); const t = today();
  const tasks = ts.map((x) => `<div class="todo ${x.done ? 'done' : ''}">
    ${x.done ? `<button class="tick on" data-act="toggleItem" data-kind="task" data-id="${x.id}" aria-label="ยกเลิกเสร็จ">${ic('check', 16, 2.6)}</button>` : `<button class="tick" data-act="toggleItem" data-kind="task" data-id="${x.id}" aria-label="ทำเสร็จ"></button>`}
    <button class="grow" data-act="editItem" data-kind="task" data-id="${x.id}"><span class="t">${esc(x.title)}</span>
    ${x.plannedFor === t && !x.done ? `<span class="due-tag" style="color:var(--purple-ink)">${ic('sun', 12, 2.2)}อยู่ใน to-do วันนี้</span>` : ''}</button>
    ${!x.done && x.plannedFor !== t ? `<button class="icon-btn solid" style="background:var(--purple-soft);color:var(--purple-ink)" data-act="planToday" data-id="${x.id}" aria-label="ใส่ใน to-do วันนี้">${ic('sun', 18, 2)}</button>` : '<span style="width:8px"></span>'}
  </div>`).join('');
  const linkedPlaces = db.places.filter((x) => (x.visits || []).some((v) => v.projectId === id));
  const linkedPeople = db.people.filter((x) => (x.projectIds || []).includes(id));
  const linkedNotes = db.notes.filter((x) => x.projectId === id);
  const link = (icon, label, n, sub, href) => `<a class="tile" href="${href}"><span style="color:var(--purple-ink)">${ic(icon)}</span><b style="font-size:13px">${label} ${n}</b><span class="muted" style="font-size:11px">${esc(sub)}</span></a>`;
  const cats = (p.categories || []).map((c) => CATEGORIES[c]?.label).join(' · ') || '-';
  return `
  <header class="between"><a class="icon-btn" href="#/projects" aria-label="ย้อนกลับ">${ic('back')}</a>
    <div class="row"><button class="icon-btn" data-act="openProject" data-id="${id}" aria-label="แก้ไขโปรเจกต์">${ic('edit')}</button>
    <button class="icon-btn solid" data-act="projectMenu" data-id="${id}" aria-label="เมนูเพิ่มเติม">${ic('more', 20, 3)}</button></div></header>
  <section class="card dark hero">
    <div class="row" style="flex-wrap:wrap">${statusChip(p.status)}${priChip(p.priority)}</div>
    <div style="font-size:22px;font-weight:700;line-height:1.4">${esc(p.name)}</div>
    ${p.desc ? `<div style="font-size:14px;color:var(--on-dark-2)">${esc(p.desc)}</div>` : ''}
    <div class="row" style="gap:14px"><div style="flex:1"><div class="bar" style="height:8px;background:rgba(255,255,255,.2)"><i style="width:${Math.round(pr * 100)}%;background:var(--purple)"></i></div><div style="font-size:12px;color:var(--on-dark-2);margin-top:6px">งานย่อยเสร็จ ${ts.filter((x) => x.done).length} จาก ${ts.length}</div></div><div style="font-size:28px;font-weight:700;line-height:1.2">${Math.round(pr * 100)}%</div></div>
    <div class="grid3"><div style="padding:10px;border-radius:16px;background:rgba(255,255,255,.1)"><div style="font-size:11px;color:var(--on-dark-2)">เริ่ม</div><b style="font-size:14px">${fmtShort(p.start) || '-'}</b></div>
    <div style="padding:10px;border-radius:16px;background:var(--purple);color:#1E1E20"><div style="font-size:11px">กำหนดส่ง</div><b style="font-size:14px">${fmtShort(p.due) || '-'}</b></div>
    <div style="padding:10px;border-radius:16px;background:rgba(255,255,255,.1)"><div style="font-size:11px;color:var(--on-dark-2)">หมวด</div><b style="font-size:13px">${esc(cats)}</b></div></div>
  </section>
  <div class="between"><h2 class="h2">งานย่อย <span style="color:var(--purple-ink)">${ts.filter((x) => x.done).length}/${ts.length}</span></h2></div>
  <form class="search" data-form="addTask" data-id="${id}" style="border-radius:20px">${ic('plus', 18, 2)}<input name="title" placeholder="เพิ่มงานย่อย แล้วกด Enter" aria-label="เพิ่มงานย่อย" autocomplete="off"></form>
  <div class="stack">${tasks || '<div class="empty">ยังไม่มีงานย่อย</div>'}</div>
  <h2 class="h2">ผูกไว้กับ</h2>
  <div class="grid3">${link('pin', 'สถานที่', linkedPlaces.length, linkedPlaces[0]?.name || '-', '#/records/place')}${link('person', 'คน', linkedPeople.length, linkedPeople[0]?.name || '-', '#/records/person')}${link('note', 'โน้ต', linkedNotes.length, linkedNotes[0]?.title || '-', '#/records/note')}</div>`;
}

/* ---------- Archive ---------- */
function viewArchive() {
  const curY = new Date().getFullYear();
  const startY = 2026; // พ.ศ. 2569
  const y = ui.archiveYear || curY;
  const years = [...Array(Math.max(3, curY - startY + 2))].map((_, i) => startY + i);
  const doneIn = (yy, m) => {
    const inMonth = (k) => k && dateOf(k).getFullYear() === yy && (m == null || dateOf(k).getMonth() === m);
    return { projects: db.projects.filter((p) => inMonth(p.archivedAt || p.doneAt)), tasks: db.tasks.filter((x) => x.done && inMonth(x.doneAt)).length + db.todos.filter((x) => x.done && inMonth(x.doneAt)).length };
  };
  const tl = years.map((yy) => {
    const has = yy <= curY;
    return `<button ${has ? `data-act="archiveYear" data-y="${yy}"` : 'disabled'} aria-pressed="${yy === y}" style="color:${yy === y ? 'var(--ink)' : 'var(--ink-3)'}">
      ${yy === y ? `<span class="y-on">${ic('check', 18, 2.4)}</span>` : '<span class="y-off"><span></span></span>'}<span style="font-size:14px;font-weight:${yy === y ? 700 : 400}">${be(yy)}</span></button>`;
  }).join('');
  const sum = doneIn(y);
  const newPlaces = db.places.filter((p) => p.createdAt && dateOf(p.createdAt).getFullYear() === y).length;
  const heat = (n) => n === 0 ? ['var(--card)', 'var(--ink)'] : n <= 3 ? ['#F3ECFD', '#1E1E20'] : n <= 6 ? ['#E2D2FA', '#1E1E20'] : n <= 9 ? ['#C9A7F5', '#1E1E20'] : ['#8E62D0', '#FFFFFF'];
  const nowM = new Date().getMonth();
  const months = TH_MON.map((m, i) => {
    if (y > curY || (y === curY && i > nowM)) return `<div class="month future"><b style="font-size:13px">${m}</b><span style="font-size:11px">ยังไม่ถึง</span></div>`;
    const d = doneIn(y, i); const n = d.tasks + d.projects.length; const [bg, fg] = heat(n);
    return `<button class="month" data-act="archiveMonth" data-y="${y}" data-m="${i}" style="background:${bg};color:${fg}"><b style="font-size:13px">${m}</b><span><b style="font-size:22px">${n}</b> <span style="font-size:11px">งาน</span></span></button>`;
  }).join('');
  return `
  <header class="row" style="gap:12px"><a class="icon-btn" href="#/projects" aria-label="ย้อนกลับ">${ic('back')}</a><h1 class="h1" style="font-size:26px">Archive</h1></header>
  <div class="timeline">${tl}</div>
  <div class="card dark grid3" style="padding:18px;border-radius:24px">
    <div><div style="font-size:26px;font-weight:700;line-height:1.2;color:var(--purple)">${sum.projects.length}</div><div style="font-size:12px;color:var(--on-dark-2)">โปรเจกต์ที่ปิด</div></div>
    <div><div style="font-size:26px;font-weight:700;line-height:1.2">${sum.tasks}</div><div style="font-size:12px;color:var(--on-dark-2)">งานที่เสร็จ</div></div>
    <div><div style="font-size:26px;font-weight:700;line-height:1.2">${newPlaces}</div><div style="font-size:12px;color:var(--on-dark-2)">สถานที่ใหม่</div></div></div>
  <div class="between"><b>งานที่เสร็จรายเดือน</b><span class="row muted" style="gap:4px;font-size:11px">น้อย${['#F3ECFD', '#E2D2FA', '#C9A7F5', '#8E62D0'].map((c) => `<i style="display:inline-block;width:16px;height:10px;border-radius:3px;background:${c}"></i>`).join('')}มาก</span></div>
  <div class="months">${months}</div>
  <div class="muted" style="text-align:center">แตะเดือนเพื่อดูโปรเจกต์และงานที่เสร็จในเดือนนั้น</div>`;
}

/* ---------- ปฏิทิน ---------- */
function viewCalendar() {
  const t = today();
  if (!ui.calMonth) ui.calMonth = t.slice(0, 7);
  if (!ui.calSel) ui.calSel = t;
  const [Y, M] = ui.calMonth.split('-').map(Number);
  const first = new Date(Y, M - 1, 1); const daysIn = new Date(Y, M, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const ranges = [
    ...db.projects.filter((p) => p.due && p.status !== 'archived').map((p) => ({ s: p.due, e: p.due, kind: 'due', title: p.name, sub: 'กำหนดส่ง', href: '#/project/' + p.id })),
    ...db.appts.map((a) => ({ s: a.start, e: a.end || a.start, kind: 'event', title: a.title, sub: (a.time ? a.time + ' · ' : '') + (a.end && a.end !== a.start ? `${fmtShort(a.start)} – ${fmtShort(a.end)}` : 'นัดหมาย'), id: a.id })),
  ];
  const cells = [];
  const total = Math.ceil((offset + daysIn) / 7) * 7;
  for (let i = 0; i < total; i++) {
    const d = i - offset + 1; const col = i % 7;
    if (d < 1 || d > daysIn) { cells.push('<div class="cell"></div>'); continue; }
    const k = `${Y}-${pad(M)}-${pad(d)}`;
    const r = ranges.find((x) => x.kind === 'due' && k >= x.s && k <= x.e) || ranges.find((x) => k >= x.s && k <= x.e);
    const wfh = col === 4 && isWfhFriday(k);
    let band = 'transparent', capL = true, capR = true;
    if (r) {
      capL = k === r.s || col === 0; capR = k === r.e || col === 6;
      const base = r.kind === 'due' ? 'var(--warn-soft)' : 'var(--purple-soft)';
      band = wfh ? `linear-gradient(color-mix(in srgb, ${base} 80%, transparent), color-mix(in srgb, ${base} 80%, transparent)), var(--stripe)` : base;
    } else if (col >= 5) { band = 'var(--weekend)'; capL = col === 5; capR = col === 6; }
    else if (wfh) band = 'var(--stripe)';
    const rad = `${capL ? 12 : 0}px ${capR ? 12 : 0}px ${capR ? 12 : 0}px ${capL ? 12 : 0}px`;
    const inset = 'calc(50% - 20px)';
    const jc = capL && !capR ? 'flex-start' : !capL && capR ? 'flex-end' : 'center';
    const l = logOf(k);
    cells.push(`<div class="cell"><div class="band" style="background:${band};border-radius:${band === 'transparent' ? 0 : rad};margin-left:${capL ? inset : 0};margin-right:${capR ? inset : 0};justify-content:${jc}">
      <button class="day ${k === ui.calSel ? 'sel' : ''}" data-act="calSel" data-k="${k}" aria-label="${fmtFull(k)}${r ? ' · ' + esc(r.title) : ''}${wfh ? ' · WFH' : ''}" style="color:${col >= 5 ? 'var(--ink-2)' : 'var(--ink)'}">
      <span>${d}</span><span style="height:10px">${l && l.mood != null ? flower(MOODS[l.mood].color, 10) : ''}</span></button></div></div>`);
  }
  const s = ui.calSel; const sl = logOf(s);
  const items = ranges.filter((x) => s >= x.s && s <= x.e).map((x) => x.kind === 'due'
    ? `<a class="lrow" href="${x.href}"><span class="av p1">${ic('warn', 18, 2)}</span><span class="grow"><span class="t" style="font-weight:500">${esc(x.title)}</span><span class="muted" style="font-size:12px">${x.sub}</span></span></a>`
    : `<button class="lrow" data-act="openAppt" data-id="${x.id}"><span class="av p2">${ic('cal', 18, 2)}</span><span class="grow"><span class="t" style="font-weight:500">${esc(x.title)}</span><span class="muted" style="font-size:12px">${esc(x.sub)}</span></span></button>`);
  if (dateOf(s).getDay() === 5 && isWfhFriday(s)) items.push(`<div class="lrow"><span class="av p4">${ic('home', 18, 2)}</span><span class="grow"><span class="t" style="font-weight:500">WFH</span><span class="muted" style="font-size:12px">วันศุกร์ทำงานที่บ้าน</span></span></div>`);
  const di = todayItems(s);
  if (di.length) items.push(`<div class="lrow"><span class="av p4">${ic('check', 18, 2)}</span><span class="grow"><span class="t" style="font-weight:500">to-do ปิดได้ ${di.filter((i) => i.ref.done).length}/${di.length}</span></span></div>`);
  const moodCard = sl && sl.mood != null ? `<div class="card dark row" style="gap:12px">${flower(MOODS[sl.mood].color, 36, 'var(--dark)')}<div style="flex:1"><b>${MOODS[sl.mood].label}</b><div style="font-size:12px;color:var(--on-dark-2)">เข้า ${esc(sl.in || '-')} · ออก ${esc(sl.out || '-')} · ${WORKTYPE[sl.type]?.label || ''}</div>${sl.note ? `<div style="font-size:13px;color:var(--purple)">${esc(sl.note)}</div>` : ''}</div></div>` : '';
  return `
  <header class="top"><div><div class="sub">ปฏิทิน</div><h1 class="h1" style="font-size:28px">${TH_MON_FULL[M - 1]} ${be(Y)}</h1></div>
    <div class="row"><button class="icon-btn" data-act="calMove" data-n="-1" aria-label="เดือนก่อน">${ic('left', 18, 2)}</button><button class="icon-btn" data-act="calMove" data-n="1" aria-label="เดือนถัดไป">${ic('right', 18, 2)}</button></div></header>
  <section class="cal"><div class="wd"><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span><span>อา</span></div>
    <div class="days">${cells.join('')}</div>
    <div class="legend"><span>${flower('#C9A7F5', 12)} ความรู้สึก</span><span><i style="background:var(--warn-soft);border:1px solid var(--warn)"></i>กำหนดส่ง</span><span><i style="background:var(--purple-soft);border:1px solid var(--purple-ink)"></i>นัด / งาน</span><span><i style="background:var(--stripe);border:1px solid var(--ink-3)"></i>WFH (ศุกร์)</span><span><i style="background:var(--weekend);border:1px solid var(--ink-3)"></i>เสาร์–อาทิตย์</span></div></section>
  <div class="between"><h2 class="h2">${fmtDay(s)}</h2><button class="pill-btn" style="background:var(--dark);color:var(--on-dark);border:none" data-act="openAppt" data-k="${s}">${ic('plus', 16, 2)}นัดหมาย</button></div>
  ${moodCard}
  <div class="stack">${items.join('') || (moodCard ? '' : '<div class="empty">วันนี้ว่าง ไม่มีนัดหรือกำหนดส่ง</div>')}</div>`;
}

/* ---------- บันทึก ---------- */
function viewRecords(tab) {
  if (tab) ui.recTab = tab;
  const q = ui.recQuery.trim().toLowerCase();
  const T = { place: ['สถานที่', 'pin', db.places.length], person: ['คน', 'person', db.people.length], note: ['โน้ต', 'note', db.notes.length] };
  const tabs = Object.entries(T).map(([k, [l, i, n]]) => `<button class="stat ${ui.recTab === k ? 'on' : ''}" data-act="recTab" data-k="${k}" role="tab" aria-selected="${ui.recTab === k}"><span class="ic">${ic(i, 16, 2)}</span><span><span class="num">${n}</span><br><span class="lb">${l}</span></span></button>`).join('');
  let rows = [];
  const hit = (...xs) => !q || xs.join(' ').toLowerCase().includes(q);
  if (q) {
    rows.push(...db.projects.filter((p) => hit(p.name, p.desc)).map((p) => recRow('#/project/' + p.id, ic('folder', 18, 2), 'p2', p.name, 'โปรเจกต์ · ' + STATUS[p.status].label)));
  }
  if (q || ui.recTab === 'place') rows.push(...db.places.filter((x) => hit(x.name, x.address, x.station, x.note)).map((x) => {
    const tr = TRANSIT[x.transit] || TRANSIT.car; const last = (x.visits || []).map((v) => v.date).sort().pop();
    return recRow('#/place/' + x.id, tr.label, '', x.name, [x.station && `${tr.label} ${x.station}`, x.exit && `ทางออก ${x.exit}`, last && `ไปล่าสุด ${fmtShort(last)}`].filter(Boolean).join(' · '), `background:${tr.color};color:#fff`);
  }));
  if (q || ui.recTab === 'person') rows.push(...db.people.filter((x) => hit(x.name, x.nickname, x.org, x.topics, x.looks)).map((x) => recRow('#/person/' + x.id, esc((x.name || '?').trim()[0]), '', x.name, [x.org, x.metDate && fmtShort(x.metDate)].filter(Boolean).join(' · '), 'background:var(--purple);color:#1E1E20;font-size:17px')));
  if (q || ui.recTab === 'note') rows.push(...db.notes.filter((x) => hit(x.title, x.body, x.tags)).map((x) => {
    const pj = byId('projects', x.projectId);
    return `<button class="lrow" data-act="openNote" data-id="${x.id}"><span class="av p4">#</span><span class="grow"><span class="t">${esc(x.title)}</span><span class="muted" style="font-size:12px">${esc([x.tags && '#' + x.tags, pj?.name, fmtShort(x.date)].filter(Boolean).join(' · '))}</span></span>${ic('right', 16, 2)}</button>`;
  }));
  const addAct = { place: 'openPlace', person: 'openPerson', note: 'openNote' }[ui.recTab];
  return `
  <header class="top"><h1 class="h1">บันทึก</h1><button class="icon-btn dark" data-act="${addAct}" aria-label="เพิ่ม${T[ui.recTab][0]}">${ic('plus', 20, 2)}</button></header>
  <label class="search">${ic('search')}<input id="recq" value="${esc(ui.recQuery)}" placeholder="ค้นหาทุกอย่าง: โปรเจกต์ สถานที่ คน โน้ต" aria-label="ค้นหารวม"></label>
  ${q ? '' : `<div class="statgrid" role="tablist">${tabs}</div>`}
  <div class="stack" id="rec-list">${rows.join('') || `<div class="empty">${q ? 'ไม่พบผลลัพธ์' : 'ยังไม่มีบันทึก กด + เพื่อเพิ่ม'}</div>`}</div>`;
}
const recRow = (href, badge, cls, title, sub, style = '') =>
  `<a class="lrow" href="${href}"><span class="av ${cls}" style="${style}">${badge}</span><span class="grow"><span class="t">${esc(title)}</span><span class="muted" style="font-size:12px">${esc(sub)}</span></span>${ic('right', 16, 2)}</a>`;

function viewPlace(id) {
  const x = byId('places', id); if (!x) return `<div class="empty">ไม่พบสถานที่</div>`;
  const tr = TRANSIT[x.transit] || TRANSIT.car;
  const visits = (x.visits || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const steps = (x.steps || '').split('\n').filter(Boolean);
  const box = (icon, l, v) => v ? `<div class="tile"><span style="color:var(--purple-ink)">${ic(icon)}</span><span class="muted" style="font-size:12px">${l}</span><b>${esc(v)}</b></div>` : '';
  return `
  <header class="between"><a class="icon-btn" href="#/records/place" aria-label="ย้อนกลับ">${ic('back')}</a>
    <div class="row"><button class="icon-btn" data-act="openPlace" data-id="${id}" aria-label="แก้ไขสถานที่">${ic('edit')}</button>
    ${x.mapUrl ? `<a class="icon-btn dark" href="${esc(x.mapUrl)}" target="_blank" rel="noopener" aria-label="เปิดในแผนที่">${ic('map')}</a>` : ''}</div></header>
  <div><div class="muted">สถานที่ · ไปมาแล้ว ${visits.length} ครั้ง${visits[0] ? ' · ล่าสุด ' + fmtShort(visits[0].date) : ''}</div>
  <h1 class="h1" style="font-size:26px">${esc(x.name)}</h1>${x.address ? `<div class="muted" style="font-size:14px">${esc(x.address)}</div>` : ''}</div>
  <section class="card dark hero">
    <b style="font-size:13px;color:var(--purple)">วิธีไป</b>
    <div class="row" style="gap:14px"><span class="av" style="width:56px;height:56px;border-radius:18px;background:${tr.color};color:#fff">${ic('train', 28)}</span>
      <div><div style="font-size:13px;font-weight:600">${tr.label}${x.line ? ' ' + esc(x.line) : ''}</div><div style="font-size:24px;font-weight:700;line-height:1.35">${esc(x.station || '-')}</div></div></div>
    <div class="grid2"><div style="padding:14px;border-radius:20px;background:var(--purple);color:#1E1E20"><div style="font-size:12px">ทางออก</div><div style="font-size:34px;font-weight:700;line-height:1.2">${esc(x.exit || '-')}</div></div>
      <div style="padding:14px;border-radius:20px;background:rgba(255,255,255,.1)"><div style="font-size:12px;color:var(--on-dark-2)">เดินต่อ</div><div style="font-size:22px;font-weight:700;line-height:1.4">${x.walk ? '~' + esc(x.walk) + ' นาที' : '-'}</div></div></div>
    ${steps.map((s, i) => `<div class="row" style="align-items:flex-start;gap:12px"><span class="av" style="width:24px;height:24px;font-size:12px;background:rgba(255,255,255,.15)">${i + 1}</span><div>${esc(s)}</div></div>`).join('')}
  </section>
  <div class="grid2">${box('card', 'แลกบัตร', x.card)}${box('lift', 'ลิฟต์', x.lift)}${box('coin', 'ค่าโดยสาร', x.fare)}${box('parking', 'ที่จอดรถ', x.parking)}</div>
  ${x.note ? `<div class="card"><div class="label">โน้ต</div><div style="font-size:14px">${esc(x.note)}</div></div>` : ''}
  <div class="between"><b class="label">เคยมาเพราะ</b><button class="pill-btn" data-act="addVisit" data-id="${id}">${ic('plus', 16, 2)}มาวันนี้</button></div>
  <div class="row" style="flex-wrap:wrap">${visits.map((v) => `<span class="chip p2" style="font-weight:500">${esc(byId('projects', v.projectId)?.name || 'ไม่ผูกโปรเจกต์')} · ${fmtShort(v.date)}</span>`).join('') || '<span class="muted">ยังไม่มีบันทึกการมา</span>'}</div>`;
}

function viewPerson(id) {
  const x = byId('people', id); if (!x) return `<div class="empty">ไม่พบข้อมูล</div>`;
  const place = byId('places', x.placeId);
  const topics = (x.topics || '').split('\n').filter(Boolean);
  return `
  <header class="between"><a class="icon-btn" href="#/records/person" aria-label="ย้อนกลับ">${ic('back')}</a>
    <button class="icon-btn" data-act="openPerson" data-id="${id}" aria-label="แก้ไขข้อมูลคน">${ic('edit')}</button></header>
  <section class="card purple hero">
    <div class="row" style="gap:14px"><span class="av" style="width:64px;height:64px;background:#2B2B2E;color:#C9A7F5;font-size:26px">${esc((x.name || '?').trim()[0])}</span>
      <div><div style="font-size:22px;font-weight:700;line-height:1.4">${esc(x.name)}</div>${x.nickname ? `<div>ชื่อเล่น ${esc(x.nickname)}</div>` : ''}</div></div>
    <div class="grid2"><div style="padding:12px;border-radius:18px;background:rgba(255,255,255,.55)"><div style="font-size:12px">องค์กร</div><b>${esc(x.org || '-')}</b></div><div style="padding:12px;border-radius:18px;background:rgba(255,255,255,.55)"><div style="font-size:12px">ตำแหน่ง</div><b>${esc(x.role || '-')}</b></div></div>
  </section>
  ${x.looks ? `<div class="card"><div class="row label">${ic('eye', 18)}หน้าตา / จุดสังเกต</div><div style="margin-top:6px">${esc(x.looks)}</div></div>` : ''}
  ${topics.length ? `<div class="card dark stack"><div class="row" style="font-size:13px;font-weight:600;color:var(--purple)">${ic('chat', 18)}คุยเรื่องอะไร / สำคัญเรื่องไหน</div>${topics.map((t) => `<div class="row" style="align-items:flex-start;gap:10px"><span class="dot" style="background:var(--purple);margin-top:9px"></span><div>${esc(t)}</div></div>`).join('')}</div>` : ''}
  <div class="label">เจอกันที่</div>
  ${place ? `<a class="lrow" href="#/place/${place.id}"><span class="av p2">${ic('pin', 20)}</span><span class="grow"><span class="t">${esc(place.name)}</span><span class="muted" style="font-size:12px">${x.metDate ? 'ครั้งแรก ' + fmtShort(x.metDate) : ''}</span></span>${ic('right', 16, 2)}</a>` : `<div class="muted">${x.metDate ? fmtShort(x.metDate) : 'ยังไม่ได้ระบุ'}</div>`}
  <div class="label">โปรเจกต์ที่เกี่ยว</div>
  <div class="row" style="flex-wrap:wrap">${(x.projectIds || []).map((pid) => byId('projects', pid)).filter(Boolean).map((p) => `<a class="chip p2" style="font-weight:500;text-decoration:none" href="#/project/${p.id}">${esc(p.name)}</a>`).join('') || '<span class="muted">-</span>'}</div>`;
}

/* ---------- สถิติ ---------- */
function periodRange(kind, shift = 0) {
  const t = today(); const d = dateOf(t);
  if (kind === 'week') { const s = addDays(mondayOf(t), shift * 7); return [s, addDays(s, 6), `${fmtShort(s)} – ${fmtShort(addDays(s, 6))}`, fmtShort(s)]; }
  if (kind === 'month') { const m = new Date(d.getFullYear(), d.getMonth() + shift, 1); const e = new Date(m.getFullYear(), m.getMonth() + 1, 0); return [keyOf(m), keyOf(e), `${TH_MON_FULL[m.getMonth()]} ${be(m.getFullYear())}`, TH_MON[m.getMonth()]]; }
  const y = d.getFullYear() + shift; return [`${y}-01-01`, `${y}-12-31`, `${be(y)}`, `${be(y)}`];
}
function statsFor(kind, shift = 0) {
  const [s, e, label, short] = periodRange(kind, shift);
  const inR = (k) => k && k >= s && k <= e;
  const logs = db.timeLogs.filter((l) => inR(l.date));
  const work = logs.filter((l) => l.type !== 'leave' && l.in && l.out);
  const min = work.reduce((a, l) => a + logMinutes(l), 0);
  const avg = (f) => work.length ? minToHM(work.reduce((a, l) => a + hmToMin(l[f]), 0) / work.length) : '-';
  const leaves = logs.filter((l) => l.type === 'leave');
  return {
    label, short, min, avgIn: avg('in'), avgOut: avg('out'),
    closed: db.projects.filter((p) => inR(p.doneAt)),
    doneTasks: [...db.tasks.filter((x) => x.done && inR(x.doneAt)), ...db.todos.filter((x) => x.done && inR(x.doneAt))],
    leave: leaves.filter((l) => (l.leaveKind || 'leave') === 'leave'), off: leaves.filter((l) => l.leaveKind === 'off'), sick: leaves.filter((l) => l.leaveKind === 'sick'),
    moods: MOODS.map((_, i) => logs.filter((l) => l.mood === i).length), logs: work,
  };
}
function viewStats() {
  const k = ui.statPeriod; const S = statsFor(k); const prev = statsFor(k, -1);
  const word = { week: 'สัปดาห์', month: 'เดือน', year: 'ปี' }[k]; const thisW = word + 'นี้';
  const n = k === 'year' ? 3 : 6;
  const series = [...Array(n)].map((_, i) => statsFor(k, i - n + 1));
  const max = Math.max(1, ...series.map((x) => x.min));
  const bars = series.map((x, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><span style="font-size:11px;font-weight:600;color:${i === n - 1 ? 'var(--purple)' : 'var(--on-dark-2)'}">${(x.min / 60).toFixed(0)}</span><div style="width:100%;height:${Math.max(4, Math.round(x.min / max * 100))}px;border-radius:12px;background:${i === n - 1 ? 'var(--purple)' : 'rgba(255,255,255,.18)'}"></div><span style="font-size:11px;color:var(--ink-3)">${i === n - 1 ? thisW : x.short}</span></div>`).join('');
  const diff = (S.min - prev.min) / 60;
  const tile = (act, icon, l, v, purple) => `<button class="tile ${purple ? 'card purple' : ''}" data-act="statDetail" data-k="${act}"><span class="chev">${ic('right', 16, 2)}</span><span style="color:${purple ? '#1E1E20' : 'var(--purple-ink)'}">${ic(icon)}</span><span class="muted" style="font-size:12px;${purple ? 'color:#3F3F46' : ''}">${l}</span><span class="big">${v}</span></button>`;
  const totalMood = S.moods.reduce((a, b) => a + b, 0) || 1;
  const sickList = S.sick.map((l) => `<div class="between" style="padding:8px 0;border-top:1px solid var(--line);font-size:13px"><span>ป่วย${l.reason ? ' · ' + esc(l.reason) : ''}</span><span class="muted">${fmtShort(l.date)}</span></div>`).join('');
  return `
  <header class="top"><h1 class="h1">สถิติ</h1><button class="icon-btn" data-act="exportCsv" aria-label="ส่งออกข้อมูล">${ic('up')}</button></header>
  <div class="seg" role="tablist">${['week', 'month', 'year'].map((x) => `<button role="tab" class="${x === k ? 'on' : ''}" data-act="statPeriod" data-k="${x}">${{ week: 'สัปดาห์', month: 'เดือน', year: 'ปี' }[x]}</button>`).join('')}</div>
  <section class="card dark hero">
    <div class="between" style="align-items:flex-start"><div><div style="font-size:13px;color:var(--on-dark-2)">ชั่วโมงทำงาน${thisW} · ${S.label}</div><div><span style="font-size:36px;font-weight:700;line-height:1.2">${(S.min / 60).toFixed(1).replace('.0', '')}</span> ชม.</div></div>
    <span class="chip" style="background:var(--purple);color:#1E1E20">${ic(diff >= 0 ? 'up' : 'down', 12, 2.4)}${diff >= 0 ? '+' : ''}${diff.toFixed(1)} ชม.</span></div>
    <div style="font-size:12px;color:var(--on-dark-2)">เทียบราย${word} · ${n} ${word}ล่าสุด</div>
    <div style="height:150px;display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:10px;align-items:end">${bars}</div>
  </section>
  <div class="grid2">${tile('in', 'login', 'เข้างานเฉลี่ย', S.avgIn)}${tile('out', 'logout', 'เลิกงานเฉลี่ย', S.avgOut)}${tile('closed', 'check', 'ปิดโปรเจกต์' + thisW, S.closed.length, true)}${tile('tasks', 'check', 'to-do ที่ปิด' + thisW, S.doneTasks.length)}</div>
  <div class="card stack"><b>วันที่ใช้ไป${thisW}</b>
    <div class="grid3">${[['leave', 'ลา', S.leave.length], ['cal', 'หยุด', S.off.length], ['plus', 'ป่วย', S.sick.length]].map(([i, l, v]) => `<div style="padding:12px;border-radius:16px;background:var(--bg)"><div class="row muted" style="gap:4px;font-size:12px">${ic(i, 14, 2)}${l}</div><b style="font-size:22px">${v}</b> <span class="muted" style="font-size:12px">วัน</span></div>`).join('')}</div>
    ${sickList || `<div class="muted">ไม่มีวันป่วย${thisW}</div>`}</div>
  <div class="card stack"><b>ความรู้สึก${thisW}</b>
    <div style="display:flex;height:14px;border-radius:999px;overflow:hidden;background:var(--card-2)">${S.moods.map((m, i) => `<div style="width:${m / totalMood * 100}%;background:${MOODS[i].color}"></div>`).join('')}</div>
    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;text-align:center">${MOODS.map((m, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">${flower(m.color, 20, 'var(--card)')}<b>${S.moods[i]}</b><span style="font-size:10px;color:var(--ink-2);line-height:1.3">${m.label.split(' ')[0]}</span></div>`).join('')}</div></div>
  ${k === 'year' ? `<a class="card row" href="#/archive" style="background:linear-gradient(135deg,#C9A7F5,#E9DDFB);color:#1E1E20;text-decoration:none;justify-content:space-between;border-radius:28px;padding:20px"><div><b style="font-size:13px;color:#4A2A80">สรุปประจำปี</b><div style="font-size:20px;font-weight:700;line-height:1.4">ปี ${S.label} ของ Blue</div><div style="font-size:13px;color:#3F3F46">ปิดงาน · ไปที่ไหน · เจอใคร</div></div><span class="icon-btn dark">${ic('arrow', 20, 2)}</span></a>` : ''}`;
}

/* ---------- ตั้งค่า ---------- */
/* มีอะไรใหม่ — ใส่เฉพาะฟีเจอร์/การเปลี่ยนแปลงใหญ่ (ไม่ต้องใส่การแก้คำ/ขนาด/สี) ใหม่สุดอยู่บน */
const CHANGELOG = [
  { ver: 'เวอร์ชัน 1.1', date: '30 ต.ค. 2569', items: [
    'แอปบน iPhone อัปเดตเป็นเวอร์ชันล่าสุดเองเมื่อเปิดแอป',
    'หน้าเช็กอิน: ช่องข้อมูลการลาแสดงเฉพาะเมื่อเลือก "ลา"',
    'หน้าเช็กอิน: ป้ายเวลาแบบนาฬิกาพลิก พร้อมวันที่',
    'เพิ่ม "มีอะไรใหม่" ในหน้าตั้งค่า',
    'เอาปุ่มใส่ข้อมูลตัวอย่างออกจากหน้าตั้งค่า',
  ] },
  { ver: 'เวอร์ชัน 1.0', date: 'ต.ค. 2569', items: ['เปิดใช้ Rocket Life ครั้งแรก'] },
];
function viewSettings() {
  const lb = db.settings.lastBackup;
  const stale = !lb || diffDays(lb.slice(0, 10), today()) > 7;
  const row = (icon, t, sub, right, act) => `<button class="lrow" style="border-radius:0;border-top:1px solid var(--line)" ${act ? `data-act="${act}"` : ''}><span class="av p2" style="width:36px;height:36px">${ic(icon, 18)}</span><span class="grow"><span class="t">${t}</span><span class="muted" style="font-size:12px">${sub}</span></span>${right || ic('right', 16, 2)}</button>`;
  const themeL = { system: 'ตามระบบ (สว่าง / มืด)', light: 'สว่าง', dark: 'มืด' }[db.settings.theme];
  return `
  <header class="row" style="gap:12px"><a class="icon-btn" href="#/today" aria-label="ย้อนกลับ">${ic('back')}</a><h1 class="h1" style="font-size:26px">ตั้งค่า</h1></header>
  <section class="card" style="padding:0;overflow:hidden">
    ${row('bell', 'มีอะไรใหม่', `${CHANGELOG[0].ver} · ${CHANGELOG[0].date}`, '', 'whatsNew')}
  </section>
  ${stale ? `<div class="card row" style="background:var(--amber-soft);color:var(--amber-ink);gap:12px">${ic('warn', 22)}<div style="font-size:14px"><b>${lb ? `ไม่ได้สำรองข้อมูลมา ${diffDays(lb.slice(0, 10), today())} วัน` : 'ยังไม่เคยสำรองข้อมูล'}</b><br>สำรองไว้กันข้อมูลหายนะ</div></div>` : ''}
  <section class="card" style="padding:0;overflow:hidden"><div class="label" style="padding:14px 14px 6px">ข้อมูล</div>
    ${row('down', 'สำรองข้อมูล', `ไฟล์ JSON · ${lb ? 'ล่าสุด ' + fmtShort(lb.slice(0, 10)) : 'ยังไม่เคย'}`, '<span class="pill-btn" style="background:var(--dark);color:var(--on-dark);border:none;height:36px">สำรองเลย</span>', 'backup')}
    ${row('up', 'กู้คืนจากไฟล์', 'เลือกไฟล์สำรองเพื่อกู้คืน', '', 'restore')}
    ${row('table', 'ส่งออก CSV', 'สำหรับเปิดใน Sheets / Excel', '', 'exportCsv')}
  </section>
  <section class="card" style="padding:0;overflow:hidden"><div class="label" style="padding:14px 14px 6px">การแสดงผล</div>
    ${row('moon', 'ธีม', themeL, '', 'cycleTheme')}
    ${row('tags', 'หมวด', 'อินโฟกราฟิก · บทความ', '<span></span>')}
    ${row('home', 'วันทำงาน', 'จ–พฤ ออฟฟิศ · ศุกร์ WFH', '<span></span>')}
  </section>
  <section class="card" style="padding:0;overflow:hidden"><div class="label" style="padding:14px 14px 6px">ล้างข้อมูล</div>
    ${row('trash', 'ล้างข้อมูลทั้งหมด', 'สำรองก่อนนะ ลบแล้วกู้ไม่ได้', '', 'wipe')}
  </section>
  <input type="file" id="restore-file" accept="application/json,.json" class="sr" aria-label="ไฟล์สำรอง">
  <div class="muted" style="text-align:center;font-size:12px">Rocket Life · เก็บข้อมูลในเครื่องนี้เท่านั้น · schema v${SCHEMA}</div>`;
}
/* =========================================================
   แผ่นเด้ง (sheets) · การกระทำ (actions) · เราเตอร์ · เริ่มแอป
   ========================================================= */

/* ---------- sheet ---------- */
function openSheet(title, body, onMount) {
  closeSheet();
  const root = $('#sheet-root');
  root.innerHTML = `<div class="sheet-dim" data-act="closeSheet"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div>
  <div class="between"><h2 class="h2" style="font-size:21px;font-weight:700;line-height:1.35">${esc(title)}</h2><button class="icon-btn solid" data-act="closeSheet" aria-label="ปิด">${ic('close', 18, 2)}</button></div>
  ${body}</div>`;
  const sh = $('.sheet', root);
  if (onMount) onMount(sh);
  const first = $('input:not([type=hidden]), textarea', sh); if (first && !first.value) first.focus({ preventScroll: true });
}
function closeSheet() { $('#sheet-root').innerHTML = ''; }
const optTiles = (name, entries, cur, cols = 2) => `<div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:6px">${entries.map(([v, l, icon, bg]) =>
  `<button type="button" class="opt ${String(cur) === String(v) ? 'on' : ''}" data-opt="${name}" data-v="${v}" data-bg="${bg || ''}" style="${String(cur) === String(v) && bg ? 'background:' + bg : ''}">${icon ? ic(icon, 18, 2) : ''}${l}</button>`).join('')}</div><input type="hidden" name="${name}" value="${cur ?? ''}">`;
function bindOpts(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-opt]'); if (!b) return;
    const name = b.dataset.opt;
    $$(`[data-opt="${name}"]`, root).forEach((x) => { x.classList.remove('on'); x.style.background = ''; });
    b.classList.add('on'); if (b.dataset.bg) b.style.background = b.dataset.bg;
    $(`input[name="${name}"]`, root).value = b.dataset.v;
    root.dispatchEvent(new CustomEvent('optchange', { detail: { name, v: b.dataset.v } }));
  });
}
const fd = (form) => Object.fromEntries(new FormData(form).entries());
const fieldH = (label, inner) => `<label class="field"><span class="label">${label}</span>${inner}</label>`;
const inputH = (name, val = '', type = 'text', ph = '') => `<input class="input" name="${name}" type="${type}" value="${esc(val)}" placeholder="${esc(ph)}">`;
const areaH = (name, val = '', ph = '') => `<textarea class="input" name="${name}" placeholder="${esc(ph)}">${esc(val)}</textarea>`;
const projectSelect = (name, cur) => `<select class="input" name="${name}"><option value="">— ไม่ผูกโปรเจกต์ —</option>${db.projects.filter((p) => p.status !== 'archived' || p.id === cur).map((p) => `<option value="${p.id}" ${p.id === cur ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`;

/* ---------- เช็กอิน / เช็กเอาต์ ---------- */
function sheetCheckin() {
  const t = today(); const dow = dateOf(t).getDay();
  const def = dow === 5 ? 'wfh' : 'office';
  openSheet('เริ่มงานวันนี้กันเลยไหม', `<form class="stack" style="gap:18px" data-form="checkin">
    <div class="stack" style="gap:8px"><label class="flip" aria-label="เวลาเข้างาน แตะเพื่อแก้">
      <span class="flip-date"><span class="fd-w">${TH_DAY_FULL[dow]}</span><b class="fd-d">${dateOf(t).getDate()}</b><span class="fd-m">${TH_MON[dateOf(t).getMonth()]}</span></span>
      <span class="flip-tile" data-hh>${nowHM().slice(0, 2)}</span><span class="flip-tile" data-mm>${nowHM().slice(3, 5)}</span>
      <input name="in" type="time" value="${nowHM()}" class="flip-input"></label>
      <span class="muted" style="text-align:center">เวลาเข้างาน · <span style="color:var(--purple-ink);font-weight:600">แตะเพื่อแก้</span></span></div>
    <div class="field"><span class="label">วันนี้ทำงานแบบไหน</span>${optTiles('type', Object.entries(WORKTYPE).map(([k, v]) => [k, v.label, v.icon]), def)}</div>
    <div id="leave-box" class="stack" hidden><div class="field"><span class="label">ประเภท</span>${optTiles('leaveKind', Object.entries(LEAVE_KIND).map(([k, v]) => [k, v]), 'leave', 3)}</div>${fieldH('สาเหตุที่บอก (ถ้ามี)', inputH('reason', '', 'text', 'เช่น ไข้หวัด'))}</div>
    <button class="btn purple">${ic('check', 20, 2.4)}<span>เช็กอิน</span></button>
    <button type="button" class="btn ghost" data-act="closeSheet">ไว้ทีหลัง</button></form>`, (sh) => {
    bindOpts(sh);
    const inp = $('.flip-input', sh);
    inp.addEventListener('input', () => { const [h = '--', m = '--'] = (inp.value || '').split(':'); $('[data-hh]', sh).textContent = h; $('[data-mm]', sh).textContent = m; });
    sh.addEventListener('optchange', (e) => { if (e.detail.name === 'type') $('#leave-box', sh).hidden = e.detail.v !== 'leave'; });
  });
}
function sheetCheckout() {
  const l = logOf(today()); if (!l) return sheetCheckin();
  const mood = l.mood ?? '';
  openSheet('เลิกงานวันนี้', `<form class="stack" style="gap:18px" data-form="checkout">
    <div class="grid2">${fieldH('เช็กอิน', inputH('in', l.in, 'time'))}${fieldH('เช็กเอาต์', inputH('out', l.out || nowHM(), 'time'))}</div>
    <div class="field"><span class="label">วันนี้รู้สึกยังไง</span>
      <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">${MOODS.map((m, i) => `<button type="button" class="opt" data-opt="mood" data-v="${i}" aria-label="${m.label}" style="justify-content:center;height:56px;${String(mood) === String(i) ? 'border:2px solid var(--ink)' : ''}">${flower(m.color, 30, 'var(--card)')}</button>`).join('')}</div>
      <input type="hidden" name="mood" value="${mood}"><div id="mood-desc" class="muted" style="min-height:20px">${mood !== '' ? `<b style="color:var(--purple-ink)">${MOODS[mood].label}</b> · ${MOODS[mood].desc}` : 'แตะดอกไม้ที่ตรงกับวันนี้'}</div></div>
    ${fieldH('โน้ตสั้น ๆ ของวันนี้', inputH('note', l.note || '', 'text', 'วันนี้เป็นยังไงบ้าง'))}
    <button class="btn">บันทึกเช็กเอาต์</button></form>`, (sh) => {
    bindOpts(sh);
    sh.addEventListener('optchange', (e) => {
      if (e.detail.name !== 'mood') return;
      $$('[data-opt="mood"]', sh).forEach((b) => { b.style.border = b.dataset.v === e.detail.v ? '2px solid var(--ink)' : ''; b.classList.remove('on'); });
      const m = MOODS[e.detail.v]; $('#mood-desc', sh).innerHTML = `<b style="color:var(--purple-ink)">${m.label}</b> · ${m.desc}`;
    });
  });
}

/* ---------- ใส่งานในวันนี้ ---------- */
function sheetPick() {
  const t = today();
  const groups = db.projects.filter((p) => !['done', 'archived'].includes(p.status)).map((p) => ({ p, ts: tasksOf(p.id).filter((x) => !x.done && x.plannedFor !== t) })).filter((g) => g.ts.length);
  const body = groups.length ? groups.map(({ p, ts }) => `<div class="stack"><div class="between" style="font-size:13px;font-weight:600"><span>${esc(p.name)}</span>${p.due ? `<span style="color:var(--warn-ink);font-weight:400">ส่ง ${fmtShort(p.due)}</span>` : ''}</div>
    ${ts.map((x) => `<button type="button" class="opt" data-pick="${x.id}" style="font-size:15px;padding:10px 14px" aria-pressed="false"><span class="tick" style="width:26px;height:26px"></span>${esc(x.title)}</button>`).join('')}</div>`).join('')
    : '<div class="empty">ไม่มีงานย่อยค้างให้เลือก · สร้างโปรเจกต์และงานย่อยก่อน หรือเพิ่ม to-do ลอย</div>';
  openSheet(`ใส่งานใน "วันนี้"`, `<div class="muted" style="margin-top:-10px">${fmtDay(t)}</div>
    <label class="search" style="height:46px;background:var(--bg)">${ic('search', 18)}<input id="pick-q" placeholder="ค้นหางานย่อย" aria-label="ค้นหางานย่อย"></label>
    <div class="stack" style="gap:14px" id="pick-list">${body}</div>
    <button class="btn" data-act="pickConfirm" id="pick-btn" disabled>เลือกงานที่จะทำวันนี้</button>
    <button class="link-btn" data-act="openTodo">+ เพิ่ม to-do ลอย (ไม่ผูกโปรเจกต์)</button>`, (sh) => {
    const sel = new Set();
    sh.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]'); if (!b) return;
      const id = b.dataset.pick; const on = !sel.has(id); on ? sel.add(id) : sel.delete(id);
      b.setAttribute('aria-pressed', on); b.style.background = on ? 'var(--purple-soft)' : '';
      $('.tick', b).classList.toggle('on', on); $('.tick', b).innerHTML = on ? ic('check', 14, 2.6) : '';
      const btn = $('#pick-btn', sh); btn.disabled = !sel.size; btn.textContent = sel.size ? `ใส่ ${sel.size} งานในวันนี้` : 'เลือกงานที่จะทำวันนี้';
    });
    $('#pick-q', sh).addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); $$('[data-pick]', sh).forEach((b) => { b.hidden = q && !b.textContent.toLowerCase().includes(q); }); });
    sh._sel = sel;
  });
}
function sheetTodo(id) {
  const x = id ? byId('todos', id) : null;
  openSheet(x ? 'แก้ไข to-do' : 'to-do ลอย', `<form class="stack" style="gap:16px" data-form="todo" data-id="${id || ''}">
    ${fieldH('ชื่องาน', inputH('title', x?.title || '', 'text', 'ต้องทำอะไร'))}
    <div class="field"><span class="label">ความสำคัญ</span>${optTiles('priority', Object.entries(PRIORITY).map(([k, v]) => [k, v.label, v.icon]), x?.priority || 4)}</div>
    ${fieldH('วันที่ทำ', inputH('date', x?.date || today(), 'date'))}
    ${fieldH('โน้ต', areaH('note', x?.note || ''))}
    <button class="btn">บันทึก</button>${x ? `<button type="button" class="btn ghost" style="color:var(--warn-ink)" data-act="delItem" data-kind="todo" data-id="${x.id}">ลบ to-do นี้</button>` : ''}</form>`, bindOpts);
}
function sheetTask(id) {
  const x = byId('tasks', id); if (!x) return;
  const p = byId('projects', x.projectId);
  openSheet('แก้ไข to-do', `<form class="stack" style="gap:16px" data-form="task" data-id="${id}">
    ${fieldH('ชื่องาน', inputH('title', x.title))}
    <div class="field"><span class="label">โปรเจกต์</span><div class="input row" style="background:var(--bg)">${esc(p?.name || '-')}</div></div>
    <div class="field"><span class="label">ความสำคัญ</span>${optTiles('priority', Object.entries(PRIORITY).map(([k, v]) => [k, v.label, v.icon]), x.priority || p?.priority || 4)}</div>
    <div class="grid2">${fieldH('วันที่ทำ', inputH('plannedFor', x.plannedFor || '', 'date'))}${fieldH('กำหนดส่ง', inputH('due', x.due || '', 'date'))}</div>
    ${fieldH('โน้ต', areaH('note', x.note || ''))}
    <button class="btn">บันทึก</button><button type="button" class="btn ghost" style="color:var(--warn-ink)" data-act="delItem" data-kind="task" data-id="${id}">ลบงานย่อยนี้</button></form>`, bindOpts);
}

/* ---------- โปรเจกต์ ---------- */
function sheetProject(id) {
  const p = id ? byId('projects', id) : null;
  const cats = p?.categories || ['infographic'];
  const stTone = { todo: 'var(--card-2)', doing: 'var(--purple)', waiting: 'var(--amber-soft)', revise: 'var(--warn-soft)' };
  const prTone = { 1: 'var(--warn-soft)', 2: 'var(--purple-soft)', 3: 'var(--amber-soft)', 4: 'var(--card-2)' };
  openSheet(p ? 'แก้ไขโปรเจกต์' : 'โปรเจกต์ใหม่', `<form class="stack" style="gap:14px" data-form="project" data-id="${id || ''}">
    ${fieldH('ชื่อโปรเจกต์', inputH('name', p?.name || '', 'text', 'เช่น อินโฟพื้นที่น้ำท่วมรายภาค'))}
    ${fieldH('คำอธิบาย (ถ้ามี)', areaH('desc', p?.desc || ''))}
    <div class="field"><span class="label">สถานะ</span>${optTiles('status', ['todo', 'doing', 'waiting', 'revise'].map((k) => [k, STATUS[k].label, STATUS[k].icon, stTone[k]]), ['done', 'archived'].includes(p?.status) ? '' : (p?.status || 'todo'))}</div>
    <div class="field"><span class="label">ความสำคัญ</span>${optTiles('priority', Object.entries(PRIORITY).map(([k, v]) => [k, v.label, v.icon, prTone[k]]), p?.priority || 2)}</div>
    <div class="grid2">${fieldH('วันเริ่ม', inputH('start', p?.start || today(), 'date'))}${fieldH('กำหนดส่ง', inputH('due', p?.due || '', 'date'))}</div>
    <div class="field"><div class="between"><span class="label">หมวด</span><span class="muted" style="font-size:12px">เลือกได้ทั้ง 2 อย่าง</span></div>
      <div class="grid2">${Object.entries(CATEGORIES).map(([k, v]) => `<label class="opt" style="height:56px;font-size:14px;font-weight:600"><span style="color:var(--purple-ink)">${ic(v.icon, 20)}</span><span style="flex:1">${v.label}</span><input type="checkbox" name="cat_${k}" ${cats.includes(k) ? 'checked' : ''} style="width:22px;height:22px;accent-color:#2B2B2E"></label>`).join('')}</div></div>
    <button class="btn">${p ? 'บันทึก' : 'สร้างโปรเจกต์'}</button></form>`, bindOpts);
}
function sheetProjectMenu(id) {
  const p = byId('projects', id); if (!p) return;
  const done = ['done', 'archived'].includes(p.status);
  openSheet('จัดการโปรเจกต์', `<div class="stack">
    ${done ? `<button class="lrow" data-act="projReopen" data-id="${id}"><span class="av p2">${ic('hourglass', 18, 2)}</span><span class="grow"><span class="t">เปิดโปรเจกต์อีกครั้ง</span><span class="muted" style="font-size:12px">กลับไปเป็น "กำลังทำ"</span></span></button>`
      : `<button class="lrow" data-act="projDone" data-id="${id}"><span class="av" style="background:var(--dark);color:var(--on-dark)">${ic('check', 18, 2.4)}</span><span class="grow"><span class="t">ทำเครื่องหมายว่าเสร็จแล้ว</span><span class="muted" style="font-size:12px">วันถัดไประบบย้ายเข้า Archive ให้เอง</span></span></button>`}
    <button class="lrow" data-act="delProject" data-id="${id}"><span class="av p1">${ic('trash', 18, 2)}</span><span class="grow"><span class="t" style="color:var(--warn-ink)">ลบโปรเจกต์</span><span class="muted" style="font-size:12px">ลบงานย่อยทั้งหมดด้วย</span></span></button></div>`);
}

/* ---------- นัดหมาย ---------- */
function sheetAppt(id, k) {
  const a = id ? byId('appts', id) : null;
  openSheet(a ? 'แก้ไขนัดหมาย' : 'นัดหมายใหม่', `<form class="stack" style="gap:14px" data-form="appt" data-id="${id || ''}">
    ${fieldH('ชื่อนัด / งาน', inputH('title', a?.title || '', 'text', 'เช่น ลงพื้นที่ · คุยทีมกราฟิก'))}
    <div class="grid2">${fieldH('วันเริ่ม', inputH('start', a?.start || k || today(), 'date'))}${fieldH('ถึงวันที่ (ถ้าหลายวัน)', inputH('end', a?.end || '', 'date'))}</div>
    ${fieldH('เวลา (ถ้ามี)', inputH('time', a?.time || '', 'time'))}
    ${fieldH('โน้ต', areaH('note', a?.note || ''))}
    <button class="btn">บันทึก</button>${a ? `<button type="button" class="btn ghost" style="color:var(--warn-ink)" data-act="delAppt" data-id="${a.id}">ลบนัดนี้</button>` : ''}</form>`);
}

/* ---------- สถานที่ / คน / โน้ต ---------- */
function sheetPlace(id) {
  const x = id ? byId('places', id) : {};
  openSheet(id ? 'แก้ไขสถานที่' : 'สถานที่ใหม่', `<form class="stack" style="gap:14px" data-form="place" data-id="${id || ''}">
    ${fieldH('ชื่อสถานที่', inputH('name', x.name || ''))}
    ${fieldH('ที่อยู่', inputH('address', x.address || ''))}
    ${fieldH('ลิงก์แผนที่', inputH('mapUrl', x.mapUrl || '', 'url', 'https://maps…'))}
    <div class="field"><div class="between"><span class="label">วิธีไป</span><span class="muted" style="font-size:12px">แตะเพื่อเปลี่ยน</span></div>
      <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">${Object.entries(TRANSIT).map(([k, v]) => `<button type="button" class="opt ${(x.transit || 'bts') === k ? 'on' : ''}" data-opt="transit" data-v="${k}" style="flex-direction:column;justify-content:center;gap:3px;height:56px;font-size:11px;font-weight:600;padding:0"><span class="dot" style="width:10px;height:10px;background:${v.color}"></span>${v.label}</button>`).join('')}</div><input type="hidden" name="transit" value="${x.transit || 'bts'}"></div>
    <div class="grid2">${fieldH('สาย', inputH('line', x.line || '', 'text', 'สุขุมวิท'))}${fieldH('สถานี', inputH('station', x.station || ''))}</div>
    <div class="grid2">${fieldH('ทางออก', inputH('exit', x.exit || ''))}${fieldH('เดินต่อ (นาที)', inputH('walk', x.walk || '', 'number'))}</div>
    ${fieldH('วิธีเดินต่อ (บรรทัดละขั้น)', areaH('steps', x.steps || '', 'ลงทางออก 3 แล้วเดินตรง'))}
    <div class="grid2">${fieldH('แลกบัตร', inputH('card', x.card || ''))}${fieldH('ลิฟต์ / ชั้น', inputH('lift', x.lift || ''))}</div>
    <div class="grid2">${fieldH('ค่าโดยสาร', inputH('fare', x.fare || ''))}${fieldH('ที่จอดรถ', inputH('parking', x.parking || ''))}</div>
    ${fieldH('โน้ต', areaH('note', x.note || ''))}
    <button class="btn">บันทึก</button>${id ? `<button type="button" class="btn ghost" style="color:var(--warn-ink)" data-act="delRecord" data-list="places" data-id="${id}">ลบสถานที่นี้</button>` : ''}</form>`, bindOpts);
}
function sheetPerson(id) {
  const x = id ? byId('people', id) : {};
  openSheet(id ? 'แก้ไขข้อมูลคน' : 'คนที่เจอ', `<form class="stack" style="gap:14px" data-form="person" data-id="${id || ''}">
    <div class="grid2">${fieldH('ชื่อ', inputH('name', x.name || ''))}${fieldH('ชื่อเล่น', inputH('nickname', x.nickname || ''))}</div>
    <div class="grid2">${fieldH('องค์กร', inputH('org', x.org || ''))}${fieldH('ตำแหน่ง', inputH('role', x.role || ''))}</div>
    ${fieldH('หน้าตา / จุดสังเกต', inputH('looks', x.looks || ''))}
    ${fieldH('คุยเรื่องอะไร (บรรทัดละเรื่อง)', areaH('topics', x.topics || ''))}
    <div class="grid2">${fieldH('เจอที่', `<select class="input" name="placeId"><option value="">—</option>${db.places.map((p) => `<option value="${p.id}" ${p.id === x.placeId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`)}${fieldH('วันที่เจอ', inputH('metDate', x.metDate || today(), 'date'))}</div>
    ${fieldH('โปรเจกต์ที่เกี่ยว', projectSelect('projectId', (x.projectIds || [])[0]))}
    <button class="btn">บันทึก</button>${id ? `<button type="button" class="btn ghost" style="color:var(--warn-ink)" data-act="delRecord" data-list="people" data-id="${id}">ลบข้อมูลนี้</button>` : ''}</form>`);
}
function sheetNote(id) {
  const x = id ? byId('notes', id) : {};
  openSheet(id ? 'แก้ไขโน้ต' : 'โน้ตใหม่', `<form class="stack" style="gap:14px" data-form="note" data-id="${id || ''}">
    ${fieldH('หัวข้อ', inputH('title', x.title || ''))}
    ${fieldH('เนื้อหา', `<textarea class="input" name="body" style="height:140px">${esc(x.body || '')}</textarea>`)}
    <div class="grid2">${fieldH('แท็ก', inputH('tags', x.tags || '', 'text', 'แหล่งข้อมูล'))}${fieldH('โปรเจกต์', projectSelect('projectId', x.projectId))}</div>
    <button class="btn">บันทึก</button>${id ? `<button type="button" class="btn ghost" style="color:var(--warn-ink)" data-act="delRecord" data-list="notes" data-id="${id}">ลบโน้ตนี้</button>` : ''}</form>`);
}

/* ---------- รายละเอียด ---------- */
function sheetAlerts() {
  const rows = [
    ...db.projects.filter((p) => !['done', 'archived'].includes(p.status) && dueSoon(p.due)).map((p) => `<a class="lrow" href="#/project/${p.id}" data-act="closeSheet"><span class="av p1">${ic('warn', 18, 2)}</span><span class="grow"><span class="t">${esc(p.name)}</span><span class="muted" style="font-size:12px">กำหนดส่ง ${fmtDay(p.due)}</span></span></a>`),
    ...db.appts.filter((a) => today() >= a.start && today() <= (a.end || a.start)).map((a) => `<div class="lrow"><span class="av p2">${ic('cal', 18, 2)}</span><span class="grow"><span class="t">${esc(a.title)}</span><span class="muted" style="font-size:12px">นัดวันนี้${a.time ? ' · ' + a.time : ''}</span></span></div>`),
  ];
  openSheet('แจ้งเตือนในแอป', `<div class="stack">${rows.join('') || '<div class="empty">ไม่มีอะไรต้องรีบ วันนี้สบาย ๆ</div>'}</div>`);
}
function sheetStatDetail(kind) {
  const S = statsFor(ui.statPeriod);
  let title, rows;
  if (kind === 'closed') { title = 'ปิดโปรเจกต์'; rows = S.closed.map((p) => `<a class="lrow" href="#/project/${p.id}" data-act="closeSheet"><span class="av" style="background:var(--dark);color:var(--on-dark)">${ic('check', 18, 2.4)}</span><span class="grow"><span class="t">${esc(p.name)}</span><span class="muted" style="font-size:12px">ปิดเมื่อ ${fmtDay(p.doneAt)} · งานย่อย ${tasksOf(p.id).length}</span></span></a>`); }
  else if (kind === 'tasks') { title = 'to-do ที่ปิด'; rows = S.doneTasks.sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).map((x) => `<div class="lrow"><span class="av p4">${ic('check', 18, 2)}</span><span class="grow"><span class="t" style="font-weight:500">${esc(x.title)}</span><span class="muted" style="font-size:12px">${fmtDay(x.doneAt)}</span></span></div>`); }
  else { title = kind === 'in' ? 'เวลาเข้างาน' : 'เวลาเลิกงาน'; rows = S.logs.sort((a, b) => b.date.localeCompare(a.date)).map((l) => `<div class="lrow"><span class="av p2">${ic(kind === 'in' ? 'login' : 'logout', 18)}</span><span class="grow"><span class="t">${esc(l[kind])}</span><span class="muted" style="font-size:12px">${fmtDay(l.date)} · ${WORKTYPE[l.type]?.label || ''} · ${fmtDur(logMinutes(l))}</span></span>${l.date === today() ? `<span class="muted">วันนี้</span>` : ''}</div>`); }
  openSheet(`${title} · ${S.label}`, `<div class="stack">${rows.join('') || '<div class="empty">ยังไม่มีข้อมูลในช่วงนี้</div>'}</div>`);
}
function sheetArchiveMonth(y, m) {
  const inM = (k) => k && dateOf(k).getFullYear() === y && dateOf(k).getMonth() === m;
  const ps = db.projects.filter((p) => inM(p.archivedAt || p.doneAt));
  const ts = [...db.tasks, ...db.todos].filter((x) => x.done && inM(x.doneAt));
  openSheet(`${TH_MON_FULL[m]} ${be(y)}`, `<div class="grid2"><div class="card purple"><b style="font-size:24px;line-height:1.2">${ps.length}</b><div style="font-size:12px">โปรเจกต์ที่ปิด</div></div><div class="card dark"><b style="font-size:24px;line-height:1.2">${ts.length}</b><div style="font-size:12px;color:var(--on-dark-2)">งานที่เสร็จ</div></div></div>
    <div class="stack">${ps.map((p) => `<a class="lrow" href="#/project/${p.id}" data-act="closeSheet"><span class="av p4">${ic('box', 18, 2)}</span><span class="grow"><span class="t">${esc(p.name)}</span><span class="muted" style="font-size:12px">ปิด ${fmtShort(p.doneAt)} · ${tasksOf(p.id).length} งานย่อย</span></span></a>`).join('') || '<div class="empty">เดือนนี้ไม่มีโปรเจกต์ที่ปิด</div>'}</div>`);
}

/* ---------- การกระทำ ---------- */
const ACT = {
  closeSheet: () => closeSheet(),
  openCheckin: () => sheetCheckin(),
  openCheckout: () => sheetCheckout(),
  openPick: () => sheetPick(),
  openTodo: () => sheetTodo(),
  openAlerts: () => sheetAlerts(),
  openProject: (el) => sheetProject(el.dataset.id),
  projectMenu: (el) => sheetProjectMenu(el.dataset.id),
  openAppt: (el) => sheetAppt(el.dataset.id, el.dataset.k),
  openPlace: (el) => sheetPlace(el.dataset.id),
  openPerson: (el) => sheetPerson(el.dataset.id),
  openNote: (el) => sheetNote(el.dataset.id),
  editItem: (el) => (el.dataset.kind === 'task' ? sheetTask(el.dataset.id) : sheetTodo(el.dataset.id)),
  toggleItem: (el) => {
    const x = byId(el.dataset.kind === 'task' ? 'tasks' : 'todos', el.dataset.id); if (!x) return;
    x.done = !x.done; x.doneAt = x.done ? today() : null; save(); render();
  },
  planToday: (el) => { const x = byId('tasks', el.dataset.id); x.plannedFor = today(); x.movedFrom = null; save(); render(); toast('ใส่ใน to-do วันนี้แล้ว'); },
  pickConfirm: () => {
    const sel = $('.sheet')._sel; if (!sel?.size) return;
    sel.forEach((id) => { const x = byId('tasks', id); x.plannedFor = today(); x.movedFrom = null; });
    save(); closeSheet(); render(); toast(`ใส่ ${sel.size} งานในวันนี้แล้ว`);
  },
  delItem: (el) => {
    if (!confirm('ลบรายการนี้?')) return;
    const list = el.dataset.kind === 'task' ? 'tasks' : 'todos';
    db[list] = db[list].filter((x) => x.id !== el.dataset.id); save(); closeSheet(); render();
  },
  projFilter: (el) => { ui.projFilter = el.dataset.k; render(); },
  projDone: (el) => { const p = byId('projects', el.dataset.id); p.status = 'done'; p.doneAt = today(); save(); closeSheet(); render(); toast('เยี่ยม! ปิดโปรเจกต์แล้ว'); },
  projReopen: (el) => { const p = byId('projects', el.dataset.id); p.status = 'doing'; p.doneAt = null; p.archivedAt = null; save(); closeSheet(); render(); },
  delProject: (el) => {
    if (!confirm('ลบโปรเจกต์นี้และงานย่อยทั้งหมด?')) return;
    const id = el.dataset.id; db.projects = db.projects.filter((p) => p.id !== id); db.tasks = db.tasks.filter((x) => x.projectId !== id);
    save(); closeSheet(); location.hash = '#/projects';
  },
  delAppt: (el) => { db.appts = db.appts.filter((a) => a.id !== el.dataset.id); save(); closeSheet(); render(); },
  delRecord: (el) => {
    if (!confirm('ลบรายการนี้?')) return;
    db[el.dataset.list] = db[el.dataset.list].filter((x) => x.id !== el.dataset.id); save(); closeSheet();
    location.hash = '#/records/' + ({ places: 'place', people: 'person', notes: 'note' }[el.dataset.list]);
  },
  addVisit: (el) => {
    const x = byId('places', el.dataset.id); const pid = db.projects.find((p) => p.status === 'doing')?.id || '';
    (x.visits = x.visits || []).push({ date: today(), projectId: pid }); save(); render(); toast('บันทึกการมาวันนี้แล้ว');
  },
  goCalendar: (el) => { ui.calSel = el.dataset.k; ui.calMonth = el.dataset.k.slice(0, 7); location.hash = '#/calendar'; },
  calSel: (el) => { ui.calSel = el.dataset.k; render(); },
  calMove: (el) => { const [y, m] = ui.calMonth.split('-').map(Number); const d = new Date(y, m - 1 + Number(el.dataset.n), 1); ui.calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; render(); },
  recTab: (el) => { location.hash = '#/records/' + el.dataset.k; },
  statPeriod: (el) => { ui.statPeriod = el.dataset.k; render(); },
  statDetail: (el) => sheetStatDetail(el.dataset.k),
  archiveYear: (el) => { ui.archiveYear = Number(el.dataset.y); render(); },
  archiveMonth: (el) => sheetArchiveMonth(Number(el.dataset.y), Number(el.dataset.m)),
  cycleTheme: () => { const o = ['system', 'light', 'dark']; db.settings.theme = o[(o.indexOf(db.settings.theme) + 1) % 3]; save(); applyTheme(); render(); },
  backup: () => {
    db.settings.lastBackup = new Date().toISOString(); save();
    download(`rocket-life-backup-${today()}.json`, JSON.stringify(db, null, 2)); render(); toast('สำรองข้อมูลแล้ว');
  },
  restore: () => $('#restore-file').click(),
  exportCsv: () => {
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['ประเภท', 'วันที่', 'ชื่อ', 'โปรเจกต์', 'สถานะ/ประเภทวัน', 'เข้า', 'ออก', 'ชั่วโมง', 'ความรู้สึก', 'โน้ต']];
    db.timeLogs.forEach((l) => rows.push(['เช็กอิน', l.date, '', '', WORKTYPE[l.type]?.label + (l.leaveKind ? '/' + LEAVE_KIND[l.leaveKind] : ''), l.in, l.out, (logMinutes(l) / 60).toFixed(2), l.mood != null ? MOODS[l.mood].label : '', l.note || l.reason || '']));
    db.projects.forEach((p) => rows.push(['โปรเจกต์', p.doneAt || p.start, p.name, '', STATUS[p.status].label, '', '', '', '', p.desc]));
    db.tasks.forEach((x) => rows.push(['งานย่อย', x.doneAt || x.plannedFor, x.title, byId('projects', x.projectId)?.name, x.done ? 'เสร็จ' : 'ยังไม่เสร็จ', '', '', '', '', x.note]));
    db.todos.forEach((x) => rows.push(['to-do', x.doneAt || x.date, x.title, '', x.done ? 'เสร็จ' : 'ยังไม่เสร็จ', '', '', '', '', x.note]));
    download(`rocket-life-${today()}.csv`, '﻿' + rows.map((r) => r.map(q).join(',')).join('\n'), 'text/csv');
  },
  whatsNew: () => openSheet('มีอะไรใหม่', `<div class="news" style="padding:0">${CHANGELOG.map((v) => `<div><div class="ver">${esc(v.ver)}<span class="muted" style="font-size:12px;font-weight:400">${esc(v.date)}</span></div><ul>${v.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}</div>`),
  sample: () => { loadSample(); save(); render(); toast('ใส่ข้อมูลตัวอย่างแล้ว'); },
  wipe: () => { if (!confirm('ล้างข้อมูลทั้งหมด? (สำรองก่อนแล้วหรือยัง)')) return; db = blank(); save(); render(); },
};

/* ---------- ฟอร์ม ---------- */
const FORM = {
  checkin: (f, v) => {
    const l = { id: uid(), date: today(), type: v.type, in: v.type === 'leave' ? '' : v.in, out: '' };
    if (v.type === 'leave') { l.leaveKind = v.leaveKind || 'leave'; l.reason = v.reason; }
    db.timeLogs = db.timeLogs.filter((x) => x.date !== l.date); db.timeLogs.push(l); toast(v.type === 'leave' ? 'บันทึกวันลาแล้ว พักผ่อนนะ' : 'เช็กอินแล้ว สู้ ๆ นะ');
  },
  checkout: (f, v) => { const l = logOf(today()); Object.assign(l, { in: v.in, out: v.out, mood: v.mood === '' ? null : Number(v.mood), note: v.note }); toast('เลิกงานแล้ว พักผ่อนให้เต็มที่นะ'); },
  todo: (f, v) => {
    const id = f.dataset.id; const data = { title: v.title.trim(), priority: Number(v.priority), date: v.date || today(), note: v.note };
    if (!data.title) return false;
    if (id) Object.assign(byId('todos', id), data); else db.todos.push({ id: uid(), done: false, ...data });
  },
  task: (f, v) => { Object.assign(byId('tasks', f.dataset.id), { title: v.title.trim(), priority: Number(v.priority), plannedFor: v.plannedFor || null, due: v.due || null, note: v.note }); },
  addTask: (f, v) => {
    const title = (v.title || '').trim(); if (!title) return false;
    db.tasks.push({ id: uid(), projectId: f.dataset.id, title, done: false, order: tasksOf(f.dataset.id).length, plannedFor: null });
  },
  project: (f, v) => {
    const id = f.dataset.id;
    const data = { name: v.name.trim(), desc: v.desc, priority: Number(v.priority) || 2, start: v.start, due: v.due || null,
      categories: Object.keys(CATEGORIES).filter((k) => v['cat_' + k]) };
    if (v.status) data.status = v.status;
    if (!data.name) return false;
    if (id) Object.assign(byId('projects', id), data);
    else { const p = { id: uid(), status: data.status || 'todo', createdAt: today(), ...data }; db.projects.push(p); setTimeout(() => (location.hash = '#/project/' + p.id)); }
  },
  appt: (f, v) => {
    const id = f.dataset.id; const data = { title: v.title.trim(), start: v.start, end: v.end && v.end > v.start ? v.end : null, time: v.time, note: v.note };
    if (!data.title) return false;
    if (id) Object.assign(byId('appts', id), data); else db.appts.push({ id: uid(), ...data });
  },
  place: (f, v) => {
    const id = f.dataset.id; if (!v.name.trim()) return false;
    if (id) Object.assign(byId('places', id), v); else { const x = { id: uid(), createdAt: today(), visits: [], ...v }; db.places.push(x); setTimeout(() => (location.hash = '#/place/' + x.id)); }
  },
  person: (f, v) => {
    const id = f.dataset.id; if (!v.name.trim()) return false;
    const data = { ...v, projectIds: v.projectId ? [v.projectId] : [] }; delete data.projectId;
    if (id) Object.assign(byId('people', id), data); else { const x = { id: uid(), createdAt: today(), ...data }; db.people.push(x); setTimeout(() => (location.hash = '#/person/' + x.id)); }
  },
  note: (f, v) => {
    const id = f.dataset.id; if (!v.title.trim()) return false;
    if (id) Object.assign(byId('notes', id), v); else db.notes.push({ id: uid(), date: today(), ...v });
  },
};

/* ---------- ลากเพื่อจัดลำดับ to-do วันนี้ ---------- */
function bindDrag() {
  const list = $('#todo-list'); if (!list) return;
  list.addEventListener('pointerdown', (e) => {
    const g = e.target.closest('[data-grip]'); if (!g) return;
    e.preventDefault();
    const row = g.closest('.todo'); row.classList.add('dragging'); g.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.todo');
      if (over && over !== row && over.parentNode === list) {
        const r = over.getBoundingClientRect();
        list.insertBefore(row, ev.clientY < r.top + r.height / 2 ? over : over.nextSibling);
      }
    };
    const up = () => {
      row.classList.remove('dragging'); g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up);
      db.settings.todayOrder[today()] = $$('.todo', list).map((x) => x.dataset.id); save();
    };
    g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
  });
}

/* ---------- เราเตอร์ ---------- */
function render() {
  const [, route = 'today', arg] = (location.hash || '#/today').split('/');
  const V = {
    today: [viewToday, 'today'], projects: [viewProjects, 'projects'], project: [() => viewProject(arg), 'projects'], archive: [viewArchive, 'projects'],
    calendar: [viewCalendar, 'calendar'], records: [() => viewRecords(arg), 'records'], place: [() => viewPlace(arg), 'records'], person: [() => viewPerson(arg), 'records'],
    stats: [viewStats, 'stats'], settings: [viewSettings, 'today'],
  }[route] || [viewToday, 'today'];
  const view = $('#view');
  const focusId = document.activeElement?.id; const caret = document.activeElement?.selectionStart;
  view.innerHTML = V[0]();
  renderTabbar(V[1]);
  if (route === 'today') bindDrag();
  if (focusId === 'recq') { const i = $('#recq'); i.focus(); i.setSelectionRange(caret, caret); }
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  if (el.tagName === 'BUTTON' || el.dataset.act !== 'closeSheet') e.preventDefault();
  if (el.tagName === 'A' && el.dataset.act === 'closeSheet') { closeSheet(); location.hash = el.getAttribute('href'); return; }
  fn(el, e);
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const v = fd(f);
  if (FORM[f.dataset.form](f, v) === false) { toast('กรอกชื่อก่อนนะ'); return; }
  save(); if (f.closest('.sheet')) closeSheet(); render();
});
document.addEventListener('input', (e) => { if (e.target.id === 'recq') { ui.recQuery = e.target.value; render(); } });
document.addEventListener('change', (e) => {
  if (e.target.id !== 'restore-file') return;
  const file = e.target.files[0]; if (!file) return;
  file.text().then((txt) => {
    const d = JSON.parse(txt);
    if (!d || !d.schemaVersion || !Array.isArray(d.projects)) throw new Error('bad');
    if (!confirm('กู้คืนจากไฟล์นี้? ข้อมูลปัจจุบันจะถูกแทนที่')) return;
    db = { ...blank(), ...d, settings: { ...blank().settings, ...d.settings } }; save(); applyTheme(); render(); toast('กู้คืนข้อมูลแล้ว');
  }).catch(() => toast('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ Rocket Life'));
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
window.addEventListener('hashchange', () => { closeSheet(); render(); window.scrollTo(0, 0); });

/* ---------- ข้อมูลตัวอย่าง (ปุ่มในตั้งค่า) ---------- */
function loadSample() {
  const t = today(); const d = (n) => addDays(t, n);
  const P1 = uid(), P2 = uid(), P3 = uid(), P4 = uid(), P5 = uid();
  db.projects.push(
    { id: P1, name: 'อินโฟโรงไฟฟ้าภาคใต้ แยกตามชนิดเชื้อเพลิงและผู้ถือหุ้น', status: 'doing', priority: 1, start: d(-17), due: d(1), categories: ['infographic'], desc: 'ชุดอินโฟกราฟิกโรงไฟฟ้าในภาคใต้ แยกตามเชื้อเพลิง และสัดส่วนการถือหุ้น' },
    { id: P2, name: 'อินโฟพื้นที่น้ำท่วมรายภาค', status: 'doing', priority: 2, start: d(-10), due: d(5), categories: ['infographic', 'article'] },
    { id: P3, name: 'บทความน้ำท่วม กทม. ปี 54 เทียบ 69', status: 'waiting', priority: 3, start: d(-20), due: d(16), categories: ['article'] },
    { id: P4, name: 'อินโฟ CCS ชุด 4 แผ่น', status: 'done', priority: 2, start: d(-30), doneAt: d(-3), archivedAt: d(-2), categories: ['infographic'] },
    { id: P5, name: 'เกม True or False พลังงาน', status: 'todo', priority: 4, start: d(-5), due: d(30), categories: [] },
  );
  db.projects.find((p) => p.id === P4).status = 'archived';
  const T = (pid, title, done, extra = {}) => db.tasks.push({ id: uid(), projectId: pid, title, done, doneAt: done ? d(-1) : null, order: db.tasks.length, ...extra });
  T(P1, 'รวบรวมรายชื่อโรงไฟฟ้าภาคใต้', true); T(P1, 'แยกชนิดเชื้อเพลิง', true); T(P1, 'ทำตารางกำลังผลิต', true);
  T(P1, 'ตรวจตัวเลขรอบสุดท้าย', false, { plannedFor: t }); T(P1, 'ส่งงานขึ้นเพจ', false);
  T(P2, 'สรุปพื้นที่น้ำท่วมรายภาค (ไร่)', false, { plannedFor: t }); T(P2, 'หาแหล่งข้อมูลปี 69', false);
  T(P4, 'ร่างข้อความ 4 แผ่น', true); T(P4, 'ส่งกราฟิก', true);
  T(P5, 'ส่งการ์ดคำถามชุด 2 ให้ทีมดู', false, { plannedFor: t });
  db.todos.push({ id: uid(), title: 'ซื้อแฟ้มเก็บเอกสาร', date: t, priority: 4, done: false });
  [[-4, 'office', '09:10', '18:02', 1], [-3, 'office', '09:05', '17:40', 3], [-2, 'office', '09:20', '18:30', 2], [-1, 'office', '09:12', '18:05', 4]].forEach(([n, type, i, o, mood]) => {
    if (!logOf(d(n))) db.timeLogs.push({ id: uid(), date: d(n), type, in: i, out: o, mood });
  });
  db.appts.push({ id: uid(), title: 'คุยทีมกราฟิก', start: d(2), time: '14:00' }, { id: uid(), title: 'งานสัมมนาพลังงาน', start: d(8), end: d(10) });
  const pl = uid();
  db.places.push({ id: pl, name: '[ชื่อสถานที่]', address: '[ที่อยู่]', transit: 'bts', line: 'สุขุมวิท', station: '[สถานี]', exit: '3', walk: '5', steps: 'ลงบันไดเลื่อนทางออก 3 แล้วเดินตรง\nผ่านร้านสะดวกซื้อ เลี้ยวซ้ายเข้าซอย\nอาคารอยู่ขวามือ', card: 'ต้องแลก · ชั้น G', lift: 'ฝั่งซ้าย · ชั้น 12', createdAt: d(-9), visits: [{ date: d(-9), projectId: P1 }] });
  db.people.push({ id: uid(), name: '[ชื่อ นามสกุล]', org: '[องค์กร]', role: '[ตำแหน่ง]', looks: 'ใส่แว่นกรอบดำ', topics: 'รู้เรื่องสัญญาซื้อขายไฟโซลาร์ฟาร์ม\nส่งตัวเลขกำลังผลิตให้ได้', placeId: pl, metDate: d(-9), projectIds: [P1] });
  db.notes.push({ id: uid(), title: 'แหล่งข้อมูลกำลังผลิตโรงไฟฟ้า', body: '', tags: 'แหล่งข้อมูล', projectId: P1, date: d(-2) });
}

/* ---------- เริ่มแอป ---------- */
applyTheme();
runDailyRules();
render();
if (!logOf(today()) && db.settings.lastCheckinPrompt !== today() && (location.hash || '#/today').startsWith('#/today')) {
  db.settings.lastCheckinPrompt = today(); save(); setTimeout(sheetCheckin, 300);
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // เช็กเวอร์ชันใหม่ทุกครั้งที่กลับมาเปิดแอป และรีโหลดเองเมื่อมีตัวใหม่
  const hadSW = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadSW && !reloaded) { reloaded = true; location.reload(); } });
}
