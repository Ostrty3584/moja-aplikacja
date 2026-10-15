import type { Quote, QuoteStatus, QuoteType } from "../types/Quote";

type QuoteOfferProps = {
  quote: Quote;
  getRenovationLabel: (type: QuoteType) => string;
  getStatusLabel: (status: QuoteStatus) => string;
  formatDate: (date: string) => string;
  onPrint: () => void;
  onBack: () => void;
};

export default function QuoteOffer({
  quote,
  getRenovationLabel,
  getStatusLabel,
  formatDate,
  onPrint,
  onBack,
}: QuoteOfferProps) {
  return (
    <section className="offer">
      <header className="offer-header">
        <div>
          <span className="offer-brand-mark">PR /</span>
          <h1>PROREMONT</h1>
          <p>Remont zaplanowany z dobrym wyczuciem.</p>
        </div>
        <div className="offer-number">
          <strong>OFERTA</strong>
          <p>Nr #{quote.id}</p>
          <p>{formatDate(quote.created_at)}</p>
          <p>Status: {getStatusLabel(quote.status)}</p>
        </div>
      </header>

      <div className="offer-section">
        <h3>Dane klienta</h3>
        <div className="offer-grid">
          <div><span>Klient</span><strong>{quote.name || "Brak danych"}</strong></div>
          <div><span>E-mail</span><strong>{quote.email || "Brak danych"}</strong></div>
          <div><span>Telefon</span><strong>{quote.phone || "Brak danych"}</strong></div>
        </div>
      </div>

      <div className="offer-section">
        <h3>Zakres remontu</h3>
        <div className="offer-grid">
          <div><span>Powierzchnia</span><strong>{quote.area} m²</strong></div>
          <div><span>Liczba pomieszczeń</span><strong>{quote.rooms}</strong></div>
          <div><span>Rodzaj remontu</span><strong>{getRenovationLabel(quote.type)}</strong></div>
          <div><span>Wywóz gruzu</span><strong>{quote.debrisRemoval ? "Tak" : "Nie"}</strong></div>
        </div>
      </div>

      <div className="offer-price">
        <div>
          <span>Łączna wartość oferty</span>
          <strong>{quote.price.toLocaleString("pl-PL")} zł</strong>
        </div>
        <p>Oferta ma charakter orientacyjny. Ostateczna cena może ulec zmianie po dokładnych oględzinach miejsca remontu.</p>
      </div>

      <footer className="offer-footer">
        <p>Dziękujemy za zainteresowanie ofertą PROREMONT.</p>
        <p>Oferta ważna 14 dni od daty wystawienia.</p>
      </footer>

      <div className="cta-row offer-actions">
        <button type="button" className="button-accent" onClick={onPrint}>Drukuj / Zapisz jako PDF</button>
        <button type="button" className="button-secondary" onClick={onBack}>Wróć do szczegółów</button>
      </div>
    </section>
  );
}