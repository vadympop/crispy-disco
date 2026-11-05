import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enu('status', ['online', 'offline', 'dnd']).defaultTo('online').notNullable()
      table.boolean('is_receiving_mentions').defaultTo(false).notNullable()
      table.string('nickname', 50).unique().notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['nickname'])
      table.dropColumn('status')
      table.dropColumn('is_receiving_mentions')
      table.dropColumn('nickname')
    })
  }
}
