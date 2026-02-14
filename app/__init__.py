from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    login_manager.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.modules import modules_bp
    from app.routes.exercises import exercises_bp
    from app.routes.progress import progress_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(modules_bp, url_prefix='/modules')
    app.register_blueprint(exercises_bp, url_prefix='/exercises')
    app.register_blueprint(progress_bp, url_prefix='/progress')

    with app.app_context():
        db.create_all()

    return app
