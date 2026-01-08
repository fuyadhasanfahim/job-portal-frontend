import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'];

// Routes that should redirect to dashboard if user is authenticated
const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Check for refresh token (authentication)
    const refreshToken = req.cookies.get('refresh_token')?.value;
    const isAuthenticated = !!refreshToken;

    // Check if current path is a public route
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    
    // Check if current path is an auth route (sign-in, sign-up)
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

    // If user is authenticated
    if (isAuthenticated) {
        // Redirect away from auth pages and root to dashboard
        if (isAuthRoute || pathname === '/') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        // Allow access to all other routes
        return NextResponse.next();
    }

    // If user is NOT authenticated
    if (!isAuthenticated) {
        // Allow access to public routes
        if (isPublicRoute) {
            return NextResponse.next();
        }
        // Redirect to sign-in for protected routes
        // Store the original URL to redirect back after login
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         * - api routes (handled separately)
         */
        '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
    ],
};
