import { useEffect, useState } from "react";
import { Navigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { PartnerApi } from "../../data/api/PartnerApi";

export function BookingsLayout() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const role = user?.role?.toUpperCase();
  const isPartnerByRole = role === "PARTNER";
  const isAdmin = role === "ADMIN";
  const [hasApprovedPartnerApplication, setHasApprovedPartnerApplication] = useState(false);
  const hasPartnerCabinetAccess = isPartnerByRole || isAdmin || hasApprovedPartnerApplication;

  useEffect(() => {
    if (!isAuthenticated) {
      setHasApprovedPartnerApplication(false);
      return;
    }
    if (isPartnerByRole || isAdmin) {
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
  }, [isAuthenticated, isPartnerByRole, isAdmin]);

  if (hasPartnerCabinetAccess) {
    const path = location.pathname.replace(/\/$/, "");
    let bookingId: string | null = null;
    if (path.startsWith("/profile/bookings/")) {
      const segment = path.slice("/profile/bookings/".length);
      if (segment && segment !== "history") bookingId = segment;
    }
    const qs = new URLSearchParams();
    qs.set("tab", "bookings");
    if (bookingId) qs.set("bookingId", bookingId);
    return <Navigate to={`/partner/dashboard?${qs.toString()}`} replace />;
  }

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
