import uuid
from datetime import datetime
from app import db


class Reaction(db.Model):
    __tablename__ = 'reactions'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    prayer_id = db.Column(db.String(36), db.ForeignKey('prayers.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('reactions', lazy=True))
    prayer = db.relationship('Prayer', backref=db.backref('reactions', lazy=True))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'prayer_id', name='unique_user_prayer_reaction'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'prayer_id': self.prayer_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Reaction user={self.user_id} prayer={self.prayer_id}>'
