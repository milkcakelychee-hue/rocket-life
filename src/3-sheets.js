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
    <label class="field" style="gap:2px"><span class="muted">เวลาเข้างาน · <span style="color:var(--purple-ink);font-weight:600">แตะเพื่อแก้</span></span><input name="in" type="time" value="${nowHM()}" style="font-size:40px;font-weight:700;line-height:1.2;border:none;background:transparent;width:100%;max-width:260px;padding:0"></label>
    <div class="field"><span class="label">วันนี้ทำงานแบบไหน</span>${optTiles('type', Object.entries(WORKTYPE).map(([k, v]) => [k, v.label, v.icon]), def)}</div>
    <div id="leave-box" class="stack" hidden><div class="field"><span class="label">ประเภท</span>${optTiles('leaveKind', Object.entries(LEAVE_KIND).map(([k, v]) => [k, v]), 'leave', 3)}</div>${fieldH('สาเหตุที่บอก (ถ้ามี)', inputH('reason', '', 'text', 'เช่น ไข้หวัด'))}</div>
    <button class="btn purple">${ic('check', 20, 2.4)}<span>เช็กอิน</span></button>
    <button type="button" class="btn ghost" data-act="closeSheet">ไว้ทีหลัง</button></form>`, (sh) => {
    bindOpts(sh);
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
