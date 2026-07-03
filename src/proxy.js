import { NextResponse } from "next/server";

function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Beacon dashboard"',
    },
  });
}

function isAuthorized(request) {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASS;

  if (!expectedUser || !expectedPass) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) {
    return false;
  }

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    const user = decoded.slice(0, separator);
    const pass = decoded.slice(separator + 1);
    return user === expectedUser && pass === expectedPass;
  } catch {
    return false;
  }
}

export function proxy(request) {
  // MVP trade-off: Basic Auth protects owner-only screens without account setup.
  // Public QR scans stay open; writes from the field still require PROGRAM_PASSCODE.
  if (isAuthorized(request)) {
    return NextResponse.next();
  }

  return unauthorized();
}

export const config = {
  matcher: [
    "/((?!r/|api/program|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
