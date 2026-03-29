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

function resolveClientEnv(key: string): string {
  if (!key.startsWith("VITE_")) throw new Error(`Client environment variable must start with "VITE_": ${key}`);
  if (globalThis.window !== undefined) {
    const value = import.meta.env[key];
    if (value) return value;
  }
  const value = process.env[key];
  if (value) return value;
  throw new Error(`Missing environment variable: ${key}`);
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
