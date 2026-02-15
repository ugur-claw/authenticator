// TOTP Utility Functions
// Implements RFC 6238 TOTP algorithm

// Base32 decoding
function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanBase32 = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  
  let bits = '';
  for (const char of cleanBase32) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  
  return new Uint8Array(bytes);
}

// HMAC-SHA1 implementation
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message.buffer as ArrayBuffer);
  return new Uint8Array(signature);
}

// Generate TOTP code
export async function generateTOTP(
  secret: string,
  period: number = 30,
  digits: number = 6
): Promise<string> {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / period);
  
  // Convert counter to 8-byte buffer
  const counterBytes = new Uint8Array(8);
  let tempCounter = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = tempCounter & 0xff;
    tempCounter = Math.floor(tempCounter / 256);
  }
  
  // Decode secret and compute HMAC-SHA1
  const key = base32ToBytes(secret);
  const hmac = await hmacSha1(key, counterBytes);
  
  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  
  // Generate digits
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

// Get remaining seconds until next code
export function getRemainingSeconds(period: number = 30): number {
  const epoch = Math.floor(Date.now() / 1000);
  return period - (epoch % period);
}

// Parse otpauth URI
export interface Account {
  id: string;
  issuer: string;
  accountName: string;
  secret: string;
}

export function parseOtpauthUri(uri: string): Account | null {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'otpauth:') return null;
    if (url.host !== 'totp') return null;
    
    const label = decodeURIComponent(url.pathname.substring(1));
    const secret = url.searchParams.get('secret');
    const issuer = url.searchParams.get('issuer') || '';
    
    let accountName = label;
    let finalIssuer = issuer;
    
    if (label.includes(':')) {
      const parts = label.split(':');
      finalIssuer = parts[0];
      accountName = parts.slice(1).join(':');
    }
    
    if (!secret) return null;
    
    return {
      id: crypto.randomUUID(),
      issuer: finalIssuer,
      accountName,
      secret: secret.toUpperCase().replace(/\s/g, ''),
    };
  } catch {
    return null;
  }
}

// Validate base32 secret
export function isValidSecret(secret: string): boolean {
  const cleanSecret = secret.toUpperCase().replace(/\s/g, '');
  const base32Regex = /^[A-Z2-7]+=*$/;
  return base32Regex.test(cleanSecret) && cleanSecret.length >= 16;
}
