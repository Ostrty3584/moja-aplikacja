"use client";

import { useEffect, useState } from "react";
import type { Quote, QuoteStatus, QuoteType } from "../types/Quote";
import { supabase } from "../lib/supabase";
import QuoteHistory, { type SortOption, type StatusFilter } from "./QuoteHistory";
import QuoteCalculator from "./QuoteCalculator";
import QuoteDetails from "./QuoteDetails";
import QuoteOffer from "./QuoteOffer";

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

  const pricePerMeter = { refresh: 800, standard: 1500, complete: 2500 }[renovationType];
  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
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

        const loadedQuotes: Quote[] = (data ?? []).map((quote) => ({
          id: quote.id,
          name: quote.name,
          email: quote.email,
          phone: quote.phone,
          area: quote.area,
          rooms: quote.rooms,
          type: quote.type as QuoteType,
          price: quote.price,
          debrisRemoval: quote.debris_removal,
          created_at: quote.created_at,
          status: quote.status as QuoteStatus,
          notes: quote.notes ?? null,
          nextContact: quote.next_contact ?? null,
        }));

        setQuotes(loadedQuotes);
      } catch (error) {
        console.error("Błąd ładowania wycen:", error);
        setQuotes([]);
      }
    }

    loadQuotes();

    const { data: subscriptionData } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadQuotes();
      } else {
        setQuotes([]);
        setResult(null);
        setEditingId(null);
        setStatusFilter("all");
        setSearchTerm("");
        setSortOption("newest");
        setSelectedQuote(null);
        setNoteText("");
        setNextContact("");
      }
    });

    return () => subscriptionData.subscription.unsubscribe();
  }, []);

  function clearForm() {
    setName("");
    setArea("");
    setRooms("");
    setEmail("");
    setPhone("");
    setDebrisRemoval(false);
    setRenovationType("standard");
    setEditingId(null);
    setNoteText("");
    setNextContact("");
  }

  async function calculateQuote() {
    const areaValue = Number(area);
    const roomsValue = Number(rooms);

    if (!email.includes("@")) {
      alert("Podaj poprawny adres e-mail.");
      return;
    }

    if (phone.trim().length < 9) {
      alert("Podaj poprawny numer telefonu.");
      return;
    }

    if (name.trim() === "" || areaValue <= 0 || roomsValue <= 0) {
      alert("Podaj imię, powierzchnię i liczbę pomieszczeń.");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Błąd sprawdzania użytkownika:", userError);
      alert("Nie udało się sprawdzić zalogowanego użytkownika.");
      return;
    }

    if (!userData.user) {
      alert("Musisz być zalogowany, aby zapisać wycenę.");
      return;
    }

    const total = areaValue * pricePerMeter + (debrisRemoval ? 2000 : 0);

    if (editingId !== null) {
      const { error } = await supabase
        .from("quotes")
        .update({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          area: areaValue,
          rooms: roomsValue,
          type: renovationType,
          price: total,
          debris_removal: debrisRemoval,
        })
        .eq("id", editingId)
        .eq("user_id", userData.user.id);

      if (error) {
        console.error("Błąd edycji wyceny:", error);
        alert("Nie udało się zapisać zmian.");
        return;
      }

      setQuotes((previous) =>
        previous.map((quote) =>
          quote.id === editingId
            ? { ...quote, name: name.trim(), email: email.trim(), phone: phone.trim(), area: areaValue, rooms: roomsValue, type: renovationType, price: total, debrisRemoval }
            : quote
        )
      );

      setResult(total);
      clearForm();
      return;
    }

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        area: areaValue,
        rooms: roomsValue,
        type: renovationType,
        price: total,
        debris_removal: debrisRemoval,
        user_id: userData.user.id,
        status: "new",
      })
      .select("id, created_at, status")
      .single();

    if (error) {
      console.error("Błąd zapisywania wyceny:", error);
      alert(`Nie udało się zapisać wyceny: ${error.message}`);
      return;
    }

    setQuotes((previous) => [
      { id: data.id, name: name.trim(), email: email.trim(), phone: phone.trim(), area: areaValue, rooms: roomsValue, type: renovationType, price: total, debrisRemoval, created_at: data.created_at, status: data.status as QuoteStatus, notes: null, nextContact: null },
      ...previous,
    ]);

    setResult(total);
    clearForm();
  }

  async function saveQuoteNote() {
    if (!selectedQuote) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      alert("Musisz być zalogowany.");
      return;
    }

    const savedNote = noteText.trim() || null;
    const { error } = await supabase
      .from("quotes")
      .update({ notes: savedNote })
      .eq("id", selectedQuote.id)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Błąd zapisywania notatki:", error);
      alert("Nie udało się zapisać notatki.");
      return;
    }

    setQuotes((previous) =>
      previous.map((quote) =>
        quote.id === selectedQuote.id ? { ...quote, notes: savedNote } : quote
      )
    );
    setSelectedQuote((previous) => (previous ? { ...previous, notes: savedNote } : previous));
    setNoteText(savedNote ?? "");
    alert("Notatka została zapisana");
  }

  async function saveNextContact() {
    if (!selectedQuote) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      alert("Musisz być zalogowany.");
      return;
    }

    const saveDate = nextContact || null;
    const { error } = await supabase
      .from("quotes")
      .update({ next_contact: saveDate })
      .eq("id", selectedQuote.id)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Błąd zapisywania terminu kontaktu:", error);
      alert("Nie udało się zapisać terminu.");
      return;
    }

    setQuotes((previous) =>
      previous.map((quote) =>
        quote.id === selectedQuote.id ? { ...quote, nextContact: saveDate } : quote
      )
    );
    setSelectedQuote((previous) => (previous ? { ...previous, nextContact: saveDate } : previous));
    setNextContact(saveDate ?? "");
    alert("Termin następnego kontaktu został zapisany.");
  }

  async function changeStatus(quoteId: number, newStatus: QuoteStatus) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      alert("Musisz być zalogowany.");
      return;
    }

    const { error } = await supabase
      .from("quotes")
      .update({ status: newStatus })
      .eq("id", quoteId)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Błąd zmiany statusu:", error);
      alert("Nie udało się zmienić statusu.");
      return;
    }

    setQuotes((previous) =>
      previous.map((quote) => (quote.id === quoteId ? { ...quote, status: newStatus } : quote))
    );

    setSelectedQuote((previous) =>
      previous?.id === quoteId ? { ...previous, status: newStatus } : previous
    );
  }

  async function deleteQuote(idToDelete: number) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      alert("Musisz być zalogowany.");
      return;
    }

    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", idToDelete)
      .eq("user_id", userData.user.id);

    if (error) {
      console.error("Błąd usuwania wyceny:", error);
      alert("Nie udało się usunąć wyceny z bazy.");
      return;
    }

    setQuotes((previous) => previous.filter((quote) => quote.id !== idToDelete));
    if (selectedQuote?.id === idToDelete) {
      setSelectedQuote(null);
      setNoteText("");
      setNextContact("");
    }
  }

  function editQuote(quote: Quote) {
    setSelectedQuote(null);
    setShowOffer(false);
    setEditingId(quote.id);
    setNoteText(quote.notes ?? "");
    setNextContact(quote.nextContact ?? "");
    setName(quote.name);
    setEmail(quote.email);
    setPhone(quote.phone);
    setArea(String(quote.area));
    setRooms(String(quote.rooms));
    setRenovationType(quote.type);
    setDebrisRemoval(quote.debrisRemoval);
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    clearForm();
    setResult(null);
  }

  function getRenovationLabel(type: QuoteType) {
    if (type === "refresh") return "Odświeżenie";
    if (type === "standard") return "Standardowy remont";
    if (type === "complete") return "Kompleksowy remont";
    return type;
  }

  function getStatusLabel(status: QuoteStatus) {
    if (status === "new") return "Nowa";
    if (status === "sent") return "Wysłana";
    if (status === "accepted") return "Zaakceptowana";
    if (status === "rejected") return "Odrzucona";
    return status;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function generateOffer() {
    if (!selectedQuote) return;
    if (selectedQuote.status === "new") {
      await changeStatus(selectedQuote.id, "sent");
    }
    setShowOffer(true);
  }

  function printOffer() {
    window.print();
  }

  if (showOffer && selectedQuote) {
    return (
      <QuoteOffer
        quote={selectedQuote}
        getRenovationLabel={getRenovationLabel}
        getStatusLabel={getStatusLabel}
        formatDate={formatDate}
        onPrint={printOffer}
        onBack={() => setShowOffer(false)}
      />
    );
  }

  if (selectedQuote) {
    return (
      <QuoteDetails
        quote={selectedQuote}
        noteText={noteText}
        nextContact={nextContact}
        getRenovationLabel={getRenovationLabel}
        getStatusLabel={getStatusLabel}
        formatDate={formatDate}
        onBack={() => {
          setSelectedQuote(null);
          setNoteText("");
          setNextContact("");
        }}
        onNoteChange={setNoteText}
        onSaveNote={saveQuoteNote}
        onContactChange={setNextContact}
        onSaveContact={saveNextContact}
        onStatusChange={(status) => changeStatus(selectedQuote.id, status)}
        onEdit={() => editQuote(selectedQuote)}
        onGenerateOffer={generateOffer}
      />
    );
  }

  return (
    <>
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
        onCalculate={calculateQuote}
        onCancel={cancelEditing}
      />

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
        onSelect={(quote) => {
          setSelectedQuote(quote);
          setNoteText(quote.notes ?? "");
          setNextContact(quote.nextContact ?? "");
        }}
        onStatusChange={changeStatus}
        onEdit={editQuote}
        onDelete={deleteQuote}
      />

    </>
  );
}