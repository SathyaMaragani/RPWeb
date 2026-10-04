import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

/**
 * Encrypts users' API keys at rest with AES-256-GCM.
 *
 * The key is derived from AUTH_SECRET, so no new secret has to be configured.
 * ponytail: rotating AUTH_SECRET makes stored API keys unreadable (users
 * re-enter them); add a dedicated ENCRYPTION_KEY if rotation is ever needed.
 */
function key() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not set")
  return createHash("sha256").update(`${secret}:rpweb-api-keys`).digest()
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".")
}

export function decryptSecret(stored: string) {
  const [iv, tag, data] = stored.split(".").map((part) => Buffer.from(part, "base64"))
  const decipher = createDecipheriv("aes-256-gcm", key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
}
