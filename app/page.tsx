import Header from "../components/Header"
import Services from "../components/Services"
import Counter from "../components/Counter"
import QuoteForm from "../components/QuoteForm"



export default function Home() {
  return (

    <main>

      
      <Header />

      <Services />

      <Counter />
      <QuoteForm />

      <h2>Czego się uczę?</h2>

      <ul>
        <li>Next.js</li>
        <li>React</li>
        <li>Vibe coding</li>
      </ul>

      <button>Kliknij mnie</button>

    </main>
  );
}