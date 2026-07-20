import { createContext, useContext } from 'react'

export const I18nContext = createContext(null)

export function useTranslation () {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
