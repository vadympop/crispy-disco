import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import { Notify } from "quasar";
import type { Channel, Message, PublicProfile } from "@/types/api";
import type { RemovedReason } from "@cisco-disco/backend/realtime";
import { client } from "@/lib/client";
import { useAuthStore } from "@/stores/auth-store";
import { parseCommand } from "@/lib/commands";

// messages per history request (the infinite scroll loads one page at a time)
const PAGE_SIZE = 30;
// a draft disappears when its author sends no update for this long
// (closed the tab, lost the connection, or just stopped typing)
const DRAFT_TIMEOUT_MS = 5000;

// What another member is writing in a channel right now
export interface TypingDraft {
  userId: string;
  nickname: string;
  text: string;
}

// What the UI should do after a command ran
export interface CommandResult {
  navigateTo?: string;
  showMembers?: boolean;
}

function notifyError(message: string) {
  Notify.create({ type: "negative", message });
}

function notifyInfo(message: string) {
  Notify.create({ type: "info", message });
}

export const useChatStore = defineStore("chat", () => {
  const auth = useAuthStore();
  // Filled from the API by fetchChannels()
  const channels = ref<Channel[]>([]);
  const isLoadingChannels = ref(false);
  const notifyMentionsOnly = ref(false);
  // channel id -> the drafts of the other members, in the order they started
  const drafts = ref<Record<string, TypingDraft[]>>({});
  // "channelId:userId" -> the timer that removes that draft, not reactive
  const draftTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // channel id -> the loaded part of its history, oldest first
  const messagesByChannel = ref<Record<string, Message[]>>({});

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

  // The loaded messages of a channel, oldest first
  function messagesOf(channelName: string): Message[] {
    const channel = findChannel(channelName);
    return channel ? (messagesByChannel.value[channel.id] ?? []) : [];
  }

  // Loads the page before the oldest loaded message, or the newest page
  // the first time. Returns false when the channel has no older messages.
  async function loadOlder(channelName: string): Promise<boolean> {
    const channel = findChannel(channelName);
    if (!channel) {
      return false;
    }
    const before = messagesOf(channelName)[0]?.cursor ?? undefined;

    const result = await client.api.messages.index({
      params: { id: channel.id },
      query: { before, limit: PAGE_SIZE }
    });
    const { messages, hasMore } = result.data;

    // read again after the request: the socket may have added a message,
    // which can then also be on this page
    const loaded = messagesByChannel.value[channel.id] ?? [];
    const loadedIds = new Set(loaded.map(message => message.id));
    messagesByChannel.value[channel.id] = [
      ...messages.filter(message => !loadedIds.has(message.id)),
      ...loaded
    ];
    return hasMore;
  }

  // Adds a new message at the end of its channel, once. Used for my own
  // messages and for the ones that arrive over the socket.
  function addMessage(message: Message) {
    const loaded = messagesByChannel.value[message.channelId] ?? [];
    if (loaded.some(m => m.id === message.id)) {
      return;
    }
    messagesByChannel.value[message.channelId] = [...loaded, message];
    // the draft became this message
    removeDraft(message.channelId, message.author.id);

    const channel = channels.value.find(c => c.id === message.channelId);
    if (channel && message.createdAt) {
      channel.lastMessageAt = message.createdAt;
    }
  }

  // message:updated, the author edited a message
  function onMessageUpdated(message: Message) {
    const loaded = messagesByChannel.value[message.channelId] ?? [];
    const index = loaded.findIndex(m => m.id === message.id);
    if (index !== -1) {
      loaded[index] = message;
    }
  }

  // message:deleted, the author or the admin deleted a message
  function onMessageDeleted(channelId: string, messageId: string) {
    const loaded = messagesByChannel.value[channelId];
    if (loaded) {
      messagesByChannel.value[channelId] = loaded.filter(
        m => m.id !== messageId
      );
    }
  }

  async function sendMessage(channelName: string, text: string) {
    const channel = findChannel(channelName);
    if (!channel || channel.invited) {
      notifyError("You can only post in channels you are a member of");
      return;
    }

    const result = await client.api.messages.store({
      params: { id: channel.id },
      body: { content: text }
    });
    addMessage(result.data);
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

  function removeChannel(name: string) {
    channels.value = channels.value.filter(channel => channel.name !== name);
  }

  // Local cleanup once the user is no longer in the channel. Returns false
  // when it was already gone: after /quit the server also sends
  // channel:deleted to me, and whichever comes first shows the notice.
  function forgetChannel(name: string): boolean {
    const channel = findChannel(name);
    if (!channel) {
      return false;
    }
    delete messagesByChannel.value[channel.id];
    for (const draft of drafts.value[channel.id] ?? []) {
      removeDraft(channel.id, draft.userId);
    }
    removeChannel(name);
    return true;
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
    if (forgetChannel(name)) {
      notifyInfo(channelDeleted ? `${label} was deleted` : `You left ${label}`);
    }
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
    if (forgetChannel(name)) {
      notifyInfo(`${label} was deleted`);
    }
    return true;
  }

  // Socket events: the server tells me about changes other people made.
  // The ones that remove a channel return its name, so the caller can
  // leave its page if it is open.

  // channel:invited, shown highlighted at the top of the list
  function onChannelInvited(channel: Channel) {
    upsertChannel(channel);
    notifyInfo(`You were invited to #${channel.name}`);
  }

  // channel:added, someone opened a direct chat with me
  function onChannelAdded(channel: Channel) {
    upsertChannel(channel);
  }

  // channel:removed, I was revoked (also an invite taken back) or banned
  function onChannelRemoved(
    channelId: string,
    reason: RemovedReason
  ): string | undefined {
    const channel = channels.value.find(c => c.id === channelId);
    if (!channel) {
      return undefined;
    }
    forgetChannel(channel.name);
    notifyInfo(
      reason === "banned"
        ? `You were banned from #${channel.name}`
        : `You were removed from #${channel.name}`
    );
    return channel.name;
  }

  // channel:deleted, the admin quit or left, or the channel expired
  function onChannelDeleted(channelId: string): string | undefined {
    const channel = channels.value.find(c => c.id === channelId);
    if (!channel) {
      return undefined;
    }
    // read it before the channel is gone, like in leaveChannel
    const label = channelLabel(channel.name);
    forgetChannel(channel.name);
    notifyInfo(`${label} was deleted`);
    return channel.name;
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

  // Everything else uses ids, so only the loaded message authors follow
  // the rename. Old "@nick" mentions in texts stay as written.
  function renameNick(oldNick: string, newNick: string) {
    const rename = (nick: string) => (nick === oldNick ? newNick : nick);

    for (const list of Object.values(messagesByChannel.value)) {
      for (const message of list) {
        message.author.nickname = rename(message.author.nickname);
      }
    }
  }

  // The moderation commands send the nick as typed. The server finds the
  // user and checks the rules (admin rights, channel type, bans, votes),
  // its error messages are shown by the api-errors boot file.

  // /invite: the admin can also invite a banned user, which lifts the ban
  async function invite(channel: Channel, nickname: string) {
    const result = await client.api.channels.invite({
      params: { id: channel.id },
      body: { nickname }
    });
    notifyInfo(
      result.data.unbanned
        ? `${nickname} is no longer banned and was invited to #${channel.name}`
        : `${nickname} was invited to #${channel.name}`
    );
  }

  // /revoke: the admin removes a member or an invite of a private channel
  async function revoke(channel: Channel, nickname: string) {
    await client.api.channels.revoke({
      params: { id: channel.id },
      body: { nickname }
    });
    notifyInfo(`${nickname} was removed from #${channel.name}`);
  }

  // /kick: a vote from a member, an instant permanent ban from the admin
  async function kick(channel: Channel, nickname: string) {
    const result = await client.api.channels.kick({
      params: { id: channel.id },
      body: { nickname }
    });
    const { banned, votes, required } = result.data;
    notifyInfo(
      banned
        ? `${nickname} is permanently banned from #${channel.name}`
        : `Kick vote for ${nickname}: ${votes}/${required}`
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
        if (command.name === "invite") {
          await invite(channel, firstArg);
        } else if (command.name === "revoke") {
          await revoke(channel, firstArg);
        } else {
          await kick(channel, firstArg);
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

  // The drafts others are writing in a channel ("X is typing")
  function draftsOf(channelName: string): TypingDraft[] {
    const channel = findChannel(channelName);
    return channel ? (drafts.value[channel.id] ?? []) : [];
  }

  // typing: the whole draft text, an empty one means they stopped
  // (sent the message or deleted the text)
  function onTyping(
    channelId: string,
    user: { id: string; nickname: string },
    text: string
  ) {
    // my own drafts from another tab
    if (user.id === auth.userId) {
      return;
    }
    if (text === "") {
      removeDraft(channelId, user.id);
      return;
    }

    // read it back through the ref: the array `??=` returns is not the
    // reactive proxy, and a push to it would not update the indicator
    drafts.value[channelId] ??= [];
    const list = drafts.value[channelId];
    const draft = list.find(d => d.userId === user.id);
    if (draft) {
      draft.text = text;
    } else {
      list.push({ userId: user.id, nickname: user.nickname, text });
    }

    // every update starts the timeout again
    const key = `${channelId}:${user.id}`;
    clearTimeout(draftTimers.get(key));
    draftTimers.set(
      key,
      setTimeout(() => removeDraft(channelId, user.id), DRAFT_TIMEOUT_MS)
    );
  }

  function removeDraft(channelId: string, userId: string) {
    const key = `${channelId}:${userId}`;
    clearTimeout(draftTimers.get(key));
    draftTimers.delete(key);

    const list = drafts.value[channelId];
    if (list) {
      drafts.value[channelId] = list.filter(d => d.userId !== userId);
    }
  }

  // Forgets everything of the previous user after logout
  function reset() {
    channels.value = [];
    messagesByChannel.value = {};
    for (const timer of draftTimers.values()) {
      clearTimeout(timer);
    }
    draftTimers.clear();
    drafts.value = {};
    notifyMentionsOnly.value = false;
  }

  return {
    channels,
    isLoadingChannels,
    fetchChannels,
    notifyMentionsOnly,
    messagesByChannel,
    sortedChannels,
    findChannel,
    directPartner,
    channelTitle,
    channelLabel,
    isAdmin,
    fetchMembers,
    messagesOf,
    loadOlder,
    addMessage,
    onMessageUpdated,
    onMessageDeleted,
    sendMessage,
    joinChannel,
    leaveChannel,
    deleteChannel,
    acceptInvite,
    startDirectChat,
    declineInvite,
    renameNick,
    runCommand,
    onChannelInvited,
    onChannelAdded,
    onChannelRemoved,
    onChannelDeleted,
    draftsOf,
    onTyping,
    reset
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot));
}
