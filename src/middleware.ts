import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function decodeToken(token: string): any | null {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = Buffer.from(payloadBase64, 'base64').toString();
    return JSON.parse(decodedJson);
  } catch {
    return null;
  }
}

function isTokenExpired(decoded: any | null): boolean {
  if (!decoded || !decoded.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const path = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = ['/signin'];
  const isPublicRoute = publicRoutes.some(route =>
    path.startsWith(route)
  );

  // No access token at all
  if (!token) {
    // Still have refresh token -> let client refresh on next API call
    if (refreshToken && !isPublicRoute) {
      return NextResponse.next();
    }

    if (isPublicRoute) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/signin', request.url));
  }

  const decoded = decodeToken(token);
  const expired = isTokenExpired(decoded);

  // Access token expired but refresh token still available
  // -> Let request through; client-side apiClient will refresh on the next API call
  if (expired) {
    if (refreshToken) {
      // Allow public routes too in case user is on /signin already
      return NextResponse.next();
    }

    // No refresh token -> truly logged out
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete('token');
    response.cookies.delete('refreshToken');
    return response;
  }

  // Already logged in & accessing /signin
  if (isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Role-based routing (only when token is valid)
  if (decoded) {
    const role =
      decoded.role ||
      decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

    // Administrator only
    if (
      path.startsWith('/brands') &&
      role !== 'Administrator'
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // BrandManager + Administrator
    if (
      (
        path.startsWith('/stores') ||
        path.startsWith('/categories') ||
        path.startsWith('/products') ||
        path.startsWith('/brand')
      ) &&
      role !== 'BrandManager' &&
      role !== 'Administrator'
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // StoreManager only
    if (
      path.startsWith('/pos') &&
      role !== 'StoreManager'
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images/|pos-app/).*)',
  ],
}
