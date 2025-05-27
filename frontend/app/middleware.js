import { NextResponse } from 'next/server'

// Public routes that don't need authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/locations',
  '/book',
  '/forbidden',
  '/session-expired',
  '/pending-approval',
]

// API routes that require token authentication
const PROTECTED_API_ROUTES = [
  '/api/hotels/manager',
  '/api/upload',
  '/api/bookings',
  '/api/savings',
]

// Since middleware can only use cookies and headers (not localStorage),
// we'll use RouteProtection components in the layouts for actual authentication
export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public routes, static files, and API routes
  if (
    PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`)) ||
    pathname.includes('_next') ||
    pathname.includes('favicon.ico') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|js|css|webp|ico)$/) ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // For all other routes, let RouteProtection components handle authentication
  return NextResponse.next()
}

// Configure matcher to cover routes that should be protected
export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}