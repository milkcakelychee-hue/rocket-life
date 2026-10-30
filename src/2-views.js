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
  <section class="card" style="padding:0;overflow:hidden"><div class="label" style="padding:14px 14px 6px">มีอะไรใหม่</div>
    <div class="news">${CHANGELOG.map((v) => `<div><div class="ver">${esc(v.ver)}<span class="muted" style="font-size:12px;font-weight:400">${esc(v.date)}</span></div><ul>${v.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}</div>
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
