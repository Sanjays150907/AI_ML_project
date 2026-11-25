import argparse
import sys
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models import User

def bootstrap_admin(email: str, password: str, full_name: str = "System Administrator"):
    """
    Creates or promotes a secure initial administrator account.
    """
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    if len(password) < 8:
        print("Error: Admin password must be at least 8 characters.")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if user:
            user.role = "admin"
            user.password_hash = hash_password(password)
            user.is_active = True
            if full_name:
                user.full_name = full_name
            db.commit()
            print(f"Success: Existing account for {email} promoted to Administrator.")
        else:
            admin_user = User(
                email=email.lower().strip(),
                password_hash=hash_password(password),
                full_name=full_name,
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print(f"Success: Initial administrator account created for {email}.")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap initial administrator account")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--password", required=True, help="Administrator secure password (min 8 chars)")
    parser.add_argument("--name", default="System Administrator", help="Full name of administrator")
    args = parser.parse_args()

    bootstrap_admin(email=args.email, password=args.password, full_name=args.name)
