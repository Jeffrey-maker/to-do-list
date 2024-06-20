from venv import logger
from botocore.exceptions import ClientError
import boto3
import traceback
from flask import current_app
from werkzeug.security import generate_password_hash
from flask_login import current_user
from .models import db, User, Note


# Check whether there is a folder with the username in S3
# If not, create a new one
def create_user_folder_if_not_exists(s3, bucket_name, username):
    folder_name = f"{username}/"
    try:
        result = s3.list_objects_v2(Bucket=bucket_name, Prefix=folder_name)
        if "Contents" not in result:
            # Create a "folder" in S3 by uploading an empty file with the folder name
            s3.put_object(Bucket=bucket_name, Key=folder_name)
    except ClientError as e:
        print(f"Error checking or creating folder: {e}")
        print(traceback.format_exc())
        return False
    return True


# Upload files to S3
# Store the files in the folder with username
def upload_file_to_s3(bucket_name, username, filename, expiration=3600):
    s3 = boto3.client(
        "s3",
        "us-east-2",
        aws_access_key_id=current_app.config["S3_KEY"],
        aws_secret_access_key=current_app.config["S3_SECRET"],
    )
    folder_name = f"{username}/"
    object_name = f"{folder_name}{filename}"
    # Check if the folder exists by attempting to list its contents
    if not create_user_folder_if_not_exists(s3, bucket_name, username):
        return None
    try:
        response = s3.generate_presigned_post(
            Bucket=bucket_name,
            Key=object_name,            
            ExpiresIn=expiration,
        )
        return response
    except Exception as e:
        print(f"Error uploading file: {e}")
        print(traceback.format_exc())
        return None


# Helper function: delete files at S3 based on bucket name, file name
def delete_file_from_s3(bucket_name, object_name, region="us-east-2"):
    s3 = boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=current_app.config["S3_KEY"],
        aws_secret_access_key=current_app.config["S3_SECRET"],
    )
    try:
        s3.delete_object(Bucket=bucket_name, Key=object_name)
        current_app.logger.debug(f"Deleted {object_name} from {bucket_name}")
    except Exception as e:
        current_app.logger.error(f"Error deleting file: {e}")
        current_app.logger.error(traceback.format_exc())


# Create a presigned url based on bucket name and file name
# Presigned url will only allow the user to get their file
# It will be last 60 minutes
def create_presigned_url(bucket_name, object_name, expiration=3600, region="us-east-2"):
    s3_client = boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=current_app.config["S3_KEY"],
        aws_secret_access_key=current_app.config["S3_SECRET"],
    )
    try:
        response = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": object_name},
            ExpiresIn=expiration,
        )
    except Exception as e:
        current_app.logger.error(f"Error generating presigned URL: {e}")
        current_app.logger.error(traceback.format_exc())
        return None
    return response


# Create new user in postgreSQL
def create_user(username, password, email):
    hashed_password = generate_password_hash(password, method="pbkdf2:sha256")
    new_user = User(username=username, password=hashed_password, email=email)
    db.session.add(new_user)
    db.session.commit()


# Create new note in postgreSQL
def create_note(title, description, s3_object_key, current_user):
    note = Note(
        title=title,
        description=description,
        file_path=s3_object_key,
        author=current_user,
    )
    db.session.add(note)
    db.session.commit()
    return note