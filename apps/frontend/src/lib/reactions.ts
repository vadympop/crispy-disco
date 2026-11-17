import type { Reaction } from "@cisco-disco/backend/realtime";

// The server stores the key, this is what the user sees. Keyed by the
// backend type, so a reaction added there and missing here is a type error.
export const REACTION_EMOJI: Record<Reaction, string> = {
  thumbs_up: "👍",
  heart: "❤️",
  laugh: "😂",
  wow: "😮",
  sad: "😢"
};

// The order of the picker, the same as the server groups them in
export const REACTIONS = Object.keys(REACTION_EMOJI) as Reaction[];
