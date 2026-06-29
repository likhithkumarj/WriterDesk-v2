import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutGrid, Users, Compass, MessageSquare, Bell, 
  Settings as SettingsIcon, User, LogOut, Menu, X, Search, MoreVertical 
} from "lucide-react";
import { Avatar } from "../components/screenplay/Avatar";
import { supabaseService } from "../utils/supabaseService";

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export function DashboardLayout({
  children,
  title,
  user,
  onLogout,
  projectsCount = 0,
  unreadMessagesCount = 2,
  unreadNotificationsCount = 3,
}: {
  children: React.ReactNode;
  title: string;
  user: UserProfile;
  onLogout?: () => void;
  projectsCount?: number;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuDropdownOpen, setMobileMenuDropdownOpen] = useState(false);
  const [timeGreeting, setTimeGreeting] = useState("Good morning");

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setTimeGreeting("Good morning");
    else if (hours < 18) setTimeGreeting("Good afternoon");
    else setTimeGreeting("Good evening");
  }, []);

  const [dynNotifCount, setDynNotifCount] = useState(unreadNotificationsCount);

  useEffect(() => {
    if (!supabaseService.isConfigured() || !user?.email) {
      setDynNotifCount(unreadNotificationsCount);
      return;
    }

    const fetchCount = async () => {
      try {
        const { data } = await supabaseService.fetchPendingInvites(user.email);
        if (data) {
          setDynNotifCount(data.length);
        }
      } catch (e) {
        // ignore
      }
    };

    fetchCount();
  }, [user, unreadNotificationsCount]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { label: "Projects", path: "/projects", icon: LayoutGrid, count: projectsCount, section: "main" },
    { label: "Community", path: "/community", icon: Users, section: "main" },
    { label: "Explore", path: "/explore", icon: Compass, section: "main" },
    { label: "Messages", path: "/messages", icon: MessageSquare, count: unreadMessagesCount, section: "main" },
    { label: "Notifications", path: "/notifications", icon: Bell, count: dynNotifCount, section: "account" },
    { label: "Settings", path: "/settings", icon: SettingsIcon, section: "account" },
    { label: "Profile", path: "/profile", icon: User, section: "account" },
  ];

  return (
    <div className="sp-layout-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .sp-layout-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: #0c0c0e;
          color: #efeff1;
          font-family: 'Outfit', sans-serif;
        }

        .sp-layout-sidebar {
          width: 240px;
          background-color: #0f0f11;
          border-right: 1px solid #1c1c20;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 16px;
          flex-shrink: 0;
          z-index: 99;
          box-sizing: border-box;
        }

        .sp-layout-logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          margin-bottom: 24px;
          padding-left: 12px;
        }

        .sp-layout-logo-box {
          width: 32px;
          height: 32px;
          background-color: #E8B84B;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f0f11;
          font-weight: 800;
        }

        .sp-layout-logo-text {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #fff;
        }

        .sp-layout-sidebar-section {
          margin-bottom: 28px;
        }

        .sp-layout-sidebar-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #55555d;
          margin-bottom: 12px;
          padding-left: 12px;
        }

        .sp-layout-sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: #8e8e93;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 4px;
          box-sizing: border-box;
        }

        .sp-layout-sidebar-item:hover {
          background: rgba(255, 255, 255, 0.02);
          color: #efeff1;
        }

        .sp-layout-sidebar-item.active {
          background: rgba(232, 184, 75, 0.06);
          color: #E8B84B;
          border-right: 3px solid #E8B84B;
          border-top-right-radius: 2px;
          border-bottom-right-radius: 2px;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }

        .sp-layout-sidebar-badge {
          font-size: 10px;
          background: #E8B84B;
          color: #0f0f11;
          padding: 1px 6px;
          border-radius: 10px;
          font-weight: 700;
          margin-left: auto;
        }

        .sp-layout-sidebar-badge.notification {
          background: #f59e0b;
          color: #fff;
        }

        .sp-layout-content-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100%;
        }

        .sp-layout-header {
          height: 72px;
          border-bottom: 1px solid #1c1c20;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 40px;
          background-color: #08080a;
          box-sizing: border-box;
          flex-shrink: 0;
        }

        .sp-layout-header-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sp-layout-header-subtitle {
          font-size: 12px;
          color: #8e8e93;
          font-weight: 500;
          margin: 0;
        }

        .sp-layout-header-title {
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .sp-layout-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sp-layout-search-wrap {
          position: relative;
          width: 240px;
        }

        .sp-layout-search-input {
          width: 100%;
          background: #121214;
          border: 1px solid #1c1c20;
          border-radius: 10px;
          padding: 8px 12px 8px 36px;
          font-size: 13px;
          color: #efeff1;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }

        .sp-layout-search-input::placeholder {
          color: #55555d;
        }

        .sp-layout-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #55555d;
        }

        .sp-layout-header-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #232329;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8e8e93;
          cursor: pointer;
          background: transparent;
          transition: all 0.15s ease;
          position: relative;
        }

        .sp-layout-header-btn:hover {
          border-color: #E8B84B;
          color: #efeff1;
          background: rgba(255, 255, 255, 0.02);
        }

        .sp-layout-header-badge-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 6px;
          height: 6px;
          background-color: #f59e0b;
          border-radius: 50%;
        }

        .sp-layout-main-content {
          flex: 1;
          overflow-y: auto;
          background-color: #08080a;
          box-sizing: border-box;
          position: relative;
        }

        .sp-layout-mobile-nav {
          display: none;
        }

        .sp-layout-mobile-header {
          display: none;
        }

        /* Responsive Layouts */
        @media (max-width: 768px) {
          .sp-layout-sidebar {
            display: none;
          }

          .sp-layout-header {
            display: none;
          }

          .sp-layout-content-pane {
            height: auto;
            min-height: 100vh;
            padding-bottom: 72px; /* space for mobile navbar */
            box-sizing: border-box;
          }

          .sp-layout-mobile-header {
            height: 64px;
            background-color: #121214;
            border-bottom: 1px solid #1c1c20;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 16px;
            position: sticky;
            top: 0;
            z-index: 100;
            box-sizing: border-box;
          }

          .sp-layout-mobile-header-title {
            font-size: 20px;
            font-weight: 800;
            color: #fff;
            margin: 0;
            letter-spacing: -0.01em;
          }

          .sp-layout-mobile-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 72px;
            background-color: #121214;
            border-top: 1px solid #1c1c20;
            display: flex;
            align-items: center;
            justify-content: space-around;
            padding: 0 12px;
            z-index: 100;
          }

          .sp-layout-mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            background: transparent;
            border: none;
            color: #8e8e93;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            width: 60px;
            position: relative;
          }

          .sp-layout-mobile-nav-item.active {
            color: #E8B84B;
          }

          .sp-layout-mobile-nav-badge {
            position: absolute;
            top: -2px;
            right: 12px;
            background-color: #f59e0b;
            color: #fff;
            font-size: 8px;
            font-weight: 700;
            padding: 1px 4px;
            border-radius: 6px;
          }

          .sp-layout-mobile-drawer {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
            z-index: 1000;
            display: flex;
            justify-content: flex-start;
          }

          .sp-layout-mobile-drawer-content {
            width: 260px;
            background-color: #0f0f11;
            height: 100%;
            padding: 24px 16px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
        }
      ` }} />

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className="sp-layout-sidebar">
        <div>
          <div className="sp-layout-logo-wrap" onClick={() => navigate("/projects")}>
            <div className="sp-layout-logo-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f0f11" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
            </div>
            <span className="sp-layout-logo-text">WriterDesk</span>
          </div>

          <div className="sp-layout-sidebar-section">
            <div className="sp-layout-sidebar-title">MAIN</div>
            {navItems.filter(item => item.section === "main").map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button 
                  key={item.path} 
                  className={`sp-layout-sidebar-item ${active ? "active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="sp-layout-sidebar-badge">{item.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="sp-layout-sidebar-section">
            <div className="sp-layout-sidebar-title">ACCOUNT</div>
            {navItems.filter(item => item.section === "account").map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button 
                  key={item.path} 
                  className={`sp-layout-sidebar-item ${active ? "active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="sp-layout-sidebar-badge notification">{item.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <button className="sp-layout-sidebar-item" onClick={onLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWER OVERLAY REMOVED */}

      {/* CONTENT PANEL */}
      <div className="sp-layout-content-pane">
        
        {/* DESKTOP HEADER */}
        <header className="sp-layout-header">
          <div className="sp-layout-header-left">
            <span className="sp-layout-header-subtitle">{timeGreeting}</span>
            <h1 className="sp-layout-header-title">{title}</h1>
          </div>

          <div className="sp-layout-header-right">
            <div className="sp-layout-search-wrap">
              <Search size={14} className="sp-layout-search-icon" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="sp-layout-search-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") alert("Search query submitted");
                }}
              />
            </div>

            <div onClick={() => navigate("/profile")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#efeff1" }}>{user.name}</span>
              <Avatar src={user.avatar} name={user.name} size={36} />
            </div>
          </div>
        </header>

        {/* MOBILE HEADER */}
        <header className="sp-layout-mobile-header" style={{ position: "relative" }}>
          <h1 className="sp-layout-mobile-header-title" style={{ marginRight: "auto" }}>{title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#efeff1" }}>{user.name}</span>
            <div onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
              <Avatar src={user.avatar} name={user.name} size={32} />
            </div>
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setMobileMenuDropdownOpen(!mobileMenuDropdownOpen)} 
                style={{ background: "none", border: "none", color: "#8e8e93", display: "flex", padding: 4, cursor: "pointer" }}
              >
                <MoreVertical size={20} />
              </button>
              {mobileMenuDropdownOpen && (
                <div className="sp-menu" style={{ right: 0, top: 36, zIndex: 110 }} onClick={() => setMobileMenuDropdownOpen(false)}>
                  <button onClick={() => navigate("/settings")}>
                    <SettingsIcon size={14} />
                    <span>Settings</span>
                  </button>
                  <button onClick={onLogout} style={{ color: "#ef4444" }}>
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <main className="sp-layout-main-content">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="sp-layout-mobile-nav">
          <button className={`sp-layout-mobile-nav-item ${isActive("/projects") ? "active" : ""}`} onClick={() => navigate("/projects")}>
            <LayoutGrid size={20} />
            <span>Projects</span>
          </button>
          <button className={`sp-layout-mobile-nav-item ${isActive("/community") ? "active" : ""}`} onClick={() => navigate("/community")}>
            <Users size={20} />
            <span>Community</span>
          </button>
          <button className={`sp-layout-mobile-nav-item ${isActive("/explore") ? "active" : ""}`} onClick={() => navigate("/explore")}>
            <Compass size={20} />
            <span>Explore</span>
          </button>
          <button className={`sp-layout-mobile-nav-item ${isActive("/messages") ? "active" : ""}`} onClick={() => navigate("/messages")}>
            <MessageSquare size={20} />
            <span>Messages</span>
            {unreadMessagesCount > 0 && <span className="sp-layout-mobile-nav-badge">{unreadMessagesCount}</span>}
          </button>
          <button className={`sp-layout-mobile-nav-item ${isActive("/profile") ? "active" : ""}`} onClick={() => navigate("/profile")}>
            <User size={20} />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
export default DashboardLayout;
