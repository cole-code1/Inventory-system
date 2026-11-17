import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (!user) return null;

  return (
    <aside className={`sidebar${isOpen ? " sidebar-open" : " sidebar-closed"}`}>
      <div className="sidebar-brand">📦 Inventory Manager</div>
      <div className="sidebar-links">
        <NavLink to="/" end onClick={onToggle} className={({ isActive }) => (isActive ? "active" : "")}>
          Dashboard
        </NavLink>
        <NavLink to="/products" onClick={onToggle} className={({ isActive }) => (isActive ? "active" : "")}>
          Products
        </NavLink>
        <NavLink to="/categories" onClick={onToggle} className={({ isActive }) => (isActive ? "active" : "")}>
          Categories
        </NavLink>
        <NavLink to="/suppliers" onClick={onToggle} className={({ isActive }) => (isActive ? "active" : "")}>
          Suppliers
        </NavLink>
        <NavLink to="/movements" onClick={onToggle} className={({ isActive }) => (isActive ? "active" : "")}>
          Stock Movements
        </NavLink>
      </div>
      <div className="sidebar-user">
        <span>
          {user.username} <em>({user.role})</em>
        </span>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </aside>
  );
}
