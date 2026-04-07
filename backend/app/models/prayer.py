import uuid
from datetime import datetime, date
from app import db


class Prayer(db.Model):
    __tablename__ = 'prayers'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    prayer_name = db.Column(db.String(20), nullable=False)
    photo_url = db.Column(db.String(500), nullable=True)
    prayer_date = db.Column(db.Date, nullable=False, default=date.today, index=True)
    checked_in_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='completed')
    note = db.Column(db.String(500), nullable=True)

    user = db.relationship('User', backref=db.backref('prayers', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'prayer_name': self.prayer_name,
            'photo_url': self.photo_url,
            'prayer_date': self.prayer_date.isoformat() if self.prayer_date else None,
            'checked_in_at': self.checked_in_at.isoformat() if self.checked_in_at else None,
            'status': self.status,
            'note': self.note
        }

    def __repr__(self):
        return f'<Prayer {self.prayer_name} by User {self.user_id} on {self.prayer_date}>'
