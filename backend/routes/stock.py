from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from extensions import db
from models import Product, StockMovement

stock_bp = Blueprint("stock", __name__, url_prefix="/api/stock")

VALID_TYPES = ("IN", "OUT", "ADJUSTMENT")


@stock_bp.get("/movements")
def list_movements():
    query = StockMovement.query

    product_id = request.args.get("product_id", type=int)
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)

    movement_type = request.args.get("movement_type")
    if movement_type in VALID_TYPES:
        query = query.filter(StockMovement.movement_type == movement_type)

    query = query.order_by(StockMovement.created_at.desc())

    page = request.args.get("page", 1, type=int)
    page_size = min(request.args.get("page_size", 20, type=int), 100)
    pagination = query.paginate(page=page, per_page=page_size, error_out=False)

    return jsonify(
        {
            "items": [m.to_dict() for m in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
        }
    )


@stock_bp.post("/movements")
@login_required
def create_movement():
    """Record a stock IN, OUT, or ADJUSTMENT and update the product's quantity atomically."""
    data = request.get_json(silent=True) or {}

    product_id = data.get("product_id")
    movement_type = (data.get("movement_type") or "").upper()
    reason = data.get("reason")
    reference = data.get("reference")

    if movement_type not in VALID_TYPES:
        return jsonify({"error": f"movement_type must be one of {VALID_TYPES}"}), 400

    try:
        quantity = int(data.get("quantity"))
    except (TypeError, ValueError):
        return jsonify({"error": "quantity must be an integer"}), 400

    if quantity <= 0:
        return jsonify({"error": "quantity must be a positive integer"}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    quantity_before = product.quantity

    if movement_type == "IN":
        quantity_after = quantity_before + quantity
    elif movement_type == "OUT":
        if quantity > quantity_before:
            return (
                jsonify(
                    {
                        "error": (
                            f"Insufficient stock: only {quantity_before} units of "
                            f"'{product.name}' available"
                        )
                    }
                ),
                409,
            )
        quantity_after = quantity_before - quantity
    else:  # ADJUSTMENT sets the absolute new quantity
        quantity_after = quantity

    product.quantity = quantity_after

    movement = StockMovement(
        product_id=product.id,
        user_id=current_user.id if current_user.is_authenticated else None,
        movement_type=movement_type,
        quantity=quantity,
        quantity_before=quantity_before,
        quantity_after=quantity_after,
        reason=reason,
        reference=reference,
    )
    db.session.add(movement)
    db.session.commit()

    return jsonify(movement.to_dict()), 201
