// "hi @ed !" -> ["hi ", "@ed", " !"]
// The same rule decides what is highlighted and who gets a mention notification
export function splitMentions(content: string): string[] {
  return content.split(/(@[\w.-]+)/).filter(part => part !== "");
}

export function mentions(content: string, nickname: string | undefined) {
  return !!nickname && splitMentions(content).includes(`@${nickname}`);
}
