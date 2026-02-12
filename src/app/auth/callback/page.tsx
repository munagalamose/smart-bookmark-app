import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export default async function AuthCallback() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/error')
  }

  redirect('/dashboard')
}
