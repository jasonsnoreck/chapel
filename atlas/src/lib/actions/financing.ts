"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  FinancingDestinationType,
  FinancingEventDirection,
  FinancingEventType,
  FinancingPositionStatus,
  FinancingPositionType,
} from "@/lib/types";

function revalidateTarget(targetType: "asset" | "business", targetId: string) {
  revalidatePath(`/${targetType === "asset" ? "assets" : "businesses"}/${targetId}`);
}

export async function recordValuation(targetType: "asset" | "business", targetId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("asset_valuations").insert({
    asset_id: targetType === "asset" ? targetId : null,
    business_id: targetType === "business" ? targetId : null,
    value: Number(formData.get("value") ?? 0),
    as_of_date: String(formData.get("as_of_date") ?? "") || new Date().toISOString().slice(0, 10),
    basis: String(formData.get("basis") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidateTarget(targetType, targetId);
}

export async function createFinancingPosition(targetType: "asset" | "business", targetId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("financing_positions").insert({
    asset_id: targetType === "asset" ? targetId : null,
    business_id: targetType === "business" ? targetId : null,
    position_type: (String(formData.get("position_type") ?? "other") as FinancingPositionType) || "other",
    lender: String(formData.get("lender") ?? "") || null,
    opened_at: String(formData.get("opened_at") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidateTarget(targetType, targetId);
}

export async function setFinancingPositionStatus(
  id: string,
  targetType: "asset" | "business",
  targetId: string,
  status: FinancingPositionStatus
) {
  const supabase = createClient();
  const update: { status: FinancingPositionStatus; closed_at?: string } = { status };
  if (status === "paid_off" || status === "refinanced_out") {
    update.closed_at = new Date().toISOString().slice(0, 10);
  }
  const { error } = await supabase.from("financing_positions").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTarget(targetType, targetId);
}

const DIRECTION_BY_EVENT_TYPE: Record<FinancingEventType, FinancingEventDirection> = {
  draw: "increase",
  principal_payment: "decrease",
  refinance: "decrease",
  payoff: "decrease",
  modification: "neutral",
  other: "neutral",
};

export async function recordFinancingEvent(
  financingPositionId: string,
  targetType: "asset" | "business",
  targetId: string,
  formData: FormData
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const eventType = (String(formData.get("event_type") ?? "other") as FinancingEventType) || "other";
  // Direction defaults from event type but can be overridden — an
  // "other" event might legitimately go either way, and a founder
  // correcting a mistaken entry needs the escape hatch.
  const direction = (String(formData.get("direction") ?? "") as FinancingEventDirection) || DIRECTION_BY_EVENT_TYPE[eventType];

  const { error } = await supabase.from("financing_events").insert({
    financing_position_id: financingPositionId,
    event_type: eventType,
    direction,
    amount: Number(formData.get("amount") ?? 0),
    event_date: String(formData.get("event_date") ?? "") || new Date().toISOString().slice(0, 10),
    destination_type: (String(formData.get("destination_type") ?? "") as FinancingDestinationType) || null,
    notes: String(formData.get("notes") ?? "") || null,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidateTarget(targetType, targetId);
}
