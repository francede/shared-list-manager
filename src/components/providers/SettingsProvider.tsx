"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"

export type Theme = {
    name: string
    colors: any //TODO
}

export type UserSettings = {
    theme: Theme
    language: "en" | "it" | "fi"
}

const defaultUserSettings: UserSettings = {
    theme: {name: "light", colors: "colors"},
    language: "en"
}

type UserSettingsContextValue = {
  settings: UserSettings
  updateSettings: (updates: Partial<UserSettings>) => void
}

export const UserSettingsContext = createContext<UserSettingsContextValue | null>(null)

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("user-settings")
    if (stored) {
      setSettings({ ...defaultUserSettings, ...JSON.parse(stored) })
    }
  }, [])

  // Persist on change
  useEffect(() => {
    localStorage.setItem("user-settings", JSON.stringify(settings))
  }, [settings])

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  return (
    <UserSettingsContext.Provider
      value={{ settings, updateSettings }}
    >
      {children}
    </UserSettingsContext.Provider>
  )
}