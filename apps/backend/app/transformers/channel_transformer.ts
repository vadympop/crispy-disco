import { BaseTransformer } from '@adonisjs/core/transformers'
import type Channel from '#models/channel'

export default class ChannelTransformer extends BaseTransformer<Channel> {
  toObject() {
    const channel = this.resource

    return {
      ...this.pick(channel, ['id', 'name']),
      isPrivate: channel.type === 'private',
      adminNick: channel.creator.nickname,
      invited: channel.$extras.pivot_status === 'invited',
      lastMessageAt: (channel.lastActivityAt ?? channel.createdAt)?.toISO() ?? '',
    }
  }
}
