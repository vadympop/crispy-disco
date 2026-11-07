import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  // The history cursor carries created_at, and JavaScript dates only hold
  // milliseconds, so the column stores exactly what the cursor can express
  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('created_at', { precision: 3 }).alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('created_at').alter()
    })
  }
}
