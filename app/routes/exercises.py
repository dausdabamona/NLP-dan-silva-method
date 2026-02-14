import json
import os
from datetime import datetime, timezone
from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import ExerciseLog, Assessment, JournalEntry

exercises_bp = Blueprint('exercises', __name__)


def load_module_data(module_id):
    modules_dir = current_app.config['MODULES_DIR']
    filepath = os.path.join(modules_dir, f'{module_id}.json')
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


@exercises_bp.route('/<module_id>/<exercise_id>')
@login_required
def exercise(module_id, exercise_id):
    module = load_module_data(module_id)
    if not module:
        flash('Modul tidak ditemukan.', 'error')
        return redirect(url_for('modules.module_list'))

    # Cari exercise dalam modul
    exercise_data = None
    for ex in module.get('exercises', []):
        if ex['id'] == exercise_id:
            exercise_data = ex
            break

    if not exercise_data:
        flash('Latihan tidak ditemukan.', 'error')
        return redirect(url_for('modules.module_detail', module_id=module_id))

    # Cek apakah sudah ada log
    existing_log = ExerciseLog.query.filter_by(
        user_id=current_user.id,
        module_id=module_id,
        exercise_id=exercise_id
    ).first()

    # Ambil jurnal entries untuk exercise ini
    journals = JournalEntry.query.filter_by(
        user_id=current_user.id,
        module_id=module_id,
        exercise_id=exercise_id
    ).order_by(JournalEntry.created_at.desc()).all()

    return render_template(
        'exercise.html',
        module=module,
        module_id=module_id,
        exercise=exercise_data,
        log=existing_log,
        journals=journals
    )


@exercises_bp.route('/<module_id>/<exercise_id>/start', methods=['POST'])
@login_required
def start_exercise(module_id, exercise_id):
    # Buat log baru jika belum ada
    existing = ExerciseLog.query.filter_by(
        user_id=current_user.id,
        module_id=module_id,
        exercise_id=exercise_id
    ).first()

    if not existing:
        log = ExerciseLog(
            user_id=current_user.id,
            module_id=module_id,
            exercise_id=exercise_id,
            completed=False
        )
        db.session.add(log)
        db.session.commit()

    return redirect(url_for('exercises.exercise', module_id=module_id, exercise_id=exercise_id))


@exercises_bp.route('/<module_id>/<exercise_id>/complete', methods=['POST'])
@login_required
def complete_exercise(module_id, exercise_id):
    log = ExerciseLog.query.filter_by(
        user_id=current_user.id,
        module_id=module_id,
        exercise_id=exercise_id
    ).first()

    if not log:
        log = ExerciseLog(
            user_id=current_user.id,
            module_id=module_id,
            exercise_id=exercise_id
        )
        db.session.add(log)

    log.completed = True
    log.completed_at = datetime.now(timezone.utc)
    duration = request.form.get('duration_minutes')
    if duration:
        log.duration_minutes = int(duration)
    log.notes = request.form.get('notes', '')

    db.session.commit()
    flash('Latihan selesai! Bagus sekali.', 'success')
    return redirect(url_for('modules.module_detail', module_id=module_id))


@exercises_bp.route('/<module_id>/<exercise_id>/assess', methods=['POST'])
@login_required
def submit_assessment(module_id, exercise_id):
    score = request.form.get('score')
    if not score:
        flash('Masukkan skor penilaian.', 'error')
        return redirect(url_for('exercises.exercise', module_id=module_id, exercise_id=exercise_id))

    # Kumpulkan jawaban assessment
    answers = {}
    for key, value in request.form.items():
        if key.startswith('q_'):
            answers[key] = value

    assessment = Assessment(
        user_id=current_user.id,
        module_id=module_id,
        exercise_id=exercise_id,
        score=int(score),
        answers=answers
    )
    db.session.add(assessment)
    db.session.commit()

    flash('Penilaian disimpan.', 'success')
    return redirect(url_for('exercises.exercise', module_id=module_id, exercise_id=exercise_id))


@exercises_bp.route('/<module_id>/<exercise_id>/journal', methods=['POST'])
@login_required
def add_journal(module_id, exercise_id):
    content = request.form.get('content', '').strip()
    if not content:
        flash('Tulis sesuatu di jurnal.', 'error')
        return redirect(url_for('exercises.exercise', module_id=module_id, exercise_id=exercise_id))

    mood_before = request.form.get('mood_before')
    mood_after = request.form.get('mood_after')

    entry = JournalEntry(
        user_id=current_user.id,
        module_id=module_id,
        exercise_id=exercise_id,
        content=content,
        mood_before=int(mood_before) if mood_before else None,
        mood_after=int(mood_after) if mood_after else None
    )
    db.session.add(entry)
    db.session.commit()

    flash('Jurnal disimpan.', 'success')
    return redirect(url_for('exercises.exercise', module_id=module_id, exercise_id=exercise_id))
