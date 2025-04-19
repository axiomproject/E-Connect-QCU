"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
const fs_1 = require("fs");
// Check for .env.local first, then fall back to .env
const localEnvPath = (0, path_1.resolve)(process.cwd(), '.env.local');
const defaultEnvPath = (0, path_1.resolve)(process.cwd(), '.env');
// Try loading .env.local first
if ((0, fs_1.existsSync)(localEnvPath)) {
    console.log(`Loading environment from: ${localEnvPath}`);
    dotenv.config({ path: localEnvPath });
}
else {
    // Fall back to .env
    console.log(`Loading environment from: ${defaultEnvPath}`);
    dotenv.config({ path: defaultEnvPath });
}
// Additionally, load from backend/.env if it exists
const backendEnvPath = (0, path_1.resolve)(process.cwd(), 'backend', '.env');
if ((0, fs_1.existsSync)(backendEnvPath)) {
    console.log(`Also loading environment from: ${backendEnvPath}`);
    dotenv.config({ path: backendEnvPath });
}
exports.env = process.env;
// Debug log to help diagnose the issue
console.log(`Environment variables loaded:
  JWT_SECRET: ${exports.env.JWT_SECRET ? '(exists)' : '(undefined)'}
  DATABASE_URL: ${exports.env.DATABASE_URL ? '(exists)' : '(undefined)'}
`);
