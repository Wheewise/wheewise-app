import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const url = new URL("/login", nextUrl);
      url.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
      return withSecurityHeaders(NextResponse.redirect(url));
    }
    if (role !== "ADMIN") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/", nextUrl)));
    }
  }

  if (nextUrl.pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const url = new URL("/login", nextUrl);
      url.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
      return withSecurityHeaders(NextResponse.redirect(url));
    }
    if (role !== "DEALER") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/", nextUrl)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
