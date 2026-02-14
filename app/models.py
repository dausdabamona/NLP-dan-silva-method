from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app import db, login_manager


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    exercise_logs = db.relationship('ExerciseLog', backref='user', lazy='dynamic')
    assessments = db.relationship('Assessment', backref='user', lazy='dynamic')
    journal_entries = db.relationship('JournalEntry', backref='user', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_module_progress(self, module_id):
        """Hitung persentase progress untuk modul tertentu."""
        logs = self.exercise_logs.filter_by(module_id=module_id).all()
        if not logs:
            return 0
        completed = sum(1 for log in logs if log.completed)
        total = len(logs)
        return int((completed / total) * 100) if total > 0 else 0

    def is_module_unlocked(self, module_order):
        """Cek apakah modul sudah ter-unlock (modul sebelumnya selesai)."""
        if module_order <= 1:
            return True
        prev_module_id = f"{module_order - 1:02d}"
        prev_progress = self.get_module_progress(prev_module_id)
        return prev_progress >= 80  # Minimal 80% selesai untuk unlock

    def get_streak(self):
        """Hitung streak latihan berturut-turut (dalam hari)."""
        logs = self.exercise_logs.order_by(
            ExerciseLog.completed_at.desc()
        ).all()
        if not logs:
            return 0

        streak = 0
        today = datetime.now(timezone.utc).date()
        current_date = today

        dates_with_activity = set()
        for log in logs:
            if log.completed_at:
                dates_with_activity.add(log.completed_at.date())

        while current_date in dates_with_activity:
            streak += 1
            current_date = current_date - __import__('datetime').timedelta(days=1)

        return streak


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


class ExerciseLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    module_id = db.Column(db.String(10), nullable=False)
    exercise_id = db.Column(db.String(50), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    started_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, nullable=True)
    notes = db.Column(db.Text, nullable=True)


class Assessment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    module_id = db.Column(db.String(10), nullable=False)
    exercise_id = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, nullable=False)  # 1-10
    answers = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class JournalEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    module_id = db.Column(db.String(10), nullable=False)
    exercise_id = db.Column(db.String(50), nullable=True)
    content = db.Column(db.Text, nullable=False)
    mood_before = db.Column(db.Integer, nullable=True)  # 1-10
    mood_after = db.Column(db.Integer, nullable=True)   # 1-10
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
