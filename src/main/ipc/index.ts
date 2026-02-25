import { registerAgentHandlers } from './agent'
import { registerAgentsHandlers } from './agents'
import { registerBrokerHandlers } from './broker'
import { registerChatHandlers } from './chat'
import { registerLogsHandlers } from './logs'
import { registerMemoryHandlers } from './memory'
import { registerModelsHandlers } from './models'
import { registerScheduleHandlers } from './schedule'
import { registerSecurityHandlers } from './security'
import { registerSettingsHandlers } from './settings'
import { registerTailscaleHandlers } from './tailscale'
import { registerTelegramHandlers } from './telegram'

export function registerIpcHandlers(): void {
  registerLogsHandlers()
  registerSettingsHandlers()
  registerAgentHandlers()
  registerAgentsHandlers()
  registerBrokerHandlers()
  registerChatHandlers()
  registerTelegramHandlers()
  registerSecurityHandlers()
  registerTailscaleHandlers()
  registerModelsHandlers()
  registerMemoryHandlers()
  registerScheduleHandlers()
}
