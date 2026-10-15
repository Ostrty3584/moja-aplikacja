import Header from "../components/Header";
import Services from "../components/Services";
import QuoteForm from "../components/QuoteForm";
import Auth from "../components/Auth";

export default function Home() {
  return (
    <main className="page-shell" id="top">
      <Header />

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Remonty i wykończenia wnętrz</span>
          <h1>Przestrzeń, w której dobrze się mieszka.</h1>
          <p>
            Od pierwszego pomysłu do ostatniego detalu. Opowiedz nam o swoim
            mieszkaniu, a przygotujemy przejrzystą, orientacyjną wycenę prac.
          </p>

          <div className="cta-row">
            <a className="button-accent" href="#wycena">Oblicz koszt remontu <span aria-hidden="true">↘</span></a>
            <a className="hero-text-link" href="#uslugi">Poznaj zakres prac</a>
          </div>
        </div>

        <div className="hero-aside" aria-label="Etapy współpracy">
          <span className="hero-aside-label">Dobry remont. Dobry plan.</span>
          <div className="stat-card">
            <strong>01</strong>
            <span>Poznajemy potrzeby</span>
          </div>
          <div className="stat-card">
            <strong>02</strong>
            <span>Ustalamy zakres i budżet</span>
          </div>
          <div className="stat-card">
            <strong>03</strong>
            <span>Realizujemy z dbałością</span>
          </div>
        </div>
      </section>

      <QuoteForm />
      <div id="uslugi">
        <Services />
      </div>
      <Auth />
    </main>
  );
}