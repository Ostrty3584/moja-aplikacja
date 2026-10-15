import type { Quote, QuoteStatus, QuoteType } from "../types/Quote";

type QuoteDetailsProps = {
  quote: Quote;
  noteText: string;
  nextContact: string;
  getRenovationLabel: (type: QuoteType) => string;
  getStatusLabel: (status: QuoteStatus) => string;
  formatDate: (date: string) => string;
  onBack: () => void;
  onNoteChange: (value: string) => void;
  onSaveNote: () => void;
  onContactChange: (value: string) => void;
  onSaveContact: () => void;
  onStatusChange: (status: QuoteStatus) => void;
  onEdit: () => void;
  onGenerateOffer: () => void;
};

export default function QuoteDetails({
  quote,
  noteText,
  nextContact,
  getRenovationLabel,
  getStatusLabel,
  formatDate,
  onBack,
  onNoteChange,
  onSaveNote,
  onContactChange,
  onSaveContact,
  onStatusChange,
  onEdit,
  onGenerateOffer,
}: QuoteDetailsProps) {
  return (
    <section className="quote-details">
      <div className="section-heading detail-heading">
        <div>
          <button type="button" className="text-button" onClick={onBack}>← Wróć do wycen</button>
          <span className="eyebrow">Wycena #{quote.id}</span>
          <h2>{quote.name || "Szczegóły klienta"}</h2>
        </div>
        <span className={`status-pill status-${quote.status}`}>{getStatusLabel(quote.status)}</span>
      </div>

      <div className="detail-grid">
        <article className="detail-block">
          <span className="detail-index">01</span>
          <h3>Dane kontaktowe</h3>
          <dl>
            <div><dt>Adres e-mail</dt><dd>{quote.email || "Brak danych"}</dd></div>
            <div><dt>Telefon</dt><dd>{quote.phone || "Brak danych"}</dd></div>
            <div><dt>Utworzono</dt><dd>{formatDate(quote.created_at)}</dd></div>
          </dl>
        </article>
        <article className="detail-block">
          <span className="detail-index">02</span>
          <h3>Zakres remontu</h3>
          <dl>
            <div><dt>Powierzchnia</dt><dd>{quote.area} m²</dd></div>
            <div><dt>Pomieszczenia</dt><dd>{quote.rooms}</dd></div>
            <div><dt>Rodzaj prac</dt><dd>{getRenovationLabel(quote.type)}</dd></div>
            <div><dt>Wywóz gruzu</dt><dd>{quote.debrisRemoval ? "Uwzględniony" : "Nie"}</dd></div>
          </dl>
          <p className="detail-price">{quote.price.toLocaleString("pl-PL")} <span>zł</span></p>
        </article>
      </div>

      <div className="detail-actions-grid">
        <label className="field">
          <span>Notatka do wyceny</span>
          <textarea value={noteText} onChange={(event) => onNoteChange(event.target.value)} placeholder="Ustalenia z klientem, preferowany termin..." rows={4} />
        </label>
        <div className="detail-side-fields">
          <label className="field">
            <span>Następny kontakt</span>
            <input type="date" value={nextContact} onChange={(event) => onContactChange(event.target.value)} />
          </label>
          <label className="field">
            <span>Status wyceny</span>
            <select value={quote.status} onChange={(event) => onStatusChange(event.target.value as QuoteStatus)}>
              <option value="new">Nowa</option>
              <option value="sent">Wysłana</option>
              <option value="accepted">Zaakceptowana</option>
              <option value="rejected">Odrzucona</option>
            </select>
          </label>
          <button type="button" className="button-secondary" onClick={onSaveContact}>Zapisz termin kontaktu</button>
        </div>
      </div>

      <div className="cta-row detail-cta">
        <button type="button" className="button-accent" onClick={onSaveNote}>Zapisz notatkę</button>
        <button type="button" className="button-secondary" onClick={onEdit}>Edytuj wycenę</button>
        <button type="button" className="button-secondary" onClick={onGenerateOffer}>Przygotuj ofertę <span aria-hidden="true">↗</span></button>
      </div>
    </section>
  );
}