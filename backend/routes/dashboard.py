from flask import Blueprint, jsonify
from sqlalchemy import func

from extensions import db
from models import Category, Product, StockMovement, Supplier

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.get("/summary")
def summary():
    total_products = db.session.query(func.count(Product.id)).scalar() or 0
    total_categories = db.session.query(func.count(Category.id)).scalar() or 0
    total_suppliers = db.session.query(func.count(Supplier.id)).scalar() or 0

    total_units = db.session.query(func.coalesce(func.sum(Product.quantity), 0)).scalar()
    total_stock_value = db.session.query(
        func.coalesce(func.sum(Product.quantity * Product.unit_price), 0)
    ).scalar()

    low_stock_products = Product.query.filter(
        Product.quantity <= Product.reorder_level
    ).all()

    recent_movements = (
        StockMovement.query.order_by(StockMovement.created_at.desc()).limit(10).all()
    )

    return jsonify(
        {
            "total_products": total_products,
            "total_categories": total_categories,
            "total_suppliers": total_suppliers,
            "total_units_in_stock": int(total_units),
            "total_stock_value": float(total_stock_value),
            "low_stock_count": len(low_stock_products),
            "low_stock_products": [p.to_dict() for p in low_stock_products],
            "recent_movements": [m.to_dict() for m in recent_movements],
        }
    )
