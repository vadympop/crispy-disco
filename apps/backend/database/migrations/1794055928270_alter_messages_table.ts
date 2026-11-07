import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['channel_id', 'created_at', 'id'], 'messages_channel_history_index')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['channel_id', 'created_at', 'id'], 'messages_channel_history_index')
    })
  }
}
