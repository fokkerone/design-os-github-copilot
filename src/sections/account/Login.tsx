import { useState } from 'react'
import data from '../../../product/sections/account/data.json'
import { LoginForm } from './components'

/** Preview: sign-in. A wrong password shows the error and keeps the email. */
export default function Login() {
  const [error, setError] = useState<string | undefined>(data.loginError)
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <LoginForm email={data.profile.email} error={error} onSignIn={() => setError(undefined)} />
    </div>
  )
}
