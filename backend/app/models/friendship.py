import uuid
from datetime import datetime
from app import db


class Friendship(db.Model):
    __tablename__ = 'friendships'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    requester_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    addressee_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    requester = db.relationship('User', foreign_keys=[requester_id], backref=db.backref('sent_requests', lazy=True))
    addressee = db.relationship('User', foreign_keys=[addressee_id], backref=db.backref('received_requests', lazy=True))

    def to_dict(self, current_user_id=None):
        return {
            'id': self.id,
            'requester_id': self.requester_id,
            'addressee_id': self.addressee_id,
            'requester_username': self.requester.username if self.requester else None,
            'addressee_username': self.addressee.username if self.addressee else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Friendship {self.requester_id} -> {self.addressee_id} ({self.status})>'
