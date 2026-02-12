# Smart Bookmark App

A simple bookmark manager with real-time synchronization built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Google OAuth Authentication**: Sign in using your Google account (no email/password required)
- **Private Bookmarks**: Each user can only see their own bookmarks
- **Real-time Updates**: Bookmarks sync across multiple browser tabs in real-time
- **CRUD Operations**: Add, view, and delete bookmarks
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript
- **Backend**: Supabase (Auth, Database, Realtime)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd smart-bookmark-app
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Authentication > Settings and configure Google OAuth:
   - Enable Google provider
   - Add your Google OAuth credentials
   - Set the redirect URL to `https://your-domain.com/auth/callback`
3. Run the SQL from `database-schema.sql` in the Supabase SQL editor
4. Enable Realtime for the `bookmarks` table in Database > Replication

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

Get these values from your Supabase project settings.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Schema

The app uses a single `bookmarks` table with the following structure:

```sql
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Row Level Security (RLS) is enabled to ensure users can only access their own bookmarks.

## Challenges and Solutions

### Challenge 1: Supabase Client Configuration in Next.js App Router

**Problem**: Initial attempts to use `@supabase/auth-helpers-nextjs` failed because it's deprecated for App Router.

**Solution**: Switched to `@supabase/ssr` package and created separate client configurations:
- `supabase.ts` for client-side usage
- `supabase-server.ts` for server-side usage with proper cookie handling

### Challenge 2: Real-time Subscription Management

**Problem**: Real-time subscriptions needed to be properly scoped to the current user and cleaned up on unmount.

**Solution**: 
- Used Supabase's `.on('postgres_changes')` with a user filter
- Implemented proper cleanup in useEffect return function
- Added subscription only when user is authenticated

### Challenge 3: Authentication State Management

**Problem**: Managing authentication state across client and server components in App Router.

**Solution**: 
- Created an `AuthContext` with React Context API
- Used `onAuthStateChange` listener for real-time auth updates
- Implemented proper loading states and redirects

### Challenge 4: TypeScript Types for Supabase

**Problem**: Missing TypeScript definitions for the database schema.

**Solution**: Initially removed the Database type import to focus on functionality. In production, you would:
1. Install Supabase CLI
2. Generate types with `supabase gen types typescript --local > src/types/database.ts`
3. Use the generated types for better type safety

### Challenge 5: Environment Variables in Production

**Problem**: Environment variables need to be properly configured for different environments.

**Solution**: 
- Used `.env.local` for development
- Documented required environment variables
- Ensured all variables are properly prefixed with `NEXT_PUBLIC_` where needed for client-side access

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

Make sure to add these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

# smart-bookmark-app

## Author
Munagala Mose

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.
