
/* ---------- หน้าคอม (จอกว้าง ≥ 1024px): บอร์ดงานสลับ การ์ด / ตาราง / ปฏิทิน ----------
   ใช้ในหน้าวันนี้ และงานย่อยในหน้าโปรเจกต์ · ไฟล์นี้ต่อท้าย จึงใช้แต่ function / var (ถูกเรียกตอน render แรกก่อนบรรทัดพวกนี้รัน) */
function isDesk() { return window.matchMedia('(min-width: 1024px)').matches; }
var deskMQ = window.matchMedia('(min-width: 1024px)');
deskMQ.addEventListener('change', () => render());

// คอลัมน์ = สถานะงานย่อย (เก็บใน x.wait: null ต้องทำ · doing · info · review) + เสร็จแล้ว
function boardCols() {
  return [['todo', 'ต้องทำ', '#71717A'], ['doing', 'กำลังทำ', '#7C4DCC'], ['info', 'รอข้อมูล', '#E08A1E'], ['review', 'รอตรวจสอบ', '#9A9AA0'], ['done', 'เสร็จแล้ว', '#2E9E4F']];
}
function colOf(x) { return x.done ? 'done' : (x.wait || 'todo'); }
function dateOfItem(kind, x) { return kind === 'task' ? (x.plannedFor || x.due || null) : x.date; }
function itemRef(kind, id) { return byId(kind === 'task' ? 'tasks' : 'todos', id); }

// scope: 'today' (ทุก to-do ของวันนี้) หรือ id ของโปรเจกต์
function deskBoard(scope) {
  const v = ui.boardView || 'card';
  const tabs = [['card', 'cols', 'การ์ด'], ['table', 'table', 'ตาราง'], ['cal', 'cal', 'ปฏิทิน']]
    .map(([k, i, l]) => `<button class="vb ${v === k ? 'on' : ''}" data-act="boardView" data-k="${k}">${ic(i, 16, 2)}${l}</button>`).join('');
  const body = v === 'table' ? boardTable(scope) : v === 'cal' ? boardCal(scope) : boardCards(scope);
  return `<section class="board"><div class="between"><span class="muted" style="font-size:13px">${v === 'cal' ? 'ลากงานไปวันอื่นเพื่อเลื่อนวัน' : v === 'card' ? 'ลากการ์ดข้ามคอลัมน์เพื่อเปลี่ยนสถานะ' : 'แก้สถานะและวันได้ในตาราง'}</span><div class="vtabs">${tabs}</div></div>${body}</section>`;
}
function boardItems(scope) {
  if (scope === 'today') {
    var f = ui.todayFilter, q = (ui.deskQ || '').trim().toLowerCase();
    return todayItems(today()).filter((it) => (!f || todayBucket(it).indexOf(f) > -1) && (!q || it.ref.title.toLowerCase().indexOf(q) > -1));
  }
  return tasksOf(scope).map((x) => ({ kind: 'task', ref: x }));
}
function boardCard({ kind, ref }, showProj) {
  const proj = kind === 'task' ? byId('projects', ref.projectId) : null;
  const pri = ref.priority || proj?.priority || 4; const cat = allCats()[ref.cat];
  const PRI = { 1: '#D9533B', 2: '#7C4DCC', 3: '#E08A1E', 4: '#A1A1AA' };
  const d = dateOfItem(kind, ref); const late = d && d < today() && !ref.done;
  const tone = ref.done ? 'done' : ref.wait === 'info' || ref.wait === 'review' ? 'waiting' : '';
  const tag = ref.done ? '' : pri === 1 ? '<span class="btag hot">ด่วน</span>' : pri === 2 ? '<span class="btag">สำคัญ</span>' : '';
  return `<div class="bcard ${tone}" draggable="true" data-drag="${kind}:${ref.id}">
    <button class="grow" data-act="editItem" data-kind="${kind}" data-id="${ref.id}">
      <span class="t">${esc(ref.title)}</span>
      ${showProj ? `<span class="bproj">${proj ? esc(proj.name) : 'to-do ลอย'}</span>` : ''}
      <span class="bmeta"><span class="${late ? 'late' : ''}">${d ? fmtShort(d) : 'ไม่มีกำหนด'}</span>${tag}
      ${cat ? `<span class="bcat" title="${esc(cat.label)}">${ic(cat.icon, 12, 2)}</span>` : ''}</span>
    </button></div>`;
}
function boardCards(scope) {
  const items = boardItems(scope);
  return `<div class="bcols">${boardCols().map(([k, l, c]) => {
    const its = items.filter((it) => colOf(it.ref) === k);
    return `<div class="bcol" data-drop-col="${k}"><div class="between bcol-h"><span><i style="background:${c}"></i>${l}</span><span class="muted">${its.length}</span></div>
      ${its.map((it) => boardCard(it, scope === 'today')).join('') || '<div class="bempty">ลากมาวางที่นี่</div>'}</div>`;
  }).join('')}</div>`;
}
function boardTable(scope) {
  const items = boardItems(scope);
  if (!items.length) return '<div class="empty">ยังไม่มีงาน</div>';
  const st = (it) => `<select class="input tsel" data-set="col" data-ref="${it.kind}:${it.ref.id}">${boardCols().map(([k, l]) => `<option value="${k}" ${colOf(it.ref) === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const cols = scope === 'today' ? '2.2fr 1.4fr 1.1fr 1.1fr .9fr 1.1fr' : '2.6fr 1.1fr 1.1fr .9fr 1.1fr';
  return `<div class="btable" style="--cols:${cols}"><div class="brow bhead"><span>งาน</span>${scope === 'today' ? '<span>โปรเจกต์</span>' : ''}<span>สถานะ</span><span>ความสำคัญ</span><span>หมวด</span><span>วันที่ทำ</span></div>
    ${items.map((it) => { const x = it.ref; const proj = it.kind === 'task' ? byId('projects', x.projectId) : null; const pri = x.priority || proj?.priority || 4;
      return `<div class="brow ${x.done ? 'done' : ''}"><button class="t" data-act="editItem" data-kind="${it.kind}" data-id="${x.id}">${esc(x.title)}</button>${scope === 'today' ? `<span class="muted">${proj ? esc(proj.name) : 'to-do ลอย'}</span>` : ''}
        ${st(it)}<span>${PRIORITY[pri].label}</span><span class="muted">${allCats()[x.cat]?.label || '-'}</span>
        <input class="input tsel" type="date" data-set="date" data-ref="${it.kind}:${x.id}" value="${dateOfItem(it.kind, x) || ''}"></div>`; }).join('')}</div>`;
}
function boardCal(scope) {
  const start = addDays(mondayOf(today()), 7 * (ui.boardWeek || 0));
  const all = scope === 'today'
    ? [...db.tasks.filter((x) => x.plannedFor).map((x) => ({ kind: 'task', ref: x })), ...db.todos.filter((x) => x.date).map((x) => ({ kind: 'todo', ref: x }))]
    : boardItems(scope);
  const days = [...Array(7)].map((_, i) => addDays(start, i));
  return `<div class="between" style="margin:4px 0 8px"><button class="icon-btn sm" data-act="boardWeek" data-n="-1" aria-label="สัปดาห์ก่อน">${ic('back', 16, 2)}</button>
    <b>${fmtShort(days[0])} – ${fmtShort(days[6])}</b><button class="icon-btn sm" data-act="boardWeek" data-n="1" aria-label="สัปดาห์หน้า"><span style="transform:rotate(180deg);display:flex">${ic('back', 16, 2)}</span></button></div>
    <div class="bcal">${days.map((k) => { const its = all.filter((it) => dateOfItem(it.kind, it.ref) === k);
      return `<div class="bday ${k === today() ? 'today' : ''}" data-drop-day="${k}"><div class="muted" style="font-size:12px">${TH_DAY[dateOf(k).getDay()]} ${dateOf(k).getDate()}</div>
        ${its.map((it) => `<button class="bchip ${it.ref.done ? 'done' : ''}" draggable="true" data-drag="${it.kind}:${it.ref.id}" data-act="editItem" data-kind="${it.kind}" data-id="${it.ref.id}">${esc(it.ref.title)}</button>`).join('')}</div>`; }).join('')}</div>`;
}

function setCol(x, k) {
  x.done = k === 'done'; x.doneAt = x.done ? (x.doneAt || today()) : null;
  if (!x.done) x.wait = k === 'todo' ? null : k;
}
function setDate(kind, x, k) { if (kind === 'task') x.plannedFor = k || null; else { x.date = k || null; x.hold = !k; } }

// ลากวางด้วยเมาส์ (HTML5 drag & drop) · ผูกครั้งเดียวที่ document
document.addEventListener('dragstart', (e) => { const el = e.target.closest?.('[data-drag]'); if (!el) return; e.dataTransfer.setData('text/plain', el.dataset.drag); el.classList.add('dragging'); });
document.addEventListener('dragend', (e) => { e.target.closest?.('[data-drag]')?.classList.remove('dragging'); });
document.addEventListener('dragover', (e) => { const z = e.target.closest?.('[data-drop-col],[data-drop-day]'); if (!z) return; e.preventDefault(); $$('.drop-on').forEach((x) => x.classList.remove('drop-on')); z.classList.add('drop-on'); });
document.addEventListener('drop', (e) => {
  const z = e.target.closest?.('[data-drop-col],[data-drop-day]'); if (!z) return;
  e.preventDefault(); const [kind, id] = e.dataTransfer.getData('text/plain').split(':');
  if (kind === 'proj') { const pj = byId('projects', id); if (pj && z.dataset.dropCol) { pj.status = z.dataset.dropCol; pj.doneAt = pj.status === 'done' ? today() : null; save(); render(); } return; }
  const x = itemRef(kind, id); if (!x) return;
  if (z.dataset.dropCol) setCol(x, z.dataset.dropCol); else setDate(kind, x, z.dataset.dropDay);
  save(); render();
});
document.addEventListener('change', (e) => {
  const s = e.target.closest?.('[data-set]'); if (!s) return;
  const [kind, id] = s.dataset.ref.split(':'); const x = itemRef(kind, id); if (!x) return;
  if (s.dataset.set === 'col') setCol(x, s.value); else if (s.dataset.set === 'pri') x.priority = Number(s.value); else if (s.dataset.set === 'due') x.due = s.value || null; else setDate(kind, x, s.value);
  save(); render();
});
Object.assign(ACT, {
  boardView: (el) => { ui.boardView = el.dataset.k; try { localStorage.setItem('rocketlife-boardview', el.dataset.k); } catch (e) { /* ไม่เป็นไร */ } render(); },
  boardWeek: (el) => { ui.boardWeek = (ui.boardWeek || 0) + Number(el.dataset.n); render(); },
});
try { ui.boardView = localStorage.getItem('rocketlife-boardview') || 'card'; } catch (e) { ui.boardView = 'card'; }

/* ---------- เมนูซ้ายบนคอม ---------- */
function deskSidebar(active) {
  var nToday = todayItems(today()).filter((it) => !it.ref.done).length;
  var nProj = db.projects.filter((p) => !['done', 'archived'].includes(p.status)).length;
  var cur = /settings/.test(location.hash) ? 'settings' : active;
  var link = (href, key, icon, label, n) => `<a href="${href}" class="sb-a ${cur === key ? 'on' : ''}" ${cur === key ? 'aria-current="page"' : ''}>${ic(icon, 18, icon === 'dots9' ? 3 : 2)}<span>${label}</span>${n ? `<em>${n}</em>` : ''}</a>`;
  return `<div class="sb-brand"><span class="sb-logo">${ic('sun', 18, 2.2)}</span>Rocket Life</div>
    ${cur === 'today' || (cur === 'projects' && /^#\/projects/.test(location.hash)) ? `<label class="sb-search">${ic('search', 16, 2)}<input id="deskq" value="${esc(ui.deskQ || '')}" placeholder="${cur === 'today' ? 'ค้นหางานวันนี้' : 'ค้นหาโปรเจกต์'}" aria-label="ค้นหา"><kbd>/</kbd></label>` : ''}
    <div class="sb-g">งาน</div>
    ${link('#/today', 'today', 'sun', 'วันนี้', nToday)}
    ${link('#/projects', 'projects', 'folder', 'โปรเจกต์', nProj)}
    ${link('#/calendar', 'calendar', 'cal', 'ปฏิทิน')}
    <div class="sb-g">ชีวิต</div>
    ${link('#/records', 'records', 'note', 'บันทึก')}
    ${link('#/stats', 'stats', 'stats', 'สถิติ')}
    <div class="sb-foot">${link('#/settings', 'settings', 'dots9', 'ตั้งค่า')}</div>`;
}

/* ---------- หน้าวันนี้บนคอม ---------- */
function priOf(it) { var x = it.ref; var proj = it.kind === 'task' ? byId('projects', x.projectId) : null; return x.priority || (proj && proj.priority) || 4; }
function isLate(it) {
  var x = it.ref; if (x.done) return false;
  var proj = it.kind === 'task' ? byId('projects', x.projectId) : null; var d = dateOfItem(it.kind, x);
  return (d && d < today()) || dueSoon(x.due) || (proj && dueSoon(proj.due));
}
function todayBucket(it) { return [String(priOf(it))]; }
function deskWeek(t) {
  var mon = mondayOf(t);
  return `<div class="dweek">${[0, 1, 2, 3, 4, 5, 6].map((i) => {
    var k = addDays(mon, i), d = dateOf(k), l = logOf(k);
    var due = db.projects.some((p) => p.due === k && !['done', 'archived'].includes(p.status));
    var n = todayItems(k).filter((it) => !it.ref.done).length;
    var cls = k === t ? 'today' : k < t ? 'past' : '';
    return `<button data-act="goCalendar" data-k="${k}" class="${cls}" aria-label="${fmtFull(k)}">
      <span class="n">${TH_DAY[d.getDay()]}</span><span class="d">${d.getDate()}</span>
      <span class="dots">${l && l.mood != null ? flower(MOODS[l.mood].color, 12) : ''}${due ? '<span class="dot" style="background:var(--warn)"></span>' : ''}${k >= t && n ? `<span class="wn">${n} งาน</span>` : ''}</span></button>`;
  }).join('')}</div>`;
}
// ตารางงานทุกวัน (วันนี้เป็นต้นไป + ที่ค้าง) · พิมพ์เพิ่มงานได้เรื่อย ๆ
function deskTable(t) {
  var items = [
    ...db.tasks.filter((x) => !x.done && x.plannedFor).map((x) => ({ kind: 'task', ref: x })),
    ...db.todos.filter((x) => !x.done && x.date && !x.hold).map((x) => ({ kind: 'todo', ref: x })),
  ].sort((a, b) => { var da = dateOfItem(a.kind, a.ref), dbb = dateOfItem(b.kind, b.ref); return da < dbb ? -1 : da > dbb ? 1 : priOf(a) - priOf(b); });
  var priSel = (val, attr) => `<select class="input tsel" ${attr}>${[1, 2, 3, 4].map((p) => `<option value="${p}" ${val === p ? 'selected' : ''}>${PRIORITY[p].label}</option>`).join('')}</select>`;
  var last = '';
  var rows = items.map((it) => {
    var x = it.ref, d = dateOfItem(it.kind, x), proj = it.kind === 'task' ? byId('projects', x.projectId) : null;
    var head = '';
    if (d !== last) { last = d; head = `<div class="trow tday ${d < t ? 'late' : ''}">${d < t ? 'ค้างจาก ' + fmtShort(d) : d === t ? 'วันนี้ · ' + fmtShort(d) : TH_DAY[dateOf(d).getDay()] + ' ' + fmtShort(d)}</div>`; }
    return head + `<div class="trow"><button class="tick ${x.done ? 'on' : ''}" data-act="toggleItem" data-kind="${it.kind}" data-id="${x.id}" aria-label="ทำเสร็จ"></button>
      <button class="t" data-act="editItem" data-kind="${it.kind}" data-id="${x.id}">${esc(x.title)}</button>
      <span class="muted tproj">${proj ? esc(proj.name) : 'to-do ลอย'}</span>
      ${priSel(priOf(it), `data-set="pri" data-ref="${it.kind}:${x.id}"`)}
      <input class="input tsel" type="date" data-set="date" data-ref="${it.kind}:${x.id}" value="${d || ''}"></div>`;
  }).join('');
  return `<section class="dpanel dtable">
    <div class="dcard-h"><h2>งานทั้งหมด</h2><span class="muted">${items.length} งานที่ยังไม่เสร็จ</span></div>

    ${rows ? '<div class="trow thead"><span></span><span>งาน</span><span>โปรเจกต์</span><span>ความสำคัญ</span><span>วันที่ทำ</span></div>' : ''}
    <div class="trows">${rows || '<div class="side-empty">ยังไม่มีงาน</div>'}</div>
    <form class="qadd" id="qadd">${ic('plus', 16, 2.2)}<input name="title" id="qadd-t" placeholder="พิมพ์งานใหม่ แล้วกด Enter" autocomplete="off" aria-label="ชื่องานใหม่">
      ${qf('ความสำคัญ', priSel(4, 'name="priority" aria-label="ความสำคัญ"'))}${qf('วันที่ทำ', `<input class="input tsel" type="date" name="date" value="${ui.qaddDate || t}" aria-label="วันที่ทำ">`)}<button class="btn-d" type="submit">เพิ่ม</button></form></section>`;
}
// กล่องในแถวเพิ่มงาน มีหัวเล็ก ๆ บอกว่าเป็นช่องอะไร
function qf(label, inner) { return `<label class="qf"><span>${label}</span>${inner}</label>`; }
function deskQReset() { var r = (location.hash || '#/today').split('/')[1] || 'today'; if (ui.qRoute !== r) { ui.deskQ = ''; ui.qRoute = r; } }
function deskToday() {
  deskQReset();
  var t = today(), log = logOf(t);
  var phase = !log ? 'before' : (log.type === 'leave' || log.out) ? 'done' : 'working';
  var all = todayItems(t);
  var open = all.filter((it) => !it.ref.done);
  var cnt = { 1: 0, 2: 0, 3: 0, 4: 0 };
  open.forEach((it) => { cnt[priOf(it)]++; });
  var lateN = open.filter(isLate).length, doneN = all.length - open.length;
  var apptsToday = db.appts.filter((a) => a.start <= t && (a.end || a.start) >= t);
  var f = ui.todayFilter;
  var tile = (p) => `<button class="kpi ${f === String(p) ? 'on' : ''}" data-act="todayFilter" data-k="${p}" aria-pressed="${f === String(p)}">
    <span class="kpi-l"><span class="kpi-ic ${PRIORITY[p].cls}">${ic(PRIORITY[p].icon, 13, 2.4)}</span>${PRIORITY[p].label}</span><span class="kpi-n">${cnt[p]}</span></button>`;

  var checkBtn = phase === 'before' ? `<button class="btn-o" data-act="openCheckin">${ic('clock', 16, 2)}เช็กอิน</button>`
    : phase === 'working' ? `<button class="btn-o" data-act="openCheckout"><span class="pulse"></span>เช็กอิน ${esc(log.in)} · เช็กเอาต์</button>`
    : `<button class="btn-o" data-act="openCheckout">${ic('check', 16, 2)}เลิกงาน ${esc(log.out || '')}</button>`;
  var summary = `เสร็จ ${doneN}/${all.length} งาน${apptsToday.length ? ` · นัด ${apptsToday.length} ที่` : ''}${lateN ? ` · <span class="warn-t">${lateN} งานใกล้/เลยกำหนด</span>` : ''}`;

  var appts = apptsToday.length ? apptsToday.map((a) => {
    var pl = a.placeId && byId('places', a.placeId);
    return `<div class="side-row"><span class="side-ic">${ic('pin', 16, 2)}</span><span class="grow" style="min-width:0"><b>${esc(a.title)}</b><span class="muted">${pl ? esc(pl.name) : ''}${a.time ? ' · ' + esc(a.time) : ''}</span></span>
      ${pl && !a.visitId ? `<button class="btn-s" data-act="apptArrived" data-id="${a.id}">${ic('check', 14, 2.4)}ถึงแล้ว</button>` : a.visitId ? '<span class="muted" style="font-size:12px">ถึงแล้ว</span>' : ''}</div>`;
  }).join('') : '<div class="side-empty">ไม่มีนัดวันนี้</div>';

  var soon = db.projects.filter((p) => !['done', 'archived'].includes(p.status) && p.due).sort((a, b) => a.due < b.due ? -1 : 1).slice(0, 3);
  var projs = soon.length ? soon.map((p) => {
    var ts = tasksOf(p.id), dn = ts.filter((x) => x.done).length, left = diffDays(t, p.due);
    return `<a class="side-row" href="#/project/${p.id}"><span class="grow" style="min-width:0"><b>${esc(p.name)}</b><span class="prog"><i style="width:${ts.length ? Math.round(dn / ts.length * 100) : 0}%"></i></span></span>
      <span class="side-due ${left <= 1 ? 'late' : ''}">${left < 0 ? 'เลย ' + (-left) + ' วัน' : left === 0 ? 'วันนี้' : left === 1 ? 'พรุ่งนี้' : fmtShort(p.due)}</span></a>`;
  }).join('') : '<div class="side-empty">ไม่มีโปรเจกต์ที่มีกำหนดส่ง</div>';

  var held = db.todos.filter((x) => !x.done && x.hold);
  return `
  <header class="dhead">
    <div><h1 class="dtitle">${fmtFull(t)}</h1><p class="dsub">${summary}</p></div>
    <div class="row" style="gap:8px">${checkBtn}<button class="btn-d" data-act="openPick">${ic('plus', 16, 2.2)}เพิ่มงาน <kbd>N</kbd></button></div>
  </header>
  ${deskWeek(t)}
  <div class="kpis">${tile(1)}${tile(2)}${tile(3)}${tile(4)}</div>
  ${f || ui.deskQ ? `<div class="fbar">กำลังกรอง: <b>${f ? PRIORITY[f].label : ''}${f && ui.deskQ ? ' · ' : ''}${ui.deskQ ? '“' + esc(ui.deskQ) + '”' : ''}</b><button class="link-btn" data-act="todayFilter" data-k="">ล้าง</button></div>` : ''}
  <div class="dgrid">
    <div class="dmain">
      <section class="dpanel"><div class="dcard-h"><h2>To-do วันนี้</h2><span class="muted">ลากการ์ดข้ามคอลัมน์เพื่อเปลี่ยนสถานะ</span></div>${boardCards('today')}</section>
      ${deskTable(t)}
    </div>
    <aside class="dside">
      <section class="dcard"><div class="dcard-h"><h2>นัดวันนี้</h2><span class="muted">${apptsToday.length}</span></div>${appts}</section>
      <section class="dcard"><div class="dcard-h"><h2>โปรเจกต์ใกล้กำหนด</h2><a class="link-btn" href="#/projects">ทั้งหมด</a></div>${projs}</section>
      ${held.length ? `<section class="dcard"><div class="dcard-h"><h2>เลื่อนไว้ไม่มีกำหนด</h2><span class="muted">${held.length}</span></div>
        ${held.map((x) => `<div class="side-row"><button class="grow t" style="text-align:left;background:none;border:none;padding:0;color:inherit" data-act="editItem" data-kind="todo" data-id="${x.id}">${esc(x.title)}</button><button class="btn-s" data-act="unhold" data-id="${x.id}">ทำวันนี้</button></div>`).join('')}</section>` : ''}
    </aside>
  </div>`;
}
Object.assign(ACT, {
  todayFilter: (el) => { var k = el.dataset.k || null; if (!k) ui.deskQ = ''; ui.todayFilter = ui.todayFilter === k ? null : k; render(); },
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'qadd') return;
  e.preventDefault(); var fd = new FormData(e.target); var title = String(fd.get('title') || '').trim(); if (!title) return;
  ui.qaddDate = fd.get('date') || today();
  db.todos.push({ id: uid(), title: title, priority: Number(fd.get('priority')) || 4, date: ui.qaddDate, done: false, hold: false, cat: null });
  save(); render(); var i = $('#qadd-t'); if (i) i.focus();
});
document.addEventListener('input', (e) => {
  if (e.target.id !== 'deskq') return;
  ui.deskQ = e.target.value; var c = e.target.selectionStart; render();
  var i = $('#deskq'); if (i) { i.focus(); i.setSelectionRange(c, c); }
});
document.addEventListener('keydown', (e) => {
  if (!isDesk() || e.metaKey || e.ctrlKey || e.altKey) return;
  var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
  if (e.key === 'Escape' && document.activeElement?.id === 'deskq') { document.activeElement.blur(); return; }
  if (typing || $('.sheet')) return;
  if (e.key === '/' && $('#deskq')) { e.preventDefault(); $('#deskq').focus(); }
  else if ((e.key === 'n' || e.key === 'N' || e.key === 'ด') && ACT.openPick) { e.preventDefault(); ACT.openPick(); }
});
/* ---------- หน้ารายการโปรเจกต์บนคอม: ตาราง / บอร์ด ---------- */
function projCols() { return ['todo', 'doing', 'waiting', 'revise', 'hold', 'done']; }
function stDot(s) { return `<span class="stdot"><i style="background:${STATUS_COLOR[s] || '#A1A1AA'}"></i>${STATUS[s] ? STATUS[s].label : s}</span>`; }
function priTag(p) { return `<span class="kpi-ic ${PRIORITY[p || 4].cls}" title="${PRIORITY[p || 4].label}">${ic(PRIORITY[p || 4].icon, 12, 2.4)}</span>`; }
function dueTxt(due, done) {
  if (!due) return '<span class="muted">-</span>';
  if (done) return `<span class="muted">${fmtShort(due)}</span>`;
  var left = diffDays(today(), due);
  var txt = left < 0 ? 'เลย ' + (-left) + ' วัน' : left === 0 ? 'วันนี้' : left === 1 ? 'พรุ่งนี้' : 'อีก ' + left + ' วัน';
  return `<span class="pdue ${left <= 1 ? 'late' : left <= 7 ? 'soon' : ''}">${fmtShort(due)}<em>${txt}</em></span>`;
}
function deskProjects() {
  deskQReset();
  var t = today();
  var active = db.projects.filter((p) => p.status !== 'archived');
  var q = (ui.deskQ || '').trim().toLowerCase();
  var f = ui.projFilter || 'all', pf = ui.priFilter ? String(ui.priFilter) : '';
  var cnt = (s) => active.filter((p) => p.status === s).length;
  var soonN = active.filter((p) => p.status !== 'done' && p.due && diffDays(t, p.due) <= 3).length;
  var list = active.filter((p) => (f === 'all' || p.status === f) && (!pf || String(p.priority || 4) === pf) && (!q || p.name.toLowerCase().indexOf(q) > -1));
  var tabs = [['all', 'ทั้งหมด', active.length]].concat(projCols().filter((s) => s === 'todo' || s === 'doing' || s === 'waiting' || s === 'revise' || cnt(s)).map((s) => [s, STATUS[s].label, cnt(s)]))
    .map(([k, l, n]) => `<button class="ftab ${f === k ? 'on' : ''}" data-act="projFilter" data-k="${k}">${l}<em>${n}</em></button>`).join('');
  var v = ui.projView || 'table';
  var vt = [['table', 'table', 'ตาราง'], ['board', 'cols', 'บอร์ด']].map(([k, i, l]) => `<button class="vb ${v === k ? 'on' : ''}" data-act="projView" data-k="${k}">${ic(i, 16, 2)}${l}</button>`).join('');
  var body = v === 'board' ? projBoard(list) : projTable(list);
  return `
  <header class="dhead">
    <div><h1 class="dtitle">โปรเจกต์</h1><p class="dsub">กำลังทำ ${cnt('doing')} · ทั้งหมด ${active.length}${soonN ? ` · <span class="warn-t">ใกล้ส่ง ${soonN}</span>` : ''}</p></div>
    <div class="row" style="gap:8px"><a class="btn-o" href="#/archive">${ic('box', 16, 2)}Archive</a><button class="btn-d" data-act="openProject">${ic('plus', 16, 2.2)}โปรเจกต์ใหม่</button></div>
  </header>
  <div class="ftools"><div class="ftabs">${tabs}</div>
    <select class="input tsel" id="pri-sel" aria-label="กรองตามความสำคัญ" style="width:auto"><option value="">ทุกความสำคัญ</option>${[1, 2, 3, 4].map((p) => `<option value="${p}" ${pf === String(p) ? 'selected' : ''}>${PRIORITY[p].label}</option>`).join('')}</select>
    <div class="vtabs" style="margin-left:auto">${vt}</div></div>
  ${q ? `<div class="fbar">ค้นหา: <b>“${esc(ui.deskQ)}”</b><button class="link-btn" data-act="clearQ">ล้าง</button></div>` : ''}
  ${body}`;
}
function projTable(list) {
  if (!list.length) return '<div class="dpanel"><div class="side-empty">ยังไม่มีโปรเจกต์ในกลุ่มนี้</div></div>';
  var s = ui.projSort || 'due', dir = ui.projDir || 1;
  var key = { name: (p) => p.name, status: (p) => projCols().indexOf(p.status), pri: (p) => p.priority || 4, prog: (p) => progress(p), due: (p) => p.due || '9999' }[s];
  list = list.slice().sort((a, b) => { var x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * dir || (a.priority || 4) - (b.priority || 4); });
  var th = (k, l) => `<button class="th ${s === k ? 'on' : ''}" data-act="projSort" data-k="${k}">${l}${s === k ? `<span class="arr">${dir > 0 ? '↑' : '↓'}</span>` : ''}</button>`;
  return `<section class="dpanel ptable"><div class="prow phead"><span></span>${th('name', 'โปรเจกต์')}${th('status', 'สถานะ')}${th('pri', 'ความสำคัญ')}${th('prog', 'ความคืบหน้า')}<span class="th">งานย่อย</span>${th('due', 'กำหนดส่ง')}</div>
    ${list.map((p) => {
      var ts = tasksOf(p.id), dn = ts.filter((x) => x.done).length, pr = Math.round(progress(p) * 100), done = p.status === 'done';
      var cats = (p.categories || []).map((c) => allCats()[c] && allCats()[c].label).filter(Boolean).join(' · ');
      return `<div class="prow ${done ? 'done' : ''}">
        <button class="tick ${done ? 'on' : ''}" data-act="${done ? 'projReopen' : 'projDone'}" data-id="${p.id}" aria-label="${done ? 'ยกเลิกเสร็จ' : 'ปิดโปรเจกต์'}">${done ? ic('check', 14, 2.6) : ''}</button>
        <a class="pname" href="#/project/${p.id}"><b>${esc(p.name)}</b>${cats ? `<span>${esc(cats)}</span>` : ''}</a>
        ${stDot(p.status)}
        <span class="ppri">${priTag(p.priority)}<span>${PRIORITY[p.priority || 4].label}</span></span>
        <span class="pprog"><span class="prog"><i style="width:${pr}%"></i></span><b>${pr}%</b></span>
        <span class="muted pnum">${dn}/${ts.length}</span>
        ${dueTxt(p.due, done)}</div>`;
    }).join('')}</section>`;
}
function projBoard(list) {
  return `<div class="pcols">${projCols().filter((s) => s !== 'hold' || list.some((p) => p.status === 'hold')).map((s) => {
    var its = list.filter((p) => p.status === s);
    return `<div class="bcol" data-drop-col="${s}"><div class="between bcol-h"><span><i style="background:${STATUS_COLOR[s] || '#A1A1AA'}"></i>${STATUS[s].label}</span><span class="muted">${its.length}</span></div>
      ${its.map((p) => { var ts = tasksOf(p.id), pr = Math.round(progress(p) * 100);
        return `<div class="bcard ${s === 'done' ? 'done' : ''}" draggable="true" data-drag="proj:${p.id}"><a class="pcard-in" href="#/project/${p.id}">
          <span class="t">${esc(p.name)}</span>
          <span class="pprog" style="margin-top:8px"><span class="prog"><i style="width:${pr}%"></i></span><b>${ts.filter((x) => x.done).length}/${ts.length}</b></span>
          <span class="bmeta">${priTag(p.priority)}${p.due ? dueTxt(p.due, s === 'done') : '<span>ไม่มีกำหนดส่ง</span>'}</span></a></div>`; }).join('') || '<div class="bempty">ลากมาวางที่นี่</div>'}</div>`;
  }).join('')}</div>`;
}
Object.assign(ACT, {
  projView: (el) => { ui.projView = el.dataset.k; try { localStorage.setItem('rocketlife-projview', el.dataset.k); } catch (e) { /* ไม่เป็นไร */ } render(); },
  projSort: (el) => { var k = el.dataset.k; ui.projDir = ui.projSort === k ? -(ui.projDir || 1) : 1; ui.projSort = k; render(); },
  clearQ: () => { ui.deskQ = ''; render(); },
});
document.addEventListener('change', (e) => { if (e.target.id === 'pri-sel') { ui.priFilter = e.target.value || null; render(); } });
try { ui.projView = localStorage.getItem('rocketlife-projview') || 'table'; } catch (e) { ui.projView = 'table'; }
/* ---------- หน้าโปรเจกต์เดี่ยวบนคอม ---------- */
function deskProject(id) {
  var p = byId('projects', id);
  if (!p) return '<div class="empty">ไม่พบโปรเจกต์นี้</div>';
  var t = today(), ts = tasksOf(id), dn = ts.filter((x) => x.done).length, pr = Math.round(progress(p) * 100);
  var cats = (p.categories || []).map((c) => allCats()[c] && allCats()[c].label).filter(Boolean);

  // แถบเวลา
  var tl = '';
  if (p.due) {
    var start = p.start && p.start <= p.due ? p.start : p.due;
    var total = Math.max(1, diffDays(start, p.due)), passed = Math.min(total, Math.max(0, diffDays(start, t))), left = diffDays(t, p.due);
    var pct = Math.round(passed / total * 100);
    // กราฟแท่ง 2 แถว: เวลาที่ใช้ไป เทียบ งานที่เสร็จ · ส่วนที่เหลือเป็นลายทาง
    var behind = p.status !== 'done' && pr < pct;
    var bar = (label, used, usedTxt, restTxt, cls) => `<div class="pbc-row"><span class="pbc-l">${label}</span>
      <div class="pbc-track"><i class="${cls}" style="width:${used}%"></i>${used < 100 ? `<span class="pbc-rest" style="left:${used}%">${restTxt}</span>` : ''}</div>
      <span class="pbc-v"><b>${used}%</b><em>${usedTxt}</em></span></div>`;
    tl = `<section class="dpanel ptl"><div class="ptl-top"><div><span class="muted">เริ่ม</span><b>${fmtShort(start)}</b></div>
      <div class="ptl-stats"><span>ระยะเวลา <b>${total}</b> วัน</span><span>ผ่านมา <b>${passed}</b> วัน</span><span class="${left <= 1 && p.status !== 'done' ? 'warn-t' : ''}">${left < 0 ? 'เลยกำหนด <b>' + (-left) + '</b> วัน' : 'เหลือ <b>' + left + '</b> วัน'}</span>${p.status === 'done' ? '' : behind ? `<span class="warn-t">งานช้ากว่าเวลา ${pct - pr}%</span>` : '<span>งานทันเวลา</span>'}</div>
      <div style="text-align:right"><span class="muted">กำหนดส่ง</span><b>${fmtShort(p.due)}</b></div></div>
      <div class="ptl-bar"><i style="width:${pct}%"></i><span class="ptl-now" style="left:${pct}%"></span></div>
      <div class="pbc">${bar('งาน', pr, `เสร็จ ${dn}/${ts.length} งาน`, `เหลือ ${100 - pr}% · ${ts.length - dn} งาน`, behind ? 'work behind' : 'work')}</div></section>`;
  } else {
    tl = `<section class="dpanel ptl"><div class="ptl-top"><div><span class="muted">เริ่ม</span><b>${fmtShort(p.start) || '-'}</b></div><div class="ptl-stats"><span>เสร็จ <b>${pr}%</b> · ${dn}/${ts.length} งาน</span></div>
      <div style="text-align:right"><span class="muted">กำหนดส่ง</span><button class="link-btn" data-act="openProject" data-id="${id}" style="height:auto;padding:0">+ ตั้งวันส่ง</button></div></div></section>`;
  }

  // ตารางงานย่อย
  var priSel = (val, attr) => `<select class="input tsel" ${attr}>${[1, 2, 3, 4].map((n) => `<option value="${n}" ${val === n ? 'selected' : ''}>${PRIORITY[n].label}</option>`).join('')}</select>`;
  var rows = ts.slice().sort((a, b) => (a.done - b.done) || (a.order || 0) - (b.order || 0)).map((x) => {
    var pv = x.priority || p.priority || 4;
    return `<div class="trow strow ${x.done ? 'done' : ''}"><button class="tick ${x.done ? 'on' : ''}" data-act="toggleItem" data-kind="task" data-id="${x.id}" aria-label="${x.done ? 'ยกเลิกเสร็จ' : 'ทำเสร็จ'}">${x.done ? ic('check', 14, 2.6) : ''}</button>
      <button class="t" data-act="editItem" data-kind="task" data-id="${x.id}">${esc(x.title)}${x.link ? ` <span class="muted">${ic('link', 12, 2)}</span>` : ''}</button>
      ${priSel(pv, `data-set="pri" data-ref="task:${x.id}" aria-label="ความสำคัญ"`)}
      <input class="input tsel" type="date" data-set="date" data-ref="task:${x.id}" value="${x.plannedFor || ''}" aria-label="วันที่ทำ">
      <input class="input tsel" type="date" data-set="due" data-ref="task:${x.id}" value="${x.due || ''}" aria-label="กำหนดส่ง">
      ${!x.done && x.plannedFor !== t ? `<button class="btn-s" data-act="planToday" data-id="${x.id}" title="ใส่ใน to-do วันนี้">${ic('sun', 14, 2)}วันนี้</button>` : x.plannedFor === t && !x.done ? '<span class="muted" style="font-size:12px">อยู่ในวันนี้</span>' : '<span></span>'}</div>`;
  }).join('');

  // ผูกไว้กับ
  var places = db.places.filter((x) => (x.visits || []).some((v) => v.projectId === id));
  var people = db.people.filter((x) => (x.projectIds || []).includes(id));
  var notes = db.notes.filter((x) => x.projectId === id);
  var links = ts.filter((x) => x.link);
  var lrow = (icon, title, sub, attrs) => `<a class="side-row" ${attrs}><span class="side-ic">${ic(icon, 16, 2)}</span><span class="grow" style="min-width:0"><b>${esc(title)}</b>${sub ? `<span class="muted">${esc(sub)}</span>` : ''}</span></a>`;
  var linked = [
    ...places.map((x) => lrow('pin', x.name, x.province || '', `href="#/place/${x.id}"`)),
    ...people.map((x) => lrow('person', x.name, x.role || x.org || '', `href="#/person/${x.id}"`)),
    ...notes.map((x) => lrow('note', x.title || 'โน้ต', fmtShort(x.date), `href="#" data-act="openNote" data-id="${x.id}"`)),
  ].join('');

  return `
  <header class="dhead">
    <div style="min-width:0"><div class="dcrumb"><a href="#/projects">โปรเจกต์</a> › ${esc(p.name)}</div>
      <h1 class="dtitle">${esc(p.name)}</h1>
      <div class="row" style="gap:10px;flex-wrap:wrap">${stDot(p.status)}<span class="ppri">${priTag(p.priority)}<span>${PRIORITY[p.priority || 4].label}</span></span>${cats.length ? `<span class="muted" style="font-size:13px">${esc(cats.join(' · '))}</span>` : ''}</div>
      ${p.desc ? `<p class="dsub" style="margin-top:8px;max-width:70ch">${esc(p.desc)}</p>` : ''}</div>
    <div class="row" style="gap:8px"><button class="btn-o" data-act="openProject" data-id="${id}">${ic('edit', 16, 2)}แก้ไข</button><button class="btn-o" data-act="projectMenu" data-id="${id}" aria-label="เมนูเพิ่มเติม" style="padding:0 10px">${ic('more', 18, 3)}</button></div>
  </header>
  ${tl}
  <div class="dgrid">
    <div class="dmain">
      <section class="dpanel"><div class="dcard-h"><h2>งานย่อย <span class="muted" style="font-weight:400">${dn}/${ts.length}</span></h2><span class="muted">ลากการ์ดข้ามคอลัมน์เพื่อเปลี่ยนสถานะ</span></div>${boardCards(id)}</section>
      <section class="dpanel dtable"><div class="dcard-h"><h2>รายการงานย่อย</h2><span class="row" style="gap:12px"><span class="muted">แก้ความสำคัญ วันที่ทำ และกำหนดส่งได้ในตาราง</span>${floatTodos().length ? `<button class="btn-o" data-act="pullTodos" data-id="${id}">${ic('down', 16, 2)}ดึงจาก to-do ลอย <b>${floatTodos().length}</b></button>` : ''}</span></div>
        ${ts.length ? `<div class="trow strow thead"><span></span><span>งาน</span><span>ความสำคัญ</span><span>วันที่ทำ</span><span>กำหนดส่ง</span><span></span></div>` : ''}
        <div class="trows">${rows || '<div class="side-empty">ยังไม่มีงานย่อย พิมพ์ด้านล่างเพื่อเพิ่ม</div>'}</div>
        <form class="qadd" id="tadd" data-pid="${id}">${ic('plus', 16, 2.2)}<input name="title" id="tadd-t" placeholder="พิมพ์งานย่อยใหม่ แล้วกด Enter" autocomplete="off" aria-label="ชื่องานย่อยใหม่">
          ${qf('ความสำคัญ', priSel(p.priority || 4, 'name="priority" aria-label="ความสำคัญ"'))}${qf('วันที่ทำ', '<input class="input tsel" type="date" name="plannedFor" aria-label="วันที่ทำ">')}${qf('กำหนดส่ง', '<input class="input tsel" type="date" name="due" aria-label="กำหนดส่ง">')}<button class="btn-d" type="submit">เพิ่ม</button></form></section>
    </div>
    <aside class="dside">
      <section class="dcard"><div class="dcard-h"><h2>รายละเอียด</h2></div>
        <dl class="pdl"><dt>สถานะ</dt><dd>${stDot(p.status)}</dd><dt>หมวด</dt><dd>${esc(cats.join(' · ')) || '-'}</dd><dt>วันเริ่ม</dt><dd>${fmtShort(p.start) || '-'}</dd><dt>กำหนดส่ง</dt><dd>${p.due ? dueTxt(p.due, p.status === 'done') : '-'}</dd><dt>สร้างเมื่อ</dt><dd>${fmtShort(p.createdAt) || '-'}</dd></dl></section>
      <section class="dcard"><div class="dcard-h"><h2>ผูกไว้กับ</h2><span class="muted">${places.length + people.length + notes.length}</span></div>${linked || '<div class="side-empty">ยังไม่มีสถานที่ คน หรือโน้ตที่ผูกไว้</div>'}</section>
      ${links.length ? `<section class="dcard"><div class="dcard-h"><h2>ลิงก์</h2><span class="muted">${links.length}</span></div>${links.map((x) => lrow('link', x.title, x.link.replace(/^https?:\/\//, ''), `href="${esc(x.link)}" target="_blank" rel="noopener"`)).join('')}</section>` : ''}
    </aside>
  </div>`;
}
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'tadd') return;
  e.preventDefault(); var pid = e.target.dataset.pid, fd = new FormData(e.target), title = String(fd.get('title') || '').trim(); if (!title) return;
  db.tasks.push({ id: uid(), projectId: pid, title: title, done: false, wait: null, order: tasksOf(pid).length, priority: Number(fd.get('priority')) || null, plannedFor: fd.get('plannedFor') || null, due: fd.get('due') || null });
  save(); render(); var i = $('#tadd-t'); if (i) i.focus();
});
/* ---------- ปฏิทินบนคอม: เดือน / สัปดาห์ + แผงวันที่เลือก ---------- */
function calEvents(k) {
  var due = db.projects.filter((p) => p.due === k && p.status !== 'archived').map((p) => ({ kind: 'due', title: p.name, id: p.id, done: p.status === 'done' || !!p.doneAt }));
  var ap = db.appts.filter((a) => a.start <= k && (a.end || a.start) >= k).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
    .map((a) => ({ kind: 'appt', title: a.title, id: a.id, time: a.time, multi: !!(a.end && a.end !== a.start), first: a.start === k, last: (a.end || a.start) === k }));
  return due.concat(ap);
}
function calChip(e, k, col) {
  if (e.kind === 'due') return `<button class="cchip due ${e.done ? 'done' : ''}" data-act="goHash" data-href="#/project/${e.id}" title="กำหนดส่ง: ${esc(e.title)}">${ic('warn', 11, 2.4)}<span>${esc(e.title)}</span></button>`;
  var cont = e.multi && !e.first && col !== 0;
  return `<button class="cchip appt ${e.multi ? 'multi' : ''} ${e.multi && !e.first ? 'cl' : ''} ${e.multi && !e.last ? 'cr' : ''}" data-act="openAppt" data-id="${e.id}" title="${esc(e.title)}">${cont ? '<span>&nbsp;</span>' : `${e.time ? `<b>${esc(e.time)}</b>` : ''}<span>${esc(e.title)}</span>`}</button>`;
}
function deskCalendar() {
  var t = today();
  if (!ui.calMonth) ui.calMonth = t.slice(0, 7);
  if (!ui.calSel) ui.calSel = t;
  var v = ui.calView || 'month';
  var Y = Number(ui.calMonth.slice(0, 4)), M = Number(ui.calMonth.slice(5, 7));
  var wd = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
  var title, body;
  if (v === 'week') {
    var mon = mondayOf(ui.calSel), days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(mon, i));
    var a = dateOf(days[0]), b = dateOf(days[6]);
    title = `${a.getDate()}${a.getMonth() !== b.getMonth() ? ' ' + TH_MON[a.getMonth()] : ''} – ${b.getDate()} ${TH_MON_FULL[b.getMonth()]} ${be(b.getFullYear())}`;
    body = `<div class="cweek">${days.map((k, i) => {
      var d = dateOf(k), ev = calEvents(k), its = todayItems(k), l = logOf(k);
      return `<div class="cwcol ${k === t ? 'today' : ''} ${k < t ? 'past' : ''} ${i >= 5 ? 'wkend' : ''} ${k === ui.calSel ? 'sel' : ''}" data-drop-day="${k}">
        <button class="cwhead" data-act="calSel" data-k="${k}"><span>${wd[i]}</span><b>${d.getDate()}</b>${l && l.mood != null ? flower(MOODS[l.mood].color, 12) : ''}</button>
        <div class="cwbody">${ev.map((e) => calChip(e, k, 0)).join('')}
          ${its.map((it) => `<div class="cwtodo ${it.ref.done ? 'done' : ''}" draggable="true" data-drag="${it.kind}:${it.ref.id}"><button class="tick ${it.ref.done ? 'on' : ''}" data-act="toggleItem" data-kind="${it.kind}" data-id="${it.ref.id}" aria-label="ทำเสร็จ">${it.ref.done ? ic('check', 11, 2.8) : ''}</button><button class="t" data-act="editItem" data-kind="${it.kind}" data-id="${it.ref.id}">${esc(it.ref.title)}</button></div>`).join('')}
          ${!ev.length && !its.length ? '<div class="cwempty">ลากงานมาวางได้</div>' : ''}</div></div>`;
    }).join('')}</div>`;
  } else {
    title = `${TH_MON_FULL[M - 1]} ${be(Y)}`;
    var first = new Date(Y, M - 1, 1), daysIn = new Date(Y, M, 0).getDate(), off = (first.getDay() + 6) % 7;
    var total = Math.ceil((off + daysIn) / 7) * 7, cells = '';
    for (var i = 0; i < total; i++) {
      var col = i % 7, k = addDays(`${Y}-${pad(M)}-01`, i - off), d = dateOf(k), inM = d.getMonth() === M - 1;
      var ev = calEvents(k), n = todayItems(k).filter((it) => !it.ref.done).length, l = logOf(k);
      var chips = ev.slice(0, 3).map((e) => calChip(e, k, col)).join('');
      var more = ev.length - 3 + (n ? 1 : 0);
      cells += `<div class="ccell ${inM ? '' : 'out'} ${k === t ? 'today' : ''} ${k < t ? 'past' : ''} ${k === ui.calSel ? 'sel' : ''} ${col >= 5 ? 'wkend' : ''} ${col === 4 && isWfhFriday(k) ? 'wfh' : ''}" data-act="calSel" data-k="${k}">
        <div class="ccell-h"><span class="cnum">${d.getDate()}</span>${l && l.mood != null ? flower(MOODS[l.mood].color, 12) : ''}${col === 4 && isWfhFriday(k) ? '<span class="cwfh">WFH</span>' : ''}</div>
        ${chips}${ev.length > 3 ? `<span class="cmore">+${ev.length - 3} อื่น ๆ</span>` : n ? `<span class="cchip todo">${n} งาน</span>` : ''}</div>`;
    }
    body = `<div class="cmonth"><div class="cwd">${wd.map((x) => `<span>${x}</span>`).join('')}</div><div class="cgrid">${cells}</div></div>`;
  }
  var vt = [['month', 'เดือน'], ['week', 'สัปดาห์']].map(([k, l]) => `<button class="vb ${v === k ? 'on' : ''}" data-act="calView" data-k="${k}">${l}</button>`).join('');
  return `
  <header class="dhead">
    <div class="row" style="gap:12px;align-items:center"><h1 class="dtitle" style="margin:0">${title}</h1>
      <button class="icon-btn sm" data-act="calStep" data-n="-1" aria-label="ก่อนหน้า">${ic('left', 16, 2)}</button><button class="icon-btn sm" data-act="calStep" data-n="1" aria-label="ถัดไป">${ic('right', 16, 2)}</button></div>
    <div class="row" style="gap:8px"><div class="vtabs">${vt}</div><button class="btn-d" data-act="openAppt" data-k="${ui.calSel}">${ic('plus', 16, 2.2)}นัดหมาย</button></div>
  </header>
  <div class="dmain"><section class="dpanel cpanel">${body}</section>${calDay(ui.calSel, t)}</div>`;
}
function calMini(t) {
  var Y = Number(ui.calMonth.slice(0, 4)), M = Number(ui.calMonth.slice(5, 7));
  var off = (new Date(Y, M - 1, 1).getDay() + 6) % 7, daysIn = new Date(Y, M, 0).getDate(), out = '';
  for (var i = 0; i < Math.ceil((off + daysIn) / 7) * 7; i++) {
    var k = addDays(`${Y}-${pad(M)}-01`, i - off), d = dateOf(k), has = calEvents(k).length;
    out += `<button class="mday ${d.getMonth() !== M - 1 ? 'out' : ''} ${k === t ? 'today' : ''} ${k === ui.calSel ? 'sel' : ''}" data-act="calSel" data-k="${k}">${d.getDate()}${has ? '<i></i>' : ''}</button>`;
  }
  return `<section class="dcard mini"><div class="dcard-h"><h2>${TH_MON_FULL[M - 1]} ${be(Y)}</h2><span class="row" style="gap:2px"><button class="icon-btn sm" data-act="calMove" data-n="-1" aria-label="เดือนก่อน">${ic('left', 14, 2)}</button><button class="icon-btn sm" data-act="calMove" data-n="1" aria-label="เดือนถัดไป">${ic('right', 14, 2)}</button></span></div>
    <div class="mgrid">${['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((x) => `<span>${x}</span>`).join('')}${out}</div></section>`;
}
function calDay(s, t) {
  var l = logOf(s), ev = calEvents(s), its = todayItems(s), dn = its.filter((it) => it.ref.done).length;
  var rows = ev.map((e) => e.kind === 'due'
    ? `<a class="side-row" href="#/project/${e.id}"><span class="side-ic due">${ic('warn', 16, 2)}</span><span class="grow" style="min-width:0"><b>${esc(e.title)}</b><span class="muted">กำหนดส่ง</span></span></a>`
    : `<button class="side-row" style="width:100%;background:none;border-left:none;border-right:none;border-bottom:none;text-align:left;font:inherit;cursor:pointer" data-act="openAppt" data-id="${e.id}"><span class="side-ic">${ic('cal', 16, 2)}</span><span class="grow" style="min-width:0"><b>${esc(e.title)}</b><span class="muted">${e.time ? esc(e.time) : 'นัดหมาย'}</span></span></button>`).join('');
  var todos = its.map((it) => { var x = it.ref, proj = it.kind === 'task' ? byId('projects', x.projectId) : null;
    return `<div class="crow ${x.done ? 'done' : ''}"><button class="tick ${x.done ? 'on' : ''}" data-act="toggleItem" data-kind="${it.kind}" data-id="${x.id}" aria-label="ทำเสร็จ">${x.done ? ic('check', 13, 2.6) : ''}</button>
      <button class="t" data-act="editItem" data-kind="${it.kind}" data-id="${x.id}"><b>${esc(x.title)}</b><span class="muted">${proj ? esc(proj.name) : 'to-do ลอย'}</span></button>${priTag(x.priority || (proj && proj.priority))}</div>`; }).join('');
  return `<section class="dpanel cday"><div class="dcard-h"><div class="row" style="gap:14px;align-items:center"><h2>${fmtFull(s)}</h2>
      ${l && (l.mood != null || l.in) ? `<span class="cday-log">${l.mood != null ? `${flower(MOODS[l.mood].color, 16)}<b>${MOODS[l.mood].label}</b>` : ''}${l.in ? `<span class="muted">${esc(l.in)}${l.out ? ' – ' + esc(l.out) : ''}</span>` : ''}</span>` : ''}</div></div>
    <div class="cday-cols">
      <div class="cday-col"><div class="cday-ch"><h3>นัดหมาย · กำหนดส่ง <em>${ev.length}</em></h3><button class="btn-s" data-act="openAppt" data-k="${s}">${ic('plus', 14, 2)}นัดหมาย</button></div>
        <div class="cday-list">${rows || '<div class="side-empty">ไม่มีนัดหรือกำหนดส่ง</div>'}</div></div>
      <div class="cday-col"><div class="cday-ch"><h3>To-do <em>${dn}/${its.length}</em></h3></div>
        <div class="cday-list">${todos || '<div class="side-empty">ยังไม่มี to-do</div>'}</div>
        <form class="qadd" id="cadd" data-k="${s}">${ic('plus', 16, 2.2)}<input name="title" id="cadd-t" placeholder="เพิ่ม to-do วันนี้ แล้วกด Enter" autocomplete="off" aria-label="เพิ่ม to-do"><button class="btn-d" type="submit">เพิ่ม</button></form></div>
    </div></section>`;
}
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'cadd') return;
  e.preventDefault(); var title = String(new FormData(e.target).get('title') || '').trim(); if (!title) return;
  db.todos.push({ id: uid(), title: title, priority: 4, date: e.target.dataset.k, done: false, hold: false, cat: null });
  save(); render(); var i = $('#cadd-t'); if (i) i.focus();
});
Object.assign(ACT, {
  calView: (el) => { ui.calView = el.dataset.k; try { localStorage.setItem('rocketlife-calview', el.dataset.k); } catch (e) { /* ไม่เป็นไร */ } render(); },
  calToday: () => { ui.calSel = today(); ui.calMonth = today().slice(0, 7); render(); },
  calStep: (el) => {
    var n = Number(el.dataset.n);
    if ((ui.calView || 'month') === 'week') { ui.calSel = addDays(ui.calSel, 7 * n); ui.calMonth = ui.calSel.slice(0, 7); render(); }
    else ACT.calMove(el);
  },
  noop: () => {},
  provToggle: () => { ui.provOpen = !ui.provOpen; render(); },
  goHash: (el) => { location.hash = el.dataset.href; },
});
try { ui.calView = localStorage.getItem('rocketlife-calview') || 'month'; } catch (e) { ui.calView = 'month'; }
/* ---------- บันทึกบนคอม: สถานที่ / คน / โน้ต ---------- */
// แบ่งจังหวัดตามภาค (6 ภาค) · จังหวัดที่ไม่อยู่ในรายการ = ภาคกลาง
function regionOf(p) {
  var R = {
    'ภาคเหนือ': 'เชียงราย เชียงใหม่ น่าน พะเยา แพร่ แม่ฮ่องสอน ลำปาง ลำพูน อุตรดิตถ์',
    'ภาคตะวันออกเฉียงเหนือ': 'กาฬสินธุ์ ขอนแก่น ชัยภูมิ นครพนม นครราชสีมา บึงกาฬ บุรีรัมย์ มหาสารคาม มุกดาหาร ยโสธร ร้อยเอ็ด เลย ศรีสะเกษ สกลนคร สุรินทร์ หนองคาย หนองบัวลำภู อำนาจเจริญ อุดรธานี อุบลราชธานี',
    'ภาคตะวันตก': 'กาญจนบุรี ตาก ประจวบคีรีขันธ์ เพชรบุรี ราชบุรี',
    'ภาคตะวันออก': 'จันทบุรี ฉะเชิงเทรา ชลบุรี ตราด ปราจีนบุรี ระยอง สระแก้ว',
    'ภาคใต้': 'กระบี่ ชุมพร ตรัง นครศรีธรรมราช นราธิวาส ปัตตานี พังงา พัทลุง ภูเก็ต ระนอง สตูล สงขลา สุราษฎร์ธานี ยะลา',
  };
  for (var k in R) if (R[k].split(' ').indexOf(p) > -1) return k;
  return 'ภาคกลาง';
}
function provRegions(provs) {
  var order = ['ภาคกลาง', 'ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออก', 'ภาคตะวันตก', 'ภาคใต้'];
  var g = {}; provs.forEach(([p, c]) => { var r = regionOf(p); (g[r] = g[r] || []).push([p, c]); });
  var open = !!ui.provOpen;
  return `<section class="dcard"><button class="dcard-h prov-h" data-act="provToggle" aria-expanded="${open}"><h2>จังหวัดที่ไปมาแล้ว <span class="muted" style="font-weight:400">${provs.length}</span></h2><span class="prov-chev ${open ? 'up' : ''}">${ic('right', 16, 2)}</span></button>
    ${order.filter((r) => g[r]).map((r) => `<div class="prov-reg"><div class="side-row"><span class="grow"><b>${r}</b></span><span class="muted">${g[r].length} จังหวัด</span></div>
      ${open ? g[r].map(([p, c]) => `<div class="side-row prov-p"><span class="grow">${esc(p)}</span><span class="muted">${c} แห่ง</span></div>`).join('') : ''}</div>`).join('')}
    <button class="link-btn prov-more" data-act="provToggle">${open ? 'ซ่อน' : 'ดูทั้งหมด'}</button></section>`;
}
function deskRecords(tab) {
  if (tab) ui.recTab = tab;
  var T = ui.recTab || 'place';
  var q = (ui.recQuery || '').trim().toLowerCase();
  var hit = function () { return !q || Array.prototype.join.call(arguments, ' ').toLowerCase().indexOf(q) > -1; };
  var n = { place: db.places.length, person: db.people.length, note: db.notes.length };
  var L = { place: ['สถานที่', 'openPlace', 'pin'], person: ['คน', 'openPerson', 'person'], note: ['โน้ต', 'openNote', 'note'] };
  var tabs = Object.keys(L).map((k) => `<button class="ftab ${T === k && !q ? 'on' : ''}" data-act="recTab" data-k="${k}">${ic(L[k][2], 16, 2)}${L[k][0]}<em>${n[k]}</em></button>`).join('');
  var body;
  if (q) {
    var res = [
      ...db.projects.filter((p) => hit(p.name, p.desc)).map((p) => ['โปรเจกต์', 'folder', p.name, STATUS[p.status] ? STATUS[p.status].label : '', `href="#/project/${p.id}"`]),
      ...db.places.filter((x) => hit(x.name, x.address, x.station, x.note, x.province)).map((x) => ['สถานที่', 'pin', x.name, [x.cat, x.province].filter(Boolean).join(' · '), `href="#/place/${x.id}"`]),
      ...db.people.filter((x) => hit(x.name, x.nickname, x.org, x.topics, x.looks)).map((x) => ['คน', 'person', x.name, x.org || '', `href="#/person/${x.id}"`]),
      ...db.notes.filter((x) => hit(x.title, x.body, x.tags)).map((x) => ['โน้ต', 'note', x.title || 'โน้ต', x.tags ? '#' + x.tags : '', `href="#" data-act="openNote" data-id="${x.id}"`]),
    ];
    body = `<section class="dpanel rtable">${res.map((r) => `<a class="rrow rq" ${r[4]}><span class="side-ic">${ic(r[1], 16, 2)}</span><span class="rname"><b>${esc(r[2])}</b><span>${esc(r[3])}</span></span><span class="muted">${r[0]}</span></a>`).join('') || '<div class="side-empty">ไม่พบผลลัพธ์</div>'}</section>`;
  } else if (T === 'person') {
    body = `<section class="dpanel rtable"><div class="rrow rp rhead"><span>ชื่อ</span><span>องค์กร</span><span>เจอที่</span><span>เจอล่าสุด</span><span>โปรเจกต์ที่เกี่ยว</span></div>
      ${db.people.slice().sort((a, b) => (b.metDate || '').localeCompare(a.metDate || '')).map((x) => { var pl = byId('places', x.placeId);
        return `<a class="rrow rp" href="#/person/${x.id}"><span class="rname row" style="gap:10px;flex-direction:row;align-items:center"><span class="rav">${esc((x.name || '?').trim()[0])}</span><span style="min-width:0"><b>${esc(x.name)}</b>${x.nickname ? `<span>${esc(x.nickname)}</span>` : ''}</span></span>
          <span class="muted">${esc(x.org || '-')}</span><span class="muted">${pl ? esc(pl.name) : '-'}</span><span class="muted tnum2">${x.metDate ? fmtShort(x.metDate) : '-'}</span>
          <span class="rtags">${(x.projectIds || []).map((pid) => byId('projects', pid)).filter(Boolean).map((p) => `<span class="btag">${esc(p.name)}</span>`).join('') || '<span class="muted">-</span>'}</span></a>`; }).join('') || '<div class="side-empty">ยังไม่มีคน กด "+ เพิ่ม" เพื่อเพิ่ม</div>'}</section>`;
  } else if (T === 'note') {
    body = `<div class="rnotes">${db.notes.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((x) => { var pj = byId('projects', x.projectId);
      return `<button class="rnote" data-act="openNote" data-id="${x.id}"><b>${esc(x.title || 'โน้ต')}</b>${x.body ? `<p>${esc(x.body)}</p>` : ''}
        <span class="rnote-f">${x.tags ? `<span class="btag">#${esc(x.tags)}</span>` : ''}${pj ? `<span class="muted">${ic('folder', 12, 2)} ${esc(pj.name)}</span>` : ''}<span class="muted" style="margin-left:auto">${x.date ? fmtShort(x.date) : ''}</span></span></button>`; }).join('') || '<div class="dpanel"><div class="side-empty">ยังไม่มีโน้ต</div></div>'}</div>`;
  } else {
    var places = db.places.filter((x) => !ui.placeCat || x.cat === ui.placeCat).map((x) => { var vs = (x.visits || []).map((v) => v.date).sort(); return { x: x, n: vs.length, last: vs[vs.length - 1] }; })
      .sort((a, b) => (b.last || '').localeCompare(a.last || '') || a.x.name.localeCompare(b.x.name, 'th'));
    var how = (x) => { var tr = trOf(x.transit), k = transitKind(x.transit); return k === 'car' ? 'รถยนต์' : k === 'walk' ? 'เดิน' : `${tr.label}${x.station ? ' · ' + x.station : ''}${x.exit ? ' ทางออก ' + x.exit : ''}`; };
    var been = {}; db.places.forEach((x) => { if (x.province) been[x.province] = (been[x.province] || 0) + 1; });
    var provs = Object.entries(been).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'th'));
    body = `<div class="dgrid rgrid"><aside class="dside">${provinceMap()}${provs.length ? provRegions(provs) : ''}</aside>
      <div class="dmain">${placeCatChips()}
      <section class="dpanel rtable"><div class="rrow rpl rhead"><span>สถานที่</span><span>จังหวัด</span><span>วิธีไป</span><span>ไปมาแล้ว</span><span>ล่าสุด</span></div>
      ${places.map((r) => `<a class="rrow rpl" href="#/place/${r.x.id}"><span class="rname row" style="gap:10px;flex-direction:row;align-items:center"><span class="side-ic">${ic(catIcon(r.x.cat), 16, 2)}</span><span style="min-width:0"><b>${esc(r.x.name)}</b>${r.x.cat ? `<span>${esc(r.x.cat)}</span>` : ''}</span></span>
        <span class="muted">${esc(r.x.province || '-')}</span><span class="muted rhow">${esc(how(r.x))}</span><span class="tnum2">${r.n ? r.n + ' ครั้ง' : '<span class="muted">-</span>'}</span><span class="muted tnum2">${r.last ? fmtShort(r.last) : '-'}</span></a>`).join('') || '<div class="side-empty">ยังไม่มีสถานที่</div>'}</section></div></div>`;
  }
  return `
  <header class="dhead">
    <div><h1 class="dtitle">บันทึก</h1><p class="dsub">สถานที่ ${n.place} · คน ${n.person} · โน้ต ${n.note}</p></div>
    <button class="btn-d" data-act="${L[T][1]}">${ic('plus', 16, 2.2)}เพิ่ม${L[T][0]}</button>
  </header>
  <div class="ftools"><div class="ftabs">${tabs}</div>
    <label class="sb-search rsearch">${ic('search', 16, 2)}<input id="recq" value="${esc(ui.recQuery || '')}" placeholder="ค้นหาทุกอย่าง: โปรเจกต์ สถานที่ คน โน้ต" aria-label="ค้นหารวม"></label></div>
  ${body}`;
}
/* ---------- หน้ารายละเอียดสถานที่ / คน บนคอม ---------- */
function deskPlace(id) {
  var x = byId('places', id); if (!x) return '<div class="empty">ไม่พบสถานที่</div>';
  if ((x.visits || []).some((v) => !v.id)) { x.visits = x.visits.map((v) => (v.id ? v : Object.assign({}, v, { id: uid() }))); save(); }
  var visits = (x.visits || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  var tr = trOf(x.transit), kind = transitKind(x.transit);
  var steps = (x.steps || '').split('\n').filter(Boolean);
  var big = (label, val, hi) => `<div class="pfact ${hi ? 'hi' : ''}"><span>${label}</span><b>${esc(val || '-')}</b></div>`;
  var route = kind === 'car' || kind === 'walk'
    ? `<div class="pfacts">${big('วิธีไป', tr.label, true)}${kind === 'car' ? big('ขับรถ', x.driveMin ? '~' + x.driveMin + ' นาที' : '') + big('ที่จอดรถ', x.parking) : big('เดิน', x.walk ? '~' + x.walk + ' นาที' : '')}</div>`
    : `<div class="pfacts"><div class="pfact hi"><span>${esc(tr.label)}${x.line ? ' ' + esc(x.line) : ''}</span><b>${esc(x.station || '-')}</b></div>${big('ทางออก', x.exit)}${big('เดินต่อ', x.walk ? '~' + x.walk + ' นาที' : '')}</div>`;
  var small = [['card', 'แลกบัตร', x.card], ['lift', 'ลิฟต์', x.lift], ['coin', 'ค่าโดยสาร', x.fare], ['parking', 'ที่จอดรถ', kind === 'car' ? '' : x.parking]].filter((r) => r[2]);
  return `
  <header class="dhead">
    <div style="min-width:0"><div class="dcrumb"><a href="#/records/place" data-act="goBack">บันทึก</a> › สถานที่</div>
      <h1 class="dtitle">${esc(x.name)}</h1>
      <div class="row" style="gap:8px;flex-wrap:wrap">${x.cat ? `<span class="btag">${ic(catIcon(x.cat), 12, 2)}&nbsp;${esc(x.cat)}</span>` : ''}${x.province ? `<span class="btag gray">${ic('map', 12, 2)}&nbsp;${esc(x.province)}</span>` : ''}<span class="muted" style="font-size:13px">ไปมาแล้ว ${visits.length} ครั้ง${visits[0] ? ' · ล่าสุด ' + fmtShort(visits[0].date) : ''}</span></div>
      ${x.address ? `<p class="dsub" style="margin-top:8px">${esc(x.address)}</p>` : ''}</div>
    <div class="row" style="gap:8px">${x.mapUrl ? `<a class="btn-o" href="${esc(x.mapUrl)}" target="_blank" rel="noopener">${ic('map', 16, 2)}เปิดแผนที่</a>` : ''}<button class="btn-o" data-act="openPlace" data-id="${id}">${ic('edit', 16, 2)}แก้ไข</button></div>
  </header>
  <div class="dgrid">
    <div class="dmain">
      <section class="dpanel"><div class="dcard-h"><h2>วิธีไป</h2></div>${route}
        ${steps.length ? `<ol class="psteps">${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}</section>
      ${small.length ? `<div class="pmini">${small.map((r) => `<div class="dcard pmini-i"><span class="side-ic">${ic(r[0], 16, 2)}</span><span><span class="muted">${r[1]}</span><b>${esc(r[2])}</b></span></div>`).join('')}</div>` : ''}
      ${x.note ? `<section class="dpanel"><div class="dcard-h"><h2>โน้ต</h2></div><p class="pnote">${esc(x.note)}</p></section>` : ''}
    </div>
    <aside class="dside">
      <section class="dcard"><div class="dcard-h"><h2>บันทึกการไป <span class="muted" style="font-weight:400">${visits.length}</span></h2><button class="btn-s" data-act="addVisit" data-id="${id}">${ic('plus', 14, 2)}บันทึก</button></div>
        ${visits.map((v) => { var pj = byId('projects', v.projectId);
          return `<button class="side-row vrow" data-act="editVisit" data-place="${id}" data-id="${v.id}"><span class="vdate"><b>${dateOf(v.date).getDate()}</b><span>${TH_MON[dateOf(v.date).getMonth()]}</span></span><span class="grow" style="min-width:0"><b>${pj ? esc(pj.name) : 'ไม่ได้ผูกโปรเจกต์'}</b><span class="muted">${esc(v.note || fmtFull(v.date))}</span></span></button>`; }).join('') || '<div class="side-empty">ยังไม่มีบันทึกการไป</div>'}</section>
    </aside>
  </div>`;
}
function deskPerson(id) {
  var x = byId('people', id); if (!x) return '<div class="empty">ไม่พบข้อมูล</div>';
  var place = byId('places', x.placeId);
  var topics = (x.topics || '').split('\n').filter(Boolean);
  var projs = (x.projectIds || []).map((pid) => byId('projects', pid)).filter(Boolean);
  return `
  <header class="dhead">
    <div class="row" style="gap:16px;align-items:center;min-width:0"><span class="rav big">${esc((x.name || '?').trim()[0])}</span>
      <div style="min-width:0"><div class="dcrumb"><a href="#/records/person" data-act="goBack">บันทึก</a> › คน</div>
      <h1 class="dtitle" style="margin:2px 0 0">${esc(x.name)}</h1>
      <p class="dsub">${[x.nickname && 'ชื่อเล่น ' + x.nickname, x.role, x.org].filter(Boolean).map(esc).join(' · ') || '&nbsp;'}</p></div></div>
    <button class="btn-o" data-act="openPerson" data-id="${id}">${ic('edit', 16, 2)}แก้ไข</button>
  </header>
  <div class="dgrid">
    <div class="dmain">
      <section class="dpanel"><div class="dcard-h"><h2>${ic('chat', 16, 2)}&nbsp;คุยเรื่องอะไร / สำคัญเรื่องไหน</h2></div>
        ${topics.length ? `<ul class="ptopics">${topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<div class="side-empty">ยังไม่ได้จด</div>'}</section>
      <section class="dpanel"><div class="dcard-h"><h2>${ic('eye', 16, 2)}&nbsp;หน้าตา / จุดสังเกต</h2></div>
        ${x.looks ? `<p class="pnote">${esc(x.looks)}</p>` : '<div class="side-empty">ยังไม่ได้จด</div>'}</section>
    </div>
    <aside class="dside">
      <section class="dcard"><div class="dcard-h"><h2>ข้อมูล</h2></div>
        <dl class="pdl"><dt>องค์กร</dt><dd>${esc(x.org || '-')}</dd><dt>ตำแหน่ง</dt><dd>${esc(x.role || '-')}</dd><dt>เจอครั้งแรก</dt><dd>${x.metDate ? fmtShort(x.metDate) : '-'}</dd></dl></section>
      <section class="dcard"><div class="dcard-h"><h2>เจอกันที่</h2></div>
        ${place ? `<a class="side-row" href="#/place/${place.id}"><span class="side-ic">${ic('pin', 16, 2)}</span><span class="grow" style="min-width:0"><b>${esc(place.name)}</b><span class="muted">${esc(place.province || '')}</span></span></a>` : '<div class="side-empty">ยังไม่ได้ระบุ</div>'}</section>
      <section class="dcard"><div class="dcard-h"><h2>โปรเจกต์ที่เกี่ยว</h2><span class="muted">${projs.length}</span></div>
        ${projs.map((p) => `<a class="side-row" href="#/project/${p.id}"><span class="side-ic">${ic('folder', 16, 2)}</span><span class="grow" style="min-width:0"><b>${esc(p.name)}</b><span class="muted">${STATUS[p.status] ? STATUS[p.status].label : ''}</span></span></a>`).join('') || '<div class="side-empty">ยังไม่ได้ผูกโปรเจกต์</div>'}</section>
    </aside>
  </div>`;
}
/* ---------- สถิติบนคอม ---------- */
// งานย่อย / to-do ที่ปิดได้ แยกตามหมวด (ใช้หมวดของงาน ถ้าไม่มีใช้หมวดแรกของโปรเจกต์) · ใช้ทั้งคอมและมือถือ
function doneCatOf(x) { var pj = x.projectId ? byId('projects', x.projectId) : null; return x.cat || (pj && (pj.categories || [])[0]) || '_none'; }
function statCats(S, thisW) {
  var g = {}, cats = allCats();
  S.doneTasks.forEach((x) => { var k = doneCatOf(x); g[k] = (g[k] || 0) + 1; });
  var rows = Object.entries(g).sort((a, b) => b[1] - a[1]);
  var max = Math.max(1, ...rows.map((r) => r[1]));
  return `<section class="dpanel card scat"><div class="dcard-h"><h2>งานที่ปิด${thisW} แยกตามหมวด</h2><span class="muted">${S.doneTasks.length} ชิ้น</span></div>
    ${rows.map(([k, n]) => { var c = cats[k];
      return `<button class="scat-row" data-act="catDetail" data-k="${esc(k)}"><span class="scat-l">${c ? ic(c.icon, 14, 2) : ic('minus', 14, 2)}<span>${c ? esc(c.label) : 'ไม่มีหมวด'}</span></span>
        <span class="scat-t"><i style="width:${Math.round(n / max * 100)}%"></i></span><b>${n} ชิ้น</b>${ic('right', 14, 2)}</button>`; }).join('') || '<div class="side-empty">ยังไม่มีงานที่ปิด</div>'}</section>`;
}
Object.assign(ACT, {
  catDetail: (el) => {
    var k = el.dataset.k, S = statsFor(ui.statPeriod || 'week'), c = allCats()[k];
    var list = S.doneTasks.filter((x) => doneCatOf(x) === k).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
    openSheet(`${c ? c.label : 'ไม่มีหมวด'} · ${list.length} ชิ้น`, `<div class="muted" style="font-size:13px;margin:-4px 0 8px">ปิดในช่วง ${S.label}</div><div class="stack" style="gap:0">${list.map((x) => { var pj = x.projectId ? byId('projects', x.projectId) : null;
      return `<div class="lrow" style="border-radius:0;border-top:1px solid var(--line);background:transparent"><span class="av p2" style="width:36px;height:36px">${ic('check', 16, 2.4)}</span><span class="grow"><span class="t">${esc(x.title)}</span><span class="muted" style="font-size:12px">${pj ? esc(pj.name) : 'to-do ลอย'}${x.doneAt ? ' · เสร็จ ' + fmtShort(x.doneAt) : ''}</span></span>${pj ? `<a class="pill-btn" href="#/project/${pj.id}" data-act="closeSheet">โปรเจกต์</a>` : ''}</div>`; }).join('') || '<div class="empty">ไม่มีงาน</div>'}</div>`);
  },
});
function deskStats() {
  var k = ui.statPeriod || 'week', S = statsFor(k), prev = statsFor(k, -1);
  var word = { week: 'สัปดาห์', month: 'เดือน', year: 'ปี' }[k], thisW = word + 'นี้';
  var n = k === 'year' ? 3 : 6;
  var series = []; for (var i = 0; i < n; i++) series.push(statsFor(k, i - n + 1));
  var max = Math.max(1, ...series.map((x) => x.min));
  var avg = series.reduce((a, x) => a + x.min, 0) / n;
  var diff = (S.min - prev.min) / 60;
  var tabs = ['week', 'month', 'year'].map((x) => `<button class="ftab ${x === k ? 'on' : ''}" data-act="statPeriod" data-k="${x}">${{ week: 'สัปดาห์', month: 'เดือน', year: 'ปี' }[x]}</button>`).join('');
  var kpiIn = (label, val, sub) => `<span class="kpi-l">${label}</span><span class="kpi-n">${val}</span><span class="kpi-h">${sub}</span>`;
  var kpi = (act, label, val, sub) => act ? `<button class="kpi" data-act="statDetail" data-k="${act}">${kpiIn(label, val, sub)}</button>` : `<div class="kpi" style="cursor:default">${kpiIn(label, val, sub)}</div>`;
  var bars = series.map((x, i) => `<div class="strack ${i === n - 1 ? 'on' : ''}" style="grid-column:${i + 1}"><span class="sv" style="bottom:${Math.max(2, Math.round(x.min / max * 100))}%">${(x.min / 60).toFixed(0)}</span><i style="height:${Math.max(2, Math.round(x.min / max * 100))}%"></i></div>`).join('')
    + series.map((x, i) => `<span class="sl ${i === n - 1 ? 'on' : ''}" style="grid-column:${i + 1}">${i === n - 1 ? thisW : x.short}</span>`).join('');
  var daily = '';
  if (k === 'week') {
    var mon = addDays(mondayOf(today()), 0), dm = [];
    for (var j = 0; j < 7; j++) { var dk = addDays(mon, j), l = logOf(dk); dm.push({ k: dk, m: logMinutes(l), l: l }); }
    var dmax = Math.max(60, ...dm.map((x) => x.m));
    daily = `<div class="dcard-h" style="margin-top:20px"><h2>รายวัน${thisW}</h2></div><div class="sdays">${dm.map((x, i) => `<div class="sbar small ${x.k === today() ? 'on' : ''}"><span class="sv">${x.m ? (x.m / 60).toFixed(1) : ''}</span><i style="height:${x.m ? Math.max(3, Math.round(x.m / dmax * 100)) : 0}%"></i><span class="sl">${TH_DAY[dateOf(x.k).getDay()]}</span><span class="sm">${x.l && x.l.mood != null ? flower(MOODS[x.l.mood].color, 12) : x.l && x.l.type === 'leave' ? '<em>ลา</em>' : ''}</span></div>`).join('')}</div>`;
  }
  var totalMood = S.moods.reduce((a, b) => a + b, 0);
  return `
  <header class="dhead">
    <div><h1 class="dtitle">สถิติ</h1><p class="dsub">${S.label}</p></div>
    <div class="row" style="gap:8px"><div class="ftabs">${tabs}</div><button class="btn-o" data-act="exportCsv">${ic('up', 16, 2)}ส่งออกข้อมูล</button></div>
  </header>
  <div class="kpis">
    ${kpi('', 'ชั่วโมงทำงาน', (S.min / 60).toFixed(1), `<span class="${diff >= 0 ? '' : 'warn-t'}">${diff >= 0 ? '+' : ''}${diff.toFixed(1)} ชม.</span> เทียบ${word}ก่อน`)}
    ${kpi('in', 'เข้างานเฉลี่ย', S.avgIn, thisW)}${kpi('out', 'เลิกงานเฉลี่ย', S.avgOut, thisW)}
    ${kpi('tasks', 'งานที่เสร็จ', S.doneTasks.length, `ปิดโปรเจกต์ ${S.closed.length}`)}
  </div>
  <div class="dgrid">
    <div class="dmain"><section class="dpanel"><div class="dcard-h"><h2>ชั่วโมงทำงาน ${n} ${word}ล่าสุด</h2><span class="muted">เส้นประ = เฉลี่ย ${(avg / 60).toFixed(1)} ชม.</span></div>
      <div class="schart" style="grid-template-columns:repeat(${n},minmax(0,1fr))"><div class="savgbox"><span class="savg" style="bottom:${Math.round(avg / max * 100)}%"><em>เฉลี่ย</em></span></div>${bars}</div>${daily}</section>
      ${statCats(S, thisW)}
      <section class="dpanel"><div class="dcard-h"><h2>โปรเจกต์ที่ปิด${thisW}</h2><span class="muted">${S.closed.length}</span></div>
        ${S.closed.map((p) => `<a class="side-row" href="#/project/${p.id}"><span class="side-ic">${ic('check', 16, 2)}</span><span class="grow" style="min-width:0"><b>${esc(p.name)}</b></span><span class="muted" style="font-size:13px">${p.doneAt ? fmtShort(p.doneAt) : ''}</span></a>`).join('') || '<div class="side-empty">ยังไม่มีโปรเจกต์ที่ปิด</div>'}</section>
      ${k === 'year' ? `<a class="dpanel row" href="#/archive" style="justify-content:space-between;text-decoration:none;color:inherit"><b>${ic('box', 16, 2)} ดู Archive ทั้งปี</b>${ic('right', 16, 2)}</a>` : ''}
    </div>
    <aside class="dside">
      <section class="dcard"><div class="dcard-h"><h2>ความรู้สึก${thisW}</h2><span class="muted">${totalMood} วัน</span></div>
        <div class="smood">${S.moods.map((m, i) => `<i style="width:${totalMood ? m / totalMood * 100 : 0}%;background:${MOODS[i].color}"></i>`).join('')}</div>
        ${MOODS.map((m, i) => `<div class="side-row">${flower(m.color, 16)}<span class="grow">${m.label}</span><span class="muted" style="font-size:13px">${S.moods[i]} วัน</span></div>`).join('')}</section>
      <section class="dcard"><div class="dcard-h"><h2>วันที่ใช้ไป${thisW}</h2></div>
        <div class="sleave">${[['ลา', S.leave.length], ['หยุด', S.off.length], ['ป่วย', S.sick.length]].map(([l, v]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
        ${S.sick.map((l) => `<div class="side-row"><span class="grow">ป่วย${l.reason ? ' · ' + esc(l.reason) : ''}</span><span class="muted" style="font-size:13px">${fmtShort(l.date)}</span></div>`).join('')}</section>
    </aside>
  </div>`;
}
/* ---------- ตั้งค่าบนคอม ---------- */
function deskSettings() {
  var lb = db.settings.lastBackup;
  var stale = !lb || diffDays(lb.slice(0, 10), today()) > 7;
  var th = db.settings.theme || 'system';
  var themes = [['system', 'ตามระบบ'], ['light', 'สว่าง'], ['dark', 'มืด']].map(([k, l]) => `<button class="ftab ${th === k ? 'on' : ''}" data-act="setTheme" data-k="${k}">${l}</button>`).join('');
  var cats = Object.entries(allCats()).map(([k, c]) => `<span class="btag gray">${ic(c.icon, 12, 2)}&nbsp;${esc(c.label)}</span>`).join('');
  var srow = (title, sub, right) => `<div class="srow"><span class="grow" style="min-width:0"><b>${title}</b><span class="muted">${sub}</span></span>${right}</div>`;
  return `
  <header class="dhead">
    <div><h1 class="dtitle">ตั้งค่า</h1><p class="dsub">อัปเดตล่าสุด ${esc(CHANGELOG[0].date)} · ซิงก์: <span id="sync-state">${syncLabel()}</span></p></div>
  </header>
  <div class="sgrid">
    <div class="dmain">
      <section class="dpanel"><div class="dcard-h"><h2>บัญชีและซิงก์</h2></div>
        ${srow('ซิงก์ข้ามเครื่อง', 'ข้อมูลตรงกันทั้งมือถือและคอม', `<button class="btn-o" data-act="openLogin">${ic('login', 16, 2)}จัดการบัญชี</button>`)}</section>
      <section class="dpanel"><div class="dcard-h"><h2>ข้อมูล</h2></div>
        ${stale ? `<div class="swarn">${ic('warn', 18, 2)}<span>${lb ? `ไม่ได้สำรองข้อมูลมา ${diffDays(lb.slice(0, 10), today())} วันแล้ว` : 'ยังไม่เคยสำรองข้อมูล'} · กด "สำรองตอนนี้" เก็บไฟล์ไว้กันข้อมูลหาย</span></div>` : ''}
        ${srow('สำรองข้อมูล', `ไฟล์ JSON · ${lb ? 'ล่าสุด ' + fmtShort(lb.slice(0, 10)) : 'ยังไม่เคย'}`, `<button class="btn-d" data-act="backup">${ic('down', 16, 2)}สำรองตอนนี้</button>`)}
        ${srow('กู้คืน / ส่งออก', 'กู้คืนจากไฟล์สำรอง หรือส่งออก CSV ไปเปิดใน Sheets / Excel', `<span class="row" style="gap:8px"><button class="btn-o" data-act="restore">${ic('up', 16, 2)}กู้คืนจากไฟล์</button><button class="btn-o" data-act="exportCsv">${ic('table', 16, 2)}ส่งออก CSV</button></span>`)}</section>
      <section class="dpanel"><div class="dcard-h"><h2>การแสดงผล</h2></div>
        ${srow('ธีม', 'สีพื้นหลังสว่างหรือมืด', `<div class="ftabs">${themes}</div>`)}
        ${srow('วันทำงาน', 'จ–พฤ ออฟฟิศ · ศุกร์ WFH', '')}</section>
      <section class="dpanel"><div class="dcard-h"><h2>หมวด</h2><button class="btn-s" data-act="toggleAdd" data-box="scat">${ic('plus', 14, 2)}เพิ่มหมวด</button></div>
        <div class="scats">${cats}</div>
        <div class="addbox" id="add-scat" hidden style="margin-top:12px">${inputH('newSCatName', '', 'text', 'ชื่อหมวด เช่น วิดีโอ, ประชุม')}
          <span class="label">ไอคอน</span>${swatchH('newSCatIcon', PROJ_CAT_ICONS, 'folder', (i) => ic(i, 18, 2))}
          <button type="button" class="btn" style="height:44px;font-size:15px" data-act="addSetCat">เพิ่มหมวดนี้</button></div></section>
      <section class="dpanel sdanger"><div class="dcard-h"><h2>ล้างข้อมูล</h2></div>
        ${srow('ล้างข้อมูลทั้งหมด', 'สำรองก่อนนะ ลบแล้วกู้ไม่ได้', `<button class="btn-o danger" data-act="wipe">${ic('trash', 16, 2)}ล้างข้อมูลทั้งหมด</button>`)}</section>
      <input type="file" id="restore-file" accept="application/json,.json" class="sr" aria-label="ไฟล์สำรอง">
      <div class="muted" style="font-size:12px">Rocket Life · schema v${SCHEMA}</div>
    </div>

  </div>`;
}
Object.assign(ACT, {
  setTheme: (el) => { db.settings.theme = el.dataset.k; save(); applyTheme(); render(); },
  addSetCat: () => {
    var name = $('[name=newSCatName]').value.trim(); if (!name) { toast('ตั้งชื่อหมวดก่อนนะ'); return; }
    (db.settings.projCats = db.settings.projCats || []).push({ key: 'c_' + uid(), label: name, icon: $('[name=newSCatIcon]').value || 'folder' });
    save(); render(); toast('เพิ่มหมวดแล้ว');
  },
});
if (document.getElementById('view')) bindOpts(document.getElementById('view'));
render();

/* ---------- ดึง to-do ลอยเข้าเป็นงานย่อยของโปรเจกต์ (ใช้ทั้งคอมและมือถือ) ---------- */
function floatTodos() { return db.todos.filter((x) => !x.done); }
function sheetPullTodos(pid) {
  var p = byId('projects', pid); if (!p) return;
  var list = floatTodos();
  openSheet('ดึงจาก to-do ลอย', `<div class="muted" style="margin-top:-10px">เลือก to-do ที่จะย้ายเข้าเป็นงานย่อยของ "${esc(p.name)}"</div>
    <div class="stack" style="gap:8px">${list.map((x) => `<button type="button" class="opt" data-pick="${x.id}" style="font-size:15px;padding:10px 14px;justify-content:flex-start;text-align:left" aria-pressed="false"><span class="tick" style="width:26px;height:26px;flex:none"></span><span class="grow">${esc(x.title)}<br><span class="muted" style="font-size:12px">${x.hold ? 'เลื่อนไว้ไม่มีกำหนด' : x.date ? 'วันที่ทำ ' + fmtShort(x.date) : ''}</span></span></button>`).join('')}</div>
    <button class="btn" data-act="pullTodosConfirm" data-id="${pid}" id="pull-btn" disabled>เลือก to-do ที่จะดึงเข้า</button>`, (sh) => {
    var sel = new Set();
    sh.addEventListener('click', (e) => {
      var b = e.target.closest('[data-pick]'); if (!b) return;
      var id = b.dataset.pick, on = !sel.has(id); on ? sel.add(id) : sel.delete(id);
      b.setAttribute('aria-pressed', on); b.style.background = on ? 'var(--purple-soft)' : '';
      $('.tick', b).classList.toggle('on', on); $('.tick', b).innerHTML = on ? ic('check', 14, 2.6) : '';
      var btn = $('#pull-btn', sh); btn.disabled = !sel.size; btn.textContent = sel.size ? `ดึง ${sel.size} งานเข้าโปรเจกต์` : 'เลือก to-do ที่จะดึงเข้า';
    });
    sh._sel = sel;
  });
}
Object.assign(ACT, {
  pullTodos: (el) => sheetPullTodos(el.dataset.id),
  pullTodosConfirm: (el) => {
    var sel = $('.sheet')._sel, pid = el.dataset.id; if (!sel?.size) return;
    // ย้ายเป็นงานย่อย: วันที่ทำเดิมยังอยู่ (ยังอยู่ใน to-do วันนั้น) · ที่เลื่อนไม่มีกำหนดจะไม่มีวันที่ทำ
    sel.forEach((id) => {
      var x = byId('todos', id); if (!x) return;
      db.tasks.push({ id: x.id, projectId: pid, title: x.title, priority: x.priority || null, cat: x.cat || null, note: x.note || '', link: x.link || '', due: x.due || null, done: false, wait: null, order: tasksOf(pid).length, plannedFor: x.hold ? null : x.date || null });
    });
    db.todos = db.todos.filter((x) => !sel.has(x.id));
    var n = sel.size; save(); closeSheet(); render(); toast(`ดึง ${n} งานเข้าโปรเจกต์แล้ว`);
  },
});
