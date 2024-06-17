from flask_cors import CORS
from app import create_app

app = create_app()
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:5173"}})

if __name__ == "__main__":
    app.run(debug=True)
