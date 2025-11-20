// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClientSingleton | undefined;
}

export const prisma: PrismaClientSingleton =
  globalThis.__prisma__ ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}

export default prisma;
