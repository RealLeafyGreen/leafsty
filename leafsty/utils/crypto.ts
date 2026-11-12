// Derives a 256-bit AES-GCM key from a shared channel passphrase
async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("leafsty-e2ee-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(
  plainText: string,
  passphrase: string
): Promise<string> {
  const key = await deriveKey(passphrase);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // Combine IV + ciphertext into a single Base64 string prefixed with "E2EE:"
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  return "E2EE:" + btoa(String.fromCharCode(...combined));
}

export async function decryptMessage(
  cipherText: string,
  passphrase: string
): Promise<string> {
  if (!cipherText.startsWith("E2EE:")) {
    return cipherText; // Return plain text for older unencrypted messages
  }

  try {
    const key = await deriveKey(passphrase);
    const rawBytes = Uint8Array.from(
      atob(cipherText.replace("E2EE:", "")),
      (c) => c.charCodeAt(0)
    );

    const iv = rawBytes.slice(0, 12);
    const data = rawBytes.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return "[Encrypted message — wrong key]";
  }
}
