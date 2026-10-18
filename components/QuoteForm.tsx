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
      < CRMDashboard quotes={quotes}/>
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
    </div>
  );
}
