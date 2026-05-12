import { NextRequest, NextResponse } from 'next/server'

// Auth will be wired here when Google OAuth is added.
// Will validate Supabase session and enforce role-based routing.
export function proxy(_request: NextRequest) {
  return NextResponse.next()
}
