from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)

    from app.routes import auth, users, prayer_times, prayers, stats, friends, feed
    app.register_blueprint(auth.bp)
    app.register_blueprint(users.bp)
    app.register_blueprint(prayer_times.bp)
    app.register_blueprint(prayers.bp)
    app.register_blueprint(stats.bp)
    app.register_blueprint(friends.bp)
    app.register_blueprint(feed.bp)

    @app.route('/api/health')
    def health():
        return {'status': 'healthy', 'message': 'Mizaan API is running'}

    from app.services.scheduler_service import start_scheduler
    start_scheduler(app)

    return app

from app.models import user
