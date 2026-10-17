import { useState } from "react";
import { ArrowRight, Menu, ShoppingBag, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { BrandMark } from "../BrandMark";
import { navigationLinks } from "../../data/landingData";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const closeMenu = () => setMenuOpen(false);
  const homeLink = (hash: string) =>
    pathname === "/" ? hash : `/${hash}`;

  return (
    <header className="site-header">
      <a
        className="site-header__brand"
        href={homeLink("#inicio")}
        onClick={closeMenu}
      >
        <BrandMark />
      </a>
      <button
        className="site-header__menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setMenuOpen((isOpen) => !isOpen)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav
        className={`site-header__navigation${menuOpen ? " is-open" : ""}`}
        id="primary-navigation"
        aria-label="Navegación principal"
      >
        {navigationLinks.map(({ label, href }) => (
          <a key={href} href={homeLink(href)} onClick={closeMenu}>
            {label}
          </a>
        ))}
        <button
          className="site-header__cart"
          type="button"
          disabled
          aria-label="El carrito estará disponible en una fase posterior"
          title="Disponible en una fase posterior"
        >
          <ShoppingBag size={16} aria-hidden="true" />
          <span>Carrito</span>
        </button>
        <a
          className="button button--small site-header__cta"
          href={homeLink("#contacto")}
          onClick={closeMenu}
        >
          Hacer una consulta
          <ArrowRight size={15} aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}
