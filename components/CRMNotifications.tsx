"use client";

import { useState } from "react";
import type { Quote } from "../types/Quote";

type Props = {
  quotes: Quote[];
  onSelect: (quote: Quote) => void;
};

// YYYY-MM-DD w lokalnej strefie czasowej użytkownika.
function localToday(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CRMNotifications({ quotes, onSelect }: Props) {
  const [expanded, setExpanded] = useState(true);
  const today = localToday();

  // Daty zapisane jako YYYY-MM-DD można porównywać tekstowo.
  const scheduled = quotes.filter((quote) => Boolean(quote.nextContact));
  const overdue = scheduled
    .filter((quote) => quote.nextContact! < today)
    .sort((a, b) => a.nextContact!.localeCompare(b.nextContact!));
  const dueToday = scheduled.filter((quote) => quote.nextContact === today);
  const upcoming = scheduled
    .filter((quote) => quote.nextContact! > today)
    .sort((a, b) => a.nextContact!.localeCompare(b.nextContact!));

  function openQuote(quote: Quote) {
    onSelect(quote);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderGroup(title: string, items: Quote[]) {
    if (items.length === 0) return null;
    return (
      <div style={{ marginTop: 16 }}>
        <h4 style={{ marginBottom: 8 }}>{title} ({items.length})</h4>
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((quote) => (
            <button
              key={quote.id}
              type="button"
              className="button-secondary"
              onClick={() => openQuote(quote)}
              style={{ textAlign: "left", display: "flex", justifyContent: "space-between", gap: 12 }}
            >
              <span>{quote.name || `Wycena #${quote.id}`}</span>
              <span>{quote.nextContact}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="detail-block" style={{ marginBottom: 24 }} aria-label="Powiadomienia CRM">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <span className="eyebrow">Dzień 55 — CRM</span>
          <h2>Centrum powiadomień</h2>
        </div>
        <button type="button" className="button-secondary" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Zwiń" : "Rozwiń"}
        </button>
      </div>

      <p style={{ marginTop: 12 }}>
        Zaległe: <strong>{overdue.length}</strong> · Dzisiaj: <strong>{dueToday.length}</strong> · Nadchodzące: <strong>{upcoming.length}</strong>
      </p>

      {expanded && (
        <div>
          {scheduled.length === 0 ? (
            <p style={{ marginTop: 12 }}>Nie masz obecnie zaplanowanych kontaktów.</p>
          ) : (
            <>
              {renderGroup("Zaległe kontakty", overdue)}
              {renderGroup("Kontakty na dzisiaj", dueToday)}
              {renderGroup("Nadchodzące kontakty", upcoming)}
            </>
          )}
        </div>
      )}
    </section>
  );
}