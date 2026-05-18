// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse = NextResponse.next({
              request,
            })
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  if (user && url.pathname === '/login') {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  const protectedPrefixes = ['/dashboard', '/create', '/decks', '/profile', '/quiz']
  const isProtected = protectedPrefixes.some((p) => url.pathname.startsWith(p))

  if (!user && isProtected) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}