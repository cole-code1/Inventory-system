from flask import Blueprint, current_app, jsonify, request
from flask_login import login_required
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Product

products_bp = Blueprint("products", __name__, url_prefix="/api/products")


@products_bp.get("")
def list_products():
    query = Product.query

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Product.name.ilike(like), Product.sku.ilike(like)))

    category_id = request.args.get("category_id", type=int)
    if category_id:
        query = query.filter(Product.category_id == category_id)

    supplier_id = request.args.get("supplier_id", type=int)
    if supplier_id:
        query = query.filter(Product.supplier_id == supplier_id)

    if request.args.get("low_stock") == "true":
        query = query.filter(Product.quantity <= Product.reorder_level)

    sort = request.args.get("sort", "name")
    sort_map = {
        "name": Product.name,
        "sku": Product.sku,
        "quantity": Product.quantity,
        "unit_price": Product.unit_price,
        "created_at": Product.created_at,
    }
    sort_col = sort_map.get(sort, Product.name)
    if request.args.get("order") == "desc":
        sort_col = sort_col.desc()
    query = query.order_by(sort_col)

    page = request.args.get("page", 1, type=int)
    page_size = min(
        request.args.get("page_size", current_app.config["DEFAULT_PAGE_SIZE"], type=int),
        current_app.config["MAX_PAGE_SIZE"],
    )

    pagination = query.paginate(page=page, per_page=page_size, error_out=False)

    return jsonify(
        {
            "items": [p.to_dict() for p in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "page_size": page_size,
            "pages": pagination.pages,
        }
    )


@products_bp.get("/<int:product_id>")
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())


@products_bp.post("")
@login_required
def create_product():
    data = request.get_json(silent=True) or {}

    sku = (data.get("sku") or "").strip()
    name = (data.get("name") or "").strip()
    if not sku or not name:
        return jsonify({"error": "sku and name are required"}), 400

    try:
        product = Product(
            sku=sku,
            name=name,
            description=data.get("description"),
            category_id=data.get("category_id"),
            supplier_id=data.get("supplier_id"),
            quantity=int(data.get("quantity", 0)),
            unit_price=data.get("unit_price", 0),
            reorder_level=int(
                data.get("reorder_level", current_app.config["DEFAULT_REORDER_LEVEL"])
            ),
        )
    except (TypeError, ValueError):
        return jsonify({"error": "quantity and reorder_level must be integers"}), 400

    if product.quantity < 0:
        return jsonify({"error": "quantity cannot be negative"}), 400

    db.session.add(product)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A product with that SKU already exists"}), 409

    return jsonify(product.to_dict()), 201


@products_bp.put("/<int:product_id>")
@login_required
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json(silent=True) or {}

    if "sku" in data:
        sku = (data.get("sku") or "").strip()
        if not sku:
            return jsonify({"error": "sku cannot be empty"}), 400
        product.sku = sku
    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        product.name = name
    if "description" in data:
        product.description = data.get("description")
    if "category_id" in data:
        product.category_id = data.get("category_id")
    if "supplier_id" in data:
        product.supplier_id = data.get("supplier_id")
    if "unit_price" in data:
        product.unit_price = data.get("unit_price")
    if "reorder_level" in data:
        try:
            product.reorder_level = int(data.get("reorder_level"))
        except (TypeError, ValueError):
            return jsonify({"error": "reorder_level must be an integer"}), 400

    # Direct quantity edits bypass the audit trail — use /api/stock/movements for that.
    # We still allow it here for corrections like fixing a data-entry mistake.
    if "quantity" in data:
        try:
            quantity = int(data.get("quantity"))
        except (TypeError, ValueError):
            return jsonify({"error": "quantity must be an integer"}), 400
        if quantity < 0:
            return jsonify({"error": "quantity cannot be negative"}), 400
        product.quantity = quantity

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A product with that SKU already exists"}), 409

    return jsonify(product.to_dict())


@products_bp.delete("/<int:product_id>")
@login_required
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"})
