import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/_next(.*)',
    '/favicon.ico',
    '/design',
    // Public scans of any GitHub username (public repositories only)
    '/scan(.*)',
    // Verified by their own signatures rather than a Clerk session
    '/api/inngest',
    '/api/webhooks(.*)',
    // Browser error reports, rate-limited per IP
    '/api/client-errors',
])

export const proxy = clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}