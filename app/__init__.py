import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cognito import CognitoAuth
from .config import Config

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
cogauth = CognitoAuth()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    login_manager.login_view = 'main.login'
    cogauth.init_app(app)

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app
