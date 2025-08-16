import React from "react";
import { Link } from "react-router-dom";
import { gamesCatalog } from "../games/catalog";

const HomePage: React.FC = () => {
  return (
    <section className="gradient-bg" style={{ padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Play a game</h2>
        <p style={{ marginBottom: "1.5rem" }}>Choose from the catalog below.</p>

        <div
          role="list"
          aria-label="Game catalog"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "1rem",
          }}
        >
          {gamesCatalog.map((game) => (
            <article
              role="listitem"
              key={game.id}
              style={{
                background: "var(--color-overlay-background)",
                border: "1px solid var(--color-border)",
                backdropFilter: "blur(4px)",
                borderRadius: 12,
                padding: "1rem",
                boxShadow: "0 2px 8px var(--color-shadow)",
              }}
            >
              <Link
                to={game.route}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  {game.icon && (
                    <img
                      src={game.icon}
                      alt=""
                      width={48}
                      height={48}
                      style={{ borderRadius: 8 }}
                    />
                  )}
                  <div>
                    <h3 style={{ margin: 0 }}>{game.title}</h3>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--color-foreground-subtle)",
                      }}
                    >
                      <span>{game.difficulty}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{game.status}</span>
                    </div>
                  </div>
                </div>
                <p style={{ marginTop: "0.75rem" }}>{game.description}</p>
              </Link>
            </article>
          ))}
        </div>

        <style>{`
          @media (max-width: 980px) {
            [aria-label="Game catalog"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 640px) {
            [aria-label="Game catalog"] { grid-template-columns: repeat(1, minmax(0, 1fr)); }
          }
        `}</style>
      </div>
    </section>
  );
};

export default HomePage;
