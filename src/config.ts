import { resolve } from "path";

export const BOT_TOKEN = process.env.BOT_TOKEN || "";
export const DB_PATH = process.env.DB_PATH || resolve("data", "crazy-grid.db");
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
