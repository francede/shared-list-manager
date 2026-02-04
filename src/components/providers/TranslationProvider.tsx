"use client"

import React, {
  createContext,
  useEffect,
  useState,
  ReactNode,
  useContext,
} from "react"
import { useUserSettings } from "../hooks/useUserSettings";

type Translations = Record<string, any>;

type TranslationContextValue = {
    translations: Translations
}

export const LANGUAGES = ["gb", "fi", "it"] as const
export type Language = typeof LANGUAGES[number]
const translationsMap: Record<Language, () => Promise<{ default: Translations }>> = {
  gb: () => import("../../translations/gb.json"),
  fi: () => import("../../translations/fi.json"),
  it: () => import("../../translations/it.json"),
} as const;

const TranslationContext = createContext<TranslationContextValue | null>(null)

export function TranslationProvider(props: TranslationProviderProps) {
  const [translations, setTranslations] = useState<Translations>({})
  const [translationsInit, setTranslationsInit] = useState(false);
  const { settings } = useUserSettings();

  useEffect(() => {
    async function loadTranslations() {
      const data = await translationsMap[settings.language]();
      setTranslations(data.default);
      setTranslationsInit(true)
    }

    loadTranslations();
  }, [settings.language]);

  if(!translationsInit) return null

  return (
    <TranslationContext.Provider value={{ translations }}>
      {props.children}
    </TranslationContext.Provider>
  )
}

export type TranslationProviderProps = {
  children: ReactNode
}


export function useTranslationContext() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslation must be used inside TranslationProvider");
  }
  return ctx;
}