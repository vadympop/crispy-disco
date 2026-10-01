// Parsing of the command line input. Execution lives in the chat store,
// this file only turns "/kick ed" into { name: "kick", args: ["ed"] }.

export const COMMANDS = [
  {
    usage: "/join channelName [private]",
    description: "Join or create a channel"
  },
  { usage: "/invite nickName", description: "Invite a user (or lift a ban)" },
  {
    usage: "/revoke nickName",
    description: "Remove a user from a private channel"
  },
  { usage: "/kick nickName", description: "Vote to kick a user (admin: ban)" },
  { usage: "/list", description: "Show channel members" },
  { usage: "/cancel", description: "Leave the channel" },
  { usage: "/quit", description: "Delete the channel (admin only)" }
] as const;

export interface ParsedCommand {
  name: string;
  args: string[];
}

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }

  const [name = "", ...args] = trimmed.slice(1).split(/\s+/);
  return { name: name.toLowerCase(), args };
}
