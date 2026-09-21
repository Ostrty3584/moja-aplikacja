import Header from "../components/Header"
import Services from "../components/Services"

export default function Home() {
  return (

    <main>

      
      <Header />

      <Services />

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