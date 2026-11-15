import { BaseTransformer } from '@adonisjs/core/transformers'
import type Channel from '#models/channel'

export default class ChannelSummaryTransformer extends BaseTransformer<Channel> {
  toObject() {
    return this.pick(this.resource, ['id', 'name'])
  }
}
