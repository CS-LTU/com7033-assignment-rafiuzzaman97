import pytest
from app import create_app
from app.models.user import db

@pytest.fixture(scope='session')
def app():
    # Create app with testing config
    app = create_app()
    app.config['TESTING'] = True
    # Use in-memory SQLite for tests
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    # Create database tables in app context
    with app.app_context():
        db.create_all()
        # create_initial_data is called inside create_app; ensure tables exist
    yield app

@pytest.fixture(scope='function')
def client(app):
    return app.test_client()

@pytest.fixture(scope='function')
def runner(app):
    return app.test_cli_runner()
