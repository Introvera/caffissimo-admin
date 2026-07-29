import { NextResponse, type NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith("/auth/login");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  // Only protect /admin routes
  if (isAdminRoute) {
    if (!token && !isLoginPage) {
      // Unauthenticated, trying to access protected route -> Redirect to login
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (token && isLoginPage) {
      // Authenticated, trying to hit login -> Redirect to dashboard
      const dashboardUrl = new URL("/admin/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
