import { cookies } from 'next/headers';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    const cookieJar = await cookies();
    const token = cookieJar.get("auth_token")?.value;
    if (!token) {
        console.log("No auth token found, redirecting to login page");
        return NextResponse.redirect(new URL('/', request.url)); // root is login page
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/((?!auth$|auth/).*)',
    ],
}