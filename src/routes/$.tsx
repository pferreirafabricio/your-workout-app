import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/core/not-found";

export const Route = createFileRoute("/$")({
  component: NotFound,
});
