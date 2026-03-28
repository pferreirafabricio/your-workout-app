import { useRouter } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSearch, Home } from "lucide-react";

export function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-lg border-none shadow-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto w-24 h-24 rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
            <FileSearch className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">404 - Lost in Orbit?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-center pb-12">
          <p className="text-slate-600 text-lg leading-relaxed max-w-sm mx-auto">
            The page you're looking for seems to have vanished into the digital void.
            Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              onClick={() => router.navigate({ to: "/" })} 
              size="lg"
              className="px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-all outline-none"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()} 
              size="lg"
              className="px-8 hover:bg-slate-50 transition-all outline-none"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
