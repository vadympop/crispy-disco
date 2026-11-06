import { BaseTransformer } from '@adonisjs/core/transformers'
import type Channel from '#models/channel'
import UserSummaryTransformer from '#transformers/user_summary_transformer'

export default class ChannelTransformer extends BaseTransformer<Channel> {
  toObject() {
    const channel = this.resource

    return {
      ...this.pick(channel, ['id', 'name']),
      isPrivate: channel.type !== 'public',
      isDirect: channel.isDirect,
      // loaded only for direct chats, where the frontend needs the other person
      members: UserSummaryTransformer.transform(this.whenLoaded(channel.members)),
      creator: UserSummaryTransformer.transform(channel.creator),
      invited: channel.$extras.pivot_status === 'invited',
      lastMessageAt: (channel.lastActivityAt ?? channel.createdAt)?.toISO() ?? '',
    }
  }
}
