import { NextResponse } from 'next/server'

// Define role permissions with more specific routes
const ROLE_PERMISSIONS = {
  // Admin routes and sub-routes
  '/admin': ['admin'],
  '/admin/dashboard': ['admin'],
  '/admin/activities': ['admin'],
  '/admin/applications': ['admin'],
  '/admin/assignments': ['admin'],
  '/admin/destinations': ['admin'],
  
  // Hotel Manager routes and sub-routes
  '/hotel-manager': ['hotel_manager'],
  '/hotel-manager/dashboard': ['hotel_manager'],
  '/hotel-manager/profile': ['hotel_manager'],
  '/hotel-manager/bookings': ['hotel_manager'],
  '/hotel-manager/password': ['hotel_manager'],
  
  // Tour Guide routes and sub-routes
  '/tour-guide': ['tour_guide'],
  '/tour-guide/dashboard': ['tour_guide'],
  '/tour-guide/profile': ['tour_guide'],
  '/tour-guide/assignments': ['tour_guide'],
  '/tour-guide/bookings': ['tour_guide'],
  
  // Travel Agent routes and sub-routes
  '/travel-agent': ['travel_agent'],
  '/travel-agent/dashboard': ['travel_agent'],
  '/travel-agent/profile': ['travel_agent'],
  '/travel-agent/routes': ['travel_agent'],
  '/travel-agent/bookings': ['travel_agent'],
  
  // General profile routes (accessible to all authenticated users)
  '/profile': ['tourist', 'admin', 'hotel_manager', 'tour_guide', 'travel_agent'],
}

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
// we need to handle authentication client-side
export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public routes, static files, and API routes
  // (API routes will be protected in the API handlers)
  if (
    PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`)) ||
    pathname.includes('_next') ||
    pathname.includes('favicon.ico') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|js|css|webp|ico)$/) ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // For protected page routes, we'll only do a basic check
  // to see if we need to redirect to the login page
  
  // Check if this is a protected route
  let isProtectedRoute = false
  let requiredRoles = []
  
  // Check if the pathname matches any protected routes
  for (const [route, roles] of Object.entries(ROLE_PERMISSIONS)) {
    if (
      pathname === route || 
      pathname.startsWith(`${route}/`) ||
      (route === '/' + pathname.split('/')[1])
    ) {
      isProtectedRoute = true
      requiredRoles = roles
      break
    }
  }
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }
  
  // For protected routes, redirect to a client-side auth checker
  // that will handle the actual authentication and redirection logic
  
  // Include the original URL as a query parameter
  const returnUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
  
  // Create the URL to our auth-check page that will handle client-side checks
  return NextResponse.rewrite(new URL(`/auth-check?returnUrl=${returnUrl}&requiredRoles=${requiredRoles.join(',')}`, request.url))
}

// Configure matcher to cover all routes that should be protected
export const config = {
  matcher: [
    // Admin routes
    '/admin',
    '/admin/:path*',
    
    // Hotel Manager routes
    '/hotel-manager',
    '/hotel-manager/:path*',
    
    // Tour Guide routes
    '/tour-guide',
    '/tour-guide/:path*',
    
    // Travel Agent routes
    '/travel-agent', 
    '/travel-agent/:path*',
    
    // Profile routes
    '/profile',
    '/profile/:path*',
  ],
}