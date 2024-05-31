import sys
import traceback
from flask import Blueprint, current_app, render_template, redirect, session, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import boto3
from botocore.exceptions import ClientError
from pycognito import Cognito
import hmac
import base64
import hashlib
import qrcode
from io import BytesIO
import pyotp
import uuid

import app
from .models import db, User, Note
import os

main = Blueprint('main', __name__)

def get_secret_hash(username, client_id, client_secret):
    message = username + client_id
    dig = hmac.new(client_secret.encode('utf-8'), msg=message.encode('utf-8'), digestmod=hashlib.sha256).digest()
    return base64.b64encode(dig).decode()

def get_cognito():
    return Cognito(
        current_app.config['COGNITO_USERPOOL_ID'],
        current_app.config['COGNITO_APP_CLIENT_ID'],
        user_pool_region=current_app.config['COGNITO_REGION']
    )

def get_cognito_client():
    return boto3.client('cognito-idp', region_name=current_app.config['COGNITO_REGION'])

def create_user_folder_if_not_exists(s3, bucket_name, username):
    folder_name = f"{username}/"
    try:
        result = s3.list_objects_v2(Bucket=bucket_name, Prefix=folder_name)
        if 'Contents' not in result:
            # Create a "folder" in S3 by uploading an empty file with the folder name
            s3.put_object(Bucket=bucket_name, Key=folder_name)
    except ClientError as e:
        print(f"Error checking or creating folder: {e}")
        print(traceback.format_exc())
        return False
    return True

def upload_file_to_s3(file, bucket_name, username, acl="private"):
    s3 = boto3.client(
        "s3",
        aws_access_key_id=current_app.config['S3_KEY'],
        aws_secret_access_key=current_app.config['S3_SECRET']
    )

    folder_name = f"{username}/"
    # Check if the folder exists by attempting to list its contents
    if not create_user_folder_if_not_exists(s3, bucket_name, username):
        return None

    try:
        folder_name = f"{username}/"
        filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
        s3.upload_fileobj(
            file,
            bucket_name,
            folder_name+filename,
            ExtraArgs={
                "ContentType": file.content_type,
                "ACL": acl
            }
        )
    except Exception as e:
        print(f"Error uploading file: {e}")
        print(traceback.format_exc())
        return None

    return f"{current_app.config['S3_LOCATION']}{folder_name+filename}"


@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Login existing user
        username = request.form.get('username')
        password = request.form.get('password')
        if not username or not password:
            flash('Username and password are required!', 'danger')
            return redirect(url_for('main.login'))

        user = User.query.filter_by(username=username).first()
        
        if not user:
            flash('User not found!', 'danger')
            return redirect(url_for('main.login'))

        client = boto3.client('cognito-idp', region_name=current_app.config['COGNITO_REGION'])

        secret_hash = get_secret_hash(username, current_app.config['COGNITO_APP_CLIENT_ID'], current_app.config['COGNITO_APP_CLIENT_SECRET'])

        try:
            response = client.initiate_auth(
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': username,
                    'PASSWORD': password,
                    'SECRET_HASH': secret_hash
                },
                ClientId=current_app.config['COGNITO_APP_CLIENT_ID']
            )

            print("Login error", response, file=sys.stdout)
            sys.stdout.flush()

            login_user(user)

            """
            if 'ChallengeName' in response:
                session['cognito_session'] = response['Session']
                flash('Additional verification required', 'warning')

                # Handle different challenge names here
                if response['ChallengeName'] == 'MFA_SETUP':
                    # Redirect to MFA setup page or handle it accordingly
                    return redirect(url_for('main.setup_mfa'))
                elif response['ChallengeName'] == 'SOFTWARE_TOKEN_MFA':
                    # Redirect to MFA verification page or handle it accordingly
                    return redirect(url_for('main.verify_mfa'))
                else:
                    flash(f"Unexpected challenge: {response['ChallengeName']}", 'danger')
                    return redirect(url_for('main.login'))
            """

            if current_user.is_two_factor_authentication_enabled == True:
                return redirect(url_for('main.verify_mfa'))
            else: 
                return redirect(url_for('main.setup_mfa'))

            flash('Login successful!', 'success')
            
            return redirect(url_for('main.notes'))
        except ClientError as e:
            flash(f"Login error: {e.response['Error']['Message']}", 'danger')

            print("Login error", e, file=sys.stdout)
            sys.stdout.flush()

            return redirect(url_for('main.login'))
    return render_template('login.html')

@main.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        # Register new user
        username = request.form['new_username']
        password = request.form['new_password']
        confirm_password = request.form['confirm_password']
        email = request.form['email']
        secret_token = pyotp.random_base32()
        cognito = get_cognito_client()

        if password != confirm_password:
            flash('Passwords do not match!', 'danger')
            return redirect(url_for('main.login'))

        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(username=username, password=hashed_password, is_two_factor_authentication_enabled = False, email=email,secret_token=secret_token)
        db.session.add(new_user)
        db.session.commit()
        
        try:
            secret_hash = get_secret_hash(username, current_app.config['COGNITO_APP_CLIENT_ID'], current_app.config['COGNITO_APP_CLIENT_SECRET'])
            response = cognito.sign_up(
                ClientId=current_app.config['COGNITO_APP_CLIENT_ID'],
                Username=username,
                Password=password,
                SecretHash=secret_hash,
                UserAttributes=[
                    {
                        'Name': 'email',
                        'Value': email
                    }
                ]
            )
            print(response, file=sys.stdout)
            sys.stdout.flush()
            session['new_username'] = username
            session['new_email'] = email
            user = User.query.filter_by(username=username).first()
            login_user(user)
            flash('Sign-up successful!', 'success')
            return redirect(url_for('main.confirm_user'))
        except ClientError as e:
            flash(f"Sign-up error: {e.response['Error']['Message']}", 'danger')
            return redirect(url_for('main.register'))
    return render_template('register.html')

@main.route('/confirm_user', methods=['GET', 'POST'])
@login_required
def confirm_user():
    if 'new_username' not in session or 'new_email' not in session:
        flash('No username or email found in session. Please register first.', 'danger')
        return redirect(url_for('main.register'))

    if request.method == 'POST':
        confirmation_code = request.form.get('confirmation_code')
        username = session['new_username']

        cognito = get_cognito_client()

        try:
            response = cognito.confirm_sign_up(
                ClientId=current_app.config['COGNITO_APP_CLIENT_ID'],
                Username=username,
                ConfirmationCode=confirmation_code,
                SecretHash=get_secret_hash(username, current_app.config['COGNITO_APP_CLIENT_ID'], current_app.config['COGNITO_APP_CLIENT_SECRET'])
            )

            flash('Email confirmed successfully!', 'success')
            return redirect(url_for('main.setup_mfa'))
        except ClientError as e:
            flash(f"Confirmation error: {e.response['Error']['Message']}", 'danger')
            return redirect(url_for('main.confirm_user'))

    email = session['new_email']
    return render_template('confirm_user.html', email=email)

@main.route('/setup_mfa', methods=['GET', 'POST'])
@login_required
def setup_mfa():
    secret = current_user.secret_token
    print(secret, file=sys.stdout)
    sys.stdout.flush()
    uri = current_user.get_authentication_setup_uri()
    base64_qr_image = get_b64encoded_qr_image(uri)
    return render_template("setup_mfa.html", secret=secret, qr_image=base64_qr_image)

@main.route('/verify_mfa', methods=['GET', 'POST'])
@login_required
def verify_mfa():
    if request.method == 'POST':
        otp = request.form.get('otp')
        
        if current_user.is_otp_valid(otp):
            current_user.is_two_factor_authentication_enabled = True
            db.session.commit()
            flash("2FA verification successful. You are logged in!", 'success')
            return redirect(url_for('main.notes'))
        else:
            flash("Invalid OTP. Please try again.", 'danger')
    
    return render_template("verify_mfa.html")

def get_b64encoded_qr_image(uri):
    qr = qrcode.make(uri)
    buffered = BytesIO()
    qr.save(buffered, 'PNG')
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

@main.route('/logout')
@login_required
def logout():
    session.pop('access_token', None)
    logout_user()
    return redirect(url_for('main.login'))

@main.route('/notes', methods=['GET', 'POST'])
@login_required
def notes():
    try:
        print("REQUEST NOTE", request, file=sys.stdout)
        if request.method == 'POST':
            title = request.form.get('title')
            description = request.form.get('description')
            file = request.files.get('file')
            file_url = None

            if file:
                print(file)
                try:  
                    file_url = upload_file_to_s3(file, current_app.config['S3_BUCKET'], current_user.username)
                    print(file_url)
                except e:
                    print(e)

                print(file_url)
                

            note = Note(title=title, description=description, file_path=file_url, author=current_user)
            db.session.add(note)
            db.session.commit()
            flash('Note added successfully!', 'success')
            return redirect(url_for('main.notes'))

        elif request.method == 'GET':
            user_notes = Note.query.filter_by(user_id=current_user.id).all()
            print("Notes retrieved successfully")
            return render_template('notes.html', notes=user_notes)

    except Exception as e:
        print(f"Error: {e}")
        print(traceback.format_exc())
        return "An error occurred while processing your request.", 500
    
@main.route('/delete/<int:note_id>', methods=['POST'])
@login_required
def delete(note_id):
    note = Note.query.get_or_404(note_id)
    if note.author != current_user:
        flash('You do not have permission to delete this note.', 'danger')
        return redirect(url_for('main.notes'))

    db.session.delete(note)
    db.session.commit()
    flash('Note deleted successfully!', 'success')
    return redirect(url_for('main.notes'))