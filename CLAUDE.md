# CLAUDE.md

This file provides guidance for AI assistants (and developers) working on the **NLP-dan-silva-method** repository.

## Project Overview

Aplikasi latihan **Neuro-Linguistic Programming (NLP)** berbasis web (Flask PWA) yang mencakup teknik dari level basic sampai advanced, termasuk Anchoring, Submodalities Mapping, Reframing, Milton Model, hingga Deep Trance Identification (DTI). Dirancang untuk penggunaan pribadi di HP (mobile-first).

**Tech Stack:** Python 3.9+ / Flask / SQLAlchemy / SQLite / PWA

## Codebase Structure

```
NLP-dan-silva-method/
├── CLAUDE.md                    # File ini — panduan untuk AI assistant
├── .gitignore                   # Git ignore rules
├── requirements.txt             # Python dependencies
├── config.py                    # Konfigurasi Flask (SECRET_KEY, DB, MODULES_DIR)
├── app.py                       # Entry point — python app.py untuk jalankan
│
├── app/                         # Package utama Flask
│   ├── __init__.py              # App factory (create_app), inisialisasi db & login_manager
│   ├── models.py                # SQLAlchemy models: User, ExerciseLog, Assessment, JournalEntry
│   ├── routes/
│   │   ├── auth.py              # Login, register, logout, profile (Blueprint: auth)
│   │   ├── modules.py           # Daftar modul, detail modul (Blueprint: modules, prefix /modules)
│   │   ├── exercises.py         # Latihan, start, complete, assess, journal (Blueprint: exercises, prefix /exercises)
│   │   └── progress.py          # Dashboard progress, chart data API (Blueprint: progress, prefix /progress)
│   ├── templates/               # Jinja2 HTML templates
│   │   ├── base.html            # Layout utama (PWA meta tags, bottom nav)
│   │   ├── login.html           # Halaman login
│   │   ├── register.html        # Halaman registrasi
│   │   ├── profile.html         # Halaman profil
│   │   ├── module_list.html     # Daftar semua modul (dengan lock status)
│   │   ├── module_detail.html   # Detail modul: teori + daftar latihan
│   │   ├── module_locked.html   # Modul yang belum ter-unlock
│   │   ├── exercise.html        # Halaman latihan: instruksi, steps, assessment, jurnal
│   │   └── dashboard.html       # Dashboard: stats, grafik, progress per modul
│   └── static/
│       ├── manifest.json        # PWA manifest
│       ├── sw.js                # Service worker (offline cache)
│       ├── css/style.css        # Mobile-first dark theme stylesheet
│       ├── js/app.js            # Rating buttons, mood slider, chart, PWA registration
│       └── audio/               # Placeholder untuk file audio latihan
│
├── data/modules/                # Data modul dalam format JSON
│   ├── 01_dasar_nlp.json        # Modul 1: Dasar-Dasar NLP (basic)
│   ├── 02_rapport.json          # Modul 2: Rapport & Kalibrasi (basic)
│   ├── 03_vakog.json            # Modul 3: Sistem Representasi VAKOG (basic)
│   ├── 04_meta_model.json       # Modul 4: Meta Model (basic)
│   ├── 05_anchoring.json        # Modul 5: Anchoring (intermediate)
│   ├── 06_submodalities.json    # Modul 6: Submodalities Mapping (intermediate)
│   ├── 07_reframing.json        # Modul 7: Reframing (intermediate)
│   ├── 08_strategi.json         # Modul 8: Strategi & Modeling (intermediate)
│   ├── 09_milton_model.json     # Modul 9: Milton Model & Hypnotic Language (advanced)
│   ├── 10_timeline.json         # Modul 10: Timeline Therapy (advanced)
│   ├── 11_sleight_of_mouth.json # Modul 11: Sleight of Mouth (advanced)
│   └── 12_deep_trance.json      # Modul 12: Deep Trance Identification (advanced)
│
├── tests/                       # Unit tests (to be added)
└── migrations/                  # DB migrations (to be added)
```

## Key Commands

| Task | Command |
|------|---------|
| Install dependencies | `pip install -r requirements.txt` |
| Run app (development) | `python app.py` |
| Run app (production) | `gunicorn app:application` |
| Access on phone | Open `http://<server-ip>:5000` in mobile browser |
| Install as PWA | Open in Chrome mobile > "Add to Home Screen" |

## Database Models

All in `app/models.py`, using SQLite via SQLAlchemy:

- **User** — username, password_hash, created_at. Methods: `get_module_progress()`, `is_module_unlocked()`, `get_streak()`
- **ExerciseLog** — tracks each exercise: module_id, exercise_id, completed, duration, notes
- **Assessment** — self-assessment scores (1-10) with JSON answers per exercise
- **JournalEntry** — reflections with mood_before/mood_after (1-10) and content

## Module Data Format

Each module JSON in `data/modules/` follows this structure:

```json
{
  "order": 1,
  "title": "Module Title",
  "level": "basic|intermediate|advanced",
  "description_short": "Short description",
  "theory": [{"title": "...", "content": "..."}],
  "exercises": [
    {
      "id": "ex_01_01",
      "title": "Exercise Title",
      "description_short": "...",
      "description": "Full instructions",
      "steps": ["Step 1", "Step 2"],
      "has_audio": true|false,
      "assessment_questions": [{"question": "..."}]
    }
  ]
}
```

## 12 Modul (Basic → Advanced)

| Level | # | Modul | Teknik Utama |
|-------|---|-------|-------------|
| Basic | 1 | Dasar-Dasar NLP | Presupposisi, model komunikasi |
| Basic | 2 | Rapport & Kalibrasi | Matching, mirroring, pacing-leading |
| Basic | 3 | Sistem Representasi | VAKOG, eye accessing cues |
| Basic | 4 | Meta Model | Deletion, distortion, generalization |
| Intermediate | 5 | Anchoring | Basic anchor, stacking, collapsing |
| Intermediate | 6 | Submodalities | Mapping, swish pattern, driver submodality |
| Intermediate | 7 | Reframing | Content, context, six-step reframe |
| Intermediate | 8 | Strategi & Modeling | TOTE, eliciting, installing strategies |
| Advanced | 9 | Milton Model | Hypnotic language, embedded commands |
| Advanced | 10 | Timeline Therapy | Timeline, releasing emotions, future programming |
| Advanced | 11 | Sleight of Mouth | 14 pola reframing Robert Dilts |
| Advanced | 12 | Deep Trance Identification | DTI proses lengkap, trance dalam |

## App Flow

1. User registers/logs in
2. Module list shows all 12 modules (locked/unlocked based on progress)
3. Unlocking: complete >=80% of exercises in previous module
4. Each module has: theory sections + 3 exercises
5. Each exercise has: instructions, steps, audio placeholder, self-assessment, journal
6. Dashboard shows: stats (completed, streak, avg score, journals), progress chart, per-module progress

## Architecture Decisions

- **JSON-based module data** — modules are stored as JSON files, not in the database. This makes it easy to edit/add modules without database migrations
- **SQLite** — lightweight, no server needed, perfect for personal use
- **PWA** — installable on phone home screen, works offline via service worker
- **Dark theme** — mobile-friendly, eye-comfortable for extended reading
- **Module unlock system** — enforces sequential learning, prevents skipping foundational skills

## Development Guidelines

### Code Conventions
- Python: PEP 8, type hints for public functions
- Templates: Jinja2, mobile-first HTML
- CSS: CSS custom properties (variables) in `:root`, BEM-like class names
- JS: Vanilla JavaScript only (no frameworks), ES6+

### Adding a New Module
1. Create `data/modules/NN_slug.json` following the JSON format above
2. Set `order` to the next number
3. Add 1-5 exercises with unique `id` values (format: `ex_NN_MM`)
4. No code changes needed — the app reads modules dynamically from the JSON files

### Adding Audio Files
1. Place `.mp3` or `.wav` files in `app/static/audio/`
2. Set `"has_audio": true` in the exercise JSON
3. Audio playback UI will need to be implemented in `exercise.html`

### Git Workflow
- Write clear commit messages in English
- Do not commit `*.db` files or `__pycache__/`
- Do not commit secrets or `.env` files

## For AI Assistants

When working on this project:

1. **Read before writing** — always read existing files before modifying them
2. **Stay focused** — only make changes that are directly requested
3. **Respect the module format** — when editing module JSON, maintain the exact schema
4. **Test the app** — run `python -c "from app import create_app; create_app()"` to verify changes
5. **Update this file** — if you add features, new directories, or change architecture, update CLAUDE.md
6. **Keep it simple** — this is a personal app, avoid over-engineering
7. **UI language** — all user-facing text should be in Bahasa Indonesia
8. **Mobile-first** — all UI changes must work well on phone screens (max-width: 480px)
