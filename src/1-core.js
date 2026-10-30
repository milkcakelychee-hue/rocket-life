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
