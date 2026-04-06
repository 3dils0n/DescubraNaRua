import { randomBytes } from "crypto";

export function generateReservationCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export function generateExternalReference(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString("hex")}`;
}
