import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { PartnerApi } from "../../data/api/PartnerApi";

export function ClientProfileLayout() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const role = user?.role?.toUpperCase();
  const isPartner = role === "PARTNER";
  const isAdmin = role === "ADMIN";
  const [hasApprovedPartnerApplication, setHasApprovedPartnerApplication] = useState(false);
  const hasPartnerCabinetAccess = isPartner || isAdmin || hasApprovedPartnerApplication;
  const notificationsTabActive = location.pathname.startsWith("/profile/notifications");

  useEffect(() => {
    if (!isAuthenticated) {
      setHasApprovedPartnerApplication(false);
      return;
    }
    if (isPartner || isAdmin) {
      setHasApprovedPartnerApplication(true);
      return;
    }

    const partnerApi = new PartnerApi();
    let cancelled = false;

    partnerApi
      .getMyApplication()
      .then((application) => {
        if (cancelled) return;
        const status = application?.status?.toUpperCase();
        setHasApprovedPartnerApplication(status === "APPROVED" || status === "ОДОБРЕНО");
      })
      .catch(() => {
        if (!cancelled) setHasApprovedPartnerApplication(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isPartner, isAdmin]);

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
          {!hasPartnerCabinetAccess && (
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
          {!isAdmin && (
            <NavLink
              to="/profile/notifications"
              className={() =>
                `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
                  notificationsTabActive
                    ? "border-[#00AFAE] text-[#00AFAE] bg-white"
                    : "border-transparent text-gray-600 hover:text-[#222222]"
                }`
              }
            >
              Уведомления
            </NavLink>
          )}
          {!isAdmin && (
            <NavLink
              to="/profile/chats"
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-[#00AFAE] text-[#00AFAE] bg-white"
                    : "border-transparent text-gray-600 hover:text-[#222222]"
                }`
              }
            >
              Чат
            </NavLink>
          )}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
