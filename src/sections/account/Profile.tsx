import { useState } from 'react'
import data from '../../../product/sections/account/data.json'
import type { Language } from '../../../product/sections/account/types'
import { ProfileForm } from './components'

/** Preview: the profile with a saved confirmation */
export default function Profile() {
  const [saved, setSaved] = useState(false)
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <ProfileForm profile={{ ...data.profile, language: data.profile.language as Language }} saved={saved} onSave={() => setSaved(true)} />
    </div>
  )
}
