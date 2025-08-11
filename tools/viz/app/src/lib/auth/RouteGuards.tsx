import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth/auth";

interface Props {
  children: React.ReactElement;
}

export function StudioAdminRoute({ children }: Props) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // AuthProvider will render LoginPage, but this prevents rendering the child route
    return <Navigate to={"/"} replace state={{ from: location }} />;
  }

  const isStudioAdmin = Boolean(
    user?.roles?.some(
      (role) => role?.name === "Studio Admin" || role?.code === "STUDIO_ADMIN"
    )
  );

  if (!isStudioAdmin) {
    return <Navigate to="/localization" replace />;
  }

  return children;
}
