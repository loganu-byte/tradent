/// <reference types="vite/client" />

import type { IElectronAPI } from './types'

declare global {
  interface Window {
    api: IElectronAPI
  }
}
