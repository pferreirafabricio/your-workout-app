import { createServerFn } from "@tanstack/react-start";
import { configService } from "./config.server";

export const getServerConfigServerFn = createServerFn().handler(async () => {
  if (!configService.isInitialized()) configService.initialize();
  return configService.getAppConfig();
});
