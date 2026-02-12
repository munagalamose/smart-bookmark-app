import { createClient } from '@supabase/supabase-js'

// Temporary fix - replace with your actual Supabase credentials
const supabaseUrl = 'https://insbqqiqxtazqqziknfy.supabase.co'
const supabaseAnonKey = 'sb_publishable_D41jzdl1Dyn3sGWo_nRQtg_eg-4iLSu'

// Uncomment this when environment variables are working properly
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
// }

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
