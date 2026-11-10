
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
  if (scope === 'today') return todayItems(today());
  return tasksOf(scope).map((x) => ({ kind: 'task', ref: x }));
}
function boardCard({ kind, ref }, showProj) {
  const proj = kind === 'task' ? byId('projects', ref.projectId) : null;
  const pri = ref.priority || proj?.priority || 4; const cat = allCats()[ref.cat];
  const PRI = { 1: '#D9533B', 2: '#7C4DCC', 3: '#E08A1E', 4: '#A1A1AA' };
  const d = dateOfItem(kind, ref); const late = d && d < today() && !ref.done;
  const tone = ref.done ? 'done' : ref.wait === 'info' || ref.wait === 'review' ? 'waiting' : pri === 1 ? 'hot' : '';
  return `<div class="bcard ${tone}" draggable="true" data-drag="${kind}:${ref.id}" style="--pri:${PRI[pri]}">
    <button class="grow" data-act="editItem" data-kind="${kind}" data-id="${ref.id}">
      <span class="t">${esc(ref.title)}</span>
      ${showProj ? `<span class="muted" style="font-size:12px">${proj ? esc(proj.name) : 'to-do ลอย'}</span>` : ''}
      <span class="between" style="font-size:12px;margin-top:6px"><span style="color:${late ? 'var(--warn-ink)' : 'var(--ink-3)'}">${d ? fmtShort(d) : 'ไม่มีกำหนด'}${pri === 1 && !ref.done ? ' · ด่วน' : ''}</span>
      ${cat ? `<span class="bcat" title="${esc(cat.label)}">${ic(cat.icon, 13, 2)}</span>` : ''}</span>
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
  e.preventDefault(); const [kind, id] = e.dataTransfer.getData('text/plain').split(':'); const x = itemRef(kind, id); if (!x) return;
  if (z.dataset.dropCol) setCol(x, z.dataset.dropCol); else setDate(kind, x, z.dataset.dropDay);
  save(); render();
});
document.addEventListener('change', (e) => {
  const s = e.target.closest?.('[data-set]'); if (!s) return;
  const [kind, id] = s.dataset.ref.split(':'); const x = itemRef(kind, id); if (!x) return;
  if (s.dataset.set === 'col') setCol(x, s.value); else setDate(kind, x, s.value);
  save(); render();
});
Object.assign(ACT, {
  boardView: (el) => { ui.boardView = el.dataset.k; try { localStorage.setItem('rocketlife-boardview', el.dataset.k); } catch (e) { /* ไม่เป็นไร */ } render(); },
  boardWeek: (el) => { ui.boardWeek = (ui.boardWeek || 0) + Number(el.dataset.n); render(); },
});
try { ui.boardView = localStorage.getItem('rocketlife-boardview') || 'card'; } catch (e) { ui.boardView = 'card'; }
render();
