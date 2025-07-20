import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Skip middleware for API routes, static files, and _next
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Extract subdomain
  const subdomain = hostname.split('.')[0]
  
  // List of reserved subdomains that should not be treated as usernames
  const reservedSubdomains = ['www', 'app', 'api', 'admin', 'mail', 'ftp', 'blog', 'shop', 'store', 'dev', 'staging', 'test']
  
  // Check if this is a subdomain (not the main domain)
  const isSubdomain = hostname.includes('.') && 
                     subdomain !== 'weeklyscheduler' && 
                     !reservedSubdomains.includes(subdomain) &&
                     subdomain.length > 0

  if (isSubdomain) {
    // This is a username subdomain - show the public schedule
    const url = request.nextUrl.clone()
    url.pathname = `/public/${subdomain}`
    
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}