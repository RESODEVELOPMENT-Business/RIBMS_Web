import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = Buffer.from(payloadBase64, 'base64').toString();
    const decoded = JSON.parse(decodedJson);

    if (!decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);

    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const path = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = ['/signin'];
  const isPublicRoute = publicRoutes.some(route =>
    path.startsWith(route)
  );

  // If no token
  if (!token) {
    if (isPublicRoute) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // If token expired
  if (isTokenExpired(token)) {
    const response = NextResponse.redirect(new URL('/signin', request.url));

    response.cookies.delete('token');
    response.cookies.delete('refreshToken');

    return response;
  }

  // If already login and access signin
  if (isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = Buffer.from(payloadBase64, 'base64').toString();
    const decoded = JSON.parse(decodedJson);

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

  } catch {
    const response = NextResponse.redirect(new URL('/signin', request.url));

    response.cookies.delete('token');
    response.cookies.delete('refreshToken');

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images/).*)',
  ],
}