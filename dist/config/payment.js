"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paystackConfig = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("./env");
exports.stripe = new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
});
exports.paystackConfig = {
    secretKey: env_1.env.PAYSTACK_SECRET_KEY,
    publicKey: env_1.env.PAYSTACK_PUBLIC_KEY,
    baseURL: 'https://api.paystack.co',
};
//# sourceMappingURL=payment.js.map