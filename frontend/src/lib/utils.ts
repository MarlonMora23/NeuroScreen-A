import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractError(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    try {
      const e = err as any;
      if (typeof e.message === "string" && e.message) return e.message;
      if (typeof e.error === "string" && e.error) return e.error;
      // attempt to stringify useful payload
      return JSON.stringify(e);
    } catch (e) {
      return String(err);
    }
  }
  return String(err);
}
