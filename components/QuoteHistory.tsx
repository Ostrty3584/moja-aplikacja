import type { Quote, QuoteStatus, QuoteType } from "../types/Quote";

export type StatusFilter = "all" | QuoteStatus;
export type SortOption = "newest" | "oldest" | "price-low" | "price-high";

type QuoteHistoryProps = {
  quotes: Quote[];
  today: string;
  statusFilter: StatusFilter;
  searchTerm: string;
  sortOption: SortOption;
  getRenovationLabel: (type: QuoteType) => string;
  getStatusLabel: (status: QuoteStatus) => string;
  formatDate: (date: string) => string;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: SortOption) => void;
  onSelect: (quote: Quote) => void;
  onStatusChange: (id: number, status: QuoteStatus) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: number) => void;
};

export default function QuoteHistory({
  quotes,
  today,
  statusFilter,
  searchTerm,
  sortOption,
  getRenovationLabel,
  getStatusLabel,
  formatDate,
  onStatusFilterChange,
  onSearchChange,
  onSortChange,
  onSelect,
  onStatusChange,
  onEdit,
  onDelete,
}: QuoteHistoryProps) {
  if (quotes.length === 0) return null;

  const acceptedQuotes = quotes.filter((quote) => quote.status === "accepted");
  const overdueContacts = quotes.filter((quote) => quote.nextContact !== null && quote.nextContact < today);
  const todayContacts = quotes.filter((quote) => quote.nextContact === today);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredQuotes = quotes.filter((quote) => {
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    const matchesSearch =
      normalizedSearch === "" ||
      quote.name.toLowerCase().includes(normalizedSearch) ||
      quote.email.toLowerCase().includes(normalizedSearch) ||
      quote.phone.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  const sortedQuotes = [...filteredQuotes].sort((first, second) => {
    if (sortOption === "oldest") {
      return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
    }
    if (sortOption === "price-low") return first.price - second.price;
    if (sortOption === "price-high") return second.price - first.price;
    return new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
  });

  function overdueDays(date: string) {
    const [year, month, day] = date.split("-").map(Number);
    const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);

    const contactTime = Date.UTC(year, month - 1, day);
    const todayTime = Date.UTC(todayYear, todayMonth - 1, todayDay);

    return Math.max(0, Math.round((todayTime - contactTime) / 86_400_000));
  }

  function clearFilters() {
      onSearchChange("");
      onStatusFilterChange("all");
      onSortChange("newest");
  }

  return (
    <section className="quote-history" aria-label="Historia wycen">
      <div className="section-heading history-heading">
        <div>
          <span className="eyebrow">Twoi klienci</span>
          <h2>Wyceny i kontakt</h2>
        </div>
        <span className="history-total">{quotes.length.toString().padStart(2, "0")} <small>łącznie</small></span>
      </div>

      <div className="metrics-grid">
        <div className="metric-item"><span>Nowe</span><strong>{quotes.filter((quote) => quote.status === "new").length}</strong></div>
        <div className="metric-item"><span>Wysłane</span><strong>{quotes.filter((quote) => quote.status === "sent").length}</strong></div>
        <div className="metric-item"><span>Zaakceptowane</span><strong>{acceptedQuotes.length}</strong></div>
        <div className="metric-item metric-highlight"><span>Wartość umów</span><strong>{acceptedQuotes.reduce((sum, quote) => sum + quote.price, 0).toLocaleString("pl-PL")} zł</strong></div>
      </div>

      {(overdueContacts.length > 0 || todayContacts.length > 0) && (
        <div className="contact-alerts">
          {overdueContacts.map((quote) => (
            <button type="button" className="contact-alert is-overdue" key={quote.id} onClick={() => onSelect(quote)}>
              <span className="alert-marker" aria-hidden="true">!</span>
              <span><strong>{quote.name}</strong><small>Kontakt spóźniony o {overdueDays(quote.nextContact!)} dni</small></span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
          {todayContacts.map((quote) => (
            <button type="button" className="contact-alert" key={quote.id} onClick={() => onSelect(quote)}>
              <span className="alert-marker" aria-hidden="true">•</span>
              <span><strong>{quote.name}</strong><small>Zaplanowany kontakt na dziś</small></span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      )}

      <div className="history-toolbar">
        <label className="field search-field">
          <span className="visually-hidden">Szukaj klienta</span>
          <input type="search" value={searchTerm} onChange={(event) => onSearchChange(event.target.value)} placeholder="Szukaj klienta, e-maila lub telefonu" />
        </label>
        <label className="field toolbar-filter">
          <span className="visually-hidden">Filtruj według statusu</span>
          <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}>
            <option value="all">Wszystkie statusy</option>
            <option value="new">Nowe</option>
            <option value="sent">Wysłane</option>
            <option value="accepted">Zaakceptowane</option>
            <option value="rejected">Odrzucone</option>
          </select>
        </label>
        <label className="field toolbar-filter">
          <span className="visually-hidden">Sortuj wyceny</span>
          <select value={sortOption} onChange={(event) => onSortChange(event.target.value as SortOption)}>
            <option value="newest">Najnowsze</option>
            <option value="oldest">Najstarsze</option>
            <option value="price-low">Cena: rosnąco</option>
            <option value="price-high">Cena: malejąco</option>
          </select>
        </label>
        <span className="result-count">{filteredQuotes.length} wyników</span>
      </div>

      {(searchTerm || statusFilter !=="all" || sortOption !== "newest") && (
        <button type="button" onClick={clearFilters}>Wyczyść filtry</button>
      )}

      {sortedQuotes.length === 0 ? (
        <p className="empty-state">Nie znaleziono wycen spełniających te kryteria.</p>
      ) : (
        <div className="quote-list">
          {sortedQuotes.map((quote) => (
            <article className="quote-row" key={quote.id}>
              <button type="button" className="quote-row-main" onClick={() => onSelect(quote)}>
                <span className="quote-avatar" aria-hidden="true">{quote.name.trim().charAt(0).toUpperCase() || "?"}</span>
                <span className="quote-client">
                  <strong>{quote.name || "Bez nazwy"}</strong>
                  <small>{quote.email} · {quote.phone}</small>
                </span>
              </button>
              <span className="quote-row-scope">{quote.area} m² <span>·</span> {getRenovationLabel(quote.type)}</span>
              <strong className="quote-row-price">{quote.price.toLocaleString("pl-PL")} zł</strong>
              <label className={`status-select status-${quote.status}`}>
                <span className="visually-hidden">Status: {getStatusLabel(quote.status)}</span>
                <select value={quote.status} onChange={(event) => onStatusChange(quote.id, event.target.value as QuoteStatus)}>
                  <option value="new">Nowa</option>
                  <option value="sent">Wysłana</option>
                  <option value="accepted">Zaakceptowana</option>
                  <option value="rejected">Odrzucona</option>
                </select>
              </label>
              <div className="quote-row-actions">
                <button type="button" className="icon-button" aria-label={`Edytuj wycenę ${quote.name}`} title="Edytuj" onClick={() => onEdit(quote)}>↗</button>
                <button type="button" className="icon-button danger-button" aria-label={`Usuń wycenę ${quote.name}`} title="Usuń" onClick={() => onDelete(quote.id)}>×</button>
              </div>
              <time className="quote-row-date" dateTime={quote.created_at}>{formatDate(quote.created_at)}</time>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}