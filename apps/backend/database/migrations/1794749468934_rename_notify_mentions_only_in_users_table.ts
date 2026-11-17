import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * "is_receiving_mentions" read like the opposite of what it stores:
 * true means the user only wants notifications for messages mentioning them
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('is_receiving_mentions', 'notify_mentions_only')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('notify_mentions_only', 'is_receiving_mentions')
    })
  }
}
