from flask import Blueprint, jsonify, request
from flask_login import login_required
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Category

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@categories_bp.get("")
def list_categories():
    categories = Category.query.order_by(Category.name).all()
    return jsonify([c.to_dict() for c in categories])


@categories_bp.get("/<int:category_id>")
def get_category(category_id):
    category = Category.query.get_or_404(category_id)
    return jsonify(category.to_dict())


@categories_bp.post("")
@login_required
def create_category():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    category = Category(name=name, description=data.get("description"))
    db.session.add(category)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A category with that name already exists"}), 409

    return jsonify(category.to_dict()), 201


@categories_bp.put("/<int:category_id>")
@login_required
def update_category(category_id):
    category = Category.query.get_or_404(category_id)
    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        category.name = name
    if "description" in data:
        category.description = data.get("description")

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A category with that name already exists"}), 409

    return jsonify(category.to_dict())


@categories_bp.delete("/<int:category_id>")
@login_required
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    if category.products:
        return (
            jsonify({"error": "Cannot delete a category that still has products assigned"}),
            409,
        )
    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted"})
