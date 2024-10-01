# app/__init__.py

import os
from flask import Flask
from flask_cors import CORS
from .routes import main_bp


def create_app(config_class=None):
    app = Flask(__name__)

    # Load configuration
    if config_class:
        app.config.from_object(config_class)
    else:
        app.config.from_object('config.DevelopmentConfig')

    # Enable CORS if needed
    CORS(app)

    # Ensure the upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register blueprints
    app.register_blueprint(main_bp)

    return app
