/* ---------- ซิงก์ข้อมูลกับ Supabase: ข้อมูลทั้งก้อน 1 แถวต่อผู้ใช้ต่อแอป (ตาราง app_data) ----------
   ต้องมีในแอป: db, blank(), KEY, render(), toast(), openSheet(), closeSheet(), esc(), $, $$, ACT (แผนที่ data-act) */
const SB_URL = 'https://YOUR-PROJECT.supabase.co';
const SB_KEY = 'sb_publishable_...';
const APP = 'my-app'; // ชื่อแอปนี้ ไม่ซ้ำกับแอปอื่นในโปรเจกต์ Supabase เดียวกัน
var sb = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;
// syncedAt = updated_at ของแถวบนเซิร์ฟเวอร์ที่ตรงกับเครื่องล่าสุด · dirty = มีแก้ในเครื่องที่ยังไม่ได้ส่ง
const SYNC_KEY = KEY + '-sync';
var syncMeta = (() => { try { return JSON.parse(localStorage.getItem(SYNC_KEY)) || {}; } catch (e) { return {}; } })();
const saveMeta = () => { try { localStorage.setItem(SYNC_KEY, JSON.stringify(syncMeta)); } catch (e) { /* ไม่เป็นไร */ } };
var sync = { user: null, state: 'off', timer: null };

function setSyncState(s) { sync.state = s; const el = $('#sync-state'); if (el) el.textContent = syncLabel(); }
function syncLabel() {
  if (!sync) return '';
  if (!sb) return 'ออฟไลน์ · ยังเชื่อมไม่ได้';
  if (!sync.user) return 'ยังไม่ได้เข้าสู่ระบบ';
  return { syncing: 'กำลังซิงก์…', ok: 'ซิงก์แล้ว · ' + sync.user.email, error: 'ซิงก์ไม่สำเร็จ จะลองใหม่', off: sync.user.email }[sync.state];
}

// เรียกท้าย save(): รอหยุดแก้ 1.5 วิแล้วค่อยส่งขึ้น
function queuePush() {
  if (!syncMeta) return; // ไฟล์นี้ยังโหลดไม่ถึง (ตอนเริ่มแอป)
  syncMeta.dirty = true; saveMeta();
  if (!sync.user) return;
  clearTimeout(sync.timer); sync.timer = setTimeout(pushNow, 1500);
}
async function pushNow() {
  if (!sync.user || !navigator.onLine) return;
  setSyncState('syncing');
  const now = new Date().toISOString();
  const { error } = await sb.from('app_data').upsert({ user_id: sync.user.id, app: APP, data: db, updated_at: now });
  if (error) { console.warn('push failed', error); setSyncState('error'); return; }
  syncMeta.syncedAt = now; syncMeta.dirty = false; saveMeta(); setSyncState('ok');
}
// เปิดแอป / กลับเข้าแอป: ใครใหม่กว่าใช้ของคนนั้น
async function pullNow() {
  if (!sync.user || !navigator.onLine) return;
  setSyncState('syncing');
  const { data: row, error } = await sb.from('app_data').select('data, updated_at').eq('user_id', sync.user.id).eq('app', APP).maybeSingle();
  if (error) { console.warn('pull failed', error); setSyncState('error'); return; }
  const remoteNewer = row && row.updated_at > (syncMeta.syncedAt || '');
  if (remoteNewer && syncMeta.dirty) {
    try { localStorage.setItem(KEY + '-conflict', JSON.stringify(db)); } catch (e) { /* ไม่เป็นไร */ }
    toast('มีข้อมูลใหม่จากอีกเครื่อง · เก็บของเดิมในเครื่องไว้สำรองแล้ว');
  }
  if (remoteNewer) {
    db = { ...blank(), ...row.data };
    localStorage.setItem(KEY, JSON.stringify(db));
    syncMeta.syncedAt = row.updated_at; syncMeta.dirty = false; saveMeta(); setSyncState('ok'); render();
  } else if (!row || syncMeta.dirty) await pushNow();
  else setSyncState('ok');
}

async function startSync() {
  if (!sb) return;
  const { data } = await sb.auth.getSession();
  sync.user = data.session?.user || null;
  if (sync.user) await pullNow();
  sb.auth.onAuthStateChange((_e, session) => { sync.user = session?.user || null; setSyncState(sync.user ? 'ok' : 'off'); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pullNow(); });
  window.addEventListener('online', () => (syncMeta.dirty ? pushNow() : pullNow()));
}

// อีเมล + รหัสผ่าน (ลิงก์จากเมลเปิดใน Safari ไม่ใช่ใน PWA · แพ็กเกจฟรีแก้เทมเพลตให้มีรหัส OTP ไม่ได้)
function sheetLogin() {
  if (!sb) { toast('ต้องต่อเน็ตก่อน'); return; }
  if (sync.user) {
    openSheet('บัญชีซิงก์', `<div class="stack"><div>${esc(sync.user.email)}</div><div id="sync-state">${syncLabel()}</div>
      <button class="btn" data-act="syncNow">ซิงก์ตอนนี้</button>
      <button class="btn ghost" data-act="logout">ออกจากระบบ</button></div>`);
    return;
  }
  openSheet('เข้าสู่ระบบเพื่อซิงก์', `<form class="stack" id="login-form">
    <label>อีเมล<input name="email" type="email" autocomplete="email" required></label>
    <label>รหัสผ่าน (อย่างน้อย 6 ตัว)<input name="password" type="password" autocomplete="current-password" minlength="6" required></label>
    <button class="btn">เข้าสู่ระบบ</button>
    <button type="button" class="btn ghost" id="signup-btn">ใช้ครั้งแรก · สร้างบัญชี</button></form>`, (sh) => {
    const f = $('#login-form', sh);
    const go = async (signup) => {
      if (!f.reportValidity()) return;
      const cred = { email: f.email.value.trim(), password: f.password.value };
      $$('button', f).forEach((b) => { b.disabled = true; });
      const { data, error } = signup ? await sb.auth.signUp(cred) : await sb.auth.signInWithPassword(cred);
      $$('button', f).forEach((b) => { b.disabled = false; });
      if (error) { toast(signup ? 'สร้างบัญชีไม่สำเร็จ: ' + error.message : 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'); return; }
      if (!data.session) { toast('ต้องปิด "Confirm email" ใน Supabase ก่อน'); return; }
      sync.user = data.user; closeSheet(); await pullNow(); render(); toast('เข้าสู่ระบบแล้ว');
    };
    f.addEventListener('submit', (e) => { e.preventDefault(); e.stopPropagation(); go(false); }, true);
    $('#signup-btn', sh).addEventListener('click', () => go(true));
  });
}
Object.assign(ACT, {
  openLogin: () => sheetLogin(),
  syncNow: async () => { await (syncMeta.dirty ? pushNow() : pullNow()); toast(sync.state === 'ok' ? 'ซิงก์แล้ว' : 'ซิงก์ไม่สำเร็จ'); },
  logout: async () => { await sb.auth.signOut(); sync.user = null; closeSheet(); render(); },
});
startSync();
