import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./src/middleware/errorHandler";
import { generalLimiter } from "./src/middleware/rateLimiter";
import authRoutes from "./src/modules/auth/auth.routes";
import paymentRoutes from "./src/modules/payment/payment.routes";

const app: Application = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://mapbyruby.com"]
        : ["http://localhost:5173"],
    credentials: true,
  }),
);

app.use(helmet());
app.use(cookieParser());

app.use("/payment/webhook", paymentRoutes);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(generalLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "This is working as expected. It time to start building your application",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/payment", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
