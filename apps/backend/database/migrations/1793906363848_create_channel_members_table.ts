import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.enu('status', ['member', 'invited', 'banned']).notNullable().defaultTo('member')

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.primary(['channel_id', 'user_id'])
      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
