
"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    if (password.length < 12) {
      setMessage("Hasło musi mieć minimum 12 znaków.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Hasła nie są identyczne.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Nie udało się potwierdzić zmiany hasła.");
      }

      setPassword("");
      setConfirmPassword("");
      setMessage("Hasło zostało zmienione.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas zmiany hasła."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        padding: 24,
        border: "1px solid #777",
        borderRadius: 14,
        margin: "24px 0",
      }}
    >
      <h2>Bezpieczeństwo konta</h2>
      <p>Zmień hasło do swojego konta ProRemont.</p>

      <form onSubmit={handleChangePassword}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="new-password">Nowe hasło</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            minLength={12}
            required
            style={{
              display: "block",
              padding: 10,
              width: "100%",
              maxWidth: 400,
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="confirm-password">
            Powtórz nowe hasło
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            minLength={12}
            required
            style={{
              display: "block",
              padding: 10,
              width: "100%",
              maxWidth: 400,
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 20px",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Zmienianie..." : "Zmień hasło"}
        </button>

        {message && (
          <p role="status" aria-live="polite">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
