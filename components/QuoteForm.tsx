"use client";

import { useEffect, useState } from "react";
import type { Quote } from "../types/Quote";
import { supabase } from "../lib/supabase";

export default function QuoteForm() {
    const [name, setName] = useState("");
    const [area, setArea] = useState("");
    const [rooms, setRooms] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [debrisRemoval, setDebrisRemoval] = useState(false);
    const [result, setResult] = useState<number | null>(null);

    const [renovationType, setRenovationType] =
        useState("standard");

    const [quotes, setQuotes] = useState<Quote[]>([]);

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const pricesPerMeter: Record<string, number> = {
        refresh: 800,
        standard: 1500,
        complete: 2500,
    };

    const pricePerMeter =
        pricesPerMeter[renovationType];

    useEffect(() => {
        async function loadQuotes() {
            const { data, error } = await supabase
                .from("quotes")
                .select("*")
                .order("created_at", {
                    ascending: false,
                });

            if (error) {
                console.error(
                    "Błąd pobierania wycen:",
                    error
                );
                return;
            }

            const loadedQuotes: Quote[] =
                (data ?? []).map((quote) => ({
                    id: quote.id,
                    name: quote.name,
                    email: quote.email,
                    phone: quote.phone,
                    area: quote.area,
                    rooms: quote.rooms,
                    type: quote.type,
                    price: quote.price,
                    debrisRemoval:
                        quote.debris_removal,
                    created_at: quote.created_at,
                }));

            setQuotes(loadedQuotes);
        }

        loadQuotes();
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

        if (
            name.trim() === "" ||
            areaValue <= 0 ||
            roomsValue <= 0
        ) {
            alert(
                "Podaj imię, powierzchnię i liczbę pomieszczeń."
            );
            return;
        }

        const basePrice =
            areaValue * pricePerMeter;

        const debrisPrice =
            debrisRemoval ? 2000 : 0;

        const total =
            basePrice + debrisPrice;

        // =========================
        // EDYCJA ISTNIEJĄCEJ WYCENY
        // =========================

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
                    debris_removal:
                        debrisRemoval,
                })
                .eq("id", editingId);

            if (error) {
                console.error(
                    "Błąd edycji wyceny:",
                    error
                );

                alert(
                    "Nie udało się zapisać zmian."
                );

                return;
            }

            setQuotes((previousQuotes) =>
                previousQuotes.map((quote) =>
                    quote.id === editingId
                        ? {
                              ...quote,
                              name: name.trim(),
                              email: email.trim(),
                              phone: phone.trim(),
                              area: areaValue,
                              rooms: roomsValue,
                              type: renovationType,
                              price: total,
                              debrisRemoval:
                                  debrisRemoval,
                          }
                        : quote
                )
            );

            setResult(total);
            clearForm();

            return;
        }

        // =========================
        // NOWA WYCENA
        // =========================

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
                debris_removal:
                    debrisRemoval,
            })
            .select("id, created_at")
            .single();

        if (error) {
            console.error(
                "Błąd zapisywania wyceny:",
                error
            );

            alert(
                "Nie udało się zapisać wyceny do bazy."
            );

            return;
        }

        const newQuote: Quote = {
            id: data.id,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            area: areaValue,
            rooms: roomsValue,
            type: renovationType,
            price: total,
            debrisRemoval:
                debrisRemoval,

            // Data pochodzi bezpośrednio z Supabase
            created_at:
                data.created_at,
        };

        setQuotes((previousQuotes) => [
            newQuote,
            ...previousQuotes,
        ]);

        setResult(total);

        clearForm();
    }

    // =========================
    // USUWANIE
    // =========================

    async function deleteQuote(
        idToDelete: number
    ) {
        const { error } = await supabase
            .from("quotes")
            .delete()
            .eq("id", idToDelete);

        if (error) {
            console.error(
                "Błąd usuwania wyceny:",
                error
            );

            alert(
                "Nie udało się usunąć wyceny z bazy."
            );

            return;
        }

        setQuotes((previousQuotes) =>
            previousQuotes.filter(
                (quote) =>
                    quote.id !== idToDelete
            )
        );
    }

    // =========================
    // ROZPOCZĘCIE EDYCJI
    // =========================

    function editQuote(quote: Quote) {
        setEditingId(quote.id);

        setName(quote.name);
        setEmail(quote.email);
        setPhone(quote.phone);
        setArea(String(quote.area));
        setRooms(String(quote.rooms));
        setRenovationType(quote.type);
        setDebrisRemoval(
            quote.debrisRemoval
        );

        setResult(null);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }

    function cancelEditing() {
        clearForm();
        setResult(null);
    }

    function getRenovationLabel(
        type: string
    ) {
        if (type === "refresh") {
            return "Odświeżenie";
        }

        if (type === "standard") {
            return "Standardowy remont";
        }

        if (type === "complete") {
            return "Kompleksowy remont";
        }

        return type;
    }

    // =========================
    // FORMATOWANIE DATY
    // =========================

    function formatDate(date: string) {
        return new Date(
            date
        ).toLocaleString("pl-PL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <section>
            <h2>Wycena remontu</h2>

            {editingId !== null && (
                <p>
                    <strong>
                        Edytujesz wycenę #
                        {editingId}
                    </strong>
                </p>
            )}

            <input
                type="text"
                placeholder="Twoje imię"
                value={name}
                onChange={(e) =>
                    setName(e.target.value)
                }
            />

            <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) =>
                    setEmail(e.target.value)
                }
            />

            <input
                type="tel"
                placeholder="Telefon"
                value={phone}
                onChange={(e) =>
                    setPhone(e.target.value)
                }
            />

            <input
                type="number"
                min="1"
                placeholder="Powierzchnia mieszkania"
                value={area}
                onChange={(e) =>
                    setArea(e.target.value)
                }
            />

            <input
                type="number"
                min="1"
                placeholder="Liczba pomieszczeń"
                value={rooms}
                onChange={(e) =>
                    setRooms(e.target.value)
                }
            />

            <p>
                Klient: {name}
            </p>

            <p>
                Powierzchnia: {area} m²
            </p>

            <p>
                Liczba pomieszczeń:{" "}
                {rooms}
            </p>

            <select
                value={renovationType}
                onChange={(e) =>
                    setRenovationType(
                        e.target.value
                    )
                }
            >
                <option value="refresh">
                    Odświeżenie
                </option>

                <option value="standard">
                    Standardowy remont
                </option>

                <option value="complete">
                    Kompleksowy remont
                </option>
            </select>

            <label>
                <input
                    type="checkbox"
                    checked={
                        debrisRemoval
                    }
                    onChange={(e) =>
                        setDebrisRemoval(
                            e.target.checked
                        )
                    }
                />

                Wywóz gruzu (+2000 zł)
            </label>

            <button
                type="button"
                onClick={
                    calculateQuote
                }
            >
                {editingId !== null
                    ? "Zapisz zmiany"
                    : "Oblicz wycenę"}
            </button>

            {editingId !== null && (
                <button
                    type="button"
                    onClick={
                        cancelEditing
                    }
                >
                    Anuluj edycję
                </button>
            )}

            <p>
                Stawka:{" "}
                {pricePerMeter.toLocaleString(
                    "pl-PL"
                )}{" "}
                zł/m²
            </p>

            {result !== null && (
                <p>
                    Szacunkowy koszt:{" "}
                    {result.toLocaleString(
                        "pl-PL"
                    )}{" "}
                    zł
                </p>
            )}

            {quotes.length > 0 && (
                <>
                    <h3>
                        Historia wycen
                    </h3>

                    <ul>
                        {quotes.map(
                            (quote) => (
                                <li
                                    key={
                                        quote.id
                                    }
                                >
                                    <p>
                                        <strong>
                                            Klient:{" "}
                                            {quote.name ||
                                                "Brak danych"}
                                        </strong>
                                    </p>

                                    <p>
                                        Data:{" "}
                                        {formatDate(
                                            quote.created_at
                                        )}
                                    </p>

                                    <p>
                                        E-mail:{" "}
                                        {quote.email ||
                                            "Brak danych"}
                                    </p>

                                    <p>
                                        Telefon:{" "}
                                        {quote.phone ||
                                            "Brak danych"}
                                    </p>

                                    <p>
                                        {
                                            quote.area
                                        }{" "}
                                        m² ·{" "}
                                        {quote.rooms ??
                                            "?"}{" "}
                                        pomieszczenia
                                        ·{" "}
                                        {getRenovationLabel(
                                            quote.type
                                        )}
                                    </p>

                                    <p>
                                        Wywóz
                                        gruzu:{" "}
                                        {quote.debrisRemoval
                                            ? "Tak"
                                            : "Nie"}
                                    </p>

                                    <p>
                                        Cena:{" "}
                                        {quote.price.toLocaleString(
                                            "pl-PL"
                                        )}{" "}
                                        zł
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            editQuote(
                                                quote
                                            )
                                        }
                                    >
                                        Edytuj
                                        wycenę
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteQuote(
                                                quote.id
                                            )
                                        }
                                    >
                                        Usuń wycenę
                                    </button>
                                </li>
                            )
                        )}
                    </ul>
                </>
            )}

            <small>
                Wartości treningowe,
                nie rzeczywisty cennik.
            </small>
        </section>
    );
}