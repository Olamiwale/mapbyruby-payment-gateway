"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']),
    PORT: zod_1.z.string().transform(Number),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_ACCESS_EXPIRY: zod_1.z.string("15m"),
    JWT_REFRESH_EXPIRY: zod_1.z.string("7d"),
    PAYSTACK_SECRET_KEY: zod_1.z.string(),
    PAYSTACK_PUBLIC_KEY: zod_1.z.string(),
    STRIPE_SECRET_KEY: zod_1.z.string(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string(),
});
const envValidation = envSchema.safeParse(process.env);
if (!envValidation.success) {
    console.error('❌ Invalid environment variables:', envValidation.error.format());
    process.exit(1);
}
exports.env = envValidation.data;
//# sourceMappingURL=env.js.map