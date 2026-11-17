import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'message_reactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Lucid models don't support composite primary keys
      table.uuid('id').primary()
      table
        .uuid('message_id')
        .notNullable()
        .references('id')
        .inTable('messages')
        .onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      // a key from the fixed list in #validators/message (thumbs_up, heart, ...)
      table.string('reaction', 32).notNullable()

      table.timestamp('created_at')

      // one of each reaction per user; message_id comes first, so loading
      // the reactions of a page of messages uses this index
      table.unique(['message_id', 'user_id', 'reaction'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
