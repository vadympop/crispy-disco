import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'kick_votes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Lucid models don't support composite primary keys
      table.uuid('id').primary()
      table
        .uuid('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table
        .uuid('target_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .uuid('voter_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.timestamp('created_at')

      table.unique(['channel_id', 'target_id', 'voter_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
