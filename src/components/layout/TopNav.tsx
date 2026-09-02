import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Listings", to: "/listings" },
  { label: "Acquisitions", to: "/acquisitions" },
  { label: "Map", to: "/map" },
  { label: "Reports", to: "/reports" },
  // Admin is role-gated below.
  { label: "Admin", to: "/admin", roles: ["Admin", "Managing Director"] },
];

function initials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

interface Props {
  /** Opens the assistant drawer, which AppLayout owns. */
  onOpenAssistant: () => void;
}

export default function TopNav({ onOpenAssistant }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the user menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-header text-white">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-8 px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-sm font-bold text-white">
            P
          </span>
          <span className="text-lg font-semibold tracking-tight">PropTrack</span>
        </div>

        {/* Primary nav */}
        <nav className="flex items-center gap-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right-side actions */}
        <div className="ml-auto flex items-center gap-4 text-white/80">
          {/* Global search is the assistant, which subsumes it: one box that answers
              questions as well as finding records, over the same cross-entity index.
              Per-page keyword search (listings grid, deal board) remains separate. */}
          <button
            type="button"
            onClick={onOpenAssistant}
            aria-label="Ask the assistant"
            title="Ask the assistant (⌘K)"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            title="Coming soon"
            className="relative grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
          >
            <BellIcon />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-header" />
          </button>

          {/* User menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-xs font-semibold text-white ring-2 ring-transparent hover:ring-white/30"
                title={user.fullName ?? user.email}
              >
                {initials(user.fullName, user.email)}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-800 shadow-lg"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold">
                      {user.fullName ?? user.email}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-hover">
                      {user.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onLogout}
                    className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
