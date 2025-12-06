import React from 'react';
import '../styles/Navbar.css';

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <span className="navbar__logo">Blood<span>Link</span></span>
          <span className="navbar__pill">Trusted</span>
        </div>
        <nav className="navbar__links" aria-label="Primary">
          <a href="/#home" className="navbar__link">
            Console
          </a>
          <a href="/#donate" className="navbar__link">
            Donate
          </a>
          <a href="/#request" className="navbar__link">
            Receive
          </a>
          <a href="/#inventory" className="navbar__link">
            Inventory
          </a>
          <a href="/about" className="navbar__link">
            About
          </a>
        </nav>
        <div className="navbar__actions">
          <a className="navbar__ghost" href="/#login">
            Log in / Verify
          </a>
          <a className="navbar__cta" href="/#request">
            Need blood
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
