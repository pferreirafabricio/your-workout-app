import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/__index/_layout/")({
  component: DashboardPlaceholderPage,
});

function DashboardPlaceholderPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Coming Soon</CardTitle>
      </CardHeader>
      <CardContent className="text-slate-600">
        Home is now reserved for dashboard insights. Visit Settings to manage preferences and bodyweight.
      </CardContent>
    </Card>
  );
}
