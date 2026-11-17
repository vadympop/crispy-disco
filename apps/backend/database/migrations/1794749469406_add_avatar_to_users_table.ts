import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The picture itself is a file (storage/uploads/<userId>/avatar.jpg).
 * The column says whether there is one and when it last changed,
 * which also busts the browser cache after a new upload
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('avatar_updated_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('avatar_updated_at')
    })
  }
}
