"use client";



import { useEffect, useState } from "react";

import type {

    Quote,

    QuoteType,

    QuoteStatus,

} from "../types/Quote";

import { supabase } from "../lib/supabase";



type StatusFilter = "all" | QuoteStatus;



type SortOption =

    | "newest"

    | "oldest"

    | "price-low"

    | "price-high";



// 
// GŁÓWNY KOMPONENT — cały kalkulator i historia wycen
// 

export default function QuoteForm() {

    // 
    // 1. STANY FORMULARZA — dane wpisywane przez użytkownika
    // 

    const [name, setName] = useState("");

    const [area, setArea] = useState("");

    const [rooms, setRooms] = useState("");

    const [email, setEmail] = useState("");

    const [phone, setPhone] = useState("");

    const [debrisRemoval, setDebrisRemoval] =

        useState(false);



    // Wynik ostatnio obliczonej wyceny.
    // null = nie pokazujemy jeszcze wyniku.
    const [result, setResult] =

        useState<number | null>(null);



    // Wybrany rodzaj remontu.
    const [renovationType, setRenovationType] =

        useState<QuoteType>("standard");



    // 
    // 2. STANY APLIKACJI — wyceny, edycja, filtry i wyszukiwanie
    //

    // Wszystkie wyceny aktualnie pobrane z Supabase.
    const [quotes, setQuotes] =

        useState<Quote[]>([]);



    // ID edytowanej wyceny.
    // null = obecnie nie edytujemy żadnej wyceny.
    const [editingId, setEditingId] =

        useState<number | null>(null);



    // Filtr historii: wszystkie / nowe / wysłane / zaakceptowane / odrzucone.
    const [statusFilter, setStatusFilter] =

        useState<StatusFilter>("all");



    // Tekst wpisany w wyszukiwarkę historii.
    const [searchTerm, setSearchTerm] =

        useState("");



    // Sposób sortowania historii wycen.
    const [sortOption, setSortOption] =

        useState<SortOption>("newest");



    



    const [selectedQuote, setSelectedQuote] =

        useState<Quote | null>(null);

    const [showOffer, setShowOffer] = useState(false);



    const [noteText, setNoteText] = useState("");



    // 
    // 4. CENNIK — stawka za 1 m² dla każdego rodzaju remontu
    // 

    const pricesPerMeter: Record<QuoteType, number> = {

        refresh: 800,

        standard: 1500,

        complete: 2500,

    };



    const pricePerMeter =

        pricesPerMeter[renovationType];



    // 
    // STATYSTYKI
    // 



    const allQuotesCount = quotes.length;



    const newQuotesCount =

        quotes.filter(

            (quote) =>

                quote.status === "new"

        ).length;



    const sentQuotesCount =

        quotes.filter(

            (quote) =>

                quote.status === "sent"

        ).length;



    const acceptedQuotes =

        quotes.filter(

            (quote) =>

                quote.status === "accepted"

        );



    const acceptedQuotesCount =

        acceptedQuotes.length;



    const rejectedQuotesCount =

        quotes.filter(

            (quote) =>

                quote.status === "rejected"

        ).length;



    const acceptedQuotesValue =

        acceptedQuotes.reduce(

            (sum, quote) =>

                sum + quote.price,

            0

        );



    // 
    // FILTROWANIE + WYSZUKIWANIE
    // 



    const filteredQuotes = quotes.filter(

        (quote) => {

            const matchesStatus =

                statusFilter === "all" ||

                quote.status === statusFilter;



            const search = searchTerm

                .trim()

                .toLowerCase();



            const matchesSearch =

                search === "" ||

                (quote.name ?? "")

                    .toLowerCase()

                    .includes(search) ||

                (quote.email ?? "")

                    .toLowerCase()

                    .includes(search) ||

                (quote.phone ?? "")

                    .toLowerCase()

                    .includes(search);



            return (

                matchesStatus &&

                matchesSearch

            );

        }

    );



    // 
    // SORTOWANIE
    // 



    const sortedQuotes =

        [...filteredQuotes].sort(

            (a, b) => {

                if (

                    sortOption === "oldest"

                ) {

                    return (

                        new Date(

                            a.created_at

                        ).getTime() -

                        new Date(

                            b.created_at

                        ).getTime()

                    );

                }



                if (

                    sortOption ===

                    "price-low"

                ) {

                    return a.price - b.price;

                }



                if (

                    sortOption ===

                    "price-high"

                ) {

                    return b.price - a.price;

                }



                return (

                    new Date(

                        b.created_at

                    ).getTime() -

                    new Date(

                        a.created_at

                    ).getTime()

                );

            }

        );



    // 
    // POBIERANIE WYCEN
    // 



    useEffect(() => {

        async function loadQuotes() {

            try {

                const {

                    data: { user },

                    error: userError,

                } =

                    await supabase.auth.getUser();



                if (userError) {

                    if (

                        userError.name !==

                        "AuthSessionMissingError"

                    ) {

                        console.error(

                            "Błąd pobierania użytkownika:",

                            userError

                        );

                    }



                    setQuotes([]);

                    return;

                }



                if (!user) {

                    setQuotes([]);

                    return;

                }



                const { data, error } =

                    await supabase

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

                    (data ?? []).map(

                        (quote) => ({

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

                        })

                    );



                setQuotes(loadedQuotes);

            } catch (error) {

                console.error(

                    "Błąd ładowania wycen:",

                    error

                );



                setQuotes([]);

            }

        }



        loadQuotes();



        const {

            data: { subscription },

        } = supabase.auth.onAuthStateChange(

            (_event, session) => {

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

                }

            }

        );



        return () => {

            subscription.unsubscribe();

        };

    }, []);



    // 
    // CZYSZCZENIE FORMULARZA
    // 



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

    }



    // 
    // OBLICZANIE / ZAPIS
    // 



    async function calculateQuote() {

        const areaValue = Number(area);

        const roomsValue = Number(rooms);



        if (!email.includes("@")) {

            alert(

                "Podaj poprawny adres e-mail."

            );

            return;

        }



        if (phone.trim().length < 9) {

            alert(

                "Podaj poprawny numer telefonu."

            );

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



        const {

            data: { user },

            error: userError,

        } = await supabase.auth.getUser();



        if (userError) {

            console.error(

                "Błąd sprawdzania użytkownika:",

                userError

            );



            alert(

                "Nie udało się sprawdzić zalogowanego użytkownika."

            );

            return;

        }



        if (!user) {

            alert(

                "Musisz być zalogowany, aby zapisać wycenę."

            );

            return;

        }



        const basePrice =

            areaValue * pricePerMeter;



        const debrisPrice =

            debrisRemoval ? 2000 : 0;



        const total =

            basePrice + debrisPrice;



        // ---------- TRYB EDYCJI ----------
        // Jeśli editingId ma wartość, aktualizujemy istniejący rekord.



        if (editingId !== null) {

            const { error } =

                await supabase

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

                    .eq("id", editingId)

                    .eq("user_id", user.id);



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

                              debrisRemoval,

                          }

                        : quote

                )

            );



            setResult(total);

            clearForm();

            return;

        }



        // ---------- NOWA WYCENA ----------
        // Jeśli niczego nie edytujemy, tworzymy nowy rekord w bazie.



        const { data, error } =

            await supabase

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

                    user_id: user.id,

                    status: "new",

                })

                .select(

                    "id, created_at, status"

                )

                .single();



        if (error) {

            console.error(

                "Błąd zapisywania wyceny:",

                error

            );



            alert(

                `Nie udało się zapisać wyceny: ${error.message}`

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

            debrisRemoval,

            created_at: data.created_at,

            status: data.status as QuoteStatus,

            notes: null,
            

        };



        setQuotes((previousQuotes) => [

            newQuote,

            ...previousQuotes,

        ]);



        setResult(total);

        clearForm();

    }



    // 
    // ZMIANA STATUSU
    // 

    async function saveQuoteNote() {
        if (!selectedQuote) {
            return;
        }

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            alert("Musisz być zalogowany.");
            return;
        }

        const savedNote = noteText.trim() || null;

        const { error } = await supabase
            .from("quotes")
            .update({
                notes: savedNote,
            })
            .eq("id", selectedQuote.id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Błąd zapisywania notatki:", error);
            alert("Nie udało się zapisać notatki.");
            return;
        }

        setQuotes((previousQuotes) =>
            previousQuotes.map((quote) =>
                quote.id === selectedQuote.id
                    ? {
                          ...quote,
                          notes: savedNote,
                      }
                    : quote
            )
        );

        setSelectedQuote((previousQuote) =>
            previousQuote
                ? {
                      ...previousQuote,
                      notes: savedNote,
                  }
                : previousQuote
        );

        setNoteText(savedNote ?? "");
        alert("Notatka została zapisana");
    }

    async function changeStatus(

        quoteId: number,

        newStatus: QuoteStatus

    ) {

        const {

            data: { user },

        } = await supabase.auth.getUser();



        if (!user) {

            alert("Musisz być zalogowany.");

            return;

        }



        const { error } =

            await supabase

                .from("quotes")

                .update({

                    status: newStatus,

                })

                .eq("id", quoteId)

                .eq("user_id", user.id);



        if (error) {

            console.error(

                "Błąd zmiany statusu:",

                error

            );



            alert(

                "Nie udało się zmienić statusu."

            );

            return;

        }



        setQuotes((previousQuotes) =>

            previousQuotes.map((quote) =>

                quote.id === quoteId

                    ? {

                          ...quote,

                          status: newStatus,

                      }

                    : quote

            )

        );



        // Jeżeli oglądamy tę wycenę,

        // aktualizujemy również szczegóły.

        setSelectedQuote(

            (previousQuote) =>

                previousQuote?.id === quoteId

                    ? {

                          ...previousQuote,

                          status: newStatus,

                      }

                    : previousQuote

        );

    }



    // 
    // USUWANIE
    // 



    async function deleteQuote(

        idToDelete: number

    ) {

        const {

            data: { user },

        } = await supabase.auth.getUser();



        if (!user) {

            alert("Musisz być zalogowany.");

            return;

        }



        const { error } =

            await supabase

                .from("quotes")

                .delete()

                .eq("id", idToDelete)

                .eq("user_id", user.id);



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



        if (

            selectedQuote?.id ===

            idToDelete

        ) {

            setSelectedQuote(null);

        }

    }



    // 
    // EDYCJA
    // 



    function editQuote(quote: Quote) {

        setSelectedQuote(null);

        setShowOffer(false);

        setEditingId(quote.id);

        setNoteText(quote.notes ?? "");

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



    // 
    // ETYKIETY
    // 



    function getRenovationLabel(

        type: QuoteType

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



    function getStatusLabel(

        status: QuoteStatus

    ) {

        if (status === "new") {

            return "Nowa";

        }



        if (status === "sent") {

            return "Wysłana";

        }



        if (status === "accepted") {

            return "Zaakceptowana";

        }



        if (status === "rejected") {

            return "Odrzucona";

        }



        return status;

    }



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

    async function generateOffer() {
        if (!selectedQuote) {
            return;
        }

        //Jeżeli wycena jest nowa,
        //po wygenerowaniu oferty zmianiemy status na "Wysłana".
        if (selectedQuote.status === "new") {
            await changeStatus(selectedQuote.id, "sent");
        }

        setShowOffer(true);
    }


    //Drukowanie oferty
    //Zapisanie jako PDF

    function printOffer() {
        window.print();
    }


    if (showOffer && selectedQuote) {
    return (
        <section className="offer">

            {/* ========================================
                NAGŁÓWEK OFERTY
                ======================================== */}

            <header className="offer-header">
                <div>
                    <h1>PROREMONT</h1>
                    <p>Profesjonalne usługi remontowe</p>
                </div>

                <div className="offer-number">
                    <strong>OFERTA</strong>
                    <p>Nr #{selectedQuote.id}</p>
                    <p>{formatDate(selectedQuote.created_at)}</p>
                    <p>Status: {getStatusLabel(selectedQuote.status)}</p>
                </div>
            </header>

            {/* ========================================
                DANE KLIENTA
                ======================================== */}

            <div className="offer-section">
                <h3>Dane klienta</h3>

                <div className="offer-grid">
                    <div>
                        <span>Klient</span>
                        <strong>
                            {selectedQuote.name || "Brak danych"}
                        </strong>
                    </div>

                    <div>
                        <span>E-mail</span>
                        <strong>
                            {selectedQuote.email || "Brak danych"}
                        </strong>
                    </div>

                    <div>
                        <span>Telefon</span>
                        <strong>
                            {selectedQuote.phone || "Brak danych"}
                        </strong>
                    </div>
                </div>
            </div>

            {/* ========================================
                ZAKRES REMONTU
                ======================================== */}

            <div className="offer-section">
                <h3>Zakres remontu</h3>

                <div className="offer-grid">
                    <div>
                        <span>Powierzchnia</span>
                        <strong>{selectedQuote.area} m²</strong>
                    </div>

                    <div>
                        <span>Liczba pomieszczeń</span>
                        <strong>{selectedQuote.rooms}</strong>
                    </div>

                    <div>
                        <span>Rodzaj remontu</span>
                        <strong>
                            {getRenovationLabel(selectedQuote.type)}
                        </strong>
                    </div>

                    <div>
                        <span>Wywóz gruzu</span>
                        <strong>
                            {selectedQuote.debrisRemoval ? "Tak" : "Nie"}
                        </strong>
                    </div>
                </div>
            </div>

            {/* ========================================
                CENA
                ======================================== */}

            <div className="offer-price">
                <div>
                    <span>Łączna wartość oferty</span>

                    <strong>
                        {selectedQuote.price.toLocaleString("pl-PL")} zł
                    </strong>
                </div>

                <p>
                    Oferta ma charakter orientacyjny.
                    Ostateczna cena może ulec zmianie po dokładnych
                    oględzinach miejsca remontu.
                </p>
            </div>

            <footer className="offer-footer">
                <p>
                    Dziękujemy za zainteresowanie ofertą PROREMONT.
                </p>

                <p>
                    Oferta ważna 14 dni od daty wystawienia.
                </p>

            </footer>

            {/* ========================================
                PRZYCISKI
                ======================================== */}

            <button
                type="button"
                onClick={printOffer}
            >
                🖨️ Drukuj / Zapisz jako PDF
            </button>

            <button
                type="button"
                onClick={() => setShowOffer(false)}
            >
                ← Wróć do szczegółów
            </button>

        </section>
    );
}


    // 
    // DZIEŃ 45 — SZCZEGÓŁY
    // 



    if (selectedQuote) {

        return (

            <section>

                <h2>

                    Szczegóły wyceny #

                    {selectedQuote.id}

                </h2>



                <button

                    type="button"

                    onClick={() =>

                        setSelectedQuote(null)

                    }

                >

                    ← Wróć do listy

                </button>



                <hr />



                <h3>👤 Klient</h3>



                <p>

                    <strong>Imię:</strong>{" "}

                    {selectedQuote.name ||

                        "Brak danych"}

                </p>



                <p>

                    <strong>E-mail:</strong>{" "}

                    {selectedQuote.email ||

                        "Brak danych"}

                </p>



                <p>

                    <strong>Telefon:</strong>{" "}

                    {selectedQuote.phone ||

                        "Brak danych"}

                </p>



                <h3>🏠 Remont</h3>



                <p>

                    <strong>

                        Powierzchnia:

                    </strong>{" "}

                    {selectedQuote.area} m²

                </p>



                <p>

                    <strong>

                        Liczba pomieszczeń:

                    </strong>{" "}

                    {selectedQuote.rooms}

                </p>



                <p>

                    <strong>

                        Rodzaj remontu:

                    </strong>{" "}

                    {getRenovationLabel(

                        selectedQuote.type

                    )}

                </p>



                <p>

                    <strong>

                        Wywóz gruzu:

                    </strong>{" "}

                    {selectedQuote.debrisRemoval

                        ? "Tak"

                        : "Nie"}

                </p>



                <h3>💰 Wycena</h3>



                <p>

                    <strong>Cena:</strong>{" "}

                    {selectedQuote.price.toLocaleString(

                        "pl-PL"

                    )}{" "}

                    zł

                </p>



                <p>

                    <strong>Status:</strong>{" "}

                    {getStatusLabel(

                        selectedQuote.status

                    )}

                </p>



                <p>

                    <strong>

                        Data utworzenia:

                    </strong>{" "}

                    {formatDate(

                        selectedQuote.created_at

                    )}

                </p>

                <h3>Notatka</h3>
                <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Np. Klient chce rozpocząć remont w listopadzie"
                    rows={5}
                />

                <button type="button" onClick={saveQuoteNote}>
                    💾 Zapisz notatkę
                </button>

                <label>

                    Zmień status:{" "}



                    <select

                        value={

                            selectedQuote.status

                        }

                        onChange={(e) =>

                            changeStatus(

                                selectedQuote.id,

                                e.target

                                    .value as QuoteStatus

                            )

                        }

                    >

                        <option value="new">

                            Nowa

                        </option>



                        <option value="sent">

                            Wysłana

                        </option>



                        <option value="accepted">

                            Zaakceptowana

                        </option>



                        <option value="rejected">

                            Odrzucona

                        </option>

                    </select>

                </label>



                <br />

                <br />



                <button type="button" onClick={() =>
                    editQuote(selectedQuote)
                }>

                    ✏️ Edytuj wycenę

                </button>

                <button type="button" onClick={generateOffer}>

                    📄 Generuj ofertę
                </button>

            </section>

        );

    }



    // 
    // GŁÓWNY WIDOK
    // 



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



            <p>Klient: {name}</p>



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

                        e.target

                            .value as QuoteType

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

                    checked={debrisRemoval}

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

                onClick={calculateQuote}

            >

                {editingId !== null

                    ? "Zapisz zmiany"

                    : "Oblicz wycenę"}

            </button>



            {editingId !== null && (

                <button

                    type="button"

                    onClick={cancelEditing}

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



            {/* DASHBOARD */}



            {quotes.length > 0 && (

                <>

                    <h3>

                        📊 Podsumowanie

                    </h3>



                    <p>

                        Wszystkie wyceny:{" "}

                        <strong>

                            {allQuotesCount}

                        </strong>

                    </p>



                    <p>

                        Nowe:{" "}

                        <strong>

                            {newQuotesCount}

                        </strong>

                    </p>



                    <p>

                        Wysłane:{" "}

                        <strong>

                            {sentQuotesCount}

                        </strong>

                    </p>



                    <p>

                        Zaakceptowane:{" "}

                        <strong>

                            {acceptedQuotesCount}

                        </strong>

                    </p>



                    <p>

                        Odrzucone:{" "}

                        <strong>

                            {rejectedQuotesCount}

                        </strong>

                    </p>



                    <p>

                        💰 Wartość

                        zaakceptowanych:{" "}

                        <strong>

                            {acceptedQuotesValue.toLocaleString(

                                "pl-PL"

                            )}{" "}

                            zł

                        </strong>

                    </p>

                </>

            )}



            {/* HISTORIA */}



            {quotes.length > 0 && (

                <>

                    <h3>

                        Historia wycen

                    </h3>



                    <label>

                        Pokaż:{" "}



                        <select

                            value={

                                statusFilter

                            }

                            onChange={(e) =>

                                setStatusFilter(

                                    e.target

                                        .value as StatusFilter

                                )

                            }

                        >

                            <option value="all">

                                Wszystkie

                            </option>



                            <option value="new">

                                Nowe

                            </option>



                            <option value="sent">

                                Wysłane

                            </option>



                            <option value="accepted">

                                Zaakceptowane

                            </option>



                            <option value="rejected">

                                Odrzucone

                            </option>

                        </select>

                    </label>



                    <input

                        type="text"

                        placeholder="Szukaj klienta, e-maila lub telefonu..."

                        value={searchTerm}

                        onChange={(e) =>

                            setSearchTerm(

                                e.target.value

                            )

                        }

                    />



                    <label>

                        Sortuj:{" "}



                        <select

                            value={sortOption}

                            onChange={(e) =>

                                setSortOption(

                                    e.target

                                        .value as SortOption

                                )

                            }

                        >

                            <option value="newest">

                                Najnowsze

                            </option>



                            <option value="oldest">

                                Najstarsze

                            </option>



                            <option value="price-low">

                                Cena: od najniższej

                            </option>



                            <option value="price-high">

                                Cena: od najwyższej

                            </option>

                        </select>

                    </label>



                    <p>

                        Znaleziono:{" "}

                        <strong>

                            {

                                filteredQuotes.length

                            }

                        </strong>

                    </p>



                    {sortedQuotes.length ===

                    0 ? (

                        <p>

                            Brak pasujących

                            wycen.

                        </p>

                    ) : (

                        <ul>

                            {sortedQuotes.map(

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

                                            Wywóz gruzu:{" "}

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



                                        <p>

                                            <strong>

                                                Status:{" "}

                                                {getStatusLabel(

                                                    quote.status

                                                )}

                                            </strong>

                                        </p>



                                        <select

                                            value={

                                                quote.status

                                            }

                                            onChange={(

                                                e

                                            ) =>

                                                changeStatus(

                                                    quote.id,

                                                    e

                                                        .target

                                                        .value as QuoteStatus

                                                )

                                            }

                                        >

                                            <option value="new">

                                                Nowa

                                            </option>



                                            <option value="sent">

                                                Wysłana

                                            </option>



                                            <option value="accepted">

                                                Zaakceptowana

                                            </option>



                                            <option value="rejected">

                                                Odrzucona

                                            </option>

                                        </select>



                                        {/* DZIEŃ 45 */}



                                        <button

                                            type="button"

                                            onClick={() => {

                                                setSelectedQuote(quote);

                                                setNoteText(quote.notes ?? "");

                                            }}

                                        >

                                            👁️ Zobacz szczegóły

                                        </button>



                                        <button

                                            type="button"

                                            onClick={() =>

                                                editQuote(

                                                    quote

                                                )

                                            }

                                        >

                                            Edytuj wycenę

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

                    )}

                </>

            )}



            <small>

                Wartości treningowe, nie

                rzeczywisty cennik.

            </small>

        </section>

    );

}