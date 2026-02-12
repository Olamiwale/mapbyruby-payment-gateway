"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./src/config/env");
const logger_1 = require("./src/utils/logger");
const PORT = env_1.env.PORT || 5000;
const server = app_1.default.listen(PORT, () => {
    logger_1.Logger.info(`Server running on port ${PORT} in ${env_1.env.NODE_ENV} mode `);
    logger_1.Logger.info(` Health check: http://localhost:${PORT}/health `);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.Logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_1.Logger.info('Server closed');
        process.exit(0);
    });
});
process.on('unhandledRejection', (reason) => {
    logger_1.Logger.error('Unhandled Rejection:', reason);
    process.exit(1);
});
//# sourceMappingURL=server.js.map