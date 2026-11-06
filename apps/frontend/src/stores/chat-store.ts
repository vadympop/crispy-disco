import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import { Notify } from "quasar";
import type { Message, TypingDraft, UserStats } from "@/types/chat";
import type { Channel, PublicProfile, User } from "@/types/api";
import { client } from "@/lib/client";
import { useAuthStore } from "@/stores/auth-store";
import { parseCommand } from "@/lib/commands";
import {
  generateHistory,
  mockChannels,
  mockMembers,
  mockOtherChannels,
  mockUsers
} from "@/mocks/chat";

const PAGE_SIZE = 20;
const KICKS_TO_BAN = 3;

// What the UI should do after a command ran
export interface CommandResult {
  navigateTo?: string;
  showMembers?: boolean;
}

// Stand-in for the server: the full history of every channel, oldest first.
// The store only "downloads" PAGE_SIZE messages from it at a time.
const serverHistory: Record<string, Message[]> = {};
for (const channel of [...mockChannels, ...mockOtherChannels]) {
  serverHistory[channel.name] = generateHistory(channel.name, 120);
}

// TODO: temporary, the mocks list members by nick
function mockMembersToIds(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [channel, nicks] of Object.entries(mockMembers)) {
    result[channel] = nicks
      .map(nick => mockUsers.find(user => user.nickName === nick))
      .filter(user => user !== undefined)
      .map(user => String(user.id));
  }
  return result;
}

function notifyError(message: string) {
  Notify.create({ type: "negative", message });
}

function notifyInfo(message: string) {
  Notify.create({ type: "info", message });
}

export const useChatStore = defineStore("chat", () => {
  const auth = useAuthStore();
  // TODO: temporary, the mocks still use the old User shape until /users exists
  const users = ref<User[]>(
    mockUsers.map(user => ({
      ...user,
      id: String(user.id),
      nickname: user.nickName
    })) as unknown as User[]
  );
  // Filled from the API by fetchChannels()
  const channels = ref<Channel[]>([]);
  const isLoadingChannels = ref(false);
  // All three are keyed by channel name and hold user ids
  const members = ref<Record<string, string[]>>(mockMembersToIds());
  const bans = ref<Record<string, string[]>>({});
  // channel -> kicked user id -> ids of members who voted for the kick
  const kickVotes = ref<Record<string, Record<string, string[]>>>({});
  const notifyMentionsOnly = ref(false);
  const typing = ref<TypingDraft[]>([]);

  const messagesByChannel = ref<Record<string, Message[]>>({});
  // index in serverHistory of the oldest message already loaded
  const historyCursor: Record<string, number> = {};

  // Invited channels are pinned to the top, the rest by latest activity
  const sortedChannels = computed(() =>
    [...channels.value].sort((a, b) => {
      if (a.invited !== b.invited) {
        return a.invited ? -1 : 1;
      }
      return b.lastMessageAt.localeCompare(a.lastMessageAt);
    })
  );

  // Loads the channels the logged-in user is a member of or invited to
  async function fetchChannels() {
    isLoadingChannels.value = true;
    try {
      const result = await client.api.channels.index({});
      channels.value = result.data;
    } finally {
      isLoadingChannels.value = false;
    }
  }

  function findChannel(name: string) {
    return channels.value.find(channel => channel.name === name);
  }

  // Nicks are what people type (commands, @mentions), ids are what we store
  function findUser(nickName: string) {
    return users.value.find(user => user.nickname === nickName);
  }

  // The other person in a direct chat; undefined for normal channels.
  // The server sends the members only for direct chats.
  function directPartner(channel: Channel) {
    if (!channel.isDirect) {
      return undefined;
    }
    return channel.members?.find(member => member.id !== auth.userId);
  }

  // Direct chats are titled with the other person's nick, channels with theirs
  function channelTitle(channel: Channel): string {
    return directPartner(channel)?.nickname ?? channel.name;
  }

  // How a channel is referred to in sentences: "#general" or "Ed Horvath"
  function channelLabel(name: string): string {
    const channel = findChannel(name);
    if (!channel) {
      return `#${name}`;
    }
    return channel.isDirect ? channelTitle(channel) : `#${channel.name}`;
  }

  // In a direct chat both people can delete it, like the server allows
  function isAdmin(channel: Channel) {
    return channel.isDirect || channel.creator.id === auth.userId;
  }

  // Adds the channel, or replaces the one with the same name
  function upsertChannel(channel: Channel) {
    const index = channels.value.findIndex(c => c.name === channel.name);
    if (index === -1) {
      channels.value.push(channel);
    } else {
      channels.value[index] = channel;
    }
  }

  // The members of a channel, always fresh from the server (/list)
  async function fetchMembers(channelName: string): Promise<PublicProfile[]> {
    const channel = findChannel(channelName);
    if (!channel) {
      return [];
    }
    const result = await client.api.channels.members({
      params: { id: channel.id }
    });
    return result.data;
  }

  // Loads the next page of older messages. Returns false when there are no more.
  function loadOlder(channelName: string): boolean {
    const history = serverHistory[channelName] ?? [];
    const cursor = historyCursor[channelName] ?? history.length;
    const start = Math.max(0, cursor - PAGE_SIZE);

    const older = history.slice(start, cursor);
    const loaded = messagesByChannel.value[channelName] ?? [];
    messagesByChannel.value[channelName] = [...older, ...loaded];
    historyCursor[channelName] = start;

    return start > 0;
  }

  function sendMessage(channelName: string, text: string) {
    const myNick = auth.nickname;
    if (!myNick) {
      return;
    }
    const channel = findChannel(channelName);
    if (!channel || channel.invited) {
      notifyError("You can only post in channels you are a member of");
      return;
    }

    const message: Message = {
      id: Date.now(),
      channel: channelName,
      // TODO: mock messages only know the author's nick
      authorNick: myNick,
      text,
      createdAt: new Date().toISOString()
    };
    const loaded = messagesByChannel.value[channelName] ?? [];
    messagesByChannel.value[channelName] = [...loaded, message];
    // the fake server keeps it too, so it counts in the user stats
    (serverHistory[channelName] ??= []).push(message);
    channel.lastMessageAt = message.createdAt;
  }

  // /join: joins a public channel, accepts an invite, or creates the channel.
  // The server decides (private channels and bans are refused there).
  async function joinChannel(
    name: string,
    isPrivate: boolean
  ): Promise<boolean> {
    const mine = findChannel(name);
    if (mine && !mine.invited) {
      return true;
    }

    const result = await client.api.channels.join({
      body: { name, isPrivate }
    });
    const { channel, created } = result.data;
    upsertChannel(channel);

    const myId = auth.userId;
    const current = members.value[name] ?? [];
    if (myId && !current.includes(myId)) {
      members.value[name] = [...current, myId];
    }

    if (created) {
      notifyInfo(
        `Created ${channel.isPrivate ? "private" : "public"} channel #${name}`
      );
    } else {
      notifyInfo(`Joined #${name}`);
    }
    return true;
  }

  // Opens the direct chat with that user; the server creates it the first time.
  // Returns the channel name to navigate to.
  async function startDirectChat(userId: string): Promise<string> {
    const result = await client.api.channels.direct({
      body: { userId }
    });
    upsertChannel(result.data);
    return result.data.name;
  }

  function userStats(user: Pick<User, "id" | "nickname">): UserStats {
    // TODO: mock messages only know the author's nick
    let messageCount = 0;
    for (const history of Object.values(serverHistory)) {
      messageCount += history.filter(
        m => m.authorNick === user.nickname
      ).length;
    }

    const myId = auth.userId ?? "";
    const sharedChannels = channels.value
      .filter(
        c =>
          !c.invited &&
          !c.isDirect &&
          members.value[c.name]?.includes(user.id) &&
          members.value[c.name]?.includes(myId)
      )
      .map(c => c.name);

    return { messageCount, sharedChannels };
  }

  function removeChannel(name: string) {
    channels.value = channels.value.filter(channel => channel.name !== name);
  }

  // Local cleanup once the user is no longer in the channel
  function forgetChannel(name: string) {
    removeChannel(name);
    delete members.value[name];
    delete messagesByChannel.value[name];
  }

  // /cancel: leave the channel. When the admin leaves, the server deletes it.
  async function leaveChannel(name: string): Promise<boolean> {
    const channel = findChannel(name);
    if (!channel) {
      return false;
    }

    // read it before the channel is gone: "#general" or the other person's nick
    const label = channelLabel(name);
    const { channelDeleted } = await client.api.channels.cancel({
      params: { id: channel.id }
    });
    forgetChannel(name);
    notifyInfo(channelDeleted ? `${label} was deleted` : `You left ${label}`);
    return true;
  }

  // /quit: the admin closes the channel (the server checks the admin rights)
  async function deleteChannel(name: string): Promise<boolean> {
    const channel = findChannel(name);
    if (!channel) {
      return false;
    }

    const label = channelLabel(name);
    await client.api.channels.destroy({ params: { id: channel.id } });
    forgetChannel(name);
    notifyInfo(`${label} was deleted`);
    return true;
  }

  // Accepting an invite is the same as joining the channel
  function acceptInvite(name: string): Promise<boolean> {
    return joinChannel(name, false);
  }

  async function declineInvite(name: string) {
    const channel = findChannel(name);
    if (!channel) {
      return;
    }
    await client.api.channels.decline({ params: { id: channel.id } });
    removeChannel(name);
  }

  // Everything else uses ids, so only the places that still store
  // a nick follow the rename. Old "@nick" mentions in texts stay as written.
  function renameNick(oldNick: string, newNick: string) {
    const rename = (nick: string) => (nick === oldNick ? newNick : nick);

    for (const user of users.value) {
      user.nickname = rename(user.nickname);
    }

    for (const list of [
      ...Object.values(messagesByChannel.value),
      ...Object.values(serverHistory)
    ]) {
      for (const message of list) {
        message.authorNick = rename(message.authorNick);
      }
    }
  }

  function invite(channel: Channel, user: User) {
    const nick = user.nickname;
    if (channel.isPrivate && !isAdmin(channel)) {
      notifyError("Only the admin can invite to a private channel");
      return;
    }

    const banned = bans.value[channel.name] ?? [];
    if (banned.includes(user.id)) {
      if (!isAdmin(channel)) {
        notifyError(`${nick} is banned, only the admin can let them back`);
        return;
      }
      bans.value[channel.name] = banned.filter(id => id !== user.id);
    }

    const current = members.value[channel.name] ?? [];
    if (current.includes(user.id)) {
      notifyInfo(`${nick} is already a member`);
      return;
    }
    members.value[channel.name] = [...current, user.id];
    notifyInfo(`${nick} was invited to #${channel.name}`);
  }

  function revoke(channel: Channel, user: User) {
    if (!channel.isPrivate || !isAdmin(channel)) {
      notifyError("/revoke works only for the admin of a private channel");
      return;
    }
    removeMember(channel.name, user.id);
    notifyInfo(`${user.nickname} was removed from #${channel.name}`);
  }

  function kick(channel: Channel, user: User) {
    const myId = auth.userId;
    if (!myId) {
      return;
    }
    const nick = user.nickname;
    if (channel.isPrivate) {
      notifyError("/kick works only in public channels, use /revoke");
      return;
    }
    if (user.id === myId || user.id === channel.creator.id) {
      notifyError(`You can't kick ${nick}`);
      return;
    }
    if (!members.value[channel.name]?.includes(user.id)) {
      notifyError(`${nick} is not a member of #${channel.name}`);
      return;
    }

    // Admin kick = permanent ban right away
    if (isAdmin(channel)) {
      ban(channel.name, user);
      return;
    }

    const votes = (kickVotes.value[channel.name] ??= {});
    const voters = (votes[user.id] ??= []);
    if (!voters.includes(myId)) {
      voters.push(myId);
    }
    // Pretend another member already voted too, so the ban can be demoed
    const otherVoter = members.value[channel.name]?.find(
      id => id !== user.id && !voters.includes(id)
    );
    if (voters.length < KICKS_TO_BAN - 1 && otherVoter) {
      voters.push(otherVoter);
    }

    if (voters.length >= KICKS_TO_BAN) {
      ban(channel.name, user);
    } else {
      notifyInfo(`Kick vote for ${nick}: ${voters.length}/${KICKS_TO_BAN}`);
    }
  }

  function ban(channelName: string, user: User) {
    removeMember(channelName, user.id);
    bans.value[channelName] = [...(bans.value[channelName] ?? []), user.id];
    notifyInfo(`${user.nickname} is permanently banned from #${channelName}`);
  }

  function removeMember(channelName: string, userId: string) {
    members.value[channelName] = (members.value[channelName] ?? []).filter(
      id => id !== userId
    );
  }

  async function runCommand(
    input: string,
    channelName: string | null
  ): Promise<CommandResult> {
    const command = parseCommand(input);
    if (!command) {
      return {};
    }
    const [firstArg, secondArg] = command.args;

    if (command.name === "join") {
      if (!firstArg) {
        notifyError("Usage: /join channelName [private]");
        return {};
      }
      const ok = await joinChannel(firstArg, secondArg === "private");
      return ok ? { navigateTo: `/channels/${firstArg}` } : {};
    }

    // Every other command needs an open channel
    const channel = channelName ? findChannel(channelName) : undefined;
    if (!channel) {
      notifyError("Open a channel first");
      return {};
    }

    // A direct chat always stays between the two of you
    const isMembership = ["invite", "revoke", "kick"].includes(command.name);
    if (channel.isDirect && isMembership) {
      notifyError(`/${command.name} is not available in a direct chat`);
      return {};
    }

    switch (command.name) {
      case "invite":
      case "revoke":
      case "kick": {
        if (!firstArg) {
          notifyError(`Usage: /${command.name} nickName`);
          return {};
        }
        // the command names a nick, from here on we work with the user
        const user = findUser(firstArg);
        if (!user) {
          notifyError(`User ${firstArg} does not exist`);
        } else if (command.name === "invite") {
          invite(channel, user);
        } else if (command.name === "revoke") {
          revoke(channel, user);
        } else {
          kick(channel, user);
        }
        return {};
      }
      case "list":
        return { showMembers: true };
      case "cancel":
        return (await leaveChannel(channel.name))
          ? { navigateTo: "/channels" }
          : {};
      case "quit":
        return (await deleteChannel(channel.name))
          ? { navigateTo: "/channels" }
          : {};
      default:
        notifyError(`Unknown command /${command.name}`);
        return {};
    }
  }

  // Fake "someone is typing" so the indicator can be demoed.
  // Returns a function that stops the simulation.
  function simulateTyping(): () => void {
    const drafts = [
      { nickName: "ed", text: "I think we should move the meeting to Friday" },
      { nickName: "zuzka", text: "@alex did you see my message?" }
    ];
    let tick = 0;

    const timer = setInterval(() => {
      tick++;
      // each draft grows one character per tick, then restarts after a pause
      typing.value = drafts
        .map((draft, i) => {
          const length = (tick + i * 15) % (draft.text.length + 20);
          return {
            nickName: draft.nickName,
            text: draft.text.slice(0, length)
          };
        })
        .filter(draft => draft.text.length > 0);
    }, 200);

    return () => {
      clearInterval(timer);
      typing.value = [];
    };
  }

  return {
    users,
    channels,
    isLoadingChannels,
    fetchChannels,
    members,
    notifyMentionsOnly,
    typing,
    messagesByChannel,
    sortedChannels,
    findChannel,
    findUser,
    directPartner,
    channelTitle,
    channelLabel,
    isAdmin,
    fetchMembers,
    loadOlder,
    sendMessage,
    joinChannel,
    leaveChannel,
    deleteChannel,
    acceptInvite,
    startDirectChat,
    userStats,
    declineInvite,
    renameNick,
    runCommand,
    simulateTyping
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot));
}
