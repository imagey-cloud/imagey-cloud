import { AuthenticationError } from "./AuthenticationError";
import { buf2hex, hex2buf, text2buf } from "./ConversionService";

export const cryptoService = {
  generatePasswordKey: async (
    deviceId: string,
    password: string,
  ): Promise<JsonWebKey> => {
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: text2buf(deviceId),
        iterations: 250000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      true, // allow exporting the key
      ["encrypt", "decrypt"],
    );
    return exportKey(key);
  },

  initializeKeyPair: async (): Promise<{
    privateKey: JsonWebKey;
    publicKey: JsonWebKey;
  }> => {
    const cryptoKeyPair = await createKeyPair();
    const privateKey = await exportKey(cryptoKeyPair.privateKey);
    const publicKey = await exportKey(cryptoKeyPair.publicKey);
    return { privateKey, publicKey };
  },

  encryptPrivateKey: async (
    privateKey: JsonWebKey,
    password: string,
  ): Promise<string> => {
    try {
      return encrypt(JSON.stringify(privateKey), password);
    } catch (error) {
      console.warn(error);
      throw AuthenticationError.WRONG_PASSWORD;
    }
  },

  decryptPrivateKey: async (
    encryptedPrivateKey: string,
    password: string,
  ): Promise<JsonWebKey> => {
    try {
      const decryptedPrivateKey = await decrypt(encryptedPrivateKey, password);
      return JSON.parse(decryptedPrivateKey);
    } catch (error) {
      console.warn(error);
      throw AuthenticationError.WRONG_PASSWORD;
    }
  },
};

async function exportKey(key: CryptoKey) {
  return crypto.subtle.exportKey("jwk", key) as JsonWebKey;
}

async function createKeyPair() {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );
}

const getPasswordKey = (password: string) =>
  window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

const deriveKey = (
  passwordKey: CryptoKey,
  salt: ArrayBuffer,
  keyUsage: KeyUsage[],
) =>
  window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 250000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    keyUsage,
  );

async function encrypt(secretData: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const passwordKey = await getPasswordKey(password);
  const aesKey = await deriveKey(passwordKey, salt, ["encrypt"]);
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    new TextEncoder().encode(secretData),
  );

  const encryptedContentArr = new Uint8Array(encryptedContent);
  const buffer = new Uint8Array(
    salt.byteLength + iv.byteLength + encryptedContentArr.byteLength,
  );
  buffer.set(salt, 0);
  buffer.set(iv, salt.byteLength);
  buffer.set(encryptedContentArr, salt.byteLength + iv.byteLength);
  return buf2hex(buffer);
}

async function decrypt(encryptedData: string, password: string) {
  const encryptedDataBuff = hex2buf(encryptedData);
  const salt = encryptedDataBuff.slice(0, 16);
  const iv = encryptedDataBuff.slice(16, 16 + 12);
  const data = encryptedDataBuff.slice(16 + 12);
  const passwordKey = await getPasswordKey(password);
  const aesKey = await deriveKey(passwordKey, salt, ["decrypt"]);
  const decryptedContent = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    data,
  );
  return new TextDecoder().decode(decryptedContent);
}
