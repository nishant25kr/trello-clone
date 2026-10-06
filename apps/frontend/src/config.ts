const runtimeEnv = typeof Bun !== "undefined"
  ? Bun.env
  : typeof process !== "undefined" && process.env
    ? process.env
    : {};

export const API_BASE_URL = runtimeEnv.VITE_API_URL ?? "http://localhost:3000/api/v1";
export const WS_URL = runtimeEnv.VITE_WS_URL ?? "ws://localhost:8080";
