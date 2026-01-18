"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { useAuth } from "./AuthProvider";

type Mode = "login" | "register";

type Ctx = {
  openAuth: (mode: Mode) => void;
};

const AuthModalContext = createContext<Ctx | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("AuthModalContext not found");
  return ctx;
}

export function AuthModalProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authParam = searchParams.get("auth") as Mode | null;
  const { refreshMe } = useAuth();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    if (authParam === "login" || authParam === "register") {
      setMode(authParam);
      setOpen(true);
    }
  }, [authParam]);

  function openAuth(nextMode: Mode) {
    setMode(nextMode);
    setOpen(true);
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("auth", nextMode);
    router.replace(`/?${qs.toString()}`);
  }

  function close() {
    setOpen(false);
    setError("");
    const qs = new URLSearchParams(searchParams.toString());
    qs.delete("auth");
    const next = qs.toString();
    router.replace(next ? `/?${next}` : "/");
  }

  async function submit() {
    setError("");
    try {
      if (mode === "login") {
        await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(loginForm),
        });
      } else {
        await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(registerForm),
        });
      }
      await refreshMe();
      close();
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const value = useMemo<Ctx>(() => ({ openAuth }), [searchParams]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {open ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={close}
            role="button"
            aria-label="Close"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 neon-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {mode === "login" ? "Login" : "Register"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {mode === "login"
                    ? "Welcome back to DarePot."
                    : "Create a DarePot account."}
                </p>
              </div>
              <button
                onClick={close}
                className="rounded-md border border-border px-3 py-2 hover:bg-surface-elevated"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 rounded-md border border-border px-3 py-2 text-sm font-semibold ${
                  mode === "login" ? "bg-neon-lime/10 text-neon-lime" : "hover:bg-surface-elevated"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 rounded-md border border-border px-3 py-2 text-sm font-semibold ${
                  mode === "register" ? "bg-neon-lime/10 text-neon-lime" : "hover:bg-surface-elevated"
                }`}
              >
                Register
              </button>
            </div>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              {mode === "register" ? (
                <>
                  <div className="space-y-1">
                    <input
                      className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                      placeholder="Username"
                      value={registerForm.username}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, username: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      This is what friends will transfer credits to.
                    </p>
                  </div>
                </>
              ) : null}

              <div className="space-y-1">
                <input
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                  placeholder="Email"
                  value={mode === "login" ? loginForm.email : registerForm.email}
                  onChange={(e) =>
                    mode === "login"
                      ? setLoginForm({ ...loginForm, email: e.target.value })
                      : setRegisterForm({ ...registerForm, email: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Example: <span className="font-mono">alex@example.com</span>
                </p>
              </div>

              <div className="space-y-1">
                <input
                  className="w-full rounded-md border border-border bg-surface-elevated px-3 py-2 placeholder:text-muted-foreground"
                  placeholder="Password"
                  type="password"
                  value={mode === "login" ? loginForm.password : registerForm.password}
                  onChange={(e) =>
                    mode === "login"
                      ? setLoginForm({ ...loginForm, password: e.target.value })
                      : setRegisterForm({ ...registerForm, password: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <button className="w-full rounded-md bg-neon-lime px-4 py-3 font-bold text-background neon-glow-hover">
                {mode === "login" ? "Login" : "Create account"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </AuthModalContext.Provider>
  );
}

