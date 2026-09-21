"use client";

import { useState } from "react";   

export default function Counter() {
    const [count, setCount] = useState(0);

    return (
        <section>
            <h2>Licznik</h2>

            <p>Kliknięcia: {count}</p>

            <button onClick={() => setCount(count + 1)}>
                Kliknij mnie
            </button>
        </section>




    );
}