import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import type { LoginProps } from '../../../../product/sections/account/types'

export function LoginForm({ email: initialEmail = '', error, onSignIn, onSendLink }: LoginProps) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight text-teal-600 dark:text-teal-300" /* token: primary */>Sign in to MeterMate</CardTitle>
        <CardDescription className="font-medium">Use the link from your reminder email, or your password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSignIn?.(email, password)
          }}
        >
          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200" /* token: destructive */>
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-teal-600 dark:text-teal-300" /* token: primary */>Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Sign in
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => onSendLink?.(email)}>
            <Mail aria-hidden /> Email me a sign-in link
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
