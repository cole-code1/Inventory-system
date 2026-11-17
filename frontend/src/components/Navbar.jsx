import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">📦 Electronic Stock Keeping System</div>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Dashboard
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "")}>
          Products
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => (isActive ? "active" : "")}>
          Categories
        </NavLink>
        <NavLink to="/suppliers" className={({ isActive }) => (isActive ? "active" : "")}>
          Suppliers
        </NavLink>
        <NavLink to="/movements" className={({ isActive }) => (isActive ? "active" : "")}>
          Stock Movements
        </NavLink>
      </div>
      <div className="navbar-user">
        <span>
          {user.username} <em>({user.role})</em>
        </span>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}
