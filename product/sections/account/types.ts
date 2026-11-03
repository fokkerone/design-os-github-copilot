// =============================================================================
// UI Data Shapes — the data the Account components expect
// =============================================================================

export type Language = 'en' | 'de'

export interface Profile {
  name: string
  /** validated: required, email */
  email: string
  language: Language
}

export interface LoginProps {
  email?: string
  /** Shown above the button when the sign-in failed */
  error?: string
  onSignIn?: (email: string, password: string) => void
  onSendLink?: (email: string) => void
}

export interface ProfileProps {
  profile: Profile
  saved?: boolean
  onSave?: (profile: Profile) => void
  onSignOut?: () => void
}
