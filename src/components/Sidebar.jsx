import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  User, 
  MessageCircle, 
  Settings, 
  LogOut,
  Menu 
} from 'lucide-react';
import { getInitials } from '../utils/getInitials';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(isOpen);
  
  useEffect(() => {
    setIsExpanded(isOpen);
  }, [isOpen]);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const role = localStorage.getItem('role') || '';
  const canManagePrescriptions = ['reception', 'doctor', 'nurse', 'admin'].includes(role);
  const canManageFinance = ['reception', 'admin'].includes(role);
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', exact: true },
    { icon: FileText, label: 'Records', path: '/records' },
  ];
  
  if (canManagePrescriptions) {
    navItems.push({ 
      icon: 'Rx', // Use text icon or import PrescriptionIcon if available
      label: 'Prescriptions', 
      path: '/prescriptions' 
    });
  }
  
  if (canManageFinance) {
    navItems.push({ 
      icon: '£', 
      label: 'Finance', 
      path: '/finance' 
    });
  }
  
  navItems.push(
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  );

  const handleNav = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const initials = user ? getInitials(user.fullName || user.name) : '';

  return (
    <>
      {/* Overlay with blur */}
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      
      {/* Slide-in Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open expanded' : ''}`} style={{ transform: `translateX(${isOpen ? 0 : '-100%'})` }}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">
              <span className="avatar-initials">{initials}</span>
            </div>
            <div>
              <div className="user-name">{user?.fullName || 'User'}</div>
              <div className="user-role">{user?.role || 'Staff'}</div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <Menu size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.exact && location.pathname === item.path);
            return (
              <button
                key={index}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNav(item.path);
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

