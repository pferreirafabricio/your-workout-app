import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Dumbbell, History, BicepsFlexed, Wrench, User, LogOut, Home, Settings, Salad, ChevronLeft, ChevronRight, Utensils, Apple, PieChart, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export const Route = createFileRoute("/__index/_layout")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: "/sign-in" });
    return { user: context.user };
  },
});

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/current-workout", label: "Current Workout", icon: Dumbbell },
  { to: "/workout-history", label: "Workout History", icon: History },
  { to: "/movements", label: "Movements", icon: BicepsFlexed },
  { to: "/equipment", label: "Equipment", icon: Wrench },
] as const;

const nutritionSubMenus = [
  { to: "/nutrition", label: "Daily Log", icon: Utensils },
  { to: "/nutrition/foods", label: "Foods", icon: Apple },
  { to: "/nutrition/calories-macros", label: "Calories & Macros", icon: PieChart },
  { to: "/settings", label: "Goals Setup", icon: Target },
] as const;

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen flex bg-slate-50 overflow-hidden">
      <div className="relative shrink-0">
        <nav
          className={cn(
            "h-full bg-white border-r border-slate-200 p-4 flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-300",
            isCollapsed ? "w-20" : "w-64"
          )}>
          <div className={cn("mb-8 flex items-center shrink-0 overflow-hidden transition-all duration-300", isCollapsed ? "justify-center" : "px-3")}>
            <img src="/wordmark.svg" alt="Logo" className={cn("h-6 transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")} />
            <Dumbbell className={cn("w-6 h-6 text-slate-900 transition-all duration-300", isCollapsed ? "block" : "hidden")} />
          </div>

        <div className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Tooltip key={to} open={isCollapsed ? undefined : false}>
              <TooltipTrigger asChild>
                <Link
                  to={to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors [&.active]:bg-slate-100 [&.active]:text-slate-900",
                    isCollapsed && "justify-center"
                  )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                {label}
              </TooltipContent>
            </Tooltip>
          ))}

          <div className="mt-2">
            {!isCollapsed ? (
              <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700">
                <Salad className="w-4 h-4 shrink-0" />
                Nutrition
              </div>
            ) : (
              <div className="flex justify-center py-2 text-slate-700">
                <Salad className="w-4 h-4" />
              </div>
            )}
            <div className={cn("flex flex-col gap-1 transition-all duration-300", !isCollapsed ? "ml-7" : "items-center")}>
              {nutritionSubMenus.map((menu) => (
                <Tooltip key={menu.to + menu.label} open={isCollapsed ? undefined : false}>
                  <TooltipTrigger asChild>
                    <Link
                      to={menu.to}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors [&.active]:bg-slate-100 [&.active]:text-slate-900 w-full",
                        isCollapsed && "justify-center"
                      )}>
                      <menu.icon className="w-3.5 h-3.5 shrink-0" />
                      {!isCollapsed && <span className="truncate">{menu.label}</span>}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    {menu.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
          <div className={cn("flex items-center gap-3 px-3 py-2 text-sm text-slate-600", isCollapsed && "justify-center")}>
            <User className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs text-slate-400">Logged in as</p>
                <p className="font-medium truncate">{user.name || user.email}</p>
              </div>
            )}
          </div>
          <a href="/logout">
            <Tooltip open={isCollapsed ? undefined : false}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className={cn("w-full justify-start gap-3 text-slate-600", isCollapsed && "justify-center px-0")}>
                  <LogOut className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Log out</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Log out
              </TooltipContent>
            </Tooltip>
          </a>
        </div>
      </nav>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-slate-200 bg-white shadow-sm z-50 hover:bg-slate-50 transition-transform duration-300"
        onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <ChevronRight className="w-3 h-3 text-slate-600" /> : <ChevronLeft className="w-3 h-3 text-slate-600" />}
      </Button>
    </div>
    <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
    </TooltipProvider>
  );
}
