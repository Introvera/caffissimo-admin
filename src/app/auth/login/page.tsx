"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Eye, EyeOff, Coffee } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/stores/store";
import { loginWithFirebase } from "@/stores/slices/authSlice";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const { resolvedTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resultAction = await dispatch(
        loginWithFirebase({ email, password }),
      );
      if (loginWithFirebase.fulfilled.match(resultAction)) {
        router.push("/admin/dashboard");
      } else if (loginWithFirebase.rejected.match(resultAction)) {
        toast.error(
          (resultAction.payload as string) ??
          "Something went wrong. Please try again.",
        );
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* ── Left panel: form ── */}
      <div className="flex flex-col w-full lg:w-1/2 px-8 py-10 justify-between bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center overflow-hidden">
            {mounted ? (
              <img
                src={resolvedTheme === "dark" ? "/logo/logo-dark-theme.png" : "/logo/logo-light-theme.png"}
                alt="Caffissimo"
                className="h-10 w-36 object-contain object-left"
              />
            ) : (
              <div className="h-10 w-32" />
            )}
          </div>
          <ThemeToggle />
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-12">
          <h1 className="text-h1 font-bold text-foreground tracking-tight leading-tight mb-1.5">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-body mb-8">
            Enter your credentials to access the admin panel.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-caption font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@caffissimo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="
                  w-full px-3.5 py-2.5 rounded-lg text-body
                  bg-background border border-border
                  text-foreground placeholder:text-muted-foreground
                  outline-none transition-colors duration-200
                  focus:border-primary
                "
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-caption font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="
                    w-full px-3.5 py-2.5 pr-10 rounded-lg text-body
                    bg-background border border-border
                    text-foreground placeholder:text-muted-foreground
                    outline-none transition-colors duration-200
                    focus:border-primary
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-2.5 rounded-lg text-body font-semibold
                bg-primary text-primary-foreground
                hover:opacity-90 active:opacity-80
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200 mt-1
              "
            >
              {isLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-caption text-muted-foreground text-center">
          © 2026 Caffissimo. All rights reserved.
        </p>
      </div>

      {/* ── Right panel: image ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Coffee photo */}
        <img
          src="/coffee-panel.png"
          alt="Artisan coffee"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay — uses the brand teal/dark tone */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.28) 60%, rgba(0,0,0,0.52) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end p-12 w-full">
          <h2 className="text-h1 font-bold text-white leading-snug tracking-tight mb-3 max-w-sm">
            Effortlessly manage your café and operations.
          </h2>

          <p className="text-white/70 text-body leading-relaxed max-w-xs">
            Track orders, manage your menu, monitor branches and keep your team
            in sync all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
