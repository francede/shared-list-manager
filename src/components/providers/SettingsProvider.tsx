"use client"

import React, {
  createContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { Language, LANGUAGES } from "./TranslationProvider"

export type Theme = {
    name: string
    cssName: string
}

export type UserSettings = {
    theme: Theme
    language: Language
    avatar: Avatar
}

export type Avatar = {
    color: string
    initial: string
}

export const LIGHT_THEME: Theme = {name: "Light", cssName: "light-theme"}
export const DARK_THEME: Theme = {name: "Dark", cssName: "dark-theme"}


const defaultUserSettings: UserSettings = {
    theme: LIGHT_THEME,
    language: "gb",
    avatar: {
      color: "#FFFFFF",
      initial: "X"
    }
}

type UserSettingsContextValue = {
  settings: UserSettings
  updateSettings: (updates: Partial<UserSettings>) => void
  updateTheme: (theme: "light" | "dark") => void
}

export const UserSettingsContext = createContext<UserSettingsContextValue | null>(null)

export function UserSettingsProvider(props: UserSettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored = localStorage.getItem("user-settings")
    const parsed = stored && JSON.parse(stored)
    if(!parsed || !LANGUAGES.includes(parsed.language)){
      return defaultUserSettings
    }
    return stored ? { ...defaultUserSettings, ...JSON.parse(stored) } : defaultUserSettings
  })

  const [themeInit, setThemeInit] = useState(false);

  useEffect(() => {
    localStorage.setItem("user-settings", JSON.stringify(settings))
    props.onThemeChange && props.onThemeChange(settings.theme)

    const root = document.documentElement;
    let timeout = null;

    if(themeInit){
      root.classList.add("theme-transition")

      timeout = setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 250);
    }

    setThemeInit(true)
    
    root.classList.remove('light-theme', 'dark-theme');
    root.classList.add(settings.theme.cssName)

    if(timeout !== null) return () => clearTimeout(timeout)
  }, [settings])

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const updateTheme = (theme: "light" | "dark") => {
    if(theme === "light"){
      updateSettings({theme: LIGHT_THEME})
    }
    if(theme === "dark"){
      updateSettings({theme: DARK_THEME})
    }
  }

  if(!themeInit) return null

  return (
    <UserSettingsContext.Provider value={{ settings, updateSettings, updateTheme }}>
      {props.children}
    </UserSettingsContext.Provider>
  )
}

export type UserSettingsProviderProps = {
  children: ReactNode
  onThemeChange?: (theme: Theme) => void
}