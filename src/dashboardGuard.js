import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import crypto from "node:crypto";

const RUNTIME_JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.JWT_SECRET) {
  console.warn("[security] JWT_SECRET is not set; using ephemeral runtime secret.");
}
const SECRET = new TextEncoder().encode(RUNTIME_JWT_SECRET);

// Always require JWT token regardless of requireLogin setting
const ALWAYS_PROTECTED = [
  "/api/shutdown",
  "/api/settings/database",
];

// Require auth, but allow through if requireLogin is disabled
const PROTECTED_API_PATHS = [
  "/api/settings",
  "/api/keys",
  "/api/providers/client",
  "/api/provider-nodes/validate",
];

function isLocalRequest(request) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function hasValidToken(request) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

async function isAuthenticated(request) {
  if (await hasValidToken(request)) return true;
  // Allow if requireLogin is disabled
  const origin = request.nextUrl.origin;
  try {
    const res = await fetch(`${origin}/api/settings/require-login`);
    const data = await res.json();
    if (data.requireLogin === false) return true;
  } catch {
    // On error, require login
  }
  return false;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Always protected - allow localhost or valid JWT only
  if (ALWAYS_PROTECTED.some((p) => pathname.startsWith(p))) {
    if (isLocalRequest(request) || await hasValidToken(request))
      return NextResponse.next();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protect sensitive API endpoints (bypass if localhost or requireLogin = false)
  if (PROTECTED_API_PATHS.some((p) => pathname.startsWith(p))) {
    if (pathname === "/api/settings/require-login") return NextResponse.next();
    if (isLocalRequest(request) || await isAuthenticated(request))
      return NextResponse.next();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth_token")?.value;

    if (token) {
      try {
        await jwtVerify(token, SECRET);
        return NextResponse.next();
      } catch (err) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    const origin = request.nextUrl.origin;
    try {
      const res = await fetch(`${origin}/api/settings/require-login`);
      const data = await res.json();
      if (data.requireLogin === false) {
        return NextResponse.next();
      }
    } catch (err) {
      // On error, require login
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect / to /dashboard if logged in, or /dashboard if it's the root
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
