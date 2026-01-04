from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    profile_picture_url = db.Column(db.String(500))
    location = db.Column(db.String(100))
    timezone = db.Column(db.String(50))
    calculation_method = db.Column(db.String(20), default='ISNA')
    fcm_token = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'profile_picture_url': self.profile_picture_url,
            'location': self.location,
            'timezone': self.timezone,
            'calculation_method': self.calculation_method,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
