"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ContactEntry = {
    id: number;
    quote_id: number;
    user_id: string;
    note: string;
    created_at: string;
};

type ContactHistoryProps = {
    quoteId: number;
    refreshKey?: number;
};

export default function ContactHistory({
    quoteId,
    refreshKey = 0,
}: ContactHistoryProps) {
    const [contacts, setContacts] = useState<ContactEntry[]>([]);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let active = true;

        async function loadContacts() {
            setLoading(true);
            setErrorMessage("");
            setContacts([]);

            const { data, error } = await supabase
                .from("contact_history")
                .select("id, quote_id, user_id, note, created_at")
                .eq("quote_id", quoteId)
                .order("created_at", { ascending: false });

            if (!active) return;

            if (error) {
                console.error("Błąd pobierania kontaktów:", error);
                setErrorMessage("Nie udało się pobrać historii kontaktów.");
            } else {
                setContacts(data ?? []);
            }

            setLoading(false);
        }

        void loadContacts();

        return () => {
            active = false;
        };
    }, [quoteId, refreshKey]);

    async function addContact() {
        const contactNote = note.trim();

        if (!contactNote || saving) return;

        setSaving(true);
        setErrorMessage("");

        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError || !userData.user) {
                throw new Error("Musisz być zalogowany.");
            }

            const { data, error } = await supabase
                .from("contact_history")
                .insert({
                    quote_id: quoteId,
                    user_id: userData.user.id,
                    note: contactNote,
                })
                .select("id, quote_id, user_id, note, created_at")
                .single();

            if (error) throw error;

            setContacts((previous) => [data, ...previous]);
            setNote("");
        } catch (error) {
            console.error("Błąd zapisu kontaktu:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Nie udało się zapisać kontaktu."
            );
        } finally {
            setSaving(false);
        }
    }

    function formatContactDate(date: string) {
        return new Date(date).toLocaleString("pl-PL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <section className="detail-block">
            <span className="detail-index">03</span>
            <h3>Historia kontaktów</h3>

            <label className="field">
                <span>Notatka z rozmowy</span>
                <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Np. Rozmowa telefoniczna - klient potwierdził termin"
                    rows={3}
                />
            </label>

            <button
                type="button"
                className="button-accent"
                onClick={addContact}
                disabled={saving || !note.trim()}
            >
                {saving ? "Zapisywanie..." : "+ Dodaj kontakt"}
            </button>

            {errorMessage && <p role="alert">{errorMessage}</p>}

            {loading ? (
                <p>Ładowanie historii...</p>
            ) : contacts.length === 0 ? (
                <p>Brak zapisanych kontaktów.</p>
            ) : (
                <ul>
                    {contacts.map((contact) => (
                        <li key={contact.id}>
                            <strong>{formatContactDate(contact.created_at)}</strong>
                            <p>{contact.note}</p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

