import type { UserStatus } from "@/types/chat";

export interface StatusOption {
  value: UserStatus;
  label: string;
  hint: string;
  color: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "online",
    label: "Online",
    hint: "Receive everything",
    color: "#21ba45"
  },
  {
    value: "dnd",
    label: "Do not disturb",
    hint: "No notifications",
    color: "#c10015"
  },
  {
    value: "offline",
    label: "Offline",
    hint: "No messages until you're back",
    color: "#9e9e9e"
  }
];

export function statusOption(status: UserStatus): StatusOption {
  return (
    STATUS_OPTIONS.find(option => option.value === status) ?? STATUS_OPTIONS[0]!
  );
}
