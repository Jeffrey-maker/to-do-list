import base64
import hashlib
import hmac
from io import BytesIO
from flask import current_app
import boto3
import qrcode


# create and return a client object for the Amazon Cognito Identity Provider (Cognito IDP) using the Boto3 library, which is the AWS SDK for Python.
def get_cognito_client():
    return boto3.client("cognito-idp", region_name=current_app.config["COGNITO_REGION"])


# Return hash code of password
def get_secret_hash(username, client_id, client_secret):
    message = username + client_id
    dig = hmac.new(
        client_secret.encode("utf-8"),
        msg=message.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()
    return base64.b64encode(dig).decode()


# Check whether MFA is setup
def check_mfa_setup_status(cognito_client, access_token):
    response = cognito_client.get_user(AccessToken=access_token)
    mfa_enabled = False
    for attribute in response["UserAttributes"]:
        if attribute["Name"] == "cognito:preferred_mfa_setting":
            mfa_enabled = True
            break
    return mfa_enabled


# Get QR code from uri
def get_b64encoded_qr_image(uri):
    qr = qrcode.make(uri)
    buffered = BytesIO()
    qr.save(buffered, "PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


# initiate_auth
def initiate_auth(cognito_client, username, password):
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
    return response


# Sign up in cognito
def sign_up(cognito_client, username, password, email, secret_hash):
    response = cognito_client.sign_up(
            ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
            Username=username,
            Password=password,
            SecretHash=secret_hash,
            UserAttributes=[{"Name": "email", "Value": email}],
        )
    return response


# Confirm email
def confirm_sign_up(cognito_client, username, confirmation_code):
    response = cognito_client.confirm_sign_up(
            ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
            Username=username,
            ConfirmationCode=confirmation_code,
            SecretHash=get_secret_hash(
                username,
                current_app.config["COGNITO_APP_CLIENT_ID"],
                current_app.config["COGNITO_APP_CLIENT_SECRET"],
            ),
        )
    return response


# Resend code to email
def resend_confirmation_code_to_email(cognito_client, username):
    response = cognito_client.resend_confirmation_code(
            ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
            Username=username,
            SecretHash=get_secret_hash(
                username,
                current_app.config["COGNITO_APP_CLIENT_ID"],
                current_app.config["COGNITO_APP_CLIENT_SECRET"],
            ),
        )
    return response

def respond_to_auth_challenge(cognito_client, Session, username, otp):
    response = cognito_client.respond_to_auth_challenge(
            ClientId=current_app.config["COGNITO_APP_CLIENT_ID"],
            ChallengeName="SOFTWARE_TOKEN_MFA",
            Session=Session,
            ChallengeResponses={
                "USERNAME": username,
                "SOFTWARE_TOKEN_MFA_CODE": otp,
                "SECRET_HASH": get_secret_hash(
                    username,
                    current_app.config["COGNITO_APP_CLIENT_ID"],
                    current_app.config["COGNITO_APP_CLIENT_SECRET"],
                ),
            },
        )
    return response