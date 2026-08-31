import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Box,
  Eye,
  EyeOff,
  Loader2,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Building2,
  BarChart3,
  Lock,
  AlertCircle,
  ArrowRight,
  Database,
  Cloud,
  Globe,
  Sparkles,
} from "lucide-react";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const features = [
    {
      icon: LayoutDashboard,
      label: "Real-time Dashboard & Analytics",
      color: "text-blue-400",
    },
    {
      icon: Building2,
      label: "Inventory & Warehouse Management",
      color: "text-emerald-400",
    },
    {
      icon: BarChart3,
      label: "Financial Reporting & Forecasting",
      color: "text-amber-400",
    },
    {
      icon: Users,
      label: "Human Resource Management",
      color: "text-violet-400",
    },
    {
      icon: Database,
      label: "Centralized Data & Integrations",
      color: "text-cyan-400",
    },
    {
      icon: Globe,
      label: "Multi-location & Multi-currency",
      color: "text-rose-400",
    },
  ];

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setErrors({});
    if (!validate()) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setErrors({ general: "Invalid email or password. Please try again." });
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* ========== LEFT BRANDING PANEL ========== */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-[#0a0e1a] overflow-hidden">
        {/* Deep gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f1629] to-[#0a0e1a]" />

        {/* Subtle mesh gradient overlays */}
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-blue-600/[0.07] rounded-full blur-[150px] -translate-x-1/3 -translate-y-1/3 animate-pulse-slow" />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-violet-600/[0.06] rounded-full blur-[130px] translate-x-1/4 translate-y-1/4 animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/[0.04] rounded-full blur-[100px]" />

        {/* Animated floating shapes */}
        <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-blue-400/30 rounded-full animate-float" />
        <div className="absolute top-[25%] left-[30%] w-1.5 h-1.5 bg-violet-400/25 rounded-full animate-float-delayed" />
        <div className="absolute top-[60%] right-[20%] w-2.5 h-2.5 bg-indigo-400/20 rounded-full animate-float-slow" />
        <div
          className="absolute top-[75%] left-[40%] w-1 h-1 bg-blue-300/30 rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-[40%] right-[10%] w-1.5 h-1.5 bg-violet-300/20 rounded-full animate-float-delayed"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute bottom-[20%] left-[15%] w-2 h-2 bg-indigo-300/15 rounded-full animate-float-slow"
          style={{ animationDelay: "1.5s" }}
        />

        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          {/* Top bar - Logo */}
          <div
            className={`flex items-center gap-4 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/25">
                <Box size={26} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Matrix ERP
              </h1>
              <p className="text-[11px] text-blue-300/60 font-semibold tracking-[0.2em] uppercase">
                Enterprise Suite
              </p>
            </div>
          </div>

          {/* Center - Hero */}
          <div
            className={`flex-1 flex flex-col justify-center max-w-xl transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h2 className="text-[2.75rem] font-bold text-white leading-[1.1] tracking-tight mb-6">
              Run your entire business on a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
                single platform
              </span>
            </h2>
            <p className="text-[17px] text-slate-400 leading-relaxed mb-12">
              From finance and supply chain to HR and analytics — manage every
              aspect of your enterprise with one intelligent, unified system.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {features.map(({ icon: Icon, label, color }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3.5 group transition-all duration-700"
                  style={{ transitionDelay: `${400 + i * 100}ms` }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:bg-white/[0.08] group-hover:border-white/[0.1] transition-all duration-300">
                    <Icon size={18} className={color} />
                  </div>
                  <span className="text-sm text-slate-300 font-medium leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom - Trust bar */}
          <div
            className={`flex items-center gap-8 transition-all duration-700 delay-[800ms] ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">
                All Systems Operational
              </span>
            </div>
            <Separator orientation="vertical" className="h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck size={14} />
              <span className="text-xs font-medium">SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Lock size={14} />
              <span className="text-xs font-medium">AES-256 Encryption</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Cloud size={14} />
              <span className="text-xs font-medium">99.99% Uptime SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== RIGHT LOGIN PANEL ========== */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 relative overflow-hidden">
        {/* Subtle decorative blurs */}
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-blue-100/40 dark:bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-[350px] h-[350px] bg-violet-100/30 dark:bg-violet-500/5 rounded-full blur-[80px]" />

        <div className="relative z-10 w-full max-w-[420px] px-6">
          {/* Mobile logo */}
          <div
            className={`lg:hidden flex flex-col items-center mb-10 transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-3.5 rounded-2xl shadow-lg shadow-blue-500/25">
                <Box size={34} strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Matrix ERP
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Enterprise Resource Planning
            </p>
          </div>

          {/* Login Card */}
          <Card
            className={`border-0 shadow-2xl shadow-zinc-200/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl ring-1 ring-black/[0.03] dark:ring-white/[0.05] transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.98]"}`}
          >
            <CardHeader className="pb-7 pt-8 px-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <Lock
                    size={16}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>
              <CardTitle className="text-[1.4rem] font-bold tracking-tight text-zinc-900 dark:text-white">
                Welcome back
              </CardTitle>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Sign in with your work credentials to access the ERP dashboard
              </p>
            </CardHeader>

            <CardContent className="px-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* General Error */}
                {errors.general && (
                  <div className="flex items-start gap-3 p-3.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400 animate-scale-in">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Authentication failed</p>
                      <p className="text-xs text-red-500/80 dark:text-red-400/60 mt-0.5">
                        {errors.general}
                      </p>
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Email address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (submitted)
                          setErrors((prev) => ({
                            ...prev,
                            email: undefined,
                            general: undefined,
                          }));
                      }}
                      className={`h-12 pl-11 rounded-xl bg-slate-50/80 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] focus-visible:border-blue-400 dark:focus-visible:border-blue-500/50 focus-visible:ring-blue-400/20 dark:focus-visible:ring-blue-500/20 transition-all duration-200 ${
                        errors.email
                          ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20"
                          : ""
                      }`}
                      aria-invalid={!!errors.email}
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1.5 mt-1 animate-fade-in-up">
                      <AlertCircle size={12} />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                      Password
                    </Label>
                    <a
                      href="#"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (submitted)
                          setErrors((prev) => ({
                            ...prev,
                            password: undefined,
                            general: undefined,
                          }));
                      }}
                      className={`h-12 pl-11 pr-12 rounded-xl bg-slate-50/80 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] focus-visible:border-blue-400 dark:focus-visible:border-blue-500/50 focus-visible:ring-blue-400/20 dark:focus-visible:ring-blue-500/20 transition-all duration-200 ${
                        errors.password
                          ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20"
                          : ""
                      }`}
                      aria-invalid={!!errors.password}
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                      <Lock size={18} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                      tabIndex={-1}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 flex items-center gap-1.5 mt-1 animate-fade-in-up">
                      <AlertCircle size={12} />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked === true)
                      }
                      className="border-slate-300 dark:border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none"
                    >
                      Remember me
                    </Label>
                  </div>
                </div>

                {/* Divider */}
                <Separator className="bg-slate-200/60 dark:bg-white/[0.06]" />

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-[15px] shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-200 active:scale-[0.98] disabled:active:scale-100 disabled:opacity-60 border-0"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="px-8 pb-8 pt-2">
              <p className="text-sm text-center w-full text-zinc-500 dark:text-zinc-400">
                No account yet?{" "}
                <a
                  href="#"
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Request access
                </a>
              </p>
            </CardFooter>
          </Card>

          {/* Footer */}
          <div
            className={`mt-8 text-center transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              &copy; {new Date().getFullYear()} Matrix ERP. All rights reserved.
            </p>
            <div className="flex items-center justify-center gap-5 mt-3">
              <a
                href="#"
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                Help Center
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
