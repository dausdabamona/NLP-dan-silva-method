// ============================================
// NLP Training App - Offline Client-Side App
// Semua data disimpan di localStorage
// ============================================

// --- Data Storage (localStorage) ---
const Storage = {
  get(key, defaultVal) {
    try {
      const v = localStorage.getItem('nlp_' + key);
      return v ? JSON.parse(v) : defaultVal;
    } catch { return defaultVal; }
  },
  set(key, val) {
    localStorage.setItem('nlp_' + key, JSON.stringify(val));
  }
};

// --- User Management ---
function getUser() {
  return Storage.get('user', null);
}

function setUser(user) {
  Storage.set('user', user);
}

function getExerciseLogs() {
  return Storage.get('exercise_logs', []);
}

function saveExerciseLog(log) {
  const logs = getExerciseLogs();
  const existing = logs.findIndex(l => l.module_id === log.module_id && l.exercise_id === log.exercise_id);
  if (existing >= 0) {
    logs[existing] = { ...logs[existing], ...log };
  } else {
    logs.push(log);
  }
  Storage.set('exercise_logs', logs);
}

function getAssessments() {
  return Storage.get('assessments', []);
}

function saveAssessment(assessment) {
  const list = getAssessments();
  list.push({ ...assessment, created_at: new Date().toISOString() });
  Storage.set('assessments', list);
}

function getJournals() {
  return Storage.get('journals', []);
}

function saveJournal(entry) {
  const list = getJournals();
  list.push({ ...entry, created_at: new Date().toISOString() });
  Storage.set('journals', list);
}

// --- Module Progress ---
function getModuleProgress(moduleId) {
  const logs = getExerciseLogs();
  const moduleLogs = logs.filter(l => l.module_id === moduleId);
  if (moduleLogs.length === 0) return 0;
  const completed = moduleLogs.filter(l => l.completed).length;
  return Math.round((completed / moduleLogs.length) * 100);
}

function isModuleUnlocked(order, allModules) {
  if (order <= 1) return true;
  const prevModule = allModules.find(m => m.order === order - 1);
  if (!prevModule) return true;
  const logs = getExerciseLogs();
  const prevExercises = prevModule.exercises || [];
  if (prevExercises.length === 0) return true;
  const completedCount = prevExercises.filter(ex =>
    logs.some(l => l.module_id === prevModule._id && l.exercise_id === ex.id && l.completed)
  ).length;
  return (completedCount / prevExercises.length) >= 0.8;
}

function getStreak() {
  const logs = getExerciseLogs().filter(l => l.completed && l.completed_at);
  if (logs.length === 0) return 0;
  const dates = new Set(logs.map(l => new Date(l.completed_at).toDateString()));
  let streak = 0;
  const today = new Date();
  let d = new Date(today);
  while (dates.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// --- Module Data Loading ---
const MODULE_FILES = [
  '01_dasar_nlp', '02_rapport', '03_vakog', '04_meta_model',
  '05_anchoring', '06_submodalities', '07_reframing', '08_strategi',
  '09_milton_model', '10_timeline', '11_sleight_of_mouth', '12_deep_trance'
];

let modulesCache = null;

async function loadAllModules() {
  if (modulesCache) return modulesCache;
  const modules = [];
  for (const file of MODULE_FILES) {
    try {
      const resp = await fetch('data/modules/' + file + '.json');
      const data = await resp.json();
      data._id = file;
      modules.push(data);
    } catch (e) {
      console.error('Failed to load module:', file, e);
    }
  }
  modules.sort((a, b) => a.order - b.order);
  modulesCache = modules;
  return modules;
}

async function loadModule(moduleId) {
  const modules = await loadAllModules();
  return modules.find(m => m._id === moduleId) || null;
}

// --- Navigation ---
let currentPage = 'login';

function navigate(page, params) {
  currentPage = page;
  window._params = params || {};
  render();
  window.scrollTo(0, 0);
}

function setHeader(title, subtitle) {
  document.getElementById('headerTitle').textContent = title;
  document.getElementById('headerSubtitle').textContent = subtitle || '';
}

function setActiveNav(id) {
  document.querySelectorAll('.bottom-nav a').forEach(a => a.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function showFlash(msg, type) {
  const app = document.getElementById('app');
  const flash = document.createElement('div');
  flash.className = 'flash flash-' + (type || 'info');
  flash.textContent = msg;
  app.prepend(flash);
  setTimeout(() => { flash.style.opacity = '0'; flash.style.transition = 'opacity 0.5s'; setTimeout(() => flash.remove(), 500); }, 3000);
}

// --- Render Functions ---
async function render() {
  const app = document.getElementById('app');
  const nav = document.getElementById('bottomNav');
  const user = getUser();

  if (!user && currentPage !== 'login' && currentPage !== 'register') {
    currentPage = 'login';
  }

  nav.style.display = user ? 'flex' : 'none';

  switch (currentPage) {
    case 'login': renderLogin(app); break;
    case 'register': renderRegister(app); break;
    case 'modules': await renderModuleList(app); break;
    case 'module_detail': await renderModuleDetail(app); break;
    case 'module_locked': renderModuleLocked(app); break;
    case 'exercise': await renderExercise(app); break;
    case 'dashboard': await renderDashboard(app); break;
    case 'profile': renderProfile(app); break;
    default: await renderModuleList(app);
  }
}

// --- Login ---
function renderLogin(app) {
  setHeader('Selamat Datang', 'Masuk ke akun Anda');
  app.innerHTML = `
    <div class="mt-3">
      <div class="form-group">
        <label class="form-label">Username</label>
        <input type="text" id="loginUser" class="form-input" placeholder="Masukkan username">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="loginPass" class="form-input" placeholder="Masukkan password">
      </div>
      <button class="btn btn-primary" onclick="doLogin()">Masuk</button>
      <div class="text-center mt-2">
        <p class="text-muted text-small">Belum punya akun?</p>
        <button class="btn btn-secondary mt-1" onclick="navigate('register')">Daftar Baru</button>
      </div>
    </div>`;
}

function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!username || !password) { showFlash('Masukkan username dan password.', 'error'); return; }
  const users = Storage.get('users', {});
  if (!users[username] || users[username] !== password) {
    showFlash('Username atau password salah.', 'error'); return;
  }
  setUser({ username, created_at: Storage.get('user_dates', {})[username] || new Date().toISOString() });
  showFlash('Selamat datang, ' + username + '!', 'success');
  navigate('modules');
}

// --- Register ---
function renderRegister(app) {
  setHeader('Daftar Akun', 'Buat akun baru untuk memulai');
  app.innerHTML = `
    <div class="mt-3">
      <div class="form-group">
        <label class="form-label">Username</label>
        <input type="text" id="regUser" class="form-input" placeholder="Pilih username">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="regPass" class="form-input" placeholder="Minimal 4 karakter">
      </div>
      <div class="form-group">
        <label class="form-label">Konfirmasi Password</label>
        <input type="password" id="regConfirm" class="form-input" placeholder="Ulangi password">
      </div>
      <button class="btn btn-primary" onclick="doRegister()">Daftar</button>
      <div class="text-center mt-2">
        <p class="text-muted text-small">Sudah punya akun?</p>
        <button class="btn btn-secondary mt-1" onclick="navigate('login')">Masuk</button>
      </div>
    </div>`;
}

function doRegister() {
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  const confirm = document.getElementById('regConfirm').value;
  if (!username || !password) { showFlash('Semua field harus diisi.', 'error'); return; }
  if (password !== confirm) { showFlash('Password tidak cocok.', 'error'); return; }
  if (password.length < 4) { showFlash('Password minimal 4 karakter.', 'error'); return; }
  const users = Storage.get('users', {});
  if (users[username]) { showFlash('Username sudah digunakan.', 'error'); return; }
  users[username] = password;
  Storage.set('users', users);
  const dates = Storage.get('user_dates', {});
  dates[username] = new Date().toISOString();
  Storage.set('user_dates', dates);
  setUser({ username, created_at: dates[username] });
  showFlash('Akun berhasil dibuat! Selamat datang.', 'success');
  navigate('modules');
}

// --- Module List ---
async function renderModuleList(app) {
  setHeader('Modul Latihan', 'Pilih modul untuk memulai');
  setActiveNav('navModules');
  const modules = await loadAllModules();
  let html = '';
  for (const m of modules) {
    const unlocked = isModuleUnlocked(m.order, modules);
    const progress = getModuleProgressFromExercises(m);
    if (unlocked) {
      html += `<div class="module-card card" onclick="navigate('module_detail', {id:'${m._id}'})">`;
    } else {
      html += `<div class="module-card card locked">`;
    }
    html += `<div class="module-row">
      <div class="module-number">${m.order}</div>
      <div class="module-info">
        <div class="card-title">${m.title}</div>
        <div class="card-subtitle">${m.description_short}</div>
        <span class="badge badge-${m.level}">${m.level}</span>`;
    if (unlocked) {
      html += `<div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <div class="progress-text">${progress}%</div>`;
    } else {
      html += `<div class="text-small text-muted mt-1">Selesaikan modul sebelumnya untuk membuka</div>`;
    }
    html += `</div></div></div>`;
  }
  app.innerHTML = html;
}

function getModuleProgressFromExercises(module) {
  const logs = getExerciseLogs();
  const exercises = module.exercises || [];
  if (exercises.length === 0) return 0;
  const completed = exercises.filter(ex =>
    logs.some(l => l.module_id === module._id && l.exercise_id === ex.id && l.completed)
  ).length;
  return Math.round((completed / exercises.length) * 100);
}

// --- Module Detail ---
async function renderModuleDetail(app) {
  const moduleId = window._params.id;
  const module = await loadModule(moduleId);
  if (!module) { navigate('modules'); return; }
  const modules = await loadAllModules();

  if (!isModuleUnlocked(module.order, modules)) {
    navigate('module_locked', { id: moduleId, title: module.title, order: module.order });
    return;
  }

  setHeader(module.title, 'Modul ' + module.order + ' - ' + module.level.charAt(0).toUpperCase() + module.level.slice(1));
  setActiveNav('navModules');
  const progress = getModuleProgressFromExercises(module);
  const logs = getExerciseLogs();

  let html = `<div class="card">
    <span class="badge badge-${module.level}">${module.level}</span>
    <div class="progress-bar mt-1"><div class="progress-fill" style="width:${progress}%"></div></div>
    <div class="progress-text">Progress: ${progress}%</div>
  </div>`;

  // Theory
  html += '<h2 class="section-header">Teori</h2><div class="theory-section">';
  for (const s of (module.theory || [])) {
    html += `<h3>${s.title}</h3><p>${s.content}</p><br>`;
  }
  html += '</div>';

  // Exercises
  html += '<h2 class="section-header">Latihan</h2>';
  (module.exercises || []).forEach((ex, i) => {
    const isCompleted = logs.some(l => l.module_id === moduleId && l.exercise_id === ex.id && l.completed);
    html += `<div class="exercise-list-item" onclick="navigate('exercise', {module_id:'${moduleId}', exercise_id:'${ex.id}'})">
      <div class="exercise-status ${isCompleted ? 'completed' : ''}">${isCompleted ? '&#10003;' : (i + 1)}</div>
      <div><div class="card-title">${ex.title}</div><div class="card-subtitle">${ex.description_short}</div></div>
    </div>`;
  });

  html += `<div class="mt-2"><button class="btn btn-secondary" onclick="navigate('modules')">Kembali ke Daftar Modul</button></div>`;
  app.innerHTML = html;
}

// --- Module Locked ---
function renderModuleLocked(app) {
  const p = window._params;
  setHeader(p.title || 'Terkunci', 'Modul ' + (p.order || ''));
  app.innerHTML = `<div class="card"><div class="lock-overlay">
    <div class="lock-icon">&#128274;</div>
    <h3 class="card-title">Modul Terkunci</h3>
    <p class="text-muted mt-1">Selesaikan modul sebelumnya (minimal 80%) untuk membuka modul ini.</p>
    <button class="btn btn-secondary mt-2" onclick="navigate('modules')">Kembali ke Daftar Modul</button>
  </div></div>`;
}

// --- Exercise ---
async function renderExercise(app) {
  const { module_id, exercise_id } = window._params;
  const module = await loadModule(module_id);
  if (!module) { navigate('modules'); return; }
  const exercise = (module.exercises || []).find(e => e.id === exercise_id);
  if (!exercise) { navigate('module_detail', { id: module_id }); return; }

  setHeader(exercise.title, module.title);
  setActiveNav('navModules');

  const logs = getExerciseLogs();
  const log = logs.find(l => l.module_id === module_id && l.exercise_id === exercise_id);
  const journals = getJournals().filter(j => j.module_id === module_id && j.exercise_id === exercise_id).reverse();

  let html = `<div class="card"><div class="card-title">Instruksi</div>
    <p class="text-small mt-1">${exercise.description}</p></div>`;

  // Steps
  if (exercise.steps && exercise.steps.length > 0) {
    html += '<h2 class="section-header">Langkah-Langkah</h2>';
    exercise.steps.forEach((step, i) => {
      html += `<div class="exercise-step"><div class="step-number">Langkah ${i + 1}</div>
        <div class="step-content">${step}</div></div>`;
    });
  }

  // Audio placeholder
  if (exercise.has_audio) {
    html += `<div class="audio-placeholder"><div class="audio-icon">&#127925;</div>
      <p>Audio Guided Exercise</p><p class="text-small text-muted">File audio akan ditambahkan</p></div>`;
  }

  // Start / Complete
  html += '<div class="card mt-2">';
  if (!log) {
    html += `<button class="btn btn-primary" onclick="startExercise('${module_id}','${exercise_id}')">Mulai Latihan</button>`;
  } else if (!log.completed) {
    html += `<div class="form-group"><label class="form-label">Durasi latihan (menit)</label>
      <input type="number" id="exDuration" class="form-input" min="1" max="180" placeholder="Berapa menit?"></div>
      <div class="form-group"><label class="form-label">Catatan (opsional)</label>
      <textarea id="exNotes" class="form-input" placeholder="Pengalaman selama latihan..."></textarea></div>
      <button class="btn btn-success" onclick="completeExercise('${module_id}','${exercise_id}')">Tandai Selesai</button>`;
  } else {
    const d = log.completed_at ? new Date(log.completed_at).toLocaleString('id-ID') : '';
    html += `<p class="text-center text-muted">Latihan ini sudah selesai &#10003;</p>
      <p class="text-center text-small text-muted">${d}</p>`;
  }
  html += '</div>';

  // Assessment
  if (exercise.assessment_questions && exercise.assessment_questions.length > 0) {
    html += '<h2 class="section-header">Self-Assessment</h2><div class="card">';
    exercise.assessment_questions.forEach((q, i) => {
      html += `<div class="form-group"><label class="form-label">${q.question}</label>
        <div class="rating-group" data-field="assess_q${i}">`;
      for (let v = 1; v <= 10; v++) {
        html += `<button type="button" class="rating-btn" onclick="selectRating(this, 'assess_q${i}')" data-value="${v}">${v}</button>`;
      }
      html += '</div><input type="hidden" id="assess_q' + i + '" value=""></div>';
    });
    html += `<div class="form-group"><label class="form-label">Skor keseluruhan (1-10)</label>
      <div class="rating-group" data-field="assess_score">`;
    for (let v = 1; v <= 10; v++) {
      html += `<button type="button" class="rating-btn" onclick="selectRating(this, 'assess_score')" data-value="${v}">${v}</button>`;
    }
    html += `</div><input type="hidden" id="assess_score" value=""></div>
      <button class="btn btn-primary" onclick="submitAssessment('${module_id}','${exercise_id}', ${exercise.assessment_questions.length})">Simpan Penilaian</button></div>`;
  }

  // Journal
  html += `<h2 class="section-header">Jurnal Refleksi</h2><div class="card">
    <div class="form-group"><label class="form-label">Mood sebelum latihan (1-10)</label>
      <input type="range" id="moodBefore" class="mood-slider" min="1" max="10" value="5" oninput="document.getElementById('moodBeforeVal').textContent=this.value">
      <span id="moodBeforeVal" class="text-small text-muted">5</span></div>
    <div class="form-group"><label class="form-label">Mood setelah latihan (1-10)</label>
      <input type="range" id="moodAfter" class="mood-slider" min="1" max="10" value="5" oninput="document.getElementById('moodAfterVal').textContent=this.value">
      <span id="moodAfterVal" class="text-small text-muted">5</span></div>
    <div class="form-group"><label class="form-label">Refleksi / Insight</label>
      <textarea id="journalContent" class="form-input" placeholder="Apa yang Anda rasakan? Apa insight yang muncul?"></textarea></div>
    <button class="btn btn-primary" onclick="submitJournal('${module_id}','${exercise_id}')">Simpan Jurnal</button></div>`;

  // Previous journals
  if (journals.length > 0) {
    html += '<h2 class="section-header">Catatan Sebelumnya</h2>';
    for (const j of journals) {
      const d = new Date(j.created_at).toLocaleString('id-ID');
      const mood = (j.mood_before && j.mood_after) ? ` | Mood: ${j.mood_before} &rarr; ${j.mood_after}` : '';
      html += `<div class="journal-entry"><div class="journal-date">${d}${mood}</div>
        <div class="journal-content">${j.content}</div></div>`;
    }
  }

  html += `<div class="mt-2 mb-2"><button class="btn btn-secondary" onclick="navigate('module_detail', {id:'${module_id}'})">Kembali ke Modul</button></div>`;
  app.innerHTML = html;
}

function selectRating(btn, fieldId) {
  const group = btn.parentElement;
  group.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById(fieldId).value = btn.dataset.value;
}

function startExercise(moduleId, exerciseId) {
  saveExerciseLog({ module_id: moduleId, exercise_id: exerciseId, completed: false, started_at: new Date().toISOString() });
  showFlash('Latihan dimulai!', 'info');
  navigate('exercise', { module_id: moduleId, exercise_id: exerciseId });
}

function completeExercise(moduleId, exerciseId) {
  const duration = document.getElementById('exDuration').value;
  const notes = document.getElementById('exNotes').value;
  saveExerciseLog({
    module_id: moduleId, exercise_id: exerciseId, completed: true,
    completed_at: new Date().toISOString(),
    duration_minutes: duration ? parseInt(duration) : null,
    notes: notes
  });
  showFlash('Latihan selesai! Bagus sekali.', 'success');
  navigate('exercise', { module_id: moduleId, exercise_id: exerciseId });
}

function submitAssessment(moduleId, exerciseId, qCount) {
  const score = document.getElementById('assess_score').value;
  if (!score) { showFlash('Masukkan skor penilaian.', 'error'); return; }
  const answers = {};
  for (let i = 0; i < qCount; i++) {
    answers['q' + i] = document.getElementById('assess_q' + i).value;
  }
  saveAssessment({ module_id: moduleId, exercise_id: exerciseId, score: parseInt(score), answers });
  showFlash('Penilaian disimpan.', 'success');
}

function submitJournal(moduleId, exerciseId) {
  const content = document.getElementById('journalContent').value.trim();
  if (!content) { showFlash('Tulis sesuatu di jurnal.', 'error'); return; }
  const moodBefore = document.getElementById('moodBefore').value;
  const moodAfter = document.getElementById('moodAfter').value;
  saveJournal({ module_id: moduleId, exercise_id: exerciseId, content, mood_before: parseInt(moodBefore), mood_after: parseInt(moodAfter) });
  showFlash('Jurnal disimpan.', 'success');
  navigate('exercise', { module_id: moduleId, exercise_id: exerciseId });
}

// --- Dashboard ---
async function renderDashboard(app) {
  setHeader('Dashboard', 'Pantau perkembangan Anda');
  setActiveNav('navDashboard');
  const modules = await loadAllModules();
  const logs = getExerciseLogs();
  const assessments = getAssessments();
  const journals = getJournals();

  const totalCompleted = logs.filter(l => l.completed).length;
  const totalJournals = journals.length;
  const avgScore = assessments.length > 0
    ? (assessments.reduce((s, a) => s + a.score, 0) / assessments.length).toFixed(1) : 0;
  const streak = getStreak();

  let html = `<div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${totalCompleted}</div><div class="stat-label">Latihan Selesai</div></div>
    <div class="stat-card"><div class="stat-value">${streak}</div><div class="stat-label">Hari Berturut</div></div>
    <div class="stat-card"><div class="stat-value">${avgScore}</div><div class="stat-label">Rata-rata Skor</div></div>
    <div class="stat-card"><div class="stat-value">${totalJournals}</div><div class="stat-label">Jurnal Ditulis</div></div>
  </div>`;

  // Chart
  html += '<h2 class="section-header">Grafik Perkembangan</h2><div class="card"><canvas id="progressChart"></canvas><p class="text-small text-muted text-center mt-1">Skor assessment dari waktu ke waktu</p></div>';

  // Per module progress
  html += '<h2 class="section-header">Progress per Modul</h2>';
  for (const m of modules) {
    const progress = getModuleProgressFromExercises(m);
    const completedEx = (m.exercises || []).filter(ex =>
      logs.some(l => l.module_id === m._id && l.exercise_id === ex.id && l.completed)
    ).length;
    html += `<div class="card"><div class="card-header"><div class="card-title">${m.title}</div>
      <span class="badge badge-${m.level}">${m.level}</span></div>
      <div class="text-small text-muted">${completedEx} / ${(m.exercises || []).length} latihan selesai</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
      <div class="progress-text">${progress}%</div></div>`;
  }

  app.innerHTML = html;

  // Draw chart
  setTimeout(() => {
    const canvas = document.getElementById('progressChart');
    if (canvas && assessments.length > 0) {
      canvas.width = Math.min(window.innerWidth - 64, 440);
      canvas.height = 200;
      drawChart(canvas, assessments);
    }
  }, 50);
}

function drawChart(canvas, assessments) {
  const ctx = canvas.getContext('2d');
  const p = 40, w = canvas.width, h = canvas.height;
  const cw = w - p * 2, ch = h - p * 2;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2a2a4a'; ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    const y = p + (ch / 10) * i;
    ctx.beginPath(); ctx.moveTo(p, y); ctx.lineTo(w - p, y); ctx.stroke();
  }
  ctx.fillStyle = '#8892a4'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
  for (let i = 0; i <= 10; i += 2) {
    ctx.fillText(i.toString(), p - 8, p + ch - (ch / 10) * i + 4);
  }
  const stepX = cw / Math.max(assessments.length - 1, 1);
  ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2; ctx.beginPath();
  assessments.forEach((a, i) => {
    const x = p + stepX * i, y = p + ch - (ch / 10) * a.score;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  assessments.forEach((a, i) => {
    const x = p + stepX * i, y = p + ch - (ch / 10) * a.score;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#e94560'; ctx.fill();
  });
  ctx.fillStyle = '#8892a4'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(assessments.length / 8));
  assessments.forEach((a, i) => {
    if (i % step === 0) {
      const d = new Date(a.created_at);
      ctx.fillText(d.getDate() + '/' + (d.getMonth() + 1), p + stepX * i, h - 10);
    }
  });
}

// --- Profile ---
function renderProfile(app) {
  const user = getUser();
  setHeader('Profil Saya', user.username);
  setActiveNav('navProfile');
  const d = new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  app.innerHTML = `
    <div class="card mt-2"><div class="card-title">Informasi Akun</div>
      <p class="text-small text-muted mt-1">Username: <strong>${user.username}</strong></p>
      <p class="text-small text-muted">Bergabung: ${d}</p></div>
    <div class="card"><div class="card-title">Tentang Aplikasi</div>
      <p class="text-small text-muted mt-1">NLP Training - Metode Dan Silva adalah aplikasi latihan Neuro-Linguistic Programming dari level basic sampai advanced. Mencakup teknik Anchoring, Submodalities, Reframing, Milton Model, hingga Deep Trance Identification.</p></div>
    <div class="mt-2"><button class="btn btn-secondary" onclick="doLogout()">Keluar</button></div>
    <div class="mt-1"><button class="btn btn-secondary" style="border-color:#e94560;color:#e94560;" onclick="if(confirm('Hapus semua data progress?')){localStorage.clear();navigate('login')}">Reset Data</button></div>`;
}

function doLogout() {
  setUser(null);
  navigate('login');
  showFlash('Anda telah keluar.', 'info');
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (user) {
    navigate('modules');
  } else {
    navigate('login');
  }
});
