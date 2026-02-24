import { registerAgentHandlers } from './agent'
import { registerBrokerHandlers } from './broker'
import { registerChatHandlers } from './chat'
import { registerLogsHandlers } from './logs'
import { registerSettingsHandlers } from './settings'

export function registerIpcHandlers(): void {
  registerLogsHandlers()
  registerSettingsHandlers()
  registerAgentHandlers()
  registerBrokerHandlers()
  registerChatHandlers()
}
