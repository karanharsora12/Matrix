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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <ERPLaoyut />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
    ],
  },
  {
    path: "/master",
    element: <ERPLaoyut />,
    children: [
      {
        path: "admin-setup/menu-setup",
        element: <MenuSetup />,
      },
      {
        path: "inventory/item-groups",
        element: <ItemGroups />,
      },
    ],
  },
]);

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchMasterData());
  }, [dispatch]);

  return <RouterProvider router={router} />;
}
