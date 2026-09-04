import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { router } from "./config/router";
import type { AppDispatch } from "./store";
import { fetchMasterData } from "./store/inventorySlice";

export default function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchMasterData());
  }, [dispatch]);

  return <RouterProvider router={router} />;
}
