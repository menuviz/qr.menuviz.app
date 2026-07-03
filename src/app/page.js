import Link from "next/link";
import { deleteCode, generateCodes } from "@/lib/actions";
import { formatDate, truncateUrl } from "@/lib/beacon";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getCodes() {
  const { data, error } = await getSupabase()
    .from("qr_stats")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export default async function Dashboard() {
  const codes = await getCodes();
  const totalScans = codes.reduce((sum, code) => sum + Number(code.scan_count || 0), 0);
  const liveCount = codes.filter((code) => code.destination).length;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Beacon command</p>
          <h1>Dynamic QR codes for field programming</h1>
        </div>
        <nav className="nav">
          <Link href="/print">Print sheet</Link>
        </nav>
      </header>

      <section className="control-band">
        <form action={generateCodes} className="generator">
          <label htmlFor="count">New blank codes</label>
          <div>
            <input id="count" name="count" type="number" min="1" max="100" defaultValue="12" />
            <button type="submit">Generate</button>
          </div>
        </form>
        <div className="metric">
          <span>{codes.length}</span>
          <p>Total codes</p>
        </div>
        <div className="metric">
          <span>{liveCount}</span>
          <p>Live codes</p>
        </div>
        <div className="metric">
          <span>{totalScans}</span>
          <p>Total scans</p>
        </div>
      </section>

      <section className="table-wrap" aria-label="QR code inventory">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Destination</th>
              <th>Scans</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.id}>
                <td className="mono">{code.id}</td>
                <td>
                  <span className={code.destination ? "badge live" : "badge blank"}>
                    {code.destination ? "live" : "blank"}
                  </span>
                </td>
                <td title={code.destination || ""}>{truncateUrl(code.destination)}</td>
                <td className="mono">{code.scan_count}</td>
                <td>{formatDate(code.created_at)}</td>
                <td>
                  <div className="row-actions">
                    <Link href={`/r/${code.id}?edit=1`} target="_blank">
                      Program
                    </Link>
                    <Link href={`/analytics/${code.id}`}>Analytics</Link>
                    <form action={deleteCode}>
                      <input type="hidden" name="id" value={code.id} />
                      <button type="submit" className="link-button">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {codes.length === 0 ? (
          <p className="empty">Generate a batch to create your first printable blank codes.</p>
        ) : null}
      </section>
    </main>
  );
}
