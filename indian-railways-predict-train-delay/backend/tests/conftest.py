import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models import User
from app.main import app

# In-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def regular_user(db):
    user = User(
        email="commuter@railway.in",
        password_hash=hash_password("UserPassword123!"),
        full_name="Regular Commuter",
        role="user",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def other_user(db):
    user = User(
        email="passenger2@railway.in",
        password_hash=hash_password("Pass2Secret123!"),
        full_name="Other Passenger",
        role="user",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def admin_user(db):
    user = User(
        email="officer@railway.gov.in",
        password_hash=hash_password("AdminSecurePassword123!"),
        full_name="Station Director",
        role="admin",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
