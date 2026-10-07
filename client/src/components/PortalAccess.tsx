import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api, Auth, setCsrf } from "@/lib/portal-api";

export function usePortalAccess() {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [state, setState] = useState<
    "loading" | "offline" | "setup" | "login" | "ready"
  >("loading");
  useEffect(() => {
    api<{ available: boolean; setup: boolean }>("/status")
      .then(async status => {
        if (status.setup) {
          setState("setup");
          return;
        }
        try {
          const session = await api<Auth>("/session");
          setCsrf(session.csrf);
          setAuth(session);
          setState("ready");
        } catch {
          setState("login");
        }
      })
      .catch(() => setState("offline"));
  }, []);
  return {
    auth,
    state,
    complete: (value: Auth) => {
      setCsrf(value.csrf);
      setAuth(value);
      setState("ready");
    },
    logout: async () => {
      await api("/logout", "POST");
      setAuth(null);
      setCsrf("");
      setState("login");
    },
  };
}
export function AccessScreen({
  state,
  complete,
  client = false,
}: {
  state: string;
  complete: (auth: Auth) => void;
  client?: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="hs-access">
      <Link href="/" className="hs-logo">
        <img src="/brand/hyperscale-h.png" alt="" />
        HYPERSCALE
      </Link>
      <section>
        <span className="hs-label">
          {client ? "CLIENT PORTAL" : "AGENCY WORKSPACE"}
        </span>
        <h1>
          {state === "setup"
            ? "Set up your workspace."
            : state === "offline"
              ? "Connect your workspace."
              : "Welcome back."}
        </h1>
        {state === "loading" ? (
          <p>Loading workspace…</p>
        ) : state === "offline" ? (
          <>
            <p>
              The shared portal needs its Node server. Your previous browser
              records are still intact.
            </p>
            <a
              className="hs-btn primary"
              href="http://127.0.0.1:4590/dashboard"
            >
              Open Desktop workspace
            </a>
            <Link href="/inquiry">Start a project</Link>
          </>
        ) : (
          <form
            onSubmit={async e => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const fields = new FormData(e.currentTarget);
              try {
                complete(
                  await api<Auth>(
                    state === "setup" ? "/setup" : "/login",
                    "POST",
                    {
                      name: fields.get("name"),
                      email: fields.get("email"),
                      password: fields.get("password"),
                    }
                  )
                );
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {state === "setup" && (
              <label>
                Your name
                <input
                  name="name"
                  required
                  maxLength={100}
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={200}
                autoComplete={
                  state === "setup" ? "new-password" : "current-password"
                }
              />
            </label>
            {state === "setup" && (
              <small>
                Choose a password with at least 12 characters. First setup is
                available on the local server.
              </small>
            )}
            {error && (
              <p role="alert" className="hs-error">
                {error}
              </p>
            )}
            <button className="hs-btn primary" disabled={busy}>
              {busy
                ? "Please wait…"
                : state === "setup"
                  ? "Create workspace"
                  : "Sign in"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
