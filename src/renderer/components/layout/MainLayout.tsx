import { ReactNode } from "react";
import {
  Outlet,
  NavLink,
  useLoaderData,
  useNavigation,
} from "react-router-dom";

const Link = ({ to, children }: { to: string; children: ReactNode }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? "underline" : "")}
    >
      {children}
    </NavLink>
  );
};

export default function MainLayout() {
  const { name } = useLoaderData() as { name: string };
  const nav = useNavigation();

  return (
    <div className="">
      <header className="p-4 border-b border-border shadow-md">
        <nav className="flex items-center">
          <ul className="flex gap-4 items-center">
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
          </ul>
          <div className="ms-auto">
            <span>Hi, {name}</span>
          </div>
        </nav>
      </header>

      {nav.state === "loading" ? <p>Loading…</p> : null}

      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
