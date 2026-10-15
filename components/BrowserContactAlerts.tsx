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
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("proremont-contact-alerts") === "on";
  });
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return "unsupported";
    }
    return Notification.permission;
  });
  const [error, setError] = useState("");

  const today = localToday();

  useEffect(() => {
    const refresh = () => {
      const nextPermission = typeof Notification !== "undefined" ? Notification.permission : "unsupported";
      setPermission(nextPermission);
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const counts = useMemo(() => {
    const overdue = quotes.filter((quote) => quote.nextContact && quote.nextContact < today).length;
    const dueToday = quotes.filter((quote) => quote.nextContact === today).length;
    return { overdue, dueToday };
  }, [quotes, today]);

  useEffect(() => {
    if (!enabled || permission !== "granted") return;
    if (counts.overdue + counts.dueToday === 0) return;

    const key = `proremont-alert-${today}`;
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
    if (!("Notification" in window) || !window.isSecureContext) {
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
      <p>Przypomnienia: {counts.overdue} zaległych, {counts.dueToday} na dziś.</p>
      <p style={{ fontSize: 13 }}>
        Powiadomienia działają, gdy aplikacja jest otwarta. Maksymalnie jedno przypomnienie dziennie w danej karcie.
      </p>
      {enabled && permission === "granted" ? (
        <button type="button" className="button-secondary" onClick={disableAlerts}>Wyłącz powiadomienia</button>
      ) : (
        <button type="button" className="button-accent" onClick={() => void enableAlerts()}>Włącz powiadomienia</button>
      )}
      {permission === "denied" && (
        <p>Przeglądarka blokuje powiadomienia. Zmień uprawnienia tej strony w ustawieniach przeglądarki.</p>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}