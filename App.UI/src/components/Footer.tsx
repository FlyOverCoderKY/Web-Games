import React from "react";
import "./Footer.css";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer" role="contentinfo" aria-label="Footer">
      <div className="site-footer__inner">
        <div className="site-footer__content">
          <p className="site-footer__text">
            © {year}{" "}
            <a
              href="https://flyovercoder.com"
              className="site-footer__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              FlyOverCoder.com
            </a>
            . All rights reserved.
          </p>
          <nav className="site-footer__nav" aria-label="Footer navigation">
            <ul className="site-footer__links">
              <li>
                <a
                  href="https://www.flyovercoder.com/terms"
                  className="site-footer__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a
                  href="https://www.flyovercoder.com/privacy"
                  className="site-footer__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://bugs.flyovercoder.com/?p=webgames"
                  className="site-footer__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Report an Issue
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
