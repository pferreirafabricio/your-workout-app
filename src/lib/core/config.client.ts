import { useMemo } from "react";

type Environment = "development" | "test" | "staging" | "production";

export interface ClientConfig {
  environment: Environment;
}

const VALID_ENVIRONMENTS = new Set(["development", "test", "staging", "production"] as const);

function isTemplatePlaceholder(value: string): boolean {
  return /^\$\{.+\}$/.test(value);
}

function resolveEnvironment(): ClientConfig["environment"] {
  const windowEnvironment = globalThis.window?.APP_CONFIG?.environment;
  if (windowEnvironment && VALID_ENVIRONMENTS.has(windowEnvironment as ClientConfig["environment"])) {
    return windowEnvironment as ClientConfig["environment"];
  }

  const viteEnvironment = import.meta.env.VITE_ENVIRONMENT as Environment;
  if (viteEnvironment && !isTemplatePlaceholder(viteEnvironment) && VALID_ENVIRONMENTS.has(viteEnvironment)) {
    return viteEnvironment;
  }

  const processEnvironment = process.env.VITE_ENVIRONMENT;
  if (processEnvironment && !isTemplatePlaceholder(processEnvironment) && VALID_ENVIRONMENTS.has(processEnvironment as ClientConfig["environment"])) {
    return processEnvironment as ClientConfig["environment"];
  }

  return "development";
}

let _clientConfig: ClientConfig | null = null;

export function getClientConfig(): ClientConfig {
  if (_clientConfig) return _clientConfig;
  const environment = resolveEnvironment();
  if (globalThis.window === undefined || environment === "development") {
    _clientConfig = {
      environment,
    };
  } else {
    _clientConfig = {
      environment,
    };
  }
  console.log("Client configuration loaded:", _clientConfig);
  return _clientConfig;
}

export function useClientConfig(): ClientConfig {
  const config = useMemo(() => getClientConfig(), []);
  return config;
}
