import type { Role as PrismaRole } from "@prisma/client";

export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const satisfies Record<string, PrismaRole>;

export type Role = (typeof Role)[keyof typeof Role];
