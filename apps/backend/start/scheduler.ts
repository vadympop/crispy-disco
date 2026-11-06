import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import ChannelService, { CHANNEL_EXPIRY_DAYS } from '#services/channel_service'

const ONE_HOUR = 60 * 60 * 1000

async function deleteInactiveChannels() {
  try {
    const service = await app.container.make(ChannelService)
    const deleted = await service.deleteInactive()
    if (deleted.length > 0) {
      logger.info(
        `Deleted ${deleted.length} channel(s) inactive for ${CHANNEL_EXPIRY_DAYS} days: ${deleted.join(', ')}`
      )
    }
  } catch (error) {
    logger.error({ err: error }, 'Inactive channel cleanup failed')
  }
}

let timer: NodeJS.Timeout | undefined

app.ready(() => {
  void deleteInactiveChannels()
  timer = setInterval(deleteInactiveChannels, ONE_HOUR)
})

app.terminating(() => clearInterval(timer))
