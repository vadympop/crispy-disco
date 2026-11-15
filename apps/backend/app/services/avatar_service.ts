import { rm } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { DateTime } from 'luxon'
import type User from '#models/user'

/**
 * Profile pictures live on disk, one folder per user:
 * storage/uploads/<userId>/avatar.jpg
 * The users.avatar_updated_at column says whether there is one.
 */
export default class AvatarService {
  static readonly FILE_NAME = 'avatar.jpg'

  folderOf(userId: string) {
    return app.makePath('storage', 'uploads', userId)
  }

  pathOf(userId: string) {
    return app.makePath('storage', 'uploads', userId, AvatarService.FILE_NAME)
  }

  // https://docs.adonisjs.com/guides/basics/file-uploads#moving-files
  async save(user: User, file: MultipartFile) {
    await file.move(this.folderOf(user.id), {
      name: AvatarService.FILE_NAME,
      overwrite: true,
    })
    user.avatarUpdatedAt = DateTime.now()
    await user.save()
  }

  async remove(user: User) {
    await rm(this.folderOf(user.id), { recursive: true, force: true })
    user.avatarUpdatedAt = null
    await user.save()
  }
}
