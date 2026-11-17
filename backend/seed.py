"""
Creates all tables and populates the database with sample data.
Run with:  python seed.py
"""

from app import create_app
from extensions import db
from models import Category, Product, StockMovement, Supplier, User

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    # --- Users ---
    admin = User(username="admin", email="admin@example.com", role="admin")
    admin.set_password("admin123")

    staff = User(username="staff", email="staff@example.com", role="staff")
    staff.set_password("staff123")

    db.session.add_all([admin, staff])
    db.session.flush()

    # --- Categories ---
    electronics = Category(name="Electronics", description="Electronic devices and accessories")
    stationery = Category(name="Stationery", description="Office and school supplies")
    groceries = Category(name="Groceries", description="Packaged food and household items")
    db.session.add_all([electronics, stationery, groceries])
    db.session.flush()

    # --- Suppliers ---
    techsource = Supplier(
        name="TechSource Ltd",
        contact_name="Grace Mwangi",
        contact_email="sales@techsource.co.ke",
        contact_phone="+254-700-111222",
        address="Nairobi, Kenya",
    )
    officeplus = Supplier(
        name="OfficePlus Supplies",
        contact_name="John Otieno",
        contact_email="orders@officeplus.co.ke",
        contact_phone="+254-700-333444",
        address="Mombasa, Kenya",
    )
    db.session.add_all([techsource, officeplus])
    db.session.flush()

    # --- Products ---
    products = [
        Product(
            sku="ELE-001",
            name="Wireless Mouse",
            description="2.4GHz wireless optical mouse",
            category_id=electronics.id,
            supplier_id=techsource.id,
            quantity=45,
            unit_price=12.50,
            reorder_level=10,
        ),
        Product(
            sku="ELE-002",
            name="USB-C Charging Cable",
            description="1m braided USB-C cable",
            category_id=electronics.id,
            supplier_id=techsource.id,
            quantity=8,
            unit_price=6.00,
            reorder_level=15,
        ),
        Product(
            sku="STA-001",
            name="A4 Notebook",
            description="200-page ruled notebook",
            category_id=stationery.id,
            supplier_id=officeplus.id,
            quantity=120,
            unit_price=1.75,
            reorder_level=30,
        ),
        Product(
            sku="STA-002",
            name="Ballpoint Pens (Box of 12)",
            description="Blue ink, medium tip",
            category_id=stationery.id,
            supplier_id=officeplus.id,
            quantity=5,
            unit_price=3.20,
            reorder_level=10,
        ),
        Product(
            sku="GRO-001",
            name="Instant Coffee 200g",
            description="Freeze-dried instant coffee jar",
            category_id=groceries.id,
            supplier_id=officeplus.id,
            quantity=60,
            unit_price=4.80,
            reorder_level=20,
        ),
    ]
    db.session.add_all(products)
    db.session.flush()

    # --- Sample stock movements ---
    movements = [
        StockMovement(
            product_id=products[0].id,
            user_id=admin.id,
            movement_type="IN",
            quantity=50,
            quantity_before=0,
            quantity_after=50,
            reason="Initial stock",
            reference="PO-1001",
        ),
        StockMovement(
            product_id=products[0].id,
            user_id=staff.id,
            movement_type="OUT",
            quantity=5,
            quantity_before=50,
            quantity_after=45,
            reason="Sold to customer",
            reference="SO-2001",
        ),
        StockMovement(
            product_id=products[1].id,
            user_id=admin.id,
            movement_type="IN",
            quantity=20,
            quantity_before=0,
            quantity_after=20,
            reason="Initial stock",
            reference="PO-1002",
        ),
        StockMovement(
            product_id=products[1].id,
            user_id=staff.id,
            movement_type="OUT",
            quantity=12,
            quantity_before=20,
            quantity_after=8,
            reason="Sold to customer",
            reference="SO-2002",
        ),
    ]
    db.session.add_all(movements)

    db.session.commit()

    print("Database seeded successfully:")
    print(f"  Users: {User.query.count()}")
    print(f"  Categories: {Category.query.count()}")
    print(f"  Suppliers: {Supplier.query.count()}")
    print(f"  Products: {Product.query.count()}")
    print(f"  Stock movements: {StockMovement.query.count()}")
    print()
    print("Login with: admin / admin123  (or) staff / staff123")
