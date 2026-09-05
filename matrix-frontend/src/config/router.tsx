import { createBrowserRouter } from "react-router-dom";
import { PublicRoute } from "../components/common/PublicRoute";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ERPLaoyut from "../layouts/ERPLaoyut";
import MenuSetup from "../pages/admin-setup/MenuSetup";
import ItemGroups from "../pages/master/inventory/ItemGroups";
import Items from "../pages/master/inventory/Items";
import Accounts from "../pages/master/accounts/Accounts";
import AccountForm from "../pages/master/accounts/AccountForm";
import DaybookGroups from "../pages/master/other-master/DaybookGroups";
import Daybooks from "../pages/master/other-master/Daybooks";
import NotFound from "../pages/NotFound";
import { WEB_ROUTES } from "./webRoutes";
import SalesList from "@/pages/transaction/customer-in-out/sales/SalesList";
import Sales from "@/pages/transaction/customer-in-out/sales/Sales";

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
          {
            path: WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER,
            element: <Accounts />,
          },
          {
            path: WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER_ADD,
            element: <AccountForm />,
          },
          {
            path: WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER_EDIT,
            element: <AccountForm />,
          },
          {
            path: WEB_ROUTES.MASTER.OTHER_MASTER.DAYBOOK_GROUPS,
            element: <DaybookGroups />,
          },
          {
            path: WEB_ROUTES.MASTER.OTHER_MASTER.DAYBOOKS,
            element: <Daybooks />,
          },
          {
            path: WEB_ROUTES.TRANSACTION.SALES_LIST,
            element: <SalesList />,
          },
          {
            path: WEB_ROUTES.TRANSACTION.SALES,
            element: <Sales />,
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
