import json
import os
from flask import Blueprint, render_template, current_app, abort
from flask_login import login_required, current_user

modules_bp = Blueprint('modules', __name__)


def load_module_data(module_id):
    """Muat data modul dari file JSON."""
    modules_dir = current_app.config['MODULES_DIR']
    filepath = os.path.join(modules_dir, f'{module_id}.json')
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_all_modules():
    """Muat semua modul dan urutkan berdasarkan order."""
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


@modules_bp.route('/')
@login_required
def module_list():
    modules = load_all_modules()
    # Tambahkan info progress dan unlock status
    for module in modules:
        module['progress'] = current_user.get_module_progress(module['id'])
        module['unlocked'] = current_user.is_module_unlocked(module.get('order', 1))
    return render_template('module_list.html', modules=modules)


@modules_bp.route('/<module_id>')
@login_required
def module_detail(module_id):
    module = load_module_data(module_id)
    if not module:
        abort(404)
    module['id'] = module_id
    module['progress'] = current_user.get_module_progress(module_id)

    # Cek apakah modul ter-unlock
    if not current_user.is_module_unlocked(module.get('order', 1)):
        return render_template('module_locked.html', module=module)

    return render_template('module_detail.html', module=module)
