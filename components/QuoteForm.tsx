"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Quote, QuoteStatus, QuoteType } from "../types/Quote";
import { supabase } from "../lib/supabase";
import CRMNotifications from "./CRMNotifications";
import QuoteHistory, { type SortOption, type StatusFilter } from "./QuoteHistory";
import QuoteCalculator from "./QuoteCalculator";
import QuoteDetails from "./QuoteDetails";
import QuoteOffer from "./QuoteOffer";
import CRMDashboard from "./CRMDashboard";
import ChangePassword from "./ChangePassword";

const BrowserContactAlerts = dynamic(
  () => import("./BrowserContactAlerts"),
  {
    ssr: false,
    loading: () => <p>Ładowanie powiadomień...</p>,
  }
);

type QuoteRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  area: number | string;
  rooms: number | string;
  type: string;
  price: number;
  debris_removal?: boolean | null;
  created_at: string;
  status: string;
  notes?: string | null;
  next_contact?: string | null;
  last_contact_at?: string | null;
};

const priceByType: Record<QuoteType, number> = {
  refresh: 800,
  standard: 1500,
  complete: 2500,
};

type BackupQuote = Omit<Quote, "id">;

function mapQuote(row: QuoteRow): Quote {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    area: Number(row.area),
    rooms: Number(row.rooms),
    type: row.type as QuoteType,
    price: Number(row.price),
    debrisRemoval: Boolean(row.debris_removal),
    created_at: row.created_at,
    status: row.status as QuoteStatus,
    notes: row.notes ?? null,
    nextContact: row.next_contact ?? null,
    lastContactAt: row.last_contact_at ?? null,
  };
}

export default function QuoteForm() {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [debrisRemoval, setDebrisRemoval] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [renovationType, setRenovationType] = useState<QuoteType>("standard");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showOffer, setShowOffer] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [nextContact, setNextContact] = useState("");
  const [contactHistoryVersion, setContactHistoryVersion] = useState(0);
  const [completingContact, setCompletingContact] = useState(false);

  const pricePerMeter = priceByType[renovationType];
  const today = new Date().toLocaleDateString("en-CA");

  const getRenovationLabel = (type: QuoteType) => {
    switch (type) {
      case "refresh":
        return "Odświeżenie";
      case "complete":
        return "Remont kompleksowy";
      default:
        return "Remont standardowy";
    }
  };

  const getStatusLabel = (status: QuoteStatus) => {
    switch (status) {
      case "new":
        return "Nowa";
      case "sent":
        return "Wysłana";
      case "accepted":
        return "Zaakceptowana";
      case "rejected":
        return "Odrzucona";
      default:
        return status;
    }
  };

  const formatDate = (value: string) => {
    if (!value) return "—";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parsed);
  };

  function clearForm() {
    setName("");
    setArea("");
    setRooms("");
    setEmail("");
    setPhone("");
    setDebrisRemoval(false);
    setRenovationType("standard");
    setEditingId(null);
    setResult(null);
  }

  async function loadQuotes() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError && userError.name !== "AuthSessionMissingError") {
        console.error("Błąd pobierania użytkownika:", userError);
      }

      if (!userData.user) {
        setQuotes([]);
        return;
      }

      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Błąd pobierania wycen:", error);
        return;
      }

      setQuotes((data ?? []).map((quote) => mapQuote(quote as QuoteRow)));
    } catch (error) {
      console.error("Błąd ładowania wycen:", error);
      setQuotes([]);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuotes();
    }, 0);

    const { data: subscriptionData } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadQuotes();
      } else {
        setQuotes([]);
        setResult(null);
        setEditingId(null);
        setStatusFilter("all");
        setSearchTerm("");
        setSortOption("newest");
        setSelectedQuote(null);
        setShowOffer(false);
        setNoteText("");
        setNextContact("");
        setContactHistoryVersion(0);
        clearForm();
      }
    });

    return () => {
      window.clearTimeout(timer);
      subscriptionData.subscription.unsubscribe();
    };
  }, []);

  async function handleCalculate() {
    const parsedArea = Number(area);
    const parsedRooms = Number(rooms);

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !Number.isFinite(parsedArea) ||
      parsedArea <= 0 ||
      !Number.isFinite(parsedRooms) ||
      parsedRooms <= 0
    ) {
      return;
    }

    const price = Math.round(parsedArea * pricePerMeter + (debrisRemoval ? 2_000 : 0));
    setResult(price);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      area: parsedArea,
      rooms: parsedRooms,
      type: renovationType,
      price,
      debris_removal: debrisRemoval,
      status: "new",
      notes: selectedQuote?.notes ?? null,
      next_contact: selectedQuote?.nextContact ?? null,
      last_contact_at: selectedQuote?.lastContactAt ?? null,
    };

    try {
      if (editingId !== null) {
        const { error } = await supabase.from("quotes").update(payload).eq("id", editingId);
        if (error) throw error;

        const { data } = await supabase.from("quotes").select("*").eq("id", editingId).single();
        if (data) {
          const updatedQuote = mapQuote(data as QuoteRow);
          setQuotes((current) =>
            current.map((quote) => (quote.id === updatedQuote.id ? updatedQuote : quote))
          );
          setSelectedQuote(updatedQuote);
        }
      } else {
        const { data, error } = await supabase.from("quotes").insert(payload).select().single();
        if (error) throw error;

        const createdQuote = mapQuote(data as QuoteRow);
        setQuotes((current) => [createdQuote, ...current]);
        setSelectedQuote(createdQuote);
      }

      clearForm();
      setShowOffer(false);
    } catch (error) {
      console.error("Błąd zapisu wyceny:", error);
    }
  }

  async function handleStatusChange(id: number, status: QuoteStatus) {
    try {
      const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
      if (error) throw error;

      setQuotes((current) =>
        current.map((quote) => (quote.id === id ? { ...quote, status } : quote))
      );

      setSelectedQuote((current) =>
        current && current.id === id ? { ...current, status } : current
      );
    } catch (error) {
      console.error("Błąd aktualizacji statusu:", error);
    }
  }

  async function handleImportBackup(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      window.alert("Wybierz plik JSON.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert("Plik jest za duży. Limit: 5 MB.");
      return;
    }

    try {
      const content = await file.text();
      const backup: unknown = JSON.parse(content);

    if (
      !backup ||
      typeof backup !== "object" ||
      Array.isArray(backup) ||
      !("application" in backup) ||
      backup.application !== "ProREmont" ||
      !("version" in backup) ||
      backup.version !== 1 ||
      !("quotes" in backup) ||
      !Array.isArray(backup.quotes)
    ) {
      throw  new Error("Nieprawidłowy format  kopii ProRemont.");
    }
    const rawQuotes: unknown[] = backup.quotes;

    if (rawQuotes.length > 500) {
      throw new Error("Limit importu: 500 wycen.");
    }

    const isQuoteType = (value: unknown): value is QuoteType =>
      value === "refresh" || value === "standard" || value === "complete";
    const isQuoteStatus = (value: unknown): value is QuoteStatus =>
      value === "new" ||
      value === "sent" ||
      value === "accepted" ||
      value === "rejected";

    const isDate = (value: unknown): value is string =>
      typeof value === "string" &&
      value.trim() !== "" &&
      !Number.isNaN(Date.parse(value));

    const isOptionalDate = (value: unknown) =>
      value == null || isDate(value);

    const isOptionalText = (value: unknown) =>
      value == null || typeof value === "string";

    const importedQuotes: BackupQuote[] = rawQuotes.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new Error(`Nieprawidłowa wycena nr ${index + 1}.`);
      }

      const q = item as Record<string, unknown>;

      if (
        typeof q.name !== "string" ||
        !q.name.trim() ||
        typeof q.email !== "string" ||
        !q.email.trim() ||
        typeof q.phone !== "string" ||
        !q.phone.trim() ||
        typeof q.area !== "number" ||
        !Number.isFinite(q.area) ||
        q.area <= 0 ||
        typeof q.rooms !== "number" ||
        !Number.isFinite(q.rooms) ||
        q.rooms <= 0 ||
        typeof q.price !== "number" ||
        !Number.isFinite(q.price) ||
        q.price < 0 ||
        !isQuoteType(q.type) ||
        !isQuoteStatus(q.status) ||
        typeof q.debrisRemoval !== "boolean" ||
        !isDate(q.created_at) ||
        !isOptionalText(q.notes) ||
        !isOptionalDate(q.nextContact) ||
        !isOptionalDate(q.lastContactAt)
      ) {
        throw new Error(
          `Wycena nr ${index + 1} ma nieprawidłowe dane.`
        );
      }

      return {
        name: q.name.trim(),
        email: q.email.trim(),
        phone: q.phone.trim(),
        area: q.area,
        rooms: q.rooms,
        type: q.type,
        price: q.price,
        debrisRemoval: q.debrisRemoval,
        created_at: q.created_at,
        status: q.status,
        notes: typeof q.notes === "string" ? q.notes : null,
        nextContact: typeof q.nextContact === "string" ? q.nextContact : null,
        lastContactAt:
          typeof q.lastContactAt === "string" ? q.lastContactAt : null,
      };
    });

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      throw new Error("Zaloguj się przed importem.");
    }

    // Sprawdzamy aktualne rekordy bezpośrednio w Supabase.
    const { data: existingRows, error: readError } =
      await supabase
        .from("quotes")
        .select("name,email,phone,price,created_at");

    if (readError) throw readError;

    // Porównujemy dane, nie ID, ponieważ baza nada nowe ID.
    const makeKey = (q: {
      name: string;
      email: string;
      phone: string;
      price: number;
      created_at: string;
    }) =>
      JSON.stringify([
        q.name.trim().toLowerCase(),
        q.email.trim().toLowerCase(),
        q.phone.trim(),
        Number(q.price),
        q.created_at,
      ]);

    const knownKeys = new Set(
      (existingRows ?? []).map(makeKey)
    );

    const newQuotes = importedQuotes.filter((quote) => {
      const key = makeKey(quote);

      if (knownKeys.has(key)) return false;

      knownKeys.add(key);
      return true;
    });

    if (newQuotes.length === 0) {
      window.alert(
        "Wszystkie wyceny z kopii już istnieją. Nic nie dodano."
      );
      return;
    }

    const confirmed = window.confirm(
      `Kopia zawiera ${importedQuotes.length} wycen.\n\n` +
      `Nowe wyceny: ${newQuotes.length}\n` +
      `Pominięte duplikaty: ${
        importedQuotes.length - newQuotes.length
      }\n\n` +
      "Czy chcesz dodać nowe wyceny do Supabase?"
    );

    if (!confirmed) return;

    const rows = newQuotes.map((quote) => ({
      user_id: authData.user.id,
      name: quote.name,
      email: quote.email,
      phone: quote.phone,
      area: quote.area,
      rooms: quote.rooms,
      type: quote.type,
      price: quote.price,
      debris_removal: quote.debrisRemoval,
      status: quote.status,
      notes: quote.notes ?? null,
      next_contact: quote.nextContact ?? null,
      last_contact_at: quote.lastContactAt ?? null,
      created_at: quote.created_at,
    }));

    const { error: insertError } = await supabase
      .from("quotes")
      .insert(rows);

    if (insertError) throw insertError;

    await loadQuotes();

    window.alert(
      `Import zakończony! Dodano ${newQuotes.length} wycen.`
    );
  } catch (error) {
    console.error("Błąd importu kopii:", error);

    window.alert(
      error instanceof Error
        ? error.message
        : "Nie udało się zaimportować kopii."
    );
  }
}

  async function handleDelete(id: number) {
    if (!window.confirm("Czy na pewno usunąć tę wycenę?")) {
      return;
    }

    try {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;

      setQuotes((current) => current.filter((quote) => quote.id !== id));
      if (selectedQuote && selectedQuote.id === id) {
        setSelectedQuote(null);
        setShowOffer(false);
      }
    } catch (error) {
      console.error("Błąd usuwania wyceny:", error);
    }
  }

  function handleSelect(quote: Quote) {
    setSelectedQuote(quote);
    setShowOffer(false);
    setNoteText(quote.notes ?? "");
    setNextContact(quote.nextContact ?? "");
  }

  function handleEdit(quote: Quote) {
    setSelectedQuote(quote);
    setEditingId(quote.id);
    setName(quote.name);
    setArea(String(quote.area));
    setRooms(String(quote.rooms));
    setEmail(quote.email);
    setPhone(quote.phone);
    setDebrisRemoval(quote.debrisRemoval);
    setRenovationType(quote.type);
    setResult(quote.price);
    setShowOffer(false);
    setNoteText(quote.notes ?? "");
    setNextContact(quote.nextContact ?? "");
  }

  async function handleSaveNote() {
    if (!selectedQuote) return;

    try {
      const { error } = await supabase
        .from("quotes")
        .update({ notes: noteText || null })
        .eq("id", selectedQuote.id);

      if (error) throw error;

      setQuotes((current) =>
        current.map((quote) =>
          quote.id === selectedQuote.id ? { ...quote, notes: noteText || null } : quote
        )
      );
      setSelectedQuote((current) =>
        current ? { ...current, notes: noteText || null } : current
      );
    } catch (error) {
      console.error("Błąd zapisu notatki:", error);
    }
  }

  async function handleSaveContact() {
    if (!selectedQuote) return;

    try {
      const { error } = await supabase
        .from("quotes")
        .update({ next_contact: nextContact || null })
        .eq("id", selectedQuote.id);

      if (error) throw error;

      setQuotes((current) =>
        current.map((quote) =>
          quote.id === selectedQuote.id ? { ...quote, nextContact: nextContact || null } : quote
        )
      );
      setSelectedQuote((current) =>
        current ? { ...current, nextContact: nextContact || null } : current
      );
    } catch (error) {
      console.error("Błąd zapisu terminu kontaktu:", error);
    }
  }

  async function handleCompleteContact() {
    if (!selectedQuote) return;

    setCompletingContact(true);
    const currentDate = new Date().toISOString();

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Musisz być zalogowany.");

      const { error: historyError } = await supabase.from("contact_history").insert({
        quote_id: selectedQuote.id,
        user_id: authData.user.id,
        note: "Kontakt wykonany",
        created_at: currentDate,
      });
      if (historyError) throw historyError;

      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ next_contact: null, last_contact_at: currentDate })
        .eq("id", selectedQuote.id);
      if (quoteError) throw quoteError;

      setQuotes((current) =>
        current.map((quote) =>
          quote.id === selectedQuote.id
            ? { ...quote, nextContact: null, lastContactAt: currentDate }
            : quote
        )
      );
      setSelectedQuote((current) =>
        current?.id === selectedQuote.id
          ? { ...current, nextContact: null, lastContactAt: currentDate }
          : current
      );
      setNextContact("");
      setContactHistoryVersion((version) => version + 1);
    } catch (error) {
      console.error("Błąd zapisywania wykonanego kontaktu:", error);
      window.alert("Nie udało się w pełni zapisać kontaktu. Sprawdź historię przed ponowną próbą.");
    } finally {
      setCompletingContact(false);
    }
  }

  return (
    <div className="quote-form-shell">
      <ChangePassword />
      <CRMDashboard quotes={quotes} />
      <CRMNotifications quotes={quotes} onSelect={handleSelect} />
      <BrowserContactAlerts quotes={quotes} />

      <QuoteCalculator
        name={name}
        area={area}
        rooms={rooms}
        email={email}
        phone={phone}
        debrisRemoval={debrisRemoval}
        renovationType={renovationType}
        pricePerMeter={pricePerMeter}
        result={result}
        editingId={editingId}
        onNameChange={setName}
        onAreaChange={setArea}
        onRoomsChange={setRooms}
        onEmailChange={setEmail}
        onPhoneChange={setPhone}
        onDebrisRemovalChange={setDebrisRemoval}
        onRenovationTypeChange={setRenovationType}
        onCalculate={handleCalculate}
        onCancel={clearForm}
      />

      {selectedQuote && !showOffer && (
        <QuoteDetails
          quote={selectedQuote}
          noteText={noteText}
          nextContact={nextContact}
          contactHistoryVersion={contactHistoryVersion}
          completingContact={completingContact}
          getRenovationLabel={getRenovationLabel}
          getStatusLabel={getStatusLabel}
          formatDate={formatDate}
          onBack={() => setSelectedQuote(null)}
          onNoteChange={setNoteText}
          onSaveNote={handleSaveNote}
          onContactChange={setNextContact}
          onSaveContact={handleSaveContact}
          onCompleteContact={handleCompleteContact}
          onStatusChange={(status) => handleStatusChange(selectedQuote.id, status)}
          onEdit={() => handleEdit(selectedQuote)}
          onGenerateOffer={() => setShowOffer(true)}
        />
      )}

      {selectedQuote && showOffer && (
        <QuoteOffer
          quote={selectedQuote}
          getRenovationLabel={getRenovationLabel}
          getStatusLabel={getStatusLabel}
          formatDate={formatDate}
          onPrint={() => window.print()}
          onBack={() => setShowOffer(false)}
        />
      )}

      <QuoteHistory
        quotes={quotes}
        today={today}
        statusFilter={statusFilter}
        searchTerm={searchTerm}
        sortOption={sortOption}
        getRenovationLabel={getRenovationLabel}
        getStatusLabel={getStatusLabel}
        formatDate={formatDate}
        onStatusFilterChange={setStatusFilter}
        onSearchChange={setSearchTerm}
        onSortChange={setSortOption}
        onSelect={handleSelect}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div style={{ margin: "20px 0" }}>
        <label className="backup-import-control">
          ↑ Importuj kopię zapasową JSON
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleImportBackup}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </div>
  );
}
