import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from backend.app.config import settings
from backend.app.schemas import TokenData

# OAuth2 Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

def get_password_hash(password: str) -> str:
    """Generates a secure SHA-256 salt-hashed password string."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}:{key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored salt-hashed password."""
    if ":" not in hashed_password:
        return plain_password == hashed_password
    salt, key = hashed_password.split(":")
    new_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return new_key.hex() == key

# Mock database of users with enterprise roles
MOCK_USERS_DB = {
    "admin": {
        "username": "admin",
        "hashed_password": get_password_hash("admin123"),
        "role": "admin", # Full System Access
    },
    "engineer": {
        "username": "engineer",
        "hashed_password": get_password_hash("engineer123"),
        "role": "automation_engineer", # Script execution and editing
    },
    "manager": {
        "username": "manager",
        "hashed_password": get_password_hash("manager123"),
        "role": "campaign_manager", # Campaign definition and report viewing
    }
}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception
        
    user = MOCK_USERS_DB.get(token_data.username)
    if user is None:
        raise credentials_exception
    return {"username": user["username"], "role": user["role"]}

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user['role']}' is not authorized. Allowed: {self.allowed_roles}"
            )
        return current_user
