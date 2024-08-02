from flask_cors import CORS
from app import create_app

app = create_app()
# app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "https://exg.es"}})


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=8000)
