import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
// Check for .env.local first, then fall back to .env
const localEnvPath = resolve(process.cwd(), '.env.local');
const defaultEnvPath = resolve(process.cwd(), '.env');
// Try loading .env.local first
if (existsSync(localEnvPath)) {
    console.log(`Loading environment from: ${localEnvPath}`);
    dotenv.config({ path: localEnvPath });
}
else {
    // Fall back to .env
    console.log(`Loading environment from: ${defaultEnvPath}`);
    dotenv.config({ path: defaultEnvPath });
}
// Additionally, load from backend/.env if it exists
const backendEnvPath = resolve(process.cwd(), 'backend', '.env');
if (existsSync(backendEnvPath)) {
    console.log(`Also loading environment from: ${backendEnvPath}`);
    dotenv.config({ path: backendEnvPath });
}
export const env = process.env;
// Debug log to help diagnose the issue
console.log(`Environment variables loaded:
  JWT_SECRET: ${env.JWT_SECRET ? '(exists)' : '(undefined)'}
  DATABASE_URL: ${env.DATABASE_URL ? '(exists)' : '(undefined)'}
`);
export default env;
