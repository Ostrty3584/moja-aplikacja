export default function Services() {
    return (
        <section className="site-section services-section">
            <div className="section-heading">
                <div>
                    <span className="eyebrow">Zakres prac</span>
                    <h2>Remont w dobrych rękach</h2>
                </div>
                <p>Jasny plan, sprawdzona ekipa i opieka od pierwszej rozmowy po ostatnie wykończenie.</p>
            </div>
            <div className="service-grid">
                <article className="service-item">
                    <span className="service-number">01</span>
                    <h3>Odświeżenie</h3>
                    <p>Nowy kolor, dopracowane detale i szybka zmiana charakteru wnętrza.</p>
                </article>
                <article className="service-item">
                    <span className="service-number">02</span>
                    <h3>Remont standardowy</h3>
                    <p>Przemyślana modernizacja pomieszczeń z dbałością o codzienny komfort.</p>
                </article>
                <article className="service-item">
                    <span className="service-number">03</span>
                    <h3>Remont kompleksowy</h3>
                    <p>Kompleksowe prace i koordynacja całego procesu w jednym miejscu.</p>
                </article>
            </div>
        </section>
    )
}