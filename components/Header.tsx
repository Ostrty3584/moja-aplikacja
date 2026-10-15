export default function Header() {
    return (
        <header className="site-header">
            <a className="brand-lockup" href="#top" aria-label="PROREMONT, strona główna">
                <span className="brand-mark">PR</span>
                <span>
                    <strong>PROREMONT</strong>
                    <small>REMONTY I WYKOŃCZENIA</small>
                </span>
            </a>
            <a className="header-link" href="#wycena">Bezpłatna wycena <span aria-hidden="true">↗</span></a>
        </header>
    );
}