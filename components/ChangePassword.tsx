
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ChangePassword() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | null>(
    null
  );
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function closeDialog() {
    if (loading) return;

    setIsOpen(false);
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setMessageType(null);
  }

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setMessageType(null);

    if (password.length < 12) {
      setMessage("Hasło musi mieć minimum 12 znaków.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Hasła nie są identyczne.");
      setMessageType("error");
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
      setMessageType("success");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas zmiany hasła."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="button-secondary"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        Zmień hasło
      </button>

      <dialog
        ref={dialogRef}
        className="password-dialog"
        aria-labelledby="password-dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
      >
        <div className="password-dialog-heading">
          <div>
            <span className="eyebrow">Bezpieczeństwo konta</span>
            <h2 id="password-dialog-title">Zmień hasło</h2>
          </div>
          <button
            className="password-dialog-close"
            type="button"
            onClick={closeDialog}
            disabled={loading}
            aria-label="Zamknij okno zmiany hasła"
          >
            ×
          </button>
        </div>

        <p className="password-dialog-description">
          Ustaw nowe, bezpieczne hasło do swojego konta ProRemont.
        </p>

        <form className="password-form" onSubmit={handleChangePassword}>
          <div className="password-field">
            <label htmlFor="new-password">Nowe hasło</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={12}
              required
            />
            <small>Hasło musi mieć co najmniej 12 znaków.</small>
          </div>

          <div className="password-field">
            <label htmlFor="confirm-password">
              Powtórz nowe hasło
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={12}
              required
            />
          </div>

          <button
            className="password-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Zmienianie..." : "Zapisz nowe hasło"}
          </button>

          {message && (
            <p
              className={`password-message password-message-${messageType}`}
              role={messageType === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </form>
      </dialog>
    </>
  );
}
