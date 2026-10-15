import type { Quote, QuoteStatus, QuoteType } from "../types/Quote";

type Props = {
  quotes: Quote[];
};

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

export default function CRMDashboard({ quotes }: Props) {
  const total = quotes.length;
  const acceptedCount = quotes.filter((quote) => quote.status === "accepted").length;
  const pendingCount = quotes.filter((quote) => quote.status === "new" || quote.status === "sent").length;
  const totalValue = quotes.reduce((sum, quote) => sum + Number(quote.price || 0), 0);
  const averageValue = total > 0 ? totalValue / total : 0;

  const statusCounts: Record<QuoteStatus, number> = {
    new: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
  };

  const renovationCounts: Record<QuoteType, number> = {
    refresh: 0,
    standard: 0,
    complete: 0,
  };

  for (const quote of quotes) {
    statusCounts[quote.status] += 1;
    renovationCounts[quote.type] += 1;
  }

  const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("pl-PL", {
      month: "short",
      year: "2-digit",
    }).format(date);

    const monthQuotes = quotes.filter((quote) => {
      const created = new Date(quote.created_at);
      if (Number.isNaN(created.getTime())) return false;
      return `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}` === key;
    });

    const value = monthQuotes.reduce((sum, quote) => sum + Number(quote.price || 0), 0);
    const acceptedValue = monthQuotes
      .filter((quote) => quote.status === "accepted")
      .reduce((sum, quote) => sum + Number(quote.price || 0), 0);

    return {
      key,
      label,
      value,
      acceptedValue,
      count: monthQuotes.length,
    };
  });

  const maxValue = Math.max(...lastSixMonths.map((month) => month.value), 1);
  const currentCount = lastSixMonths[lastSixMonths.length - 1]?.count ?? 0;
  const previousCount = lastSixMonths[lastSixMonths.length - 2]?.count ?? 0;
  const countDifference = currentCount - previousCount;

  const metrics = [
    {
      label: "Łączna wartość",
      value: formatCurrency(totalValue),
      description: `${total} wycen zapisanych w systemie`,
    },
    {
      label: "Średnia wycena",
      value: formatCurrency(averageValue),
      description: "Średnia wartość jednej oferty",
    },
    {
      label: "Zaakceptowane",
      value: String(acceptedCount),
      description: `${Math.round((acceptedCount / Math.max(total, 1)) * 100)}% wszystkich wycen`,
    },
    {
      label: "Do działania",
      value: String(pendingCount),
      description: "Wystawione i oczekujące na reakcję",
    },
  ];

  const statuses = (Object.keys(statusLabels) as QuoteStatus[]).map((status) => ({
    label: statusLabels[status],
    count: statusCounts[status],
  }));

  const renovationTypes = (Object.keys(renovationLabels) as QuoteType[]).map((type) => ({
    label: renovationLabels[type],
    count: renovationCounts[type],
  }));

  return (
    <section className="detail-panel" style={{ marginBottom: 24 }}>
      <span className="eyebrow">Dzień 58 · Statystyki i analiza miesięczna</span>
      <h2>Panel wyników ProRemont</h2>
      <p>Podsumowanie wycen zapisanych na Twoim koncie.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginTop: 20,
        }}
      >
        {metrics.map((metric) => (
          <article key={metric.label} className="detail-block" style={{ padding: 18, minWidth: 0 }}>
            <p style={{ margin: "0 0 10px", opacity: 0.75 }}>{metric.label}</p>
            <strong
              style={{
                fontSize: "clamp(1.15rem, 2.5vw, 1.65rem)",
                overflowWrap: "anywhere",
              }}
            >
              {metric.value}
            </strong>
            <p style={{ margin: "10px 0 0", fontSize: 13, opacity: 0.7 }}>{metric.description}</p>
          </article>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginTop: 22,
        }}
      >
        <div>
          <h3>Statusy wycen</h3>
          {statuses.map((item) => (
            <div key={item.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 8,
                  background: "rgba(128,128,128,.22)",
                  marginTop: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${total ? (item.count / total) * 100 : 0}%`,
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
            <div key={item.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 8,
                  background: "rgba(128,128,128,.22)",
                  marginTop: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${total ? (item.count / total) * 100 : 0}%`,
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

      <div style={{ marginTop: 26 }}>
        <h3>Wartość wycen — ostatnie 6 miesięcy</h3>
        <p style={{ opacity: 0.75, fontSize: 13 }}>
          Wartość ofert według daty utworzenia. Ciemniejsza część słupka oznacza oferty obecnie
          zaakceptowane.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            alignItems: "end",
            gap: 8,
            minHeight: 230,
            marginTop: 14,
          }}
        >
          {lastSixMonths.map((month) => (
            <div
              key={month.key}
              style={{ minWidth: 0, textAlign: "center" }}
              title={`${month.label}: ${formatCurrency(month.value)}, zaakceptowane: ${formatCurrency(month.acceptedValue)}, wyceny: ${month.count}`}
            >
              <div style={{ fontSize: 11, marginBottom: 7, overflowWrap: "anywhere" }}>
                {month.value ? formatCurrency(month.value) : "0 zł"}
              </div>
              <div
                style={{
                  height: 165,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  borderBottom: "1px solid rgba(128,128,128,.35)",
                }}
              >
                <div
                  style={{
                    height: `${(month.value / maxValue) * 100}%`,
                    minHeight: month.value > 0 ? 3 : 0,
                    background: "#d7a858",
                    borderRadius: "5px 5px 0 0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: `${month.value ? (month.acceptedValue / month.value) * 100 : 0}%`,
                      background: "#518b79",
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 12, marginTop: 8 }}>{month.label}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{month.count} wycen</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, marginTop: 14 }}>
          Nowe wyceny w bieżącym miesiącu: <strong>{currentCount}</strong>. W poprzednim: <strong>{previousCount}</strong>.
          Zmiana: <strong>{countDifference > 0 ? "+" : ""}{countDifference}</strong>.
        </p>
        <p style={{ fontSize: 13 }}>
          Wartość zaakceptowanych ofert w bieżącym miesiącu utworzenia: <strong>{formatCurrency(lastSixMonths[lastSixMonths.length - 1]?.acceptedValue ?? 0)}</strong>.
        </p>
      </div>

      {total === 0 && <p>Dodaj pierwszą wycenę, aby zobaczyć statystyki.</p>}
      <p style={{ fontSize: 12, opacity: 0.65, marginTop: 14 }}>
        Wartości ofert nie są przychodem ani zyskiem firmy. Status zaakceptowania jest liczony według
        aktualnego stanu oferty, a nie daty jej akceptacji.
      </p>
    </section>
  );
}