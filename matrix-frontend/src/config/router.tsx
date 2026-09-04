import { createBrowserRouter } from "react-router-dom";
import { PublicRoute } from "../components/common/PublicRoute";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ERPLaoyut from "../layouts/ERPLaoyut";
import MenuSetup from "../pages/admin-setup/MenuSetup";
import ItemGroups from "../pages/master/inventory/ItemGroups";
import Items from "../pages/master/inventory/Items";
import NotFound from "../pages/NotFound";
import { WEB_ROUTES } from "./webRoutes";

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: WEB_ROUTES.HOME,
        element: <Login />,
      },
      {
        path: WEB_ROUTES.LOGIN,
        element: <Login />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ERPLaoyut />,
        children: [
          {
            path: WEB_ROUTES.DASHBOARD,
            element: <Dashboard />,
          },
          {
            path: WEB_ROUTES.MASTER.MENU_SETUP,
            element: <MenuSetup />,
          },
          {
            path: WEB_ROUTES.MASTER.INVENTORY.ITEM_GROUPS,
            element: <ItemGroups />,
          },
          {
            path: WEB_ROUTES.MASTER.INVENTORY.ITEMS,
            element: <Items />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
