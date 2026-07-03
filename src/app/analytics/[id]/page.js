import Link from "next/link";
import { formatDate, lastNDays } from "@/lib/beacon";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getAnalytics(id) {
  const supabase = getSupabase();
  const [{ data: code, error: codeError }, { data: scans, error: scanError }] =
    await Promise.all([
      supabase.from("qr_stats").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("scans")
        .select("scanned_at,country")
        .eq("qr_id", id)
        .order("scanned_at", { ascending: true }),
    ]);

  if (codeError) {
    throw new Error(codeError.message);
  }
  if (scanError) {
    throw new Error(scanError.message);
  }

  return { code, scans: scans || [] };
}

function buildDaily(scans) {
  const days = lastNDays(14);
  const counts = new Map(days.map((date) => [date.toISOString().slice(0, 10), 0]));

  for (const scan of scans) {
    const key = new Date(scan.scanned_at).toISOString().slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, counts.get(key) + 1);
    }
  }

  const max = Math.max(1, ...counts.values());
  return days.map((date) => {
    const key = date.toISOString().slice(0, 10);
    const count = counts.get(key);
    return {
      key,
      label: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
      count,
      height: `${Math.max(8, (count / max) * 100)}%`,
    };
  });
}

function buildLocations(scans) {
  const counts = new Map();

  for (const scan of scans) {
    if (scan.country) {
      counts.set(scan.country, (counts.get(scan.country) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export default async function AnalyticsPage({ params }) {
  const { id } = await params;
  const { code, scans } = await getAnalytics(id);

  if (!code) {
    return (
      <main className="shell">
        <Link href="/" className="back-link">
          Back to dashboard
        </Link>
        <h1>Code not found</h1>
      </main>
    );
  }

  const daily = buildDaily(scans);
  const locations = buildLocations(scans);
  const firstScan = scans[0]?.scanned_at;
  const lastScan = scans[scans.length - 1]?.scanned_at;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Analytics / {id}</p>
          <h1>{code.label || code.destination || "Blank code"}</h1>
        </div>
        <nav className="nav">
          <Link href="/">Dashboard</Link>
          <Link href={`/r/${id}?edit=1`} target="_blank">
            Reprogram
          </Link>
        </nav>
      </header>

      <section className="control-band">
        <div className="metric">
          <span>{code.scan_count}</span>
          <p>Total scans</p>
        </div>
        <div className="metric">
          <span>{formatDate(firstScan)}</span>
          <p>First scan</p>
        </div>
        <div className="metric">
          <span>{formatDate(lastScan)}</span>
          <p>Last scan</p>
        </div>
      </section>

      <section className="analytics-grid">
        <div className="chart-panel">
          <h2>Last 14 days</h2>
          <div className="bar-chart">
            {daily.map((day) => (
              <div className="bar-slot" key={day.key}>
                <span style={{ height: day.height }} title={`${day.count} scans`} />
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-panel">
          <h2>Top locations</h2>
          {locations.length ? (
            <ul className="location-list">
              {locations.map((location) => (
                <li key={location.country}>
                  <span>{location.country}</span>
                  <strong>{location.count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No country data has been reported yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
