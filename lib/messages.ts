"use client";

import type { AuthResult } from "./auth";
import { authEnabled, getClient } from "./supabase";

export type MessageRow = {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const NOT_CONFIGURED = "Chat is not available yet. Please check back shortly.";

/**
 * Every message on a booking, oldest first — RLS already scopes this to
 * that booking's own customer or its currently assigned driver (see
 * supabase/020_messages.sql), never anyone else's conversation.
 */
export async function fetchMessages(bookingId: string): Promise<AuthResult<MessageRow[]>> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const { data, error } = await supabase
    .from("messages")
    .select("id, booking_id, sender_id, body, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetch messages failed", error);
    return { ok: false, message: "Couldn't load the conversation. Please try again." };
  }
  return { ok: true, data: data as MessageRow[] };
}

export async function sendMessage(bookingId: string, body: string): Promise<AuthResult> {
  if (!authEnabled) return { ok: false, message: NOT_CONFIGURED };
  const supabase = getClient();
  if (!supabase) return { ok: false, message: NOT_CONFIGURED };

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, message: "Type a message first." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const { error } = await supabase
    .from("messages")
    .insert({ booking_id: bookingId, sender_id: user.id, body: trimmed });
  if (error) {
    console.error("send message failed", error);
    return { ok: false, message: "That didn't send. Please try again." };
  }
  return { ok: true, data: undefined };
}

/**
 * Live new-message updates for one booking's conversation, via Supabase
 * Realtime (migration 020 adds `messages` to the `supabase_realtime`
 * publication). Returns an unsubscribe function — callers tear this down
 * the same way every other effect in this project cleans up on unmount.
 */
export function subscribeToMessages(bookingId: string, onInsert: (message: MessageRow) => void): () => void {
  const supabase = getClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`messages:${bookingId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${bookingId}` },
      (payload) => onInsert(payload.new as MessageRow),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
