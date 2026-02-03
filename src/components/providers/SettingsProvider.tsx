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
    cssName: string
}

export type UserSettings = {
    theme: Theme
    language: "en" | "it" | "fi"
}

export const THEMES: Theme[] = [
    {name: "Light", cssName: "light-theme"},
    {name: "Dark", cssName: "dark-theme"}
]

const defaultUserSettings: UserSettings = {
    theme: THEMES[0],
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
    <UserSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </UserSettingsContext.Provider>
  )
}