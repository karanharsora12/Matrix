import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import menusRoutes from "./routes/menus";
import inventoryRoutes from "./routes/inventory";
import accountRoutes from "./routes/account.routes";
import daybookRoutes from "./routes/daybook.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/menus", menusRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/daybooks", daybookRoutes);

app.get("/", (req, res) => {
  res.send("Matrix ERP System API");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
