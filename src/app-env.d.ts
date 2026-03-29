import { ClientConfig } from "./lib/core/get-server-config.server";

declare global {
  interface Window {
    APP_CONFIG: ClientConfig;
  }
}
