"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    static info(message, meta) {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
    }
    static error(message, error) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    }
    static warn(message, meta) {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
    }
    static security(event, details) {
        console.log(`[SECURITY] ${new Date().toISOString()} - ${event}`, details);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map