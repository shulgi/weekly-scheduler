import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient({
  options: {
    auth: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    }
  }
})