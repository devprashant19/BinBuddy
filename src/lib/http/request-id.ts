import crypto from 'crypto';

export function generateRequestId(): string {
  return `req_${crypto.randomBytes(8).toString('hex')}`;
}
