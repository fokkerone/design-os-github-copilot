import { useState } from 'react'
import { Gauge, UserRound } from 'lucide-react'
import { AppShell } from '../shell/components'
import { MeterReadingForm, ReadingConfirmationCard, ReadingHistoryList, ReadingReviewCard } from '../sections/meter-readings/components'
import { formatValue } from '../sections/meter-readings/components/format'
import { LoginForm, ProfileForm } from '../sections/account/components'
import meterData from '../../product/sections/meter-readings/data.json'
import accountData from '../../product/sections/account/data.json'
import type { Meter, Reading } from '../../product/sections/meter-readings/types'
import type { Language, Profile } from '../../product/sections/account/types'

type Screen = 'login' | 'history' | 'form' | 'review' | 'confirmation' | 'profile'

const meters = meterData.meters as Meter[]
const initialReadings = meterData.readings as Reading[]

/** Clickdummy: sign in, submit a reading, review it, confirm it, browse the history, edit the profile */
export default function ClickdummyApp() {
  const [screen, setScreen] = useState<Screen>('login')
  const [loginError, setLoginError] = useState<string>()
  const [value, setValue] = useState('')
  const [readings, setReadings] = useState<Reading[]>(initialReadings)
  const [profile, setProfile] = useState<Profile>({ ...accountData.profile, language: accountData.profile.language as Language })
  const [saved, setSaved] = useState(false)
  const meter = meters[0]

  const number = Number(value)
  const error =
    value.trim() === '' ? undefined : !Number.isFinite(number) ? 'Enter the digits only, without a unit.'
    : number < meter.previousValue ? `Must not be lower than your last reading (${formatValue(meter.previousValue, meter.unit)}).` : undefined

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-12 dark:bg-stone-950">
        <div className="mx-auto max-w-sm">
          <LoginForm
            email={profile.email}
            error={loginError}
            onSignIn={(email, password) => {
              if (password.length < 4) return setLoginError('The email or password is not correct.')
              setLoginError(undefined)
              setProfile((p) => ({ ...p, email }))
              setScreen('history')
            }}
            onSendLink={() => setScreen('history')}
          />
        </div>
      </div>
    )
  }

  const submitted: Reading = {
    id: 'r-new', meterId: meter.id, value: number, unit: meter.unit, date: new Date().toISOString().slice(0, 10), status: 'submitted', reference: 'MM-26-0108',
  }

  return (
    <AppShell
      navigationItems={[
        { label: 'Readings', href: 'history', icon: Gauge, isActive: screen !== 'profile' },
        { label: 'Account', href: 'profile', icon: UserRound, isActive: screen === 'profile' },
      ]}
      user={{ name: profile.name }}
      onNavigate={(href) => setScreen(href as Screen)}
      onLogout={() => setScreen('login')}
    >
      <div className="px-4 py-8">
        {screen === 'history' && (
          <ReadingHistoryList meters={meters} readings={readings} onNewReading={() => { setValue(''); setScreen('form') }} />
        )}
        {screen === 'form' && (
          <MeterReadingForm meter={meter} value={value} error={error} onChange={setValue} onContinue={() => setScreen('review')} />
        )}
        {screen === 'review' && (
          <ReadingReviewCard
            meter={meter}
            value={number}
            onBack={() => setScreen('form')}
            onSubmit={() => { setReadings([submitted, ...readings]); setScreen('confirmation') }}
          />
        )}
        {screen === 'confirmation' && <ReadingConfirmationCard reading={submitted} onShowHistory={() => setScreen('history')} />}
        {screen === 'profile' && (
          <ProfileForm profile={profile} saved={saved} onSave={(p) => { setProfile(p); setSaved(true) }} onSignOut={() => setScreen('login')} />
        )}
      </div>
    </AppShell>
  )
}
