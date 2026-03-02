"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorHandler_1 = require("./src/middleware/errorHandler");
const rateLimiter_1 = require("./src/middleware/rateLimiter");
const auth_routes_1 = __importDefault(require("./src/modules/auth/auth.routes"));
const payment_routes_1 = __importDefault(require("./src/modules/payment/payment.routes"));
const admin_routes_1 = __importDefault(require("./src/modules/admin/admin.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === "production"
        ? ["https://mapbyruby.com"]
        : ["http://localhost:5173"],
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use((0, cookie_parser_1.default)());
app.use("/payment/webhook", payment_routes_1.default);
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use(rateLimiter_1.generalLimiter);
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "This is working as expected. It time to start building your application",
        timestamp: new Date().toISOString(),
    });
});
app.use("/auth", auth_routes_1.default);
app.use("/payment", payment_routes_1.default);
app.use("/admin", admin_routes_1.default);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map