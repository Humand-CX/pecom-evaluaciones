// app/api/auth/callback/route.ts  (Next.js 13+ App Router)
// -----------------------------------------------------------------
// Este endpoint recibe el code + code_verifier que Humand envía
// cuando el usuario hace clic en "PECOM Evaluaciones".
// Canjea el code por tokens de Janus y establece la sesión.
// -----------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";

// ── Configuración ────────────────────────────────────────────────
// Guardá estos valores en variables de entorno de Vercel.
// NUNCA los hardcodees en el código fuente.
const JANUS_BASE_URL   = process.env.JANUS_BASE_URL!;       // ej. https://auth.humand.co
const CLIENT_ID        = process.env.JANUS_CLIENT_ID!;      // ej. hu_user_xxxxxxxxxxxxxxxx
const CLIENT_SECRET    = process.env.JANUS_CLIENT_SECRET!;  // el secret que Janus mostró una sola vez
const REDIRECT_URI     = process.env.JANUS_REDIRECT_URI!;   // https://pecom-deploy.vercel.app/auth/callback

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code          = searchParams.get("code");
  const code_verifier = searchParams.get("code_verifier");

  // ── 1. Validar que llegaron los parámetros esperados ─────────
  if (!code || !code_verifier) {
    return NextResponse.json(
      { error: "missing_params", detail: "code o code_verifier ausentes" },
      { status: 400 }
    );
  }

  // ── 2. Canjear el code por tokens en Janus ───────────────────
  // Autenticación: CLIENT_SECRET_BASIC  →  Base64(clientId:clientSecret)
  const basicCredentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const tokenResponse = await fetch(`${JANUS_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicCredentials}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      code_verifier,
      redirect_uri:  REDIRECT_URI,
      // client_id también puede ir aquí como alternativa al header Basic,
      // pero CLIENT_SECRET_BASIC (el header) es preferible.
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error("[auth/callback] Janus token error:", errorBody);
    return NextResponse.json(
      { error: "token_exchange_failed", detail: errorBody },
      { status: 502 }
    );
  }

  const tokens = await tokenResponse.json() as {
    access_token:  string;
    id_token:      string;   // JWT OIDC con name, email, user_id, instance_id
    refresh_token: string;
    expires_in:    number;
    token_type:    string;
  };

  // ── 3. (Recomendado) Validar el id_token con la librería OIDC ─
  // Podés usar 'jose' o 'openid-client'.
  // Ejemplo con 'jose':
  //
  //   import { createRemoteJWKSet, jwtVerify } from "jose";
  //   const JWKS = createRemoteJWKSet(new URL(`${JANUS_BASE_URL}/oauth2/jwks`));
  //   const { payload } = await jwtVerify(tokens.id_token, JWKS, {
  //     audience: CLIENT_ID,   // aud del id_token = client_id (estándar OIDC)
  //   });
  //   // payload.sub     → user_id como string
  //   // payload.email   → email del usuario
  //   // payload.name    → nombre completo
  //
  // Por ahora lo decodificamos sin verificar firma (solo para ilustrar):
  const idPayload = JSON.parse(
    Buffer.from(tokens.id_token.split(".")[1], "base64url").toString("utf-8")
  );

  // ── 4. Persistir sesión ──────────────────────────────────────
  // Guardá los tokens donde corresponda según tu arquitectura:
  //   • HttpOnly cookie (recomendado para refresh_token)
  //   • Base de datos / Redis si necesitás revocar sesiones
  //   • JWT propio firmado por tu app
  //
  // Ejemplo simple con cookies HttpOnly:
  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  response.cookies.set("humand_access_token", tokens.access_token, {
    httpOnly: true,
    secure:   true,
    sameSite: "lax",
    maxAge:   tokens.expires_in,   // Janus emite tokens con 1 hora de vida
    path:     "/",
  });

  response.cookies.set("humand_refresh_token", tokens.refresh_token, {
    httpOnly: true,
    secure:   true,
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 7,   // 7 días; ajustá según tu política
    path:     "/",
  });

  // El id_token puede guardarse en una cookie no-httpOnly si el frontend
  // necesita leer los claims del usuario (name, email, etc.).
  response.cookies.set("humand_user", JSON.stringify({
    userId:     idPayload.user_id,
    instanceId: idPayload.instance_id,
    email:      idPayload.email,
    name:       idPayload.name,
  }), {
    httpOnly: false,   // legible desde JS del cliente
    secure:   true,
    sameSite: "lax",
    maxAge:   tokens.expires_in,
    path:     "/",
  });

  return response;
}
