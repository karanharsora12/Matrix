import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { WEB_ROUTES } from "@/config/webRoutes";

export function PublicRoute() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  if (isAuthenticated) {
    return <Navigate to={WEB_ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
