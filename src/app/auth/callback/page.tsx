'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      await supabase.auth.getSession()
      router.push('/dashboard')
    }

    handleAuth()
  }, [router])

  return <p>Signing you in...</p>
}
