import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

// Routes that don't require any authentication
const PUBLIC_ROUTES = [
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
];

// Auth routes - redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/sign-in', '/sign-up'];

// Static assets and API routes to always skip
const SKIP_PATTERNS = [
    '/_next',
    '/api',
    '/favicon',
    '/images',
    '/fonts',
    '/public',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isPathMatch(pathname: string, routes: string[]): boolean {
    return routes.some(route => 
        pathname === route || pathname.startsWith(`${route}/`)
    );
}

function shouldSkipMiddleware(pathname: string): boolean {
    return SKIP_PATTERNS.some(pattern => pathname.startsWith(pattern));
}

/**
 * Decode JWT payload without verification (for expiry check only)
 * Full verification happens on the backend
 */
function decodeJwtPayload(token: string): { exp?: number; iat?: number } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        // Decode base64url payload
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

/**
 * Check if a JWT token is expired
 * Returns true if expired or invalid, false if still valid
 */
function isTokenExpired(token: string | undefined): boolean {
    if (!token) return true;
    
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return true;
    
    // Add 30 second buffer to account for clock skew
    const now = Math.floor(Date.now() / 1000);
    const buffer = 30;
    
    return payload.exp < (now + buffer);
}

/**
 * Check if refresh token is still valid (not expired)
 */
function isRefreshTokenValid(token: string | undefined): boolean {
    if (!token) return false;
    
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
}

// ============================================================================
// MAIN MIDDLEWARE
// ============================================================================

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Skip middleware for static assets and API routes
    if (shouldSkipMiddleware(pathname)) {
        return NextResponse.next();
    }

    // Get authentication tokens from cookies
    const refreshToken = req.cookies.get('refresh_token')?.value;
    const accessToken = req.cookies.get('access_token')?.value;
    
    // Check token validity
    const hasValidRefreshToken = isRefreshTokenValid(refreshToken);
    const hasValidAccessToken = !isTokenExpired(accessToken);
    
    // User is considered authenticated if refresh token is valid
    // (Access token can be refreshed if expired but refresh token is valid)
    const isAuthenticated = hasValidRefreshToken;

    // Route classification
    const isPublicRoute = isPathMatch(pathname, PUBLIC_ROUTES);
    const isAuthRoute = isPathMatch(pathname, AUTH_ROUTES);
    const isRootPath = pathname === '/';

    // -------------------------------------------------------------------------
    // AUTHENTICATED USER LOGIC
    // -------------------------------------------------------------------------
    if (isAuthenticated) {
        // Redirect authenticated users away from auth pages to dashboard
        if (isAuthRoute || isRootPath) {
            const dashboardUrl = new URL('/dashboard', req.url);
            const response = NextResponse.redirect(dashboardUrl);
            return addSecurityHeaders(response);
        }

        // If access token is expired but refresh token is valid,
        // the API layer will handle token refresh automatically
        // We still allow the request to proceed
        
        const response = NextResponse.next();
        
        // Add header to indicate if access token needs refresh
        if (!hasValidAccessToken && hasValidRefreshToken) {
            response.headers.set('X-Token-Refresh-Needed', 'true');
        }
        
        return addSecurityHeaders(response);
    }

    // -------------------------------------------------------------------------
    // UNAUTHENTICATED USER LOGIC (or expired refresh token)
    // -------------------------------------------------------------------------
    
    // Allow access to public routes
    if (isPublicRoute) {
        const response = NextResponse.next();
        return addSecurityHeaders(response);
    }

    // Clear expired cookies when redirecting to sign-in
    const signInUrl = new URL('/sign-in', req.url);
    
    // Don't add callback for simple navigation
    if (pathname !== '/dashboard') {
        signInUrl.searchParams.set('callbackUrl', pathname);
    }

    const response = NextResponse.redirect(signInUrl);
    
    // Clear expired tokens from cookies
    if (refreshToken && !hasValidRefreshToken) {
        response.cookies.delete('refresh_token');
        response.cookies.delete('access_token');
    }
    
    return addSecurityHeaders(response);
}

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, favicon.png (favicon files)
         * - public folder files (images, fonts, etc.)
         * - API routes (handled by backend)
         */
        '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|images|fonts|public).*)',
    ],
};
