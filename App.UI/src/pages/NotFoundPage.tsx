import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <section className="gradient-bg" style={{ padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist.</p>
        <p>
          <Link to="/">Return to Home</Link>
        </p>
      </div>
    </section>
  );
};

export default NotFoundPage;
