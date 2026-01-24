import * as crypto from 'crypto';

export function generateMd5Hash(value: string): string {
  return crypto.createHash('md5').update(value).digest('hex');
}
