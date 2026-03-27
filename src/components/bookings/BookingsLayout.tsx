import { Outlet, NavLink } from "react-router-dom";

export function BookingsLayout() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <nav className="flex gap-1 border-b border-gray-200 mb-6">
        <NavLink
          to="/profile/bookings"
          end
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-[#00AFAE] text-[#00AFAE] bg-white"
                : "border-transparent text-gray-600 hover:text-[#222222]"
            }`
          }
        >
          Мои брони
        </NavLink>
        <NavLink
          to="/profile/bookings/history"
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-[#00AFAE] text-[#00AFAE] bg-white"
                : "border-transparent text-gray-600 hover:text-[#222222]"
            }`
          }
        >
          История
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
