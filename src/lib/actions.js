"use server";

import { revalidatePath } from "next/cache";
import { makeCodeId, normalizeDestination } from "@/lib/beacon";
import { getSupabase } from "@/lib/supabase";

export async function generateCodes(formData) {
  const requested = Number(formData.get("count") || 1);
  const count = Math.max(1, Math.min(100, Number.isFinite(requested) ? requested : 1));
  const rows = [];
  const seen = new Set();

  while (rows.length < count) {
    const id = makeCodeId();
    if (!seen.has(id)) {
      seen.add(id);
      rows.push({ id });
    }
  }

  const { error } = await getSupabase().from("qr_codes").insert(rows);

  if (error?.code === "23505") {
    return generateCodes(formData);
  }

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/print");
}

export async function deleteCode(formData) {
  const id = String(formData.get("id") || "");
  if (!id) {
    return;
  }

  const { error } = await getSupabase().from("qr_codes").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/print");
}

export async function programCode(id, _previousState, formData) {
  const passcode = String(formData.get("passcode") || "");

  if (!process.env.PROGRAM_PASSCODE || passcode !== process.env.PROGRAM_PASSCODE) {
    return {
      ok: false,
      message: "That passcode did not work. Check it and try again.",
    };
  }

  const destination = normalizeDestination(formData.get("destination"));
  if (!destination) {
    return {
      ok: false,
      message: "Enter a valid website address.",
    };
  }

  const label = String(formData.get("label") || "").trim() || null;
  const { error } = await getSupabase()
    .from("qr_codes")
    .update({
      label,
      destination,
      programmed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: "Could not save this code. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/print");
  revalidatePath(`/analytics/${id}`);
  revalidatePath(`/r/${id}`);

  return { ok: true, destination };
}
