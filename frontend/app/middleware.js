import { NextResponse } from 'next/server'

export async function middleware(request) {
  // Get token from request
  const token = request.headers.get('authorization')?.split(' ')[1]

  // API routes that require authentication
  if (request.nextUrl.pathname.startsWith('/api/hotels/manager') ||
      request.nextUrl.pathname.startsWith('/api/upload')) {
    
    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' }}
      )
    }

    try {
      // Verify token with backend
      const response = await fetch(`${process.env.API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        return new NextResponse(
          JSON.stringify({ message: 'Invalid token' }),
          { status: 401, headers: { 'content-type': 'application/json' }}
        )
      }

      const userData = await response.json()
      
      // Verify user role for hotel manager routes
      if (request.nextUrl.pathname.startsWith('/api/hotels/manager') && 
          userData.role !== 'hotel_manager') {
        return new NextResponse(
          JSON.stringify({ message: 'Unauthorized' }),
          { status: 403, headers: { 'content-type': 'application/json' }}
        )
      }

      // Add user data to request
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', userData.id)
      requestHeaders.set('x-user-role', userData.role)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error('Error verifying token:', error)
      return new NextResponse(
        JSON.stringify({ message: 'Authentication failed' }),
        { status: 401, headers: { 'content-type': 'application/json' }}
      )
    }
  }

  return NextResponse.next()
}