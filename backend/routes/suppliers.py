from flask import Blueprint, jsonify, request
from flask_login import login_required
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Supplier

suppliers_bp = Blueprint("suppliers", __name__, url_prefix="/api/suppliers")


@suppliers_bp.get("")
def list_suppliers():
    suppliers = Supplier.query.order_by(Supplier.name).all()
    return jsonify([s.to_dict() for s in suppliers])


@suppliers_bp.get("/<int:supplier_id>")
def get_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    return jsonify(supplier.to_dict())


@suppliers_bp.post("")
@login_required
def create_supplier():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    supplier = Supplier(
        name=name,
        contact_name=data.get("contact_name"),
        contact_email=data.get("contact_email"),
        contact_phone=data.get("contact_phone"),
        address=data.get("address"),
    )
    db.session.add(supplier)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A supplier with that name already exists"}), 409

    return jsonify(supplier.to_dict()), 201


@suppliers_bp.put("/<int:supplier_id>")
@login_required
def update_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    data = request.get_json(silent=True) or {}

    for field in ("name", "contact_name", "contact_email", "contact_phone", "address"):
        if field in data:
            setattr(supplier, field, data.get(field))

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A supplier with that name already exists"}), 409

    return jsonify(supplier.to_dict())


@suppliers_bp.delete("/<int:supplier_id>")
@login_required
def delete_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    if supplier.products:
        return (
            jsonify({"error": "Cannot delete a supplier that still has products assigned"}),
            409,
        )
    db.session.delete(supplier)
    db.session.commit()
    return jsonify({"message": "Supplier deleted"})
