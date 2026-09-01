import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ERPLaoyut from "./layouts/ERPLaoyut";

import MenuSetup from "./pages/admin-setup/MenuSetup";

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
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
