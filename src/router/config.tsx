import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import ComingSoon from "../pages/coming-soon/page";

const routes: RouteObject[] = [
  { path: "/", element: <ComingSoon /> },
  { path: "*", element: <Navigate to="/" replace /> },
];

export default routes;