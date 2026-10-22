import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_AUTH_REDIRECT_URL = "https://mold-gold.vercel.app/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log in — MOLD" },
      { name: "description", content: "Log in to your MOLD account or create a new account." },
      { property: "og:title", content: "Log in — MOLD" },
      { property: "og:description", content: "Log in to your MOLD account or create a new account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    // Handles the return from the email confirmation link: Supabase picks up
    // the token in the URL and signs the user in.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setStatus("Email confirmed — you're signed in.");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  function validate() {
    const next: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Minimum 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    if (!validate()) return;
    setLoading(true);

    if (mode === "signup") {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      setLoading(false);
      if (error) {
        setStatus(error.message);
        return;
      }

      setPendingConfirmationEmail(normalizedEmail);
      setStatus(
        data.session
          ? "Your account is ready — you're signed in."
          : "Check your email to confirm your account. If it doesn't arrive, use Resend confirmation below.",
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        setStatus(
          resendError
            ? "Your email isn't confirmed yet, and re-sending failed. Try again in a minute."
            : "Your email isn't confirmed yet — we've sent you a new confirmation link. Check your inbox and spam folder.",
        );
      } else {
        setStatus(error.message);
      }
      return;
    }
    navigate({ to: "/account" });
  }

  async function resendConfirmation() {
    const recipient = pendingConfirmationEmail || email.trim().toLowerCase();
    if (!recipient) {
      setErrors((current) => ({ ...current, email: "Enter your email address first." }));
      return;
    }

    setResending(true);
    setStatus("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: recipient,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setResending(false);
    setStatus(
      error
        ? error.message
        : "A new confirmation link has been sent. Check your inbox and spam folder.",
    );
  }

  async function resetPassword() {
    setStatus("");
    if (!email.trim()) {
      setErrors((e) => ({ ...e, email: "Enter your email address first." }));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    setStatus(error ? error.message : "Password reset link sent. Check your inbox.");
  }

  async function signInWithGoogle() {
    setStatus("");
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: GOOGLE_AUTH_REDIRECT_URL },
    });
    if (error) {
      setGoogleLoading(false);
      setStatus(error.message);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-[400px]">
        {/* Wordmark */}
        <div className="mb-12 text-center">
          <Link to="/" className="label-mono text-[11px] tracking-[0.35em] text-ink transition-opacity hover:opacity-60">
            MOLD
          </Link>
        </div>

        <div className="text-center">
          <h1 className="font-[var(--font-body)] text-2xl font-semibold tracking-tight text-ink">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-ink">
            {mode === "signin" ? "Log in to continue to MOLD." : "Join MOLD to track orders and check out faster."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 space-y-5" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="email" className="label-mono block text-muted-ink">
              Email
            </label>
            <input
              id="email"
              required
              autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((x) => { const { email: _e, ...rest } = x; return rest; });
              }}
              placeholder="name@example.com"
              className="mt-2 w-full border-b border-line bg-transparent px-0 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-ink/60 focus:border-ink"
            />
            {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="label-mono text-muted-ink">
                Password
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={resetPassword}
                  className="text-xs text-muted-ink underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative mt-2">
              <input
                id="password"
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                type={showPassword ? "text" : "password"}
                minLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((x) => { const { password: _p, ...rest } = x; return rest; });
                }}
                placeholder="Minimum 6 characters"
                className="w-full border-b border-line bg-transparent px-0 py-3 pr-11 text-sm text-ink outline-none transition-colors placeholder:text-muted-ink/60 focus:border-ink"
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-ink transition-colors hover:text-ink"
              >
                {showPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-destructive">{errors.password}</p>}
          </div>

          {status && (
            <div className="space-y-2">
              <p role="status" className="text-xs leading-5 text-muted-ink">{status}</p>
              {mode === "signup" && pendingConfirmationEmail && (
                <Button
                  type="button"
                  variant="link"
                  disabled={resending}
                  onClick={resendConfirmation}
                  className="h-auto p-0 text-xs font-medium text-ink underline underline-offset-4 disabled:opacity-60"
                >
                  {resending ? "Sending…" : "Resend confirmation"}
                </Button>
              )}
            </div>
          )}

          <Button
            disabled={loading}
            type="submit"
            className="h-12 w-full rounded-none bg-ink text-sm font-semibold text-paper transition-opacity hover:opacity-85 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper [animation-delay:300ms]" />
              </span>
            ) : mode === "signin" ? "Log In" : "Create account"}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-line" />
          <span className="label-mono text-muted-ink">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-none border border-ink text-sm font-medium text-ink transition-colors hover:bg-ink/5 disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink [animation-delay:300ms]" />
            </span>
          ) : (
            <>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.455 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Footer */}
        <p className="mt-10 text-center text-sm text-muted-ink">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setStatus("");
              setPendingConfirmationEmail("");
              setErrors({});
            }}
            className="font-medium text-ink underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            {mode === "signin" ? "Sign up" : "Log in"}
          </button>
        </p>

        <div className="mt-6 text-center">
          <Link to="/track" className="label-mono text-muted-ink underline underline-offset-4 transition-colors hover:text-ink">
            Track an order as guest
          </Link>
        </div>
      </div>
    </div>
  );
}
