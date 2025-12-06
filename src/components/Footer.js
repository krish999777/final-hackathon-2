import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__brand">
          <div className="footer__logo">Blood<span>Link</span></div>
          <p className="footer__tagline">
            A coordinated network of donors, hospitals, and blood banks keeping shelves full and
            emergencies covered.
          </p>
          <div className="footer__social">
            <a
              className="footer__social-icon"
              href="https://www.linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              in
            </a>
            <a
              className="footer__social-icon"
              href="https://www.x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter / X"
            >
              X
            </a>
            <a
              className="footer__social-icon"
              href="https://dribbble.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Dribbble"
            >
              Db
            </a>
            <a
              className="footer__social-icon"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              GH
            </a>
          </div>
        </div>

        <div className="footer__links">
          <div>
            <h4>Platform</h4>
            <ul>
              <li><a href="/#home">Console</a></li>
              <li><a href="/#donate">Donate</a></li>
              <li><a href="/#request">Receive</a></li>
              <li><a href="/about">Why trust us</a></li>
            </ul>
          </div>
          <div>
            <h4>Guides</h4>
            <ul>
              <li><a href="/#inventory">Inventory policy</a></li>
              <li><a href="/#activity">Matching rules</a></li>
              <li><a href="/about">Data model</a></li>
              <li><a href="/about">Security</a></li>
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/#login">Contact desk</a></li>
              <li><a href="/#request">Emergency line</a></li>
              <li><a href="mailto:safe@bloodlink.org">Report scam</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__cta">
          <div>
            <p className="footer__eyebrow">Stay in the loop</p>
            <h4>Incident playbooks and inventory drops.</h4>
          </div>
          <form className="footer__form">
            <label htmlFor="newsletter" className="visually-hidden">
              Email address
            </label>
            <input
              id="newsletter"
              name="newsletter"
              type="email"
              placeholder="ops@hospital.org"
              required
            />
            <button type="submit">Subscribe</button>
          </form>
          <p className="footer__hint">No spam. Only critical updates.</p>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__bottom-left">
          <span className="footer__pill">24/7 dispatch</span>
          <span className="footer__pill footer__pill--glass">Verified donors</span>
        </div>
        <p className="footer__rights">© {new Date().getFullYear()} BloodLink. Built for emergencies.</p>
      </div>
    </footer>
  );
};

export default Footer;
