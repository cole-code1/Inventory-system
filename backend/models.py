from datetime import datetime, timezone

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="staff")  # admin | staff
    created_at = db.Column(db.DateTime, default=utcnow)

    stock_movements = db.relationship("StockMovement", back_populates="user")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=utcnow)

    products = db.relationship("Product", back_populates="category")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "product_count": len(self.products) if self.products is not None else 0,
        }


class Supplier(db.Model):
    __tablename__ = "suppliers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    contact_name = db.Column(db.String(120))
    contact_email = db.Column(db.String(120))
    contact_phone = db.Column(db.String(40))
    address = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=utcnow)

    products = db.relationship("Product", back_populates="supplier")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "contact_name": self.contact_name,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "address": self.address,
            "product_count": len(self.products) if self.products is not None else 0,
        }


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(60), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(500))

    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"))
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id"))

    quantity = db.Column(db.Integer, nullable=False, default=0)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    reorder_level = db.Column(db.Integer, nullable=False, default=10)

    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    category = db.relationship("Category", back_populates="products")
    supplier = db.relationship("Supplier", back_populates="products")
    stock_movements = db.relationship(
        "StockMovement", back_populates="product", cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.CheckConstraint("quantity >= 0", name="ck_products_quantity_nonnegative"),
    )

    @property
    def is_low_stock(self):
        return self.quantity <= self.reorder_level

    @property
    def stock_value(self):
        return float(self.unit_price) * self.quantity

    def to_dict(self, include_relations=True):
        data = {
            "id": self.id,
            "sku": self.sku,
            "name": self.name,
            "description": self.description,
            "category_id": self.category_id,
            "supplier_id": self.supplier_id,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "reorder_level": self.reorder_level,
            "is_low_stock": self.is_low_stock,
            "stock_value": self.stock_value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_relations:
            data["category"] = self.category.name if self.category else None
            data["supplier"] = self.supplier.name if self.supplier else None
        return data


class StockMovement(db.Model):
    """Audit trail of every stock change made to a product."""

    __tablename__ = "stock_movements"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    movement_type = db.Column(db.String(20), nullable=False)  # IN | OUT | ADJUSTMENT
    quantity = db.Column(db.Integer, nullable=False)
    quantity_before = db.Column(db.Integer, nullable=False)
    quantity_after = db.Column(db.Integer, nullable=False)

    reason = db.Column(db.String(255))
    reference = db.Column(db.String(100))  # e.g. PO number, order id
    created_at = db.Column(db.DateTime, default=utcnow)

    product = db.relationship("Product", back_populates="stock_movements")
    user = db.relationship("User", back_populates="stock_movements")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "product_sku": self.product.sku if self.product else None,
            "user_id": self.user_id,
            "user": self.user.username if self.user else None,
            "movement_type": self.movement_type,
            "quantity": self.quantity,
            "quantity_before": self.quantity_before,
            "quantity_after": self.quantity_after,
            "reason": self.reason,
            "reference": self.reference,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
