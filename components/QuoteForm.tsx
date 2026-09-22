"use client";

import { useEffect, useState } from "react";

type Quote = {
    area: number;
    type: string;
    price: number;
};

export default function QuoteForm() {
    const [name, setName] = useState("");
    const [area, setArea] = useState("");
    const [result, setResult] = useState<number | null>(null);
    const [renovationType, setRenovationType] = useState("standard");

    const [quotes, setQuotes] = useState<Quote[]>(() => {
        if (typeof window === "undefined") {
            return [];
        }

        const storedQuotes = localStorage.getItem("quotes");
        return storedQuotes ? (JSON.parse(storedQuotes) as Quote[]) : [];
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

        if (areaValue <= 0) {
            return;
        }

        const total = areaValue * pricePerMeter;

        setQuotes((previousQuotes) => [
            ...previousQuotes,
            {
                area: areaValue,
                type: renovationType,
                price: total,
            },
        ]);

        setResult(total);
    }

    function deleteQuote(indexToDelete: number) {
        setQuotes((previousQuotes) =>
            previousQuotes.filter((_, index) => index !== indexToDelete)
        );
    }

    function editQuote(indexToEdit: number) {
        const newArea = prompt("Podaj nową powierzchnię mieszkania (m²):");

        if (newArea === null) {
            return;
        }

        const areaNumber = Number(newArea);

        if (areaNumber <= 0) {
            return;
        }

        setQuotes((previousQuotes) => {
            const updatedQuotes = [...previousQuotes];
            const quote = updatedQuotes[indexToEdit];

            if (!quote) {
                return previousQuotes;
            }

            quote.area = areaNumber;
            quote.price = areaNumber * pricesPerMeter[quote.type];

            return updatedQuotes;
        });
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

            <p>Klient: {name}</p>
            <p>Powierzchnia: {area} m²</p>

            <select
                value={renovationType}
                onChange={(e) => setRenovationType(e.target.value)}
            >
                <option value="refresh">Odświeżenie</option>
                <option value="standard">Standardowy remont</option>
                <option value="complete">Kompleksowy remont</option>
            </select>

            <button type="button" onClick={calculateQuote}>
                Oblicz wycenę
            </button>

            <p>Stawka: {pricePerMeter} zł/m²</p>
            {result !== null && (
                <p>Szacunkowy koszt: {result.toLocaleString("pl-PL")} zł</p>
            )}

            {quotes.length > 0 && (
                <ul>
                    {quotes.map((quote, index) => (
                        <li key={`${quote.type}-${quote.area}-${index}`}>
                            <span>
                                {quote.area} m² · {quote.type} · {quote.price.toLocaleString("pl-PL")} zł
                            </span>
                            <button type="button" onClick={() => editQuote(index)}>
                                Edytuj wycenę
                            </button>
                            <button type="button" onClick={() => deleteQuote(index)}>
                                Usuń wycenę
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <small>Wartości treningowe, nie rzeczywisty cennik.</small>
        </section>
    );
}
