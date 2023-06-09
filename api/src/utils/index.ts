import { randomBytes, createHash } from 'crypto';
import { pick } from 'lodash';

export function base64URLEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
export const verifier = base64URLEncode(randomBytes(32));

function sha256(buf: Buffer) {
  return createHash('sha256').update(buf).digest();
}
export const challenge = base64URLEncode(sha256(Buffer.from(verifier)));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fixPartiallyCompletedChallengeItem = (obj: any) =>
  pick(obj, ['id', 'completedDate']);