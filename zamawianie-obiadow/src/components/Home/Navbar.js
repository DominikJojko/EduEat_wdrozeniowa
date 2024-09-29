import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';
import { ReactComponent as OrderIcon } from '../../assets/icons/order.svg';
import { ReactComponent as AboutIcon } from '../../assets/icons/about.svg';
import { ReactComponent as LoginIcon } from '../../assets/icons/login.svg';
import { ReactComponent as LogoutIcon } from '../../assets/icons/logout.svg';
import { ReactComponent as AdminIcon } from '../../assets/icons/admin.svg';
import { ReactComponent as ProfileIcon } from '../../assets/icons/profile.svg';
import logoVideo from '../../assets/videos/logo.mp4';

function Navbar() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="brand-logo">
        <video autoPlay loop muted height="60">
          <source src={logoVideo} type="video/mp4" />
        </video>
      </NavLink>

      {isAuthenticated && (
        <div className="welcome-message">
          Witaj <span>{user.username}</span>, smacznego!
        </div>
      )}

      <div className="nav-links">
        <NavLink to="/order" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          <OrderIcon className="nav-icon" />
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          <AboutIcon className="nav-icon" />
        </NavLink>
        {isAuthenticated && user.role_id === 3 && (
          <NavLink to="/admin-panel" className={({ isActive }) => (isActive ? 'active-link' : '')}>
            <AdminIcon className="nav-icon" />
          </NavLink>
        )}
        {isAuthenticated ? (
          <>
            <NavLink to="/user-profile" className={({ isActive }) => isActive ? 'active-link' : ''}>
              <ProfileIcon className="nav-icon" />
            </NavLink>
            <button onClick={handleLogout} className="logout-button">
              <LogoutIcon className="nav-icon" />
            </button>
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => (isActive ? 'active-link' : '')}>
            <LoginIcon className="nav-icon" />
          </NavLink>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
