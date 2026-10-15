import type { QuoteType } from "../types/Quote";

type QuoteCalculatorProps = {
  name: string;
  area: string;
  rooms: string;
  email: string;
  phone: string;
  debrisRemoval: boolean;
  renovationType: QuoteType;
  pricePerMeter: number;
  result: number | null;
  editingId: number | null;
  onNameChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onRoomsChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onDebrisRemovalChange: (value: boolean) => void;
  onRenovationTypeChange: (value: QuoteType) => void;
  onCalculate: () => void;
  onCancel: () => void;
};

export default function QuoteCalculator({
  name,
  area,
  rooms,
  email,
  phone,
  debrisRemoval,
  renovationType,
  pricePerMeter,
  result,
  editingId,
  onNameChange,
  onAreaChange,
  onRoomsChange,
  onEmailChange,
  onPhoneChange,
  onDebrisRemovalChange,
  onRenovationTypeChange,
  onCalculate,
  onCancel,
}: QuoteCalculatorProps) {
  return (
    <section className="calculator-panel quote-calculator" id="wycena">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Kalkulator kosztów</span>
          <h2>Porozmawiajmy o remoncie</h2>
        </div>
        <span className="step-mark">01 / 03</span>
      </div>

      {editingId !== null && (
        <p className="edit-notice">Edytujesz wycenę #{editingId}</p>
      )}

      <div className="quote-form-grid">
        <label className="field">
          <span>Imię i nazwisko</span>
          <input autoComplete="name" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Jan Kowalski" />
        </label>
        <label className="field">
          <span>Adres e-mail</span>
          <input type="email" autoComplete="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="jan@email.pl" />
        </label>
        <label className="field">
          <span>Numer telefonu</span>
          <input type="tel" autoComplete="tel" value={phone} onChange={(event) => onPhoneChange(event.target.value)} placeholder="000 000 000" />
        </label>
        <label className="field">
          <span>Powierzchnia</span>
          <span className="input-with-unit">
            <input type="number" min="1" value={area} onChange={(event) => onAreaChange(event.target.value)} placeholder="65" />
            <span>m²</span>
          </span>
        </label>
        <label className="field">
          <span>Liczba pomieszczeń</span>
          <input type="number" min="1" value={rooms} onChange={(event) => onRoomsChange(event.target.value)} placeholder="3" />
        </label>
        <label className="field">
          <span>Zakres prac</span>
          <select value={renovationType} onChange={(event) => onRenovationTypeChange(event.target.value as QuoteType)}>
            <option value="refresh">Odświeżenie</option>
            <option value="standard">Remont standardowy</option>
            <option value="complete">Remont kompleksowy</option>
          </select>
        </label>
      </div>

      <label className="check-field">
        <input type="checkbox" checked={debrisRemoval} onChange={(event) => onDebrisRemovalChange(event.target.checked)} />
        <span><strong>Wywóz gruzu</strong><small>Dodaj usługę do orientacyjnej wyceny: 2 000 zł</small></span>
      </label>

      <div className="quote-submit-row">
        <div className="quote-estimate" aria-live="polite">
          <span>Szacunkowa stawka</span>
          <strong>{pricePerMeter.toLocaleString("pl-PL")} <small>zł / m²</small></strong>
          {result !== null && <span className="estimate-result">Ostatnia wycena: {result.toLocaleString("pl-PL")} zł</span>}
        </div>
        <div className="cta-row">
          <button type="button" className="button-accent" onClick={onCalculate}>
            {editingId !== null ? "Zapisz zmiany" : "Oblicz wycenę"}
            <span aria-hidden="true">↗</span>
          </button>
          {editingId !== null && <button type="button" className="button-secondary" onClick={onCancel}>Anuluj</button>}
        </div>
      </div>
      <small className="quote-disclaimer">Wycena ma charakter orientacyjny i nie stanowi oferty handlowej.</small>
    </section>
  );
}