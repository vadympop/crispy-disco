import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      // direct = a private chat between exactly two users
      table.enu('type', ['public', 'private', 'direct']).notNullable()
      table
        .uuid('creator_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('name', 50).notNullable().unique()
      table.timestamp('last_activity_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
