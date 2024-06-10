import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_secret_key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///site.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    S3_BUCKET = os.getenv('S3_BUCKET')
    S3_KEY = os.getenv('AWS_ACCESS_KEY_ID')
    S3_SECRET = os.getenv('AWS_SECRET_ACCESS_KEY')
    S3_LOCATION = f"https://{os.getenv('S3_BUCKET')}.s3.{os.getenv('COGNITO_REGION')}.amazonaws.com/"

    COGNITO_REGION = os.getenv('COGNITO_REGION')
    COGNITO_USERPOOL_ID = os.getenv('COGNITO_USERPOOL_ID')
    COGNITO_APP_CLIENT_ID = os.getenv('COGNITO_APP_CLIENT_ID')
    COGNITO_APP_CLIENT_SECRET = os.getenv('COGNITO_APP_CLIENT_SECRET')
    COGNITO_IDENTITY_POOL_ID = os.getenv('COGNITO_IDENTITY_POOL_ID')

    APP_NAME = "APP_NAME"