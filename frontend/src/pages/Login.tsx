import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { initiateLogin } from "../api";
import styles from "./Login.module.css";

const ERRORS: Record<string, string> = {
  access_denied:         "You cancelled the GitHub login. Try again anytime.",
  state_mismatch:        "Security check failed — please try logging in again.",
  token_exchange_failed: "Couldn't exchange the authorization code. Check your app config.",
  user_fetch_failed:     "Logged in but couldn't load your profile. Try again.",
  missing_params:        "The callback was missing required parameters.",
};

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const errorKey = params.get("error");
  const errorMsg = errorKey ? (ERRORS[errorKey] ?? "An unexpected error occurred.") : null;

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return <div className={styles.loader} aria-label="Loading" />;

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* GitHub mark */}
        <div className={styles.mark}>
          <svg height="44" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
              -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
              .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
              -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0
              1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82
              1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01
              1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </div>

        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.sub}>Use your GitHub account to continue</p>

        {errorMsg && (
          <div className={styles.error} role="alert">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12a1 1 0 110-2 1 1 0 010
                2zm.75-4.25a.75.75 0 01-1.5 0V5.75a.75.75 0 011.5 0v3z"/>
            </svg>
            {errorMsg}
          </div>
        )}

        <button className={styles.btn} onClick={initiateLogin}>
          <svg height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
              0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
              -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
              .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
              -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0
              1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82
              1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01
              1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Continue with GitHub
        </button>

        <p className={styles.legal}>
          Authorizes read-only access to your public GitHub profile.
        </p>
      </div>

      <footer className={styles.footer}>
        <span>OAuth 2.0 Demo</span>
        <span className={styles.dot}>·</span>
        <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </div>
  );
}
