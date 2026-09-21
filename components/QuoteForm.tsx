"use client";

import { useState } from "react";

export default function QuoteForm() {
    const [name, setName] = useState("");
    const [area, setArea] = useState("");


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
                placeholder="Powierzchnia mieszkania "
                 value={area}
                onChange={(e) => setArea(e.target.value)}
/>


            <p>Klient: {name}</p>
            <p>Powierzchnia: {area} m²</p>
    </section>

    );
}