import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import { Notify } from "quasar";
import type {
  Channel,
  Message,
  TypingDraft,
  User,
  UserStatus
} from "@/types/chat";
import { parseCommand } from "@/lib/commands";
import {
  generateHistory,
  mockChannels,
  mockMe,
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

function notifyError(message: string) {
  Notify.create({ type: "negative", message });
}

function notifyInfo(message: string) {
  Notify.create({ type: "info", message });
}

export const useChatStore = defineStore("chat", () => {
  const me = ref<User>({ ...mockMe });
  const users = ref<User[]>(mockUsers.map(user => ({ ...user })));
  const channels = ref<Channel[]>(mockChannels.map(c => ({ ...c })));
  const otherChannels = ref<Channel[]>(mockOtherChannels.map(c => ({ ...c })));
  const members = ref<Record<string, string[]>>(structuredClone(mockMembers));
  const bans = ref<Record<string, string[]>>({});
  // channel -> kicked nick -> nicks of members who voted for the kick
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

  function findChannel(name: string) {
    return channels.value.find(channel => channel.name === name);
  }

  function findUser(nickName: string) {
    return users.value.find(user => user.nickName === nickName);
  }

  function isAdmin(channel: Channel) {
    return channel.adminNick === me.value.nickName;
  }

  function membersOf(channelName: string): User[] {
    return (members.value[channelName] ?? [])
      .map(nick => (nick === me.value.nickName ? me.value : findUser(nick)))
      .filter((user): user is User => user !== undefined);
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
    const channel = findChannel(channelName);
    if (!channel || channel.invited) {
      notifyError("You can only post in channels you are a member of");
      return;
    }

    const message: Message = {
      id: Date.now(),
      channel: channelName,
      authorNick: me.value.nickName,
      text,
      createdAt: new Date().toISOString()
    };
    const loaded = messagesByChannel.value[channelName] ?? [];
    messagesByChannel.value[channelName] = [...loaded, message];
    channel.lastMessageAt = message.createdAt;
  }

  function joinChannel(name: string, isPrivate: boolean): boolean {
    const mine = findChannel(name);
    if (mine) {
      if (mine.invited) {
        acceptInvite(name);
      }
      return true;
    }

    if (bans.value[name]?.includes(me.value.nickName)) {
      notifyError(`You are banned from #${name}`);
      return false;
    }

    const existing = otherChannels.value.find(c => c.name === name);
    if (existing) {
      if (existing.isPrivate) {
        notifyError(`#${name} is private, you need an invite`);
        return false;
      }
      otherChannels.value = otherChannels.value.filter(c => c !== existing);
      channels.value.push(existing);
      members.value[name] = [...(members.value[name] ?? []), me.value.nickName];
      notifyInfo(`Joined #${name}`);
      return true;
    }

    // The channel doesn't exist yet, so the user creates it and becomes admin
    channels.value.push({
      name,
      isPrivate,
      adminNick: me.value.nickName,
      invited: false,
      lastMessageAt: new Date().toISOString()
    });
    members.value[name] = [me.value.nickName];
    notifyInfo(`Created ${isPrivate ? "private" : "public"} channel #${name}`);
    return true;
  }

  function removeChannel(name: string) {
    channels.value = channels.value.filter(channel => channel.name !== name);
  }

  function leaveChannel(name: string) {
    const channel = findChannel(name);
    if (!channel) {
      return;
    }

    // When the admin leaves, the channel ceases to exist
    if (isAdmin(channel)) {
      deleteChannel(name);
      return;
    }

    removeChannel(name);
    members.value[name] = (members.value[name] ?? []).filter(
      nick => nick !== me.value.nickName
    );
    otherChannels.value.push(channel);
    notifyInfo(`You left #${name}`);
  }

  function deleteChannel(name: string) {
    const channel = findChannel(name);
    if (!channel) {
      return;
    }
    if (!isAdmin(channel)) {
      notifyError("Only the admin can delete the channel");
      return;
    }

    removeChannel(name);
    delete members.value[name];
    delete messagesByChannel.value[name];
    notifyInfo(`#${name} was deleted`);
  }

  function acceptInvite(name: string) {
    const channel = findChannel(name);
    if (channel) {
      channel.invited = false;
      members.value[name] = [...(members.value[name] ?? []), me.value.nickName];
    }
  }

  function declineInvite(name: string) {
    removeChannel(name);
  }

  function setStatus(status: UserStatus) {
    me.value.status = status;
  }

  function invite(channel: Channel, nick: string) {
    if (!findUser(nick)) {
      notifyError(`User ${nick} does not exist`);
      return;
    }
    if (channel.isPrivate && !isAdmin(channel)) {
      notifyError("Only the admin can invite to a private channel");
      return;
    }

    const banned = bans.value[channel.name] ?? [];
    if (banned.includes(nick)) {
      if (!isAdmin(channel)) {
        notifyError(`${nick} is banned, only the admin can let them back`);
        return;
      }
      bans.value[channel.name] = banned.filter(n => n !== nick);
    }

    const current = members.value[channel.name] ?? [];
    if (current.includes(nick)) {
      notifyInfo(`${nick} is already a member`);
      return;
    }
    members.value[channel.name] = [...current, nick];
    notifyInfo(`${nick} was invited to #${channel.name}`);
  }

  function revoke(channel: Channel, nick: string) {
    if (!channel.isPrivate || !isAdmin(channel)) {
      notifyError("/revoke works only for the admin of a private channel");
      return;
    }
    removeMember(channel.name, nick);
    notifyInfo(`${nick} was removed from #${channel.name}`);
  }

  function kick(channel: Channel, nick: string) {
    if (channel.isPrivate) {
      notifyError("/kick works only in public channels, use /revoke");
      return;
    }
    if (nick === me.value.nickName || nick === channel.adminNick) {
      notifyError(`You can't kick ${nick}`);
      return;
    }
    if (!members.value[channel.name]?.includes(nick)) {
      notifyError(`${nick} is not a member of #${channel.name}`);
      return;
    }

    // Admin kick = permanent ban right away
    if (isAdmin(channel)) {
      ban(channel.name, nick);
      return;
    }

    const votes = (kickVotes.value[channel.name] ??= {});
    const voters = (votes[nick] ??= []);
    if (!voters.includes(me.value.nickName)) {
      voters.push(me.value.nickName);
    }
    // Pretend another member already voted too, so the ban can be demoed
    const otherVoter = members.value[channel.name]?.find(
      n => n !== nick && !voters.includes(n)
    );
    if (voters.length < KICKS_TO_BAN - 1 && otherVoter) {
      voters.push(otherVoter);
    }

    if (voters.length >= KICKS_TO_BAN) {
      ban(channel.name, nick);
    } else {
      notifyInfo(`Kick vote for ${nick}: ${voters.length}/${KICKS_TO_BAN}`);
    }
  }

  function ban(channelName: string, nick: string) {
    removeMember(channelName, nick);
    bans.value[channelName] = [...(bans.value[channelName] ?? []), nick];
    notifyInfo(`${nick} is permanently banned from #${channelName}`);
  }

  function removeMember(channelName: string, nick: string) {
    members.value[channelName] = (members.value[channelName] ?? []).filter(
      n => n !== nick
    );
  }

  function runCommand(
    input: string,
    channelName: string | null
  ): CommandResult {
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
      const ok = joinChannel(firstArg, secondArg === "private");
      return ok ? { navigateTo: `/channels/${firstArg}` } : {};
    }

    // Every other command needs an open channel
    const channel = channelName ? findChannel(channelName) : undefined;
    if (!channel) {
      notifyError("Open a channel first");
      return {};
    }

    switch (command.name) {
      case "invite":
      case "revoke":
      case "kick":
        if (!firstArg) {
          notifyError(`Usage: /${command.name} nickName`);
        } else if (command.name === "invite") {
          invite(channel, firstArg);
        } else if (command.name === "revoke") {
          revoke(channel, firstArg);
        } else {
          kick(channel, firstArg);
        }
        return {};
      case "list":
        return { showMembers: true };
      case "cancel":
        leaveChannel(channel.name);
        return { navigateTo: "/channels" };
      case "quit":
        if (!isAdmin(channel)) {
          notifyError("Only the admin can close the channel");
          return {};
        }
        deleteChannel(channel.name);
        return { navigateTo: "/channels" };
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
    me,
    users,
    channels,
    members,
    notifyMentionsOnly,
    typing,
    messagesByChannel,
    sortedChannels,
    findChannel,
    isAdmin,
    membersOf,
    loadOlder,
    sendMessage,
    joinChannel,
    leaveChannel,
    deleteChannel,
    acceptInvite,
    declineInvite,
    setStatus,
    runCommand,
    simulateTyping
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot));
}
