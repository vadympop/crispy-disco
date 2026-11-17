import { rm } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import type { MultipartFile } from '@adonisjs/core/bodyparser'

/**
 * Profile pictures live on disk, one folder per user:
 * storage/uploads/<userId>/avatar.jpg
 * Only the files are handled here, users.avatar_updated_at is set by UserService.
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
  async store(userId: string, file: MultipartFile) {
    await file.move(this.folderOf(userId), {
      name: AvatarService.FILE_NAME,
      overwrite: true,
    })
  }

  async delete(userId: string) {
    await rm(this.folderOf(userId), { recursive: true, force: true })
  }
}
