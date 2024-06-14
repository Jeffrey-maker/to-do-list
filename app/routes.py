import sys
import traceback
from flask import (
    Blueprint,
    current_app,
    render_template,
    redirect,
    session,
    url_for,
    request,
    jsonify,
    flash,
    Flask,
)
from flask_cors import CORS
from flask_login import login_user, login_required, logout_user, current_user
import requests
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
import re

import app
from .models import db, User, Note
import os
import logging

logging.basicConfig(level=logging.DEBUG)

main = Blueprint("main", __name__)
logger = logging.getLogger(__name__)

"""
    Return hash code of password
"""
def get_secret_hash(username, client_id, client_secret):
    message = username + client_id
    dig = hmac.new(
        client_secret.encode("utf-8"),
        msg=message.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()
    return base64.b64encode(dig).decode()


"""
    Create and return Cognito instance
"""
def get_cognito():
    return Cognito(
        current_app.config["COGNITO_USERPOOL_ID"],
        current_app.config["COGNITO_APP_CLIENT_ID"],
        user_pool_region=current_app.config["COGNITO_REGION"],
    )


"""
    create and return a client object for the Amazon Cognito Identity Provider (Cognito IDP) using the Boto3 library, which is the AWS SDK for Python.
"""
def get_cognito_client():
    return boto3.client("cognito-idp", region_name=current_app.config["COGNITO_REGION"])


"""
    Check whether there is a folder with the username in S3
    If not, create a new one
"""
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


"""
    Upload files to S3
    Store the files in the folder with username
    Files are ristricted by 1MB
"""
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
            Conditions=[
                ["content-length-range", 0, 1048576]  # Restrict file size to 1MB
            ],
        )
        logger.debug(f"Response in upload is : {response}")
        return response
    except Exception as e:
        print(f"Error uploading file: {e}")
        print(traceback.format_exc())
        return None


"""
    Check whether MFA is setup
"""
def check_mfa_setup_status(cognito_client, access_token):
    response = cognito_client.get_user(AccessToken=access_token)
    mfa_enabled = False
    for attribute in response["UserAttributes"]:
        if attribute["Name"] == "cognito:preferred_mfa_setting":
            mfa_enabled = True
            break
    return mfa_enabled


"""
    Login page
    Check username and password
    Check if the email address has been verified, if not, return to verify email page
    Check MFA status: MFA setup or verify MFA
    If MFA pass, get id token, access token, refresh token
    If all pass, return to notes page
"""
@main.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # Login existing user
        username = request.form.get("username")
        password = request.form.get("password")
        if not username or not password:
            flash("Username and password are required!", "danger")
            return redirect(url_for("main.login"))

        user = User.query.filter_by(username=username).first()

        if not user:
            flash("User not found!", "danger")
            return redirect(url_for("main.login"))

        cognito_client = get_cognito_client()

        try:
            login_user(user)
            user_details = cognito_client.admin_get_user(
                UserPoolId=current_app.config["COGNITO_USERPOOL_ID"], Username=username
            )
            email_verified = any(
                attr["Name"] == "email_verified" and attr["Value"] == "true"
                for attr in user_details["UserAttributes"]
            )

            if not email_verified:
                flash("Email not confirmed. Please confirm your email.", "warning")
                logger.debug(f"Session with not verify email: {session}")
                return redirect(url_for("main.confirm_user"))

            response = cognito_client.initiate_auth(
                ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={
                    "USERNAME": username,
                    "PASSWORD": password,
                    "SECRET_HASH": get_secret_hash(
                        username,
                        current_app.config["COGNITO_APP_CLIENT_ID"],
                        current_app.config["COGNITO_APP_CLIENT_SECRET"],
                    ),
                },
            )
            logger.debug(f"Response at login: {response}")

            if "ChallengeName" in response:
                session["Session"] = response["Session"]
                session["USERNAME"] = username
                if response["ChallengeName"] == "MFA_SETUP":
                    flash("MFA setup required. Please enter your MFA code.", "info")
                    return redirect(url_for("main.setup_mfa"))
                elif response["ChallengeName"] == "SOFTWARE_TOKEN_MFA":
                    flash("Please enter your MFA code.", "info")
                    return redirect(url_for("main.verify_mfa"))
            else:
                id_token = response["AuthenticationResult"]["IdToken"]
                access_token = response["AuthenticationResult"]["AccessToken"]
                refresh_token = response["AuthenticationResult"]["RefreshToken"]

                mfa_enabled = check_mfa_setup_status(cognito_client, access_token)
                if not mfa_enabled:
                    flash("MFA setup required. Please set up your MFA.", "info")
                    return redirect(url_for("main.setup_mfa"))

                session["id_token"] = id_token
                session["access_token"] = access_token
                session["refresh_token"] = refresh_token

                user = User.query.filter_by(username=username).first()
                if not user:
                    user = User(
                        username=username, email=""
                    )  # Assuming email is empty for now
                    db.session.add(user)
                    db.session.commit()

                flash("Login successful!", "success")
                return redirect(url_for("main.notes"))

        except cognito_client.exceptions.NotAuthorizedException:
            flash("Incorrect username or password", "danger")
        except cognito_client.exceptions.UserNotFoundException:
            flash("User not found", "danger")

    return render_template("login.html")


"""
    Register page
    Check if the password follows regular expression, including at least one uppercase letter, one lowercase letter, one number, and one special character, including @, $, !, %, *, ?, &.
    Check whether password and confirm password is same
    Ckeck if the username and email is already existed, if yes, return to register page and set new one
    Create hash code of password
    Store username, hash code of password and email in postgreSQL
    Sign up on cognito
    Return to verify email page
"""
@main.route("/register", methods=["POST"])
def register():
    logger.debug("Enter to register")
    # Register new user
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")
    cognito = get_cognito_client()


    existing_user = User.query.filter(
        (User.username == username) | (User.email == email)
    ).first()
    if existing_user:
        if existing_user.username == username:
            flash("Username already exists!", "danger")
        if existing_user.email == email:
            flash("Email already exists!", "danger")
        return redirect(url_for("main.register"))

    hashed_password = generate_password_hash(password, method="pbkdf2:sha256")
    new_user = User(username=username, password=hashed_password, email=email)
    db.session.add(new_user)
    db.session.commit()

    try:
        secret_hash = get_secret_hash(
            username,
            current_app.config["COGNITO_APP_CLIENT_ID"],
            current_app.config["COGNITO_APP_CLIENT_SECRET"],
        )
        response = cognito.sign_up(
            ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
            Username=username,
            Password=password,
            SecretHash=secret_hash,
            UserAttributes=[{"Name": "email", "Value": email}],
        )
        session["new_username"] = username
        session["new_email"] = email
        session["new_password"] = password
        session["secret_hash"] = secret_hash
        user = User.query.filter_by(username=username).first()
        login_user(user)
        return jsonify({"message": "Sign-up successful!"}), 200
    except ClientError as e:
        return jsonify({"error": f"Sign-up error: {str(e)}"}), 400
    


"""
    Check if username and email are existed, if not, return to register page
    User confirm_sign_up to get code from email
    Check email code
    Use initiate_auth get Session and store in session
"""
@main.route("/api/auth/confirm-user", methods=["GET", "POST"])
@login_required
def confirm_user():
    if "new_username" not in session or "new_email" not in session:
        flash("No username or email found in session. Please register first.", "danger")
        return redirect(url_for("main.register"))

    username = session["new_username"]
    password = session["new_password"]

    cognito = get_cognito_client()

    if request.method == "POST":
        confirmation_code = request.json.get("confirmation_code")

        try:
            response = cognito.confirm_sign_up(
                ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
                Username=username,
                ConfirmationCode=confirmation_code,
                SecretHash=get_secret_hash(
                    username,
                    current_app.config["COGNITO_APP_CLIENT_ID"],
                    current_app.config["COGNITO_APP_CLIENT_SECRET"],
                ),
            )

            auth_response = cognito.initiate_auth(
                ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={
                    "USERNAME": username,
                    "PASSWORD": password,  # Use the same password provided during registration
                    "SECRET_HASH": get_secret_hash(
                        username,
                        current_app.config["COGNITO_APP_CLIENT_ID"],
                        current_app.config["COGNITO_APP_CLIENT_SECRET"],
                    ),  # Include the SECRET_HASH
                },
            )
            logger.debug(f"Response at confirm user: {auth_response}")
            session["Session"] = auth_response["Session"]
            flash("Email confirmed successfully!", "success")
            return jsonify({"message": "Email confirmed successfully!"}), 200
        except ClientError as e:
            flash(f"Confirmation error: {str(e)}", "danger")
            return jsonify({"error": f"Confirmation error: {str(e)}"}), 400

    try:
        secret_hash = get_secret_hash(
            username,
            current_app.config["COGNITO_APP_CLIENT_ID"],
            current_app.config["COGNITO_APP_CLIENT_SECRET"],
        )
        cognito.resend_confirmation_code(
            ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
            Username=username,
            SecretHash=secret_hash,
        )
        flash(f"A new confirmation code has been sent to {username}.", "info")
        logger.debug(f"Resend email from login: {resend_confirmation_code}")
    except ClientError as e:
        flash(
            f"Error resending confirmation code: {e.response['Error']['Message']}",
            "danger",
        )

    email = session["new_email"]
    return render_template("confirm_user.html", email=email)


"""
    Resend code to email
"""
@main.route("/resend_confirmation_code", methods=["POST"])
@login_required
def resend_confirmation_code():
    username = session.get("new_username")
    if not username:
        logger.error("No username found in session.")
        return jsonify(
            success=False,
            message="No username found in session. Please register first.",
        )

    cognito = get_cognito_client()

    try:
        logger.info(f"Attempting to resend confirmation code for user: {username}")
        response = cognito.resend_confirmation_code(
            ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
            Username=username,
            SecretHash=get_secret_hash(
                username,
                current_app.config["COGNITO_APP_CLIENT_ID"],
                current_app.config["COGNITO_APP_CLIENT_SECRET"],
            ),
        )
        logger.info("Confirmation code resent successfully.")
        return jsonify(success=True, message="Confirmation code resent successfully!")
    except ClientError as e:
        logger.error(
            f"ClientError while resending confirmation code: {e.response['Error']['Message']}"
        )
        return jsonify(
            success=False,
            message=f"Error resending confirmation code: {e.response['Error']['Message']}",
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify(success=False, message=f"Unexpected error: {str(e)}")


"""
    Get secret code from associate_software_token by using Session
    Using secret code get uri
    Using uri get QR code from Google Authenticator so that user can scan it and input code to get set up MFA
"""
@main.route("/setup_mfa", methods=["GET", "POST"])
@login_required
def setup_mfa():
    if request.method == "GET":
        cognito_client = get_cognito_client()
        response = cognito_client.associate_software_token(Session=session["Session"])
        logger.debug(f"Response at setup_mfa: {response}")
        secret_code = response["SecretCode"]
        session["Session"] = response["Session"]
        uri = pyotp.totp.TOTP(secret_code).provisioning_uri(
            name=current_user.username, issuer_name="YourApp"
        )
        base64_qr_image = get_b64encoded_qr_image(uri)
        session["Secret_code"] = secret_code
        return render_template(
            "setup_mfa.html", secret=secret_code, qr_image=base64_qr_image
        )

    elif request.method == "POST":
        otp = request.form.get("otp")
        if "Session" not in session:
            flash("Session is missing. Please log in again.", "danger")
            return redirect(url_for("main.login"))

        cognito_client = get_cognito_client()

        try:
            username = session["new_username"]
            session_token = session["Session"]

            logger.debug(f"Username from session: {username}")
            logger.debug(f"Session token: {session_token}")
            logger.debug(f"OTP code: {otp}")

            secret_hash = get_secret_hash(
                username,
                current_app.config["COGNITO_APP_CLIENT_ID"],
                current_app.config["COGNITO_APP_CLIENT_SECRET"],
            )
            logger.debug(f"Secret hash: {secret_hash}")

            response = cognito_client.verify_software_token(
                Session=session_token, UserCode=otp
            )
            logger.debug(f"Response from Cognito: {response}")

            return redirect(url_for("main.login"))

        except cognito_client.exceptions.NotAuthorizedException as e:
            logger.error(f"Not authorized: {e}")
            flash(f"Not authorized to verify the MFA code: {str(e)}", "danger")
        except cognito_client.exceptions.CodeMismatchException as e:
            logger.error(f"Code mismatch: {e}")
            flash(f"Invalid MFA code: {str(e)}", "danger")
        except cognito_client.exceptions.ExpiredCodeException as e:
            logger.error(f"Expired code: {e}")
            flash(f"The MFA code has expired: {str(e)}", "danger")
        except KeyError as e:
            logger.error(f"Key error: {e}")
            flash(
                f"Session or access token is missing: {str(e)}. Please log in again.",
                "danger",
            )
            return redirect(url_for("main.login"))
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            flash(f"An unexpected error occurred: {str(e)}", "danger")

    return render_template("setup_mfa.html")


"""
    Check code from Google Authenticator
"""
@main.route("/verify_mfa", methods=["GET", "POST"])
@login_required
def verify_mfa():
    if request.method == "POST":
        otp = request.form.get("otp")
        cognito_client = get_cognito_client()

        try:
            response = cognito_client.respond_to_auth_challenge(
                ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
                ChallengeName="SOFTWARE_TOKEN_MFA",
                Session=session["Session"],
                ChallengeResponses={
                    "USERNAME": session["new_username"],
                    "SOFTWARE_TOKEN_MFA_CODE": otp,
                    "SECRET_HASH": get_secret_hash(
                        session["new_username"],
                        current_app.config["COGNITO_APP_CLIENT_ID"],
                        current_app.config["COGNITO_APP_CLIENT_SECRET"],
                    ),
                },
            )
            logger.debug(f"Response from verify: {response}")
            if "AuthenticationResult" in response:
                id_token = response["AuthenticationResult"]["IdToken"]
                access_token = response["AuthenticationResult"]["AccessToken"]
                refresh_token = response["AuthenticationResult"]["RefreshToken"]
                session["id_token"] = id_token
                session["access_token"] = access_token
                session["refresh_token"] = refresh_token
                logger.debug(f"Session from verify: {session}")
                flash("MFA setup completed successfully.", "success")
                return redirect(url_for("main.notes"))
            else:
                flash("Invalid MFA code. Please try again.", "danger")

        except cognito_client.exceptions.NotAuthorizedException as e:
            logger.error(f"Not authorized: {e}")
            logger.debug(traceback.format_exc())
            flash("Not authorized to verify the MFA code.", "danger")
        except cognito_client.exceptions.CodeMismatchException as e:
            logger.error(f"Code mismatch: {e}")
            logger.debug(traceback.format_exc())
            flash("Invalid MFA code.", "danger")
        except cognito_client.exceptions.ExpiredCodeException as e:
            logger.error(f"Expired code: {e}")
            logger.debug(traceback.format_exc())
            flash("The MFA code has expired.", "danger")
        except KeyError as e:
            logger.error(f"Key error: {e}")
            logger.debug(traceback.format_exc())
            flash(
                f"Session or access token is missing: {str(e)}. Please log in again.",
                "danger",
            )
            return redirect(url_for("main.login"))
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            logger.debug(traceback.format_exc())
            flash(f"An unexpected error occurred: {str(e)}", "danger")

    return render_template("verify_mfa.html")


"""
    Get QR code from uri
"""
def get_b64encoded_qr_image(uri):
    qr = qrcode.make(uri)
    buffered = BytesIO()
    qr.save(buffered, "PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


"""
    Logout
    Return to login page
    Session will be cleared
"""
@main.route("/logout")
@login_required
def logout():
    session.pop("access_token", None)
    logout_user()
    return redirect(url_for("main.login"))


"""
    Store title, description, file path in postgreSQL
    The file name will be uuid, so that store same files will not have same address
    Files are stored in the folder with username in S3
    Files are stored by presigned url. They are private, can only be seen, edited, and deleted by user
"""
@main.route("/notes", methods=["GET", "POST"])
@login_required
def notes():
    try:
        if request.method == "POST":
            title = request.form.get("title")
            description = request.form.get("description")
            file = request.files.get("file")
            s3_object_key = None
            presigned_post = None

            if file:
                try:
                    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
                    presigned_post = upload_file_to_s3(
                        current_app.config["S3_BUCKET"], current_user.username, filename
                    )
                    current_app.logger.debug(f"Presigned Post: {presigned_post}")
                    files = {"file": (file.filename, file.stream, file.content_type)}
                    response = requests.post(
                        presigned_post["url"],
                        data=presigned_post["fields"],
                        files=files,
                    )
                    if response.status_code == 204:
                        s3_object_key = f"{current_user.username}/{filename}"
                    else:
                        raise Exception("File upload failed")
                except Exception as e:
                    current_app.logger.error(f"Error uploading file: {e}")
                    current_app.logger.error(traceback.format_exc())

            note = Note(
                title=title,
                description=description,
                file_path=s3_object_key,
                author=current_user,
            )
            db.session.add(note)
            db.session.commit()
            flash("Note added successfully!", "success")
            return redirect(url_for("main.notes"))

        elif request.method == "GET":
            user_notes = Note.query.filter_by(user_id=current_user.id).all()
            notes_with_presigned_urls = []
            for note in user_notes:
                presigned_url = None
                if note.file_path:
                    try:
                        presigned_url = create_presigned_url(
                            current_app.config["S3_BUCKET"], note.file_path
                        )
                        logger.debug(f"Presigned URL: {presigned_url}")
                    except Exception as e:
                        current_app.logger.error(f"Error generating presigned URL: {e}")
                        current_app.logger.error(traceback.format_exc())
                notes_with_presigned_urls.append(
                    {
                        "id": note.id,
                        "title": note.title,
                        "description": note.description,
                        "presigned_url": presigned_url,
                    }
                )
            current_app.logger.debug("Notes retrieved successfully")
            current_app.logger.debug(
                f"Notes with presigned url:  {notes_with_presigned_urls}"
            )
            return render_template("notes.html", notes=notes_with_presigned_urls)

    except Exception as e:
        print(f"Error: {e}")
        print(traceback.format_exc())
        return "An error occurred while processing your request.", 500


"""
    Create presigned url, which is used when get files from S3
    It only be lasted in 60min
"""
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


"""
    Delete notes at postgreSQL
    Delete files at S3
"""
@main.route("/delete/<int:note_id>", methods=["POST"])
@login_required
def delete(note_id):
    note = Note.query.get_or_404(note_id)
    if note.author != current_user:
        flash("You do not have permission to delete this note.", "danger")
        return redirect(url_for("main.notes"))

    if note.file_path:
        try:
            delete_file_from_s3(current_app.config["S3_BUCKET"], note.file_path)
        except Exception as e:
            current_app.logger.error(f"Error deleting file from S3: {e}")
            current_app.logger.error(traceback.format_exc())
            flash("An error occurred while deleting the file from S3.", "danger")
            return redirect(url_for("main.notes"))

    db.session.delete(note)
    db.session.commit()
    flash("Note deleted successfully!", "success")
    return redirect(url_for("main.notes"))


"""
    Helper function: delete files at S3
"""
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
