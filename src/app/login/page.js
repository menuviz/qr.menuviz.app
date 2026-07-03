import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

function getSafeNext(value) {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/r/")) {
    return "/";
  }
  return next;
}

export default async function LoginPage({ searchParams }) {
  const query = await searchParams;
  const next = getSafeNext(query.next);

  return (
    <main className="scan-shell">
      <section className="program-panel">
        <div className="ping" aria-hidden="true" />
        <p className="eyebrow">Beacon owner</p>
        <h1>Sign in to command</h1>
        <p className="muted login-copy">
          This protects code generation, printing, analytics, and deletion before you print
          physical tiles.
        </p>
        <LoginForm next={next} />
      </section>
    </main>
  );
}
