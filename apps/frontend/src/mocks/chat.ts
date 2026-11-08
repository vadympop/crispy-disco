// Placeholder data for the clickable prototype (phase 1).
// Everything here gets replaced by API calls once the backend is ready.

import type { User } from "@/types/chat";

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
