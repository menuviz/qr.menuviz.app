import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/beacon";

export const dynamic = "force-dynamic";

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireAdmin();

  const { data, error } = await getSupabase()
    .from("qr_stats")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response("Could not export codes.", { status: 500 });
  }

  const baseUrl = getSiteUrl();
  const header = [
    "id",
    "scan_url",
    "label",
    "destination",
    "status",
    "scan_count",
    "created_at",
    "last_scan",
  ];
  const rows = (data || []).map((code) => [
    code.id,
    `${baseUrl}/r/${code.id}`,
    code.label,
    code.destination,
    code.destination ? "live" : "blank",
    code.scan_count,
    code.created_at,
    code.last_scan,
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="beacon-codes.csv"',
    },
  });
}
