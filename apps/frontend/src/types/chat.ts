// Shared shapes for the chat UI. They mirror what the backend will send
// later, so the components don't have to change when mocks are replaced.

export type UserStatus = "online" | "dnd" | "offline";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  nickName: string;
  status: UserStatus;
}

export interface Channel {
  name: string;
  isPrivate: boolean;
  adminNick: string;
  // true = the user was invited but hasn't accepted yet
  invited: boolean;
  lastMessageAt: string;
}

export interface Message {
  id: number;
  channel: string;
  authorNick: string;
  text: string;
  createdAt: string;
}

export interface TypingDraft {
  nickName: string;
  text: string;
}
