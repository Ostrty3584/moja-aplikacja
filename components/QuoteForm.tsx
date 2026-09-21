"use client";

import { useState } from "react";

export default function QuoteForm() {
    const [name, setName] = useState("");
    const [area, setArea] = useState("");
    const [result, setResult] = useState<number | null>(null);
    const [renovationType, setRenovationType] = useState("standard");
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

    setResult(total);
}

return (
    <section>

        <h2>Wycena remontu</h2>

        <input
            type="text"
            placeholder="Twoje imię"
            value={name}
            onChange={(e) => setName(e.target.value)} />

        <input
            type="number"
            placeholder="Powierzchnia mieszkania "
            value={area}
            onChange={(e) => setArea(e.target.value)} />


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

        <button onClick={calculateQuote}>
            Oblicz wycenę
        </button>


    <p>Stawka: {pricePerMeter} zł/m²</p>
            {result !== null && (
    <p>
        Szacunkowy koszt: {result.toLocaleString("pl-PL")} zł
    </p>
)}
            <small>Wartości treningowe, nie rzeczywisty cennik.</small>

    </section>

    );
}
 