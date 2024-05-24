import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_secret_key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///site.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    S3_BUCKET = os.getenv('S3_BUCKET')
    S3_KEY = os.getenv('AWS_ACCESS_KEY_ID')
    S3_SECRET = os.getenv('AWS_SECRET_ACCESS_KEY')
    S3_LOCATION = f"http://{os.getenv('S3_BUCKET')}.s3.amazonaws.com/"
