
"use client";

import { useState } from "react";
import type { Quote, QuoteStatus, QuoteType } from "../types/Quote";

type Props = {
  quotes: Quote[];
};

type Period = "30d" | "3m" | "6m" | "12m";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(value);

const statusLabels: Record<QuoteStatus, string> = {
  new: "Nowe",
  sent: "Wysłane",
  accepted: "Zaakceptowane",
  rejected: "Odrzucone",
};

const renovationLabels: Record<QuoteType, string> = {
  refresh: "Odświeżenie",
  standard: "Standard",
  complete: "Kompleksowy",
};

const periodLabels: Record<Period, string> = {
  "30d": "Ostatnie 30 dni",
  "3m": "Ostatnie 3 miesiące",
  "6m": "Ostatnie 6 miesięcy",
  "12m": "Ostatnie 12 miesięcy",
};

function getStartDate(period: Period, now: Date): Date {
  if (period === "30d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start;
  }

  const months = Number(period.replace("m", ""));
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  return start;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function CRMDashboard({ quotes }: Props) {
  const [period, setPeriod] = useState<Period>("6m");

  const now = new Date();
  const startDate = getStartDate(period, now);

  // Wybieramy wyceny z określonego przedziału dat.
  const filteredQuotes = quotes.filter((quote) => {
    const created = new Date(quote.created_at);

    return (
      !Number.isNaN(created.getTime()) &&
      created >= startDate &&
      created <= now
    );
  });

  // Statystyki główne.
  const total = filteredQuotes.length;

  const acceptedCount = filteredQuotes.filter(
    (quote) => quote.status === "accepted"
  ).length;

  const pendingCount = filteredQuotes.filter(
    (quote) =>
      quote.status === "new" || quote.status === "sent"
  ).length;

  const totalValue = filteredQuotes.reduce(
    (sum, quote) => sum + Number(quote.price || 0),
    0
  );

  const averageValue = total > 0 ? totalValue / total : 0;

  // Liczba wycen według statusu.
  const statusCounts: Record<QuoteStatus, number> = {
    new: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
  };

  // Liczba wycen według rodzaju remontu.
  const renovationCounts: Record<QuoteType, number> = {
    refresh: 0,
    standard: 0,
    complete: 0,
  };

  for (const quote of filteredQuotes) {
    if (quote.status in statusCounts) {
      statusCounts[quote.status] += 1;
    }

    if (quote.type in renovationCounts) {
      renovationCounts[quote.type] += 1;
    }
  }

  // Dla 30 dni wyświetlamy tygodnie.
  // Dla pozostałych okresów wyświetlamy miesiące.
  const isThirtyDays = period === "30d";

  const chartData = isThirtyDays
    ? Array.from({ length: 5 }, (_, index) => {
        const end = new Date(now);
        end.setDate(end.getDate() - (4 - index) * 7);

        const start = new Date(end);
        start.setDate(start.getDate() - 7);

        if (index === 0 && start < startDate) {
          start.setTime(startDate.getTime());
        }

        const weekQuotes = filteredQuotes.filter((quote) => {
          const created = new Date(quote.created_at);
          return created >= start && created <= end;
        });

        return {
          key: `week-${index}`,
          label: `T${index + 1}`,
          value: weekQuotes.reduce(
            (sum, quote) => sum + Number(quote.price || 0),
            0
          ),
          acceptedValue: weekQuotes
            .filter((quote) => quote.status === "accepted")
            .reduce(
              (sum, quote) => sum + Number(quote.price || 0),
              0
            ),
          count: weekQuotes.length,
          tooltip: `${start.toLocaleDateString("pl-PL")} – ${end.toLocaleDateString("pl-PL")}`,
        };
      })
    : Array.from(
        { length: Number(period.replace("m", "")) },
        (_, index) => {
          const months = Number(period.replace("m", ""));

          const date = new Date(
            now.getFullYear(),
            now.getMonth() - (months - 1 - index),
            1
          );

          const key = getMonthKey(date);

          const monthQuotes = filteredQuotes.filter((quote) => {
            const created = new Date(quote.created_at);
            return getMonthKey(created) === key;
          });

          return {
            key,
            label: new Intl.DateTimeFormat("pl-PL", {
              month: "short",
              year: "2-digit",
            }).format(date),
            value: monthQuotes.reduce(
              (sum, quote) => sum + Number(quote.price || 0),
              0
            ),
            acceptedValue: monthQuotes
              .filter((quote) => quote.status === "accepted")
              .reduce(
                (sum, quote) => sum + Number(quote.price || 0),
                0
              ),
            count: monthQuotes.length,
            tooltip: date.toLocaleDateString("pl-PL", {
              month: "long",
              year: "numeric",
            }),
          };
        }
      );

  const maxValue = Math.max(
    ...chartData.map((item) => item.value),
    1
  );

  // Porównanie bieżącego miesiąca z poprzednim.
  const currentMonthKey = getMonthKey(now);

  const previousMonthDate = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const previousMonthKey = getMonthKey(previousMonthDate);

  const currentMonthQuotes = quotes.filter((quote) => {
    const created = new Date(quote.created_at);
    return (
      !Number.isNaN(created.getTime()) &&
      getMonthKey(created) === currentMonthKey
    );
  });

  const previousMonthQuotes = quotes.filter((quote) => {
    const created = new Date(quote.created_at);
    return (
      !Number.isNaN(created.getTime()) &&
      getMonthKey(created) === previousMonthKey
    );
  });

  const currentCount = currentMonthQuotes.length;
  const previousCount = previousMonthQuotes.length;
  const countDifference = currentCount - previousCount;

  const currentAcceptedValue = currentMonthQuotes
    .filter((quote) => quote.status === "accepted")
    .reduce(
      (sum, quote) => sum + Number(quote.price || 0),
      0
    );

  const metrics = [
    {
      label: "Łączna wartość",
      value: formatCurrency(totalValue),
      description: `${total} wycen w wybranym okresie`,
    },
    {
      label: "Średnia wycena",
      value: formatCurrency(averageValue),
      description: "Średnia wartość jednej oferty",
    },
    {
      label: "Zaakceptowane",
      value: String(acceptedCount),
      description: `${Math.round(
        (acceptedCount / Math.max(total, 1)) * 100
      )}% wycen w okresie`,
    },
    {
      label: "Do działania",
      value: String(pendingCount),
      description: "Nowe i wysłane oferty",
    },
  ];

  const statuses = (
    Object.keys(statusLabels) as QuoteStatus[]
  ).map((status) => ({
    label: statusLabels[status],
    count: statusCounts[status],
  }));

  const renovationTypes = (
    Object.keys(renovationLabels) as QuoteType[]
  ).map((type) => ({
    label: renovationLabels[type],
    count: renovationCounts[type],
  }));

  return (
    <section
      className="detail-panel"
      style={{ marginBottom: 24 }}
    >
      <h2>Panel wyników ProRemont</h2>

      <p>
        Podsumowanie wycen zapisanych na Twoim koncie.
      </p>

      {/* WYBÓR OKRESU */}
      <div
        className="detail-block"
        style={{
          padding: 16,
          marginTop: 20,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <label
          htmlFor="crm-period"
          style={{ fontWeight: 600 }}
        >
          Okres statystyk
        </label>

        <select
          id="crm-period"
          value={period}
          onChange={(event) =>
            setPeriod(event.target.value as Period)
          }
          style={{
            padding: "11px 14px",
            borderRadius: 10,
            border: "1px solid rgba(128,128,128,.4)",
            background: "var(--background, #202020)",
            color: "inherit",
            fontSize: 14,
            minWidth: 200,
            cursor: "pointer",
          }}
        >
          {(
            Object.keys(periodLabels) as Period[]
          ).map((option) => (
            <option key={option} value={option}>
              {periodLabels[option]}
            </option>
          ))}
        </select>
      </div>

      {/* KAFELKI STATYSTYK */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginTop: 20,
        }}
      >
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="detail-block"
            style={{
              padding: 18,
              minWidth: 0,
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                opacity: 0.75,
              }}
            >
              {metric.label}
            </p>

            <strong
              style={{
                fontSize:
                  "clamp(1.15rem, 2.5vw, 1.65rem)",
                overflowWrap: "anywhere",
              }}
            >
              {metric.value}
            </strong>

            <p
              style={{
                margin: "10px 0 0",
                fontSize: 13,
                opacity: 0.7,
              }}
            >
              {metric.description}
            </p>
          </article>
        ))}
      </div>

      {/* STATUSY I RODZAJE REMONTÓW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginTop: 22,
        }}
      >
        <div>
          <h3>Statusy wycen</h3>

          {statuses.map((item) => (
            <div
              key={item.label}
              style={{ marginBottom: 14 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>

              <div
                style={{
                  height: 8,
                  borderRadius: 8,
                  background:
                    "rgba(128,128,128,.22)",
                  marginTop: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${
                      total
                        ? (item.count / total) * 100
                        : 0
                    }%`,
                    height: "100%",
                    background: "#d7a858",
                    borderRadius: 8,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3>Rodzaje remontów</h3>

          {renovationTypes.map((item) => (
            <div
              key={item.label}
              style={{ marginBottom: 14 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>

              <div
                style={{
                  height: 8,
                  borderRadius: 8,
                  background:
                    "rgba(128,128,128,.22)",
                  marginTop: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${
                      total
                        ? (item.count / total) * 100
                        : 0
                    }%`,
                    height: "100%",
                    background: "#73a8d8",
                    borderRadius: 8,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WYKRES */}
      <div style={{ marginTop: 26 }}>
        <h3>
          Wartość wycen — {periodLabels[period].toLowerCase()}
        </h3>

        <p
          style={{
            opacity: 0.75,
            fontSize: 13,
          }}
        >
          Wartość ofert według daty utworzenia.
          Zielona część słupka oznacza oferty
          obecnie zaakceptowane.
        </p>

        <div
          style={{
            overflowX: "auto",
            marginTop: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${chartData.length}, minmax(65px, 1fr))`,
              alignItems: "end",
              gap: 8,
              minHeight: 230,
              minWidth:
                chartData.length > 6
                  ? chartData.length * 72
                  : 0,
            }}
          >
            {chartData.map((item) => (
              <div
                key={item.key}
                style={{
                  minWidth: 0,
                  textAlign: "center",
                }}
                title={`${item.tooltip}: ${formatCurrency(
                  item.value
                )}, zaakceptowane: ${formatCurrency(
                  item.acceptedValue
                )}, wyceny: ${item.count}`}
              >
                <div
                  style={{
                    fontSize: 11,
                    marginBottom: 7,
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.value
                    ? formatCurrency(item.value)
                    : "0 zł"}
                </div>

                <div
                  style={{
                    height: 165,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    borderBottom:
                      "1px solid rgba(128,128,128,.35)",
                  }}
                >
                  <div
                    style={{
                      height: `${
                        (item.value / maxValue) * 100
                      }%`,
                      minHeight:
                        item.value > 0 ? 3 : 0,
                      background: "#d7a858",
                      borderRadius:
                        "5px 5px 0 0",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: `${
                          item.value
                            ? (item.acceptedValue /
                                item.value) *
                              100
                            : 0
                        }%`,
                        background: "#518b79",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.7,
                  }}
                >
                  {item.count} wycen
                </div>
              </div>
            ))}
          </div>
        </div>

        {isThirtyDays && (
          <p
            style={{
              fontSize: 12,
              opacity: 0.7,
              marginTop: 8,
            }}
          >
            T1–T5 oznaczają kolejne przedziały
            tygodniowe. Najedź na słupek,
            aby zobaczyć dokładne daty.
          </p>
        )}

        <p
          style={{
            fontSize: 13,
            marginTop: 14,
          }}
        >
          Nowe wyceny w bieżącym miesiącu:{" "}
          <strong>{currentCount}</strong>.
          {" "}W poprzednim:{" "}
          <strong>{previousCount}</strong>.
          {" "}Zmiana:{" "}
          <strong>
            {countDifference > 0 ? "+" : ""}
            {countDifference}
          </strong>.
        </p>

        <p style={{ fontSize: 13 }}>
          Wartość zaakceptowanych ofert
          utworzonych w bieżącym miesiącu:{" "}
          <strong>
            {formatCurrency(currentAcceptedValue)}
          </strong>.
        </p>
      </div>

      {total === 0 && (
        <p>
          Brak wycen w wybranym okresie.
          Wybierz dłuższy okres lub dodaj
          nową wycenę.
        </p>
      )}

      <p
        style={{
          fontSize: 12,
          opacity: 0.65,
          marginTop: 14,
        }}
      >
        Wartości ofert nie są przychodem ani
        zyskiem firmy. Status zaakceptowania
        jest liczony według aktualnego stanu
        oferty, a nie daty jej akceptacji.
      </p>
    </section>
  );
}
