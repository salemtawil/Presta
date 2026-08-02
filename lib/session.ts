export const sessionCookieName = "presta_session";

export type SessionPayload = {
  userId: string;
  companyId: string;
  email: string;
  role: string;
};

export async function encodeSession(payload: SessionPayload) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function decodeSession(value: string | undefined): Promise<SessionPayload | null> {
  if (value == null || value.length === 0) {
    return null;
  }

  try {
    const [encodedPayload, signature] = value.split(".");

    if (encodedPayload == null || signature == null) {
      return null;
    }

    const expectedSignature = await sign(encodedPayload);

    if (!constantTimeEqual(signature, expectedSignature)) {
      return null;
    }

    const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as Partial<SessionPayload>;

    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.companyId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.role !== "string"
    ) {
      return null;
    }

    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

function sessionSecret() {
  return process.env.PRESTA_SESSION_SECRET ?? "dev-session-secret-change-before-production";
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return encodeBytesBase64Url(new Uint8Array(signature));
}

function encodeBase64Url(value: string) {
  return encodeBytesBase64Url(new TextEncoder().encode(value));
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBytesBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}
