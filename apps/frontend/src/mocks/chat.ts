// Placeholder data for the clickable prototype (phase 1).
// Everything here gets replaced by API calls once the backend is ready.

import type { Channel, Message, User } from "@/types/chat";

export const mockMe: User = {
  id: 1,
  firstName: "Alex",
  lastName: "Novak",
  nickName: "alex",
  status: "online"
};

export const mockUsers: User[] = [
  mockMe,
  {
    id: 2,
    firstName: "Ed",
    lastName: "Horvath",
    nickName: "ed",
    status: "online"
  },
  {
    id: 3,
    firstName: "Maria",
    lastName: "Kovac",
    nickName: "maria",
    status: "dnd"
  },
  {
    id: 4,
    firstName: "Peter",
    lastName: "Balaz",
    nickName: "peter",
    status: "offline"
  },
  {
    id: 5,
    firstName: "Zuzana",
    lastName: "Mala",
    nickName: "zuzka",
    status: "online"
  },
  {
    id: 6,
    firstName: "Tomas",
    lastName: "Varga",
    nickName: "tomas",
    status: "offline"
  },
  {
    id: 7,
    firstName: "Lucia",
    lastName: "Bielik",
    nickName: "lucia",
    status: "online"
  },
  {
    id: 8,
    firstName: "Martin",
    lastName: "Kral",
    nickName: "martin",
    status: "dnd"
  }
];

const now = Date.now();
const daysAgo = (days: number) =>
  new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

// Channels the current user is a member of (or was invited to)
export const mockChannels: Channel[] = [
  {
    name: "general",
    isPrivate: false,
    adminNick: "ed",
    invited: false,
    lastMessageAt: daysAgo(0)
  },
  {
    name: "random",
    isPrivate: false,
    adminNick: "alex",
    invited: false,
    lastMessageAt: daysAgo(1)
  },
  {
    name: "frontend",
    isPrivate: true,
    adminNick: "alex",
    invited: false,
    lastMessageAt: daysAgo(0)
  },
  {
    name: "backend",
    isPrivate: true,
    adminNick: "maria",
    invited: false,
    lastMessageAt: daysAgo(2)
  },
  {
    name: "memes",
    isPrivate: false,
    adminNick: "peter",
    invited: false,
    lastMessageAt: daysAgo(5)
  },
  {
    name: "design",
    isPrivate: true,
    adminNick: "lucia",
    invited: true,
    lastMessageAt: daysAgo(1)
  }
];

// Channels that exist but the user is not in, so /join has something to find
export const mockOtherChannels: Channel[] = [
  {
    name: "music",
    isPrivate: false,
    adminNick: "zuzka",
    invited: false,
    lastMessageAt: daysAgo(3)
  },
  {
    name: "secret",
    isPrivate: true,
    adminNick: "martin",
    invited: false,
    lastMessageAt: daysAgo(1)
  }
];

export const mockMembers: Record<string, string[]> = {
  general: [
    "ed",
    "alex",
    "maria",
    "peter",
    "zuzka",
    "tomas",
    "lucia",
    "martin"
  ],
  random: ["alex", "ed", "zuzka", "tomas"],
  frontend: ["alex", "ed", "lucia"],
  backend: ["maria", "alex", "peter"],
  memes: ["peter", "alex", "tomas", "martin"],
  design: ["lucia", "zuzka"],
  music: ["zuzka", "ed"],
  secret: ["martin"]
};

const phrases = [
  "Hey everyone, how is it going?",
  "Did anybody check the latest build?",
  "I pushed a fix for the login page",
  "Can we meet tomorrow at 10?",
  "Looks good to me 👍",
  "@alex could you take a look at this?",
  "The migration failed on my machine, weird",
  "Let's keep this channel on topic please",
  "Lunch anyone?",
  "I will write the docs for this part",
  "Thanks @alex, that helped a lot!",
  "Reviewing the PR right now"
];

// Builds `count` messages, oldest first, spaced 7 minutes apart
export function generateHistory(channel: string, count: number): Message[] {
  const authors = (mockMembers[channel] ?? ["ed"]).filter(
    nick => nick !== mockMe.nickName
  );
  const messages: Message[] = [];

  for (let i = 0; i < count; i++) {
    const age = (count - i) * 7 * 60 * 1000;
    messages.push({
      id: i + 1,
      channel,
      authorNick: authors[i % authors.length] ?? "ed",
      text: `${phrases[i % phrases.length]} (#${i + 1})`,
      createdAt: new Date(now - age).toISOString()
    });
  }

  return messages;
}
