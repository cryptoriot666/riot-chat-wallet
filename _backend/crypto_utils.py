from cryptography.fernet import Fernet
import hashlib
import base64

def get_key_from_password(password: str) -> bytes:
    key = hashlib.sha256(password.encode()).digest()
    return base64.urlsafe_b64encode(key)

def encrypt_data(data: str, password: str) -> str:
    key = get_key_from_password(password)
    f = Fernet(key)
    encrypted = f.encrypt(data.encode())
    return encrypted.decode()

def decrypt_data(encrypted_data: str, password: str) -> str:
    key = get_key_from_password(password)
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_data.encode())
    return decrypted.decode()

def hash_wallet(wallet: str) -> str:
    return hashlib.sha256(wallet.lower().encode()).hexdigest()[:16]
