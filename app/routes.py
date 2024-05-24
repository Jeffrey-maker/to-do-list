import sys
import traceback
from flask import Blueprint, current_app, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import boto3

import app
from .models import db, User, Note
import os

main = Blueprint('main', __name__)

def upload_file_to_s3(file, bucket_name, acl="public-read"):
    s3 = boto3.client(
        "s3",
        aws_access_key_id=current_app.config['S3_KEY'],
        aws_secret_access_key=current_app.config['S3_SECRET']
    )

    try:
        s3.upload_fileobj(
            file,
            bucket_name,
            file.filename,
            ExtraArgs={
                "ContentType": file.content_type
            }
        )
    except Exception as e:
        print(f"Error uploading file: {e}")
        print(traceback.format_exc())
        return None

    return f"{current_app.config['S3_LOCATION']}{file.filename}"

@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if 'login' in request.form.get('action', ''):
            # Login existing user
            username = request.form['username']
            password = request.form['password']
            user = User.query.filter_by(username=username).first()
            if user and check_password_hash(user.password, password):
                login_user(user)
                return redirect(url_for('main.notes'))
            else:
                flash('Login Unsuccessful. Please check username and password', 'danger')
        elif 'register' in request.form.get('action', ''):
            # Register new user
            username = request.form['new_username']
            password = request.form['new_password']
            confirm_password = request.form['confirm_password']
            email = request.form['email']

            if password != confirm_password:
                flash('Passwords do not match!', 'danger')
                return redirect(url_for('main.login'))

            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
            new_user = User(username=username, password=hashed_password)
            db.session.add(new_user)
            db.session.commit()

            login_user(new_user)
            flash('Account created successfully!', 'success')
            return redirect(url_for('main.notes'))

    return render_template('login.html')

@main.route('/logout')
@login_required
def logout():
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
                    file_url = upload_file_to_s3(file, current_app.config['S3_BUCKET'])
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