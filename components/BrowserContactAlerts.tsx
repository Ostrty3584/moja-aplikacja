"use client";

import { useEffect, useMemo, useState } from "react";
import type { Quote } from "../types/Quote";


type BrowserContactAlertsProps = {
  quotes: Quote[];
};

function localToday(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BrowserContactAlerts({ quotes }: BrowserContactAlertsProps) {
  const today = localToday();
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("proremont-contact-alerts") === "on";
  });
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    return Notification.permission;
  });
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const counts = useMemo(() => {
    const scheduled = quotes.filter((quote) => Boolean(quote.nextContact));
    const overdue = scheduled.filter((quote) => quote.nextContact! < today).length;
    const dueToday = scheduled.filter((quote) => quote.nextContact === today).length;
    const upcoming = scheduled.filter((quote) => quote.nextContact! > today).length;

    return { overdue, dueToday, upcoming };
  }, [quotes, today]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled || permission !== "granted") return;
    if (!("Notification" in window) || !window.isSecureContext) return;
    if (counts.overdue === 0 && counts.dueToday === 0) return;

    const key = `proremont-contact-alert-${today}`;
    if (window.sessionStorage.getItem(key) === "sent") return;

    try {
      const notification = new Notification("ProRemont — przypomnienie", {
        body: `Zaległe kontakty: ${counts.overdue}. Na dziś: ${counts.dueToday}.`,
        tag: "proremont-contacts",
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      window.sessionStorage.setItem(key, "sent");
    } catch (e) {
      console.error("Nie udało się wyświetlić powiadomienia:", e);
    }
  }, [counts, enabled, permission, today]);

  async function enableAlerts() {
    setError("");
    if (typeof window === "undefined" || !("Notification" in window) || !window.isSecureContext) {
      setError("Powiadomienia wymagają obsługiwanej przeglądarki oraz HTTPS lub localhost.");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setError("Brak zgody na powiadomienia. Możesz zmienić ją w ustawieniach przeglądarki.");
        return;
      }

      window.localStorage.setItem("proremont-contact-alerts", "on");
      setEnabled(true);
    } catch {
      setError("Nie udało się włączyć powiadomień.");
    }
  }

  function disableAlerts() {
    window.localStorage.setItem("proremont-contact-alerts", "off");
    setEnabled(false);
    setError("");
  }

  return (
    <section className="detail-block" style={{ marginBottom: 24 }} aria-label="Powiadomienia przeglądarkowe">
      <h3>Powiadomienia przeglądarkowe</h3>
      <p>
        Przypomnienia: {counts.overdue} zaległych, {counts.dueToday} na dziś, {counts.upcoming} w przyszłości.
      </p>
      <p style={{ fontSize: 13 }}>
        Powiadomienia działają, gdy aplikacja jest otwarta. Maksymalnie jedno przypomnienie dziennie w danej karcie.
      </p>

      {!mounted ? (
        <p>Sprawdzanie ustawień powiadomień...</p>
      ) : enabled && permission === "granted" ? (
        <button type="button" className="button-secondary" onClick={disableAlerts}>
          Wyłącz powiadomienia
        </button>
      ) : permission === "unsupported" ? (
        <p>Twoja przeglądarka nie obsługuje powiadomień przeglądarkowych.</p>
      ) : (
        <button type="button" className="button-accent" onClick={() => void enableAlerts()}>
          Włącz powiadomienia
        </button>
      )}

      {mounted && permission === "denied" && (
        <p>Przeglądarka blokuje powiadomienia. Zmień uprawnienia tej strony w ustawieniach przeglądarki.</p>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}