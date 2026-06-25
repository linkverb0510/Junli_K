import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import type { PropsWithChildren } from "react";

const navItems = [
  { to: "/", label: "总览" },
  { to: "/chapters", label: "章节练习" },
  { to: "/practice/random", label: "随机刷题" },
  { to: "/wrong-book", label: "错题本" },
];

export function Layout({ children }: PropsWithChildren) {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <Link to="/" className="brand">
            军理刷题
          </Link>
          <p className="subtitle">基于复习题集的本地刷题网站</p>
        </div>

        {/* 汉堡菜单按钮 (A6) */}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* 移动端遮罩 */}
      {menuOpen && <div className="mobile-overlay active" onClick={closeMenu} />}

      <main className="page">{children}</main>
    </div>
  );
}
