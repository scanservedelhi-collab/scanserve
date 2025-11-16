// src/Auth.jsx
import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // send OTP (magic link / one-time code via Supabase)
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const redirectTo = window.location.origin + window.location.pathname + "#menu"; // where user returns after clicking
      // Supabase v2: signInWithOtp
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;
      setMessage("Check your email — we sent a one-time link / code to sign you in.");
    } catch (err) {
      setMessage("Error: " + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  // sign in with Google
  const handleGoogle = async () => {
    setLoading(true);
    setMessage("");
    try {
      // provider redirect to Supabase OAuth; set callback URL in Supabase console
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // optional: redirect after OAuth - we'll rely on Supabase settings
          // redirectTo: window.location.origin + window.location.pathname + "#menu"
        },
      });
      if (error) throw error;
      // OAuth flow will redirect away
    } catch (err) {
      setMessage("OAuth error: " + (err.message || err.toString()));
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ marginBottom: 6 }}>Sign in / Sign up</h2>
        <p style={{ marginTop: 0, marginBottom: 12, fontSize: 13, color: "#555" }}>
          Enter your email to receive a one-time link (OTP) — or sign in with Google.
        </p>

        <form onSubmit={handleEmailSignIn} style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <button style={styles.primaryBtn} disabled={loading}>
            {loading ? "Sending..." : "Send login link / OTP"}
          </button>
        </form>

        <div style={{ textAlign: "center", margin: "12px 0" }}>— or —</div>

        <button onClick={handleGoogle} style={styles.googleBtn} disabled={loading}>
          Continue with Google
        </button>

        {message && <div style={{ marginTop: 12, color: "#b33" }}>{message}</div>}
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", padding: 24 },
  card: { width: 420, padding: 18, borderRadius: 8, border: "1px solid #eee", background: "#fff" },
  input: { padding: 10, borderRadius: 6, border: "1px solid #ddd", width: "100%" },
  primaryBtn: { marginTop: 6, padding: "10px 12px", borderRadius: 6, background: "#2b8aef", color: "#fff", border: "none", cursor: "pointer" },
  googleBtn: { padding: "10px 12px", borderRadius: 6, background: "#fff", border: "1px solid #ddd", cursor: "pointer" },
};
