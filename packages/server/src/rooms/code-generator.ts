import { randomBytes } from 'node:crypto';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, type RoomCode } from '@domino/contracts';

const ALPHABET_SIZE = ROOM_CODE_ALPHABET.length;
const MAX_USABLE = Math.floor(256 / ALPHABET_SIZE) * ALPHABET_SIZE;

export function generateRoomCode(): RoomCode {
  const chars = new Array<string>(ROOM_CODE_LENGTH);
  let filled = 0;
  while (filled < ROOM_CODE_LENGTH) {
    const buf = randomBytes(ROOM_CODE_LENGTH * 2);
    for (const byte of buf) {
      if (byte >= MAX_USABLE) continue;
      chars[filled++] = ROOM_CODE_ALPHABET[byte % ALPHABET_SIZE] as string;
      if (filled === ROOM_CODE_LENGTH) break;
    }
  }
  return chars.join('') as RoomCode;
}

export function generateUniqueRoomCode(isInUse: (code: RoomCode) => boolean): RoomCode {
  for (let attempt = 0; attempt < 50; attempt++) {
    const code = generateRoomCode();
    if (!isInUse(code)) return code;
  }
  throw new Error('Failed to generate a unique room code after 50 attempts');
}
