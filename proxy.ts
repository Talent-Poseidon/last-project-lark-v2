import { NextRequest, NextResponse } from "next/server";
import { jwtDecrypt } from "jose";

// Next.js 16: proxy.ts replaces middleware.ts and runs on Node.js runtime
// (not Edge Runtime), so there are no __dirname or crypto-API limitations.

/**
 * Derive the encryption key using HKDF, matching auth.js internal implementation.
 * Auth.js uses: hkdf("sha256", secret, salt=cookieName, info="Auth.js Generated Encryption Key (cookieName)", keyLength)
 */
async function deriveEncryptionKey(
  secret: string,
  salt: string,
  length: number
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode(salt),
      info: enc.encode(`Auth.js Generated Encryption Key (${salt})`),
    },
    baseKey,
    length * 8
  );
  return new Uint8Array(bits);
}

/**
 * Determine the required key length from the JWE content encryption algorithm.
 * A256CBC-HS512 (auth.js default) = 64 bytes, A256GCM = 32 bytes.
 */
function getKeyLengthFromToken(token: string): number {
  try {
    const headerB64 = token.split(".")[0];
    const padded = headerB64
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(headerB64.length + ((4 - (headerB64.length % 4)) % 4), "=");
    const headerJson = JSON.parse(atob(padded));
    const enc = headerJson.enc || "A256CBC-HS512";
    console.log(`[Proxy] JWE header: alg=${headerJson.alg}, enc=${enc}`);
    return enc === "A256CBC-HS512" ? 64 : 32;
  } catch {
    console.log("[Proxy] Failed to parse JWE header, defaulting to 64-byte key (A256CBC-HS512)");
    return 64; // default for A256CBC-HS512
  }
}

async function getSession(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = req.cookies.get(cookieName)?.value;
  if (!token) {
    console.log(`[Proxy] No cookie '${cookieName}' found in request`);
    return null;
  }
  console.log(`[Proxy] Cookie '${cookieName}' found (length: ${token.length})`);

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[Proxy] CRITICAL: No AUTH_SECRET or NEXTAUTH_SECRET env var found!");
    return null;
  }

  try {
    const keyLength = getKeyLengthFromToken(token);
    const encryptionKey = await deriveEncryptionKey(secret, cookieName, keyLength);
    console.log(`[Proxy] Derived ${keyLength}-byte encryption key`);

    const { payload } = await jwtDecrypt(token, encryptionKey, {
      clockTolerance: 15,
    });

    console.log(`[Proxy] JWT decrypted successfully. sub=${payload.sub}, email=${payload.email}, role=${payload.role}, is_approved=${payload.is_approved}`);
    return payload;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Proxy] JWT decryption failed: ${message}`);
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip logging for static/internal routes
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isAuthRoute = pathname.startsWith("/auth");

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  console.log(`[Proxy] Processing: ${pathname}`);

  const session = await getSession(req);
  const isLoggedIn = !!session;
  const isApproved = session?.is_approved as boolean | undefined;

  console.log(`[Proxy] Session check: isLoggedIn=${isLoggedIn}, isApproved=${isApproved}, path=${pathname}`);

  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnAdmin = pathname.startsWith("/admin");
  const isOnPending = pathname.startsWith("/auth/pending-approval");

  // Logged in but not approved → redirect to pending approval
  if (isLoggedIn && !isApproved) {
    if (isOnPending) return NextResponse.next();
    console.log(`[Proxy] User not approved, redirecting to /auth/pending-approval`);
    return NextResponse.redirect(
      new URL("/auth/pending-approval", req.nextUrl)
    );
  }

  // Protected routes require authentication
  if (isOnDashboard || isOnAdmin) {
    if (isLoggedIn) {
      console.log(`[Proxy] Authenticated access to ${pathname} - ALLOWED`);
      return NextResponse.next();
    }
    console.log(`[Proxy] Unauthenticated access to ${pathname} - redirecting to /auth/login`);
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    console.log(`[Proxy] Authenticated user on auth page, redirecting to /dashboard`);
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
