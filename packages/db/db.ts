import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({
  adapter,
});