from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required, login_user, logout_user

from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role", "staff")

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400

    if role not in ("admin", "staff"):
        role = "staff"

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "A user with that username or email already exists"}), 409

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    login_user(user)
    return jsonify(user.to_dict()), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter(
        (User.username == username) | (User.email == username.lower())
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    login_user(user, remember=True)
    return jsonify(user.to_dict())


@auth_bp.post("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out"})


@auth_bp.get("/me")
@login_required
def me():
    return jsonify(current_user.to_dict())
