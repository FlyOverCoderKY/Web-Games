import React from "react";
import AppHeader from "./components/AppHeader";
import Footer from "./components/Footer";
import { ThemeProvider } from "./context/ThemeContext";
import type { ThemeContextType } from "./context/theme-context";
import "./App.css";
import { useLocation, useRoutes } from "react-router-dom";
import { routes } from "./routes";
import MainNav from "./components/MainNav";
import { trackPageView } from "./lib/telemetry";

function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("Route error boundary caught error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <section className="gradient-bg" style={{ padding: "2rem 1rem" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2>Something went wrong</h2>
            <p>Try navigating back to the home page or reloading.</p>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

function App() {
  const element = useRoutes(routes);
  const location = useLocation();
  React.useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return (
    <ThemeProvider>
      {(theme: ThemeContextType) => (
        <div className="App" data-theme={theme.resolvedAppearance}>
          <AppHeader
            title="Web Games"
            subtitle="A collection of small games in React"
          />
          <MainNav />
          <main style={{ flex: 1 }}>
            <RouteErrorBoundary>{element}</RouteErrorBoundary>
          </main>
          <Footer />
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;
