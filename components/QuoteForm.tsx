"use client";

import { useEffect, useState } from "react";

type Quote = {
    area: number;
    rooms: number;
    type: string;
    price: number;
};

export default function QuoteForm() {
    const [name, setName] = useState("");
    const [area, setArea] = useState("");
    const [rooms, setRooms] = useState("");
    const [debrisRemoval, setDebrisRemoval] = useState(false);
    const [result, setResult] = useState<number | null>(null);
    const [renovationType, setRenovationType] = useState("standard");

    const [quotes, setQuotes] = useState<Quote[]>(() => {
        if (typeof window === "undefined") {
            return [];
        }

        const storedQuotes = localStorage.getItem("quotes");

        if (!storedQuotes) {
            return [];
        }

        try {
            return JSON.parse(storedQuotes) as Quote[];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("quotes", JSON.stringify(quotes));
        }
    }, [quotes]);

    const pricesPerMeter: Record<string, number> = {
        refresh: 800,
        standard: 1500,
        complete: 2500,
    };

    const pricePerMeter = pricesPerMeter[renovationType];

    function calculateQuote() {
        const areaValue = Number(area);
        const roomsValue = Number(rooms);

        if (areaValue <= 0 || roomsValue <= 0) {
            alert("Podaj poprawną powierzchnię i liczbę pomieszczeń.");
            return;
        }

        const basePrice = areaValue * pricePerMeter;
        const debrisPrice = debrisRemoval ? 2000 : 0;
        const  total = basePrice + debrisPrice;

        setQuotes((previousQuotes) => [
            ...previousQuotes,
            {
                area: areaValue,
                rooms: roomsValue,
                type: renovationType,
                price: total,
            },
        ]);

        setResult(total);
    }

    function deleteQuote(indexToDelete: number) {
        setQuotes((previousQuotes) =>
            previousQuotes.filter(
                (_, index) => index !== indexToDelete
            )
        );
    }

    function editQuote(indexToEdit: number) {
        const newArea = prompt(
            "Podaj nową powierzchnię mieszkania (m²):"
        );

        if (newArea === null) {
            return;
        }

        const areaNumber = Number(newArea);

        if (!Number.isFinite(areaNumber) || areaNumber <= 0) {
            alert("Podaj poprawną powierzchnię większą od 0.");
            return;
        }

        setQuotes((previousQuotes) =>
            previousQuotes.map((quote, index) => {
                if (index !== indexToEdit) {
                    return quote;
                }

                return {
                    ...quote,
                    area: areaNumber,
                    price: areaNumber * pricesPerMeter[quote.type],
                };
            })
        );
    }

    function getRenovationLabel(type: string) {
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

    return (
        <section>
            <h2>Wycena remontu</h2>

            <input
                type="text"
                placeholder="Twoje imię"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <input
                type="number"
                placeholder="Powierzchnia mieszkania"
                value={area}
                onChange={(e) => setArea(e.target.value)}
            />

            <input
                type="number"
                min="1"
                placeholder="Liczba pomieszczeń"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
            />

            <p>Klient: {name}</p>
            <p>Powierzchnia: {area} m²</p>
            <p>Liczba pomieszczeń: {rooms}</p>

            <select
                value={renovationType}
                onChange={(e) => setRenovationType(e.target.value)}
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

            <button
                type="button"
                onClick={calculateQuote}
            >
                Oblicz wycenę
            </button>

            <label>
                <input
                    type="checkbox"
                    checked={debrisRemoval}
                    onChange={(e) => setDebrisRemoval(e.target.checked)}
                />
                Wywóz gruzu (+2000 zł)
                
            </label>

            <p>
                Stawka:{" "}
                {pricePerMeter.toLocaleString("pl-PL")} zł/m²
            </p>

            {result !== null && (
                <p>
                    Szacunkowy koszt:{" "}
                    {result.toLocaleString("pl-PL")} zł
                </p>
            )}

            {quotes.length > 0 && (
                <>
                    <h3>Historia wycen</h3>

                    <ul>
                        {quotes.map((quote, index) => (
                            <li
                                key={`${quote.type}-${quote.area}-${index}`}
                            >
                                <span>
                                    {quote.area} m² ·{" "}
                                    {quote.rooms ?? "?"} pomieszczenia ·{" "}
                                    {getRenovationLabel(quote.type)} ·{" "}
                                    {quote.price.toLocaleString("pl-PL")} zł
                                </span>

                                <button
                                    type="button"
                                    onClick={() => editQuote(index)}
                                >
                                    Edytuj wycenę
                                </button>

                                <button
                                    type="button"
                                    onClick={() => deleteQuote(index)}
                                >
                                    Usuń wycenę
                                </button>
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={() => setQuotes([])}
                    >
                        Wyczyść historię
                    </button>
                </>
            )}

            <small>
                Wartości treningowe, nie rzeczywisty cennik.
            </small>
        </section>
    );
}