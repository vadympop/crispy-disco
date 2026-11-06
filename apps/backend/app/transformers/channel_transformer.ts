import { BaseTransformer } from '@adonisjs/core/transformers'
import type Channel from '#models/channel'
import UserSummaryTransformer from '#transformers/user_summary_transformer'

export default class ChannelTransformer extends BaseTransformer<Channel> {
  toObject() {
    const channel = this.resource

    return {
      ...this.pick(channel, ['id', 'name']),
      isPrivate: channel.type === 'private',
      // the creator is the admin; ChannelService always preloads it
      creator: UserSummaryTransformer.transform(channel.creator),
      invited: channel.$extras.pivot_status === 'invited',
      lastMessageAt: (channel.lastActivityAt ?? channel.createdAt)?.toISO() ?? '',
    }
  }
}
