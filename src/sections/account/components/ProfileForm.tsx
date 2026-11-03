import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import type { Language, ProfileProps } from '../../../../product/sections/account/types'

export function ProfileForm({ profile, saved, onSave, onSignOut }: ProfileProps) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [language, setLanguage] = useState<Language>(profile.language)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Your profile</CardTitle>
        <CardDescription>We use this for confirmations and reminders.</CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave?.({ name, email, language })
        }}
      >
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </CardContent>
        <CardFooter className="mt-5 gap-3">
          <Button type="button" variant="ghost" onClick={onSignOut}>
            Sign out
          </Button>
          <Button
            type="submit"
            className="rounded-full border-0 border-neutral-100 leading-4 text-white dark:border-[oklch(27.07%_0.00918_285.77)] dark:text-[oklch(28%_0.01016_260.7)]" /* tokens: popover (text), accent (border) */
            aria-live="polite"
          >
            {saved ? (
              <>
                <Check aria-hidden /> Saved
              </>
            ) : (
              'Save'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
