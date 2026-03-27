import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function ClientProfileLayout() {
  const { user } = useAuth();
  const isPartner = user?.role?.toUpperCase() === "PARTNER" || user?.role?.toUpperCase() === "ADMIN";

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        <nav className="flex gap-1 border-b border-gray-200">
          <NavLink
            to="/profile"
            end
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-[#00AFAE] text-[#00AFAE] bg-white"
                  : "border-transparent text-gray-600 hover:text-[#222222]"
              }`
            }
          >
            Профиль
          </NavLink>
          {!isPartner && (
            <NavLink
              to="/profile/bookings"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-[#00AFAE] text-[#00AFAE] bg-white"
                    : "border-transparent text-gray-600 hover:text-[#222222]"
                }`
              }
            >
              Бронирования
            </NavLink>
          )}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
