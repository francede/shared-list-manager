import { useContext } from "react"
import { UserSettingsContext } from "@/components/providers/SettingsProvider"

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (!context) {
    throw new Error(
      "useUserSettings must be used within a UserSettingsProvider"
    )
  }
  return context
}