import traceback
from flask import (
    Blueprint,
    current_app,
    session,
    request,
    jsonify,
    flash,
)
from flask_login import login_user, login_required, logout_user, current_user
import requests
from werkzeug.utils import secure_filename
from botocore.exceptions import ClientError
import pyotp
import uuid
import logging
from .id import (
    get_secret_hash,
    get_cognito_client,
    check_mfa_setup_status,
    get_b64encoded_qr_image,
    initiate_auth,
    sign_up,
    confirm_sign_up,
    resend_confirmation_code_to_email,
    respond_to_auth_challenge,
)
from .models import db, User, Note
from .db import (
    upload_file_to_s3,
    delete_file_from_s3,
    create_presigned_url,
    create_user,
    create_note,
)

logging.basicConfig(level=logging.DEBUG)
main = Blueprint("main", __name__)
logger = logging.getLogger(__name__)


# Login page
# Check username and password
# Check if the email address has been verified, if not, return to verify email page
# Check MFA status: MFA setup or verify MFA
# If MFA pass, get id token, access token, refresh token
# If all pass, return to notes page
@main.route("/login", methods=["POST"])
def login():
    # Request data from frontend
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    # Finf whether the user exist
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 400

    cognito_client = get_cognito_client()
    email = user.email if user else None

    # Update session
    session["username"] = username
    session["password"] = password
    session["email"] = email
    try:
        login_user(user)
        # Check whether email is verified
        user_details = cognito_client.admin_get_user(
            UserPoolId=current_app.config["COGNITO_USERPOOL_ID"], Username=username
        )
        email_verified = any(
            attr["Name"] == "email_verified" and attr["Value"] == "true"
            for attr in user_details["UserAttributes"]
        )
        if not email_verified:
            session["username"] = username
            flash("Email not confirmed. Please confirm your email.", "warning")
            logger.debug(f"Session with not verify email: {session}")
            return jsonify({"message": "Email not confirmed", "email": email}), 200

        # Initiate an authentication process
        response = initiate_auth(cognito_client, username, password)
        if "ChallengeName" in response:
            session["Session"] = response["Session"]
            session["username"] = username
            if response["ChallengeName"] == "MFA_SETUP":
                return jsonify({"message": "Need MFA setup"}), 200
            elif response["ChallengeName"] == "SOFTWARE_TOKEN_MFA":
                return jsonify({"message": "Need MFA verify"}), 200
        else:
            id_token = response["AuthenticationResult"]["IdToken"]
            access_token = response["AuthenticationResult"]["AccessToken"]
            refresh_token = response["AuthenticationResult"]["RefreshToken"]

            mfa_enabled = check_mfa_setup_status(cognito_client, access_token)
            if not mfa_enabled:
                flash("MFA setup required. Please set up your MFA.", "info")
                return jsonify({"message": "Need MFA setup"}), 200

            # Store id token, access token and refresh token in session
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
            return jsonify({"message": "Login successful!"}), 200

    except cognito_client.exceptions.NotAuthorizedException:
        jsonify({"error": "Incorrect username or password"}), 400
    except cognito_client.exceptions.UserNotFoundException:
        jsonify({"error": "User not found"}), 400

    return jsonify({"error": "Unexpected error occurred"}), 500


# Check uername and email if the user forget password and want to reset it
@main.route("/vertify-identity", methods=["POST"])
def vertifyIdentity():
    logger.debug("Enter to vertify identity")
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

    cognito_client = get_cognito_client()
    existing_user = User.query.filter((User.username == username)).first()
    existing_email = User.query.filter((User.email == email)).first()

    if not existing_user:
        errors = []
        errors.append("Username does not exist!")
        return jsonify({"errors": errors}), 400

    if not existing_email:
        errors = []
        errors.append("Email does not exist!")
        return jsonify({"errors": errors}), 400

    if existing_user.id != existing_email.id:
        errors = []
        errors.append("Username and email do not match")
        return jsonify({"errors": errors}), 400

    try:
        session["username"] = username
        user_details = cognito.admin_get_user(
            UserPoolId=current_app.config["COGNITO_USERPOOL_ID"], 
            Username=username
        )

        email_verified = any(
            attr["Name"] == "email_verified" and attr["Value"] == "true"
            for attr in user_details["UserAttributes"]
        )
        if not email_verified:
            logger.debug(f"Email not verified for user {username}")
            return jsonify({"message": "Email not confirmed"}), 200
        return jsonify({"message": "Identity verified successfully!"}), 200

    except cognito.exceptions.NotAuthorizedException:
        logger.error("Not authorized: incorrect username or password")
        return jsonify({"error": "Incorrect username or password"}), 400
    except cognito.exceptions.UserNotFoundException:
        logger.error("User not found")
        return jsonify({"error": "User not found"}), 400
    except Exception as e:
        logger.error(f"An error occurred during verification: {str(e)}")
        return jsonify({"error": "An error occurred during verification"}), 500


# Register page
# Check if the password follows regular expression, including at least one uppercase letter, one lowercase letter, one number, and one special character, including @, $, !, %, *, ?, &.
# Check whether password and confirm password is same
# Ckeck if the username and email is already existed, if yes, return to register page and set new one
# Create hash code of password
# Store username, hash code of password and email in postgreSQL
# Sign up on cognito
# Return to verify email page

@main.route("/register", methods=["POST"])
def register():
    # Request data
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")
    cognito = get_cognito_client()

    
    # Check whether username or password are already exist
    existing_user = User.query.filter(
        (User.username == username) | (User.email == email)
    ).first()
    if existing_user:
        errors = []
        if existing_user.username == username:
            errors.append("Username already exists!")
        if existing_user.email == email:
            errors.append("Email already exists!")
        return jsonify({"errors": errors}), 400
    create_user(username, password, email)
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
        session["username"] = username
        session["email"] = email
        session["password"] = password
        session["secret_hash"] = secret_hash
        user = User.query.filter_by(username=username).first()
        login_user(user)
        return jsonify({"message": "Sign-up successful!"}), 200
    except ClientError as e:
        return jsonify({"error": f"Sign-up error: {str(e)}"}), 400


# Check if username and email are existed, if not, return to register page
# User confirm_sign_up to get code from email
# Check email code
# Use initiate_auth get Session and store in session
@main.route("/confirm-user", methods=["GET"])
@login_required
def confirm_user_get_email():
    email = session["email"]
    return jsonify({"email": email})


@main.route("/confirm-user", methods=["POST"])
@login_required
def confirm_user():
    if "username" not in session or "email" not in session:
        return jsonify({"error": "Username or password was not exist"}), 400
    username = session["username"]
    password = session["password"]
    cognito_client = get_cognito_client()
    data = request.get_json()
    confirmation_code = data.get("code")
    try:
        user_details = cognito.admin_get_user(
            UserPoolId=current_app.config["COGNITO_USERPOOL_ID"],
            Username=username
        )
        user_status = any(
            attr["Name"] == "email_verified" and attr["Value"] == "true"
            for attr in user_details["UserAttributes"]
        )
        if user_status:
            return jsonify({"message": "User already confirmed!"}), 200
        response = confirm_sign_up(cognito_client, username, confirmation_code)
        auth_response = initiate_auth(cognito_client, username, password)
        session["Session"] = auth_response["Session"]
        return jsonify({"message": "Email confirmed successfully!"}), 200
    except ClientError as e:
        return jsonify({"error": f"Confirmation error: {str(e)}"}), 400


# Resend code to email
@main.route("/resend_confirmation_code", methods=["POST"])
@login_required
def resend_confirmation_code():
    username = session.get("username")
    if not username:
        return jsonify(
            success=False,
            message="No username found in session. Please register first.",
        )
    cognito_client = get_cognito_client()
    logger.debug("Begin to go in to try in resend code")
    try:
        response = resend_confirmation_code_to_email(cognito_client, username)
        logger.debug(f"Response in resend code is : {response}")
        return jsonify(success=True, message="Confirmation code resent successfully!")
    except ClientError as e:
        return jsonify(
            success=False,
            message=f"Error resending confirmation code: {e.response['Error']['Message']}",
        )
    except Exception as e:
        return jsonify(success=False, message=f"Unexpected error: {str(e)}")


# Get secret code from associate_software_token by using Session
# Using secret code get uri
# Using uri get QR code from Google Authenticator so that user can scan it and input code to get set up MFA
@main.route("/mfa-setup", methods=["GET"])
@login_required
def get_mfa():
    try:
        cognito_client = get_cognito_client()
        response = cognito_client.associate_software_token(Session=session["Session"])
        secret_code = response["SecretCode"]
        session["Session"] = response["Session"]
        uri = pyotp.totp.TOTP(secret_code).provisioning_uri(
            name=current_user.username, issuer_name="YourApp"
        )
        base64_qr_image = get_b64encoded_qr_image(uri)
        session["Secret_code"] = secret_code
        return jsonify({"secret_code": secret_code, "base64_qr_image": base64_qr_image})
    except Exception as e:
        return jsonify({"error": "cognito_client error"}), 500


@main.route("/mfa-setup", methods=["POST"])
@login_required
def setup_mfa():
    data = request.get_json()
    otp = data.get("code")
    if "Session" not in session:
        return jsonify({"error": "Unexpected error occurred"}), 500
    cognito_client = get_cognito_client()
    try:
        username = session["username"]
        session_token = session["Session"]
        secret_hash = get_secret_hash(
            username,
            current_app.config["COGNITO_APP_CLIENT_ID"],
            current_app.config["COGNITO_APP_CLIENT_SECRET"],
        )
        response = cognito_client.verify_software_token(
            Session=session_token, UserCode=otp
        )
        return jsonify({"message": "MFA setup successfully!"}), 200
    except cognito_client.exceptions.NotAuthorizedException as e:
        return jsonify("error", f"Not authorized to verify the MFA code: {str(e)}"), 400
    except cognito_client.exceptions.CodeMismatchException as e:
        return jsonify("error", f"Invalid MFA code: {str(e)}"), 400
    except cognito_client.exceptions.ExpiredCodeException as e:
        return jsonify("error", f"The MFA code has expired: {str(e)}"), 400
    except KeyError as e:
        return (
            jsonify(
                "error",
                f"Session or access token is missing: {str(e)}. Please log in again.",
            ),
            400,
        )
    except Exception as e:
        return jsonify({"error": f"Confirmation error: {str(e)}"}), 400


# Check code from Google Authenticator
@main.route("/mfa-verify", methods=["POST"])
@login_required
def verify_mfa():
    data = request.get_json()
    otp = data.get("code")
    cognito_client = get_cognito_client()
    try:
        response = respond_to_auth_challenge(
            cognito_client=cognito_client,
            Session=session["Session"],
            username=session["username"],
            otp=otp,
        )
        if "AuthenticationResult" in response:
            id_token = response["AuthenticationResult"]["IdToken"]
            access_token = response["AuthenticationResult"]["AccessToken"]
            refresh_token = response["AuthenticationResult"]["RefreshToken"]
            session["id_token"] = id_token
            session["access_token"] = access_token
            session["refresh_token"] = refresh_token
            return jsonify({"message": "MFA verify successfully!"}), 200
        else:
            flash("Invalid MFA code. Please try again.", "danger")
    except cognito_client.exceptions.NotAuthorizedException as e:
        return (
            jsonify({"error": f"Not authorized to verify the MFA code: {str(e)}"}),
            400,
        )
    except cognito_client.exceptions.CodeMismatchException as e:
        return jsonify({"error": f"Invalid MFA code: {str(e)}"}), 400
    except cognito_client.exceptions.ExpiredCodeException as e:
        return jsonify({"error": f"The MFA code has expired: {str(e)}"}), 400
    except KeyError as e:
        return jsonify({"error": f"Session or access token is missing: {str(e)}"}), 400
    except Exception as e:
        jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

    return jsonify({"error": "Unexpected error occurred"}), 500


# Logout
# Return to login page
# Session will be cleared
@main.route("/logout")
@login_required
def logout():
    session.clear()
    logout_user()
    return jsonify({"message": "Logout"}), 200


# Store title, description, file path in postgreSQL
# The file name will be uuid, so that store same files will not have same address
# Files are stored in the folder with username in S3
# Files are stored by presigned url. They are private, can only be seen, edited, and deleted by user
@main.route("/notes", methods=["POST"])
@login_required
def notes():
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
            return jsonify({"error": f"Error uploading file: {e}"}), 400
    note = create_note(
        title=title,
        description=description,
        s3_object_key=s3_object_key,
        current_user=current_user,
    )
    return jsonify({"message": "Notes create successfully!"}), 200


# Go to the singel page of the note
@main.route("/notes/<int:post_id>", methods=["PUT"])
@login_required
def edit_note(post_id):
    note = Note.query.get_or_404(post_id)
    title = request.form.get("title")
    description = request.form.get("description")
    file = request.files.get("file")
    s3_object_key = note.file_path
    if file:
        try:
            if s3_object_key:
                delete_file_from_s3(current_app.config["S3_BUCKET"], note.file_path)
            filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            presigned_post = upload_file_to_s3(
                current_app.config["S3_BUCKET"], current_user.username, filename
            )
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
            return jsonify({"error": f"Error uploading file: {e}"}), 400

    # Update the existing note's attributes
    note.title = title
    note.description = description
    note.file_path = s3_object_key

    # Commit the changes to the database
    db.session.commit()
    return jsonify({"message": "Note updated successfully!"}), 200

@main.route("/reset-password", methods=["PUT"])
@login_required
def resetPassword():
    username = session.get("username")
    if not username:
        return jsonify({"error": "No username found in session"}), 400

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    password = data.get("password")
    if not password:
        return jsonify({"error": "Password is required"}), 400
    
    cognito = get_cognito_client()
    
    hashed_password = generate_password_hash(password, method="pbkdf2:sha256")
    try:
        # 更新 Cognito 中的密码
        response = cognito.admin_set_user_password(
            UserPoolId=current_app.config["COGNITO_USERPOOL_ID"],
            Username=username,
            Password=password,
            Permanent=True
        )
        logger.debug(f"Password updated in Cognito: {response}")
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.password = hashed_password

        db.session.commit()

        flash("Password reset successfully!", "success")
        return jsonify({"message": "Password reset successfully!"}), 200
    except Exception as e:
        current_app.logger.error(f"Error resetting password: {e}")
        return jsonify({"error": "An error occurred while resetting the password"}), 500

# Get title and description of notes
@main.route("/notes", methods=["GET"])
@login_required
def get_notes():
    user_notes = Note.query.filter_by(user_id=current_user.id).all()
    notes_with_presigned_urls = []
    for note in user_notes:
        presigned_url = None
        if note.file_path:
            try:
                presigned_url = create_presigned_url(
                    current_app.config["S3_BUCKET"], note.file_path
                )
            except Exception as e:
                return jsonify({"error": f"Error generating presigned URL: {e}"}), 400
        notes_with_presigned_urls.append(
            {
                "id": note.id,
                "title": note.title,
                "description": note.description,
                "presigned_url": presigned_url,
            }
        )
    return jsonify({"notes": notes_with_presigned_urls})


# Delete notes at postgreSQL
# Delete files at S3
@main.route("/delete/<int:note_id>", methods=["POST"])
@login_required
def delete(note_id):
    note = Note.query.get_or_404(note_id)
    if note.author != current_user:
        return jsonify({"error": "Do not have permission to delete"}), 400
    if note.file_path:
        try:
            delete_file_from_s3(current_app.config["S3_BUCKET"], note.file_path)
        except Exception as e:
            return jsonify({"error": f"Error deleting file from S3: {e}"}), 400
    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Note delete successfully"}), 200
