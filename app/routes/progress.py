import json
import os
from flask import Blueprint, render_template, current_app, jsonify
from flask_login import login_required, current_user
from app.models import ExerciseLog, Assessment, JournalEntry
from sqlalchemy import func

progress_bp = Blueprint('progress', __name__)


def load_all_modules():
    modules_dir = current_app.config['MODULES_DIR']
    modules = []
    if not os.path.exists(modules_dir):
        return modules
    for filename in sorted(os.listdir(modules_dir)):
        if filename.endswith('.json'):
            filepath = os.path.join(modules_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                module = json.load(f)
                module['id'] = filename.replace('.json', '')
                modules.append(module)
    modules.sort(key=lambda m: m.get('order', 0))
    return modules


@progress_bp.route('/')
@login_required
def dashboard():
    modules = load_all_modules()

    # Hitung progress per modul
    module_progress = []
    for module in modules:
        mid = module['id']
        total_exercises = len(module.get('exercises', []))
        completed = ExerciseLog.query.filter_by(
            user_id=current_user.id,
            module_id=mid,
            completed=True
        ).count()
        progress_pct = int((completed / total_exercises) * 100) if total_exercises > 0 else 0
        module_progress.append({
            'id': mid,
            'title': module.get('title', ''),
            'level': module.get('level', ''),
            'total': total_exercises,
            'completed': completed,
            'progress': progress_pct
        })

    # Statistik umum
    total_completed = ExerciseLog.query.filter_by(
        user_id=current_user.id, completed=True
    ).count()
    total_journals = JournalEntry.query.filter_by(
        user_id=current_user.id
    ).count()
    avg_score = Assessment.query.filter_by(
        user_id=current_user.id
    ).with_entities(func.avg(Assessment.score)).scalar()
    streak = current_user.get_streak()

    stats = {
        'total_completed': total_completed,
        'total_journals': total_journals,
        'avg_score': round(avg_score, 1) if avg_score else 0,
        'streak': streak
    }

    return render_template('dashboard.html',
                           module_progress=module_progress,
                           stats=stats)


@progress_bp.route('/api/chart-data')
@login_required
def chart_data():
    """API endpoint untuk data grafik progress."""
    assessments = Assessment.query.filter_by(
        user_id=current_user.id
    ).order_by(Assessment.created_at).all()

    data = {
        'labels': [],
        'scores': [],
        'modules': []
    }

    for a in assessments:
        data['labels'].append(a.created_at.strftime('%d/%m'))
        data['scores'].append(a.score)
        data['modules'].append(a.module_id)

    return jsonify(data)
