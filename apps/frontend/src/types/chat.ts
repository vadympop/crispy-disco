export type UserStatus = "online" | "dnd" | "offline";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  nickName: string;
  status: UserStatus;
  // data: URL of an uploaded picture; without it the avatar shows the initial
  avatarUrl?: string;
}

// The fields the user can edit in the profile settings dialog
export type ProfileUpdate = Pick<
  User,
  "nickName" | "firstName" | "lastName" | "avatarUrl"
>;

export interface Channel {
  name: string;
  isPrivate: boolean;
  adminNick: string;
  // true = the user was invited but hasn't accepted yet
  invited: boolean;
  lastMessageAt: string;
  // set for a private 1-on-1 chat: the nick of the other person
  directWith?: string;
}

export interface UserStats {
  messageCount: number;
  // regular channels (not direct chats) both of us are in
  sharedChannels: string[];
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
