export type UserStatus = "online" | "dnd" | "offline";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  nickName: string;
  status: UserStatus;
  avatarUrl?: string;
}

export interface TypingDraft {
  nickName: string;
  text: string;
}
