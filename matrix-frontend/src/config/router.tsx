import Sales from "@/pages/transaction/customer-in-out/sales/Sales";
import SalesList from "@/pages/transaction/customer-in-out/sales/SalesList";
import CashPayment from "@/pages/transaction/payments/cash-payment/CashPayment";
import CashPaymentList from "@/pages/transaction/payments/cash-payment/CashPaymentList";
import CashReceipt from "@/pages/transaction/receipt/cash-receipt/CashReceipt";
import CashReceiptList from "@/pages/transaction/receipt/cash-receipt/CashReceiptList";
import { Purchase } from "@/pages/transaction/supplier-in-out/purchase/Purchase";
import PurchaseList from "@/pages/transaction/supplier-in-out/purchase/PurchaseList";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { PublicRoute } from "../components/common/PublicRoute";
import ERPLaoyut from "../layouts/ERPLaoyut";
import MenuSetup from "../pages/admin-setup/MenuSetup";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import AccountForm from "../pages/master/accounts/AccountForm";
import Accounts from "../pages/master/accounts/Accounts";
import ItemCodes from "../pages/master/inventory/ItemCodes";
import ItemGroups from "../pages/master/inventory/ItemGroups";
import Items from "../pages/master/inventory/Items";
import DaybookGroups from "../pages/master/other-master/DaybookGroups";
import Daybooks from "../pages/master/other-master/Daybooks";
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
          {
            path: WEB_ROUTES.MASTER.INVENTORY.ITEM_CODES,
            element: <ItemCodes />,
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
          {
            path: WEB_ROUTES.TRANSACTION.PURCHASE_LIST,
            element: <PurchaseList />,
          },
          {
            path: WEB_ROUTES.TRANSACTION.PURCHASE,
            element: <Purchase />,
          },
          {
            path: WEB_ROUTES.TRANSACTION.CASH_PAYMENT_LIST,
            element: <CashPaymentList />,
          },
          {
            path: WEB_ROUTES.TRANSACTION.CASH_PAYMENT,
            element: <CashPayment />,
          },
          {
            path: WEB_ROUTES.TRANSACTION.CASH_RECEIPT_LIST,
            element: <CashReceiptList />,
          },
          {
            path: WEB_ROUTES.TRANSACTION.CASH_RECEIPT,
            element: <CashReceipt />,
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
