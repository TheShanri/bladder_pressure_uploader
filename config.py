# config.py

import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'you-will-never-guess')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
    UPLOAD_FOLDER = os.path.join(basedir, 'app', 'static', 'static/uploads')
    ALLOWED_EXTENSIONS = {'csv', 'txt'}

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
