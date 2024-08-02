from enum import Enum
from . import db
import bcrypt
from flask_login import UserMixin
import pyotp
from .config import Config

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)

    def __repr__(self):
        return f"<user {self.username}>"

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    file_path = db.Column(db.String(300), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    author = db.relationship('User', backref=db.backref('notes', lazy=True))
    deadline_date = db.Column(db.Date, nullable=True)  # Only the date part
    deadline_time = db.Column(db.Time, nullable=True)  # Optional time part
    flag = db.Column(db.Boolean, default=False, nullable=False)
    priority = db.Column(Enum('none', 'low', 'medium', 'high', name='priority_levels'), default='none', nullable=False)
