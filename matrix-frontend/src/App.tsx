import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchMasterData } from "./store/inventorySlice";
import type { AppDispatch } from "./store";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ERPLaoyut from "./layouts/ERPLaoyut";

import MenuSetup from "./pages/admin-setup/MenuSetup";
import ItemGroups from "./pages/master/inventory/ItemGroups";
import Items from "./pages/master/inventory/Items";
import { WEB_ROUTES } from "./config/webRoutes";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter([
  {
    path: WEB_ROUTES.HOME,
    element: <Login />,
  },
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
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchMasterData());
  }, [dispatch]);

  return <RouterProvider router={router} />;
}
