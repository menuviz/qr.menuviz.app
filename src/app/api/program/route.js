import { revalidatePath } from "next/cache";
import { normalizeDestination } from "@/lib/beacon";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(request) {
  const body = await request.json().catch(() => ({}));

  if (!process.env.PROGRAM_PASSCODE || body.passcode !== process.env.PROGRAM_PASSCODE) {
    return Response.json(
      { message: "That passcode did not work. Check it and try again." },
      { status: 401 }
    );
  }

  const id = String(body.id || "");
  const destination = normalizeDestination(body.destination);
  const label = String(body.label || "").trim() || null;

  if (!id || !destination) {
    return Response.json({ message: "Enter a valid code and website address." }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("qr_codes")
    .update({
      label,
      destination,
      programmed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return Response.json({ message: "Could not save this code." }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/print");
  revalidatePath(`/analytics/${id}`);
  revalidatePath(`/r/${id}`);

  return Response.json({ destination });
}
