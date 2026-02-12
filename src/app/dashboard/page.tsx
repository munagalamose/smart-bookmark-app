'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Bookmark {
  id: string
  title: string
  url: string
  created_at: string
  updated_at: string
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '' })
  const [loadingBookmarks, setLoadingBookmarks] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  useEffect(() => {
    if (!user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchBookmarks()
      setRealtimeStatus('connecting')
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('bookmarks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Real-time update received:', payload)
            if (payload.eventType === 'INSERT') {
              setBookmarks(prev => {
                // Remove any temporary bookmark with same title, then add the real one
                const filtered = prev.filter(b => 
                  !b.id.startsWith('temp-') || b.title !== payload.new.title
                )
                return [payload.new as Bookmark, ...filtered]
              })
            } else if (payload.eventType === 'DELETE') {
              setBookmarks(prev => prev.filter(b => b.id !== payload.old.id))
            } else if (payload.eventType === 'UPDATE') {
              setBookmarks(prev => 
                prev.map(b => b.id === payload.new.id ? payload.new as Bookmark : b)
              )
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status)
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected')
          } else if (status === 'CLOSED') {
            setRealtimeStatus('disconnected')
          }
        })

      return () => {
        console.log('Cleaning up subscription')
        setRealtimeStatus('disconnected')
        subscription.unsubscribe()
      }
    }
  }, [user])

  const fetchBookmarks = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookmarks:', error)
    } else {
      setBookmarks(data || [])
    }
    setLoadingBookmarks(false)
  }

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newBookmark.title || !newBookmark.url) return

    // Optimistic update - add to UI immediately
    const tempBookmark: Bookmark = {
      id: `temp-${Date.now()}`, // Temporary ID
      title: newBookmark.title,
      url: newBookmark.url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    setBookmarks(prev => [tempBookmark, ...prev])
    setNewBookmark({ title: '', url: '' })

    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        title: newBookmark.title,
        url: newBookmark.url,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding bookmark:', error)
      // Remove the temporary bookmark if insert failed
      setBookmarks(prev => prev.filter(b => b.id !== tempBookmark.id))
    } else {
      // Replace temporary bookmark with real one
      setBookmarks(prev => 
        prev.map(b => b.id === tempBookmark.id ? data : b)
      )
    }
  }

  const deleteBookmark = async (id: string) => {
    // Optimistic update - remove from UI immediately
    setBookmarks(prev => prev.filter(b => b.id !== id))
    
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting bookmark:', error)
      // If delete failed, add the bookmark back
      fetchBookmarks()
    }
    // If successful, the real-time subscription will handle the update
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg">Redirecting to home...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                realtimeStatus === 'connected' ? 'bg-green-500' : 
                realtimeStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {realtimeStatus === 'connected' ? 'Real-time sync active' : 
                 realtimeStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>

        <form onSubmit={addBookmark} className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold mb-4">Add New Bookmark</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={newBookmark.title}
                onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bookmark title"
                required
              />
            </div>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                id="url"
                value={newBookmark.url}
                onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Bookmark
            </button>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold p-6 border-b">Your Bookmarks</h2>
          {loadingBookmarks ? (
            <div className="p-6 text-center text-gray-500">Loading bookmarks...</div>
          ) : bookmarks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No bookmarks yet. Add your first bookmark above!</div>
          ) : (
            <div className="divide-y">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{bookmark.title}</h3>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                      >
                        {bookmark.url}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">
                        Added {new Date(bookmark.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
