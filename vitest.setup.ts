import { config } from "dotenv";

config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://proposalfast:proposalfast_dev@localhost:5432/proposalfast_test";
}

process.env.AUTH_SECRET ??= "test-auth-secret-do-not-use-in-production";
process.env.NEXT_PUBLIC_APP_URL ??= "http://127.0.0.1:43127";
process.env.AUTH_URL ??= "http://127.0.0.1:43127";
