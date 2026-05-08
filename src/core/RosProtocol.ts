/**
 * RosProtocol.ts
 * * This module is the "mathematical heart" of the library.
 * It strictly handles the encoding and decoding of packet lengths
 * according to MikroTik's proprietary standard.
 * * Refactored and adapted from:
 * - node-routeros/src/connector/Transmitter.ts
 * - node-routeros/src/connector/Receiver.ts
 */

export class RosProtocol {

    /**
     * Converts a string (command) into a Buffer ready to be sent over the socket.
     * Includes the variable Length Encoding calculation.
     * * @param str The command or parameter (e.g., "/ip/address/print" or "=disabled=yes")
     */
    public static encodeSentence(str: string): Buffer {
        // OPTIMIZATION: Calculate byte length without allocating a new Buffer first.
        // Buffer.byteLength is highly optimized in V8 (O(n) but strictly at the C++ level).
        const len = Buffer.byteLength(str, 'utf8');
        let headerLen = 0;

        // 1. Determine header size early (O(1))
        if (len < 0x80) headerLen = 1;
        else if (len < 0x4000) headerLen = 2;
        else if (len < 0x200000) headerLen = 3;
        else if (len < 0x10000000) headerLen = 4;
        else headerLen = 5;

        const result = Buffer.allocUnsafe(headerLen + len);
        let offset = 0;

        // 2. Write the header directly into the final buffer
        if (headerLen === 1) {
            result[offset++] = len;
        } else if (headerLen === 2) {
            const lenBytes = len | 0x8000;
            result[offset++] = (lenBytes >> 8) & 0xff;
            result[offset++] = lenBytes & 0xff;
        } else if (headerLen === 3) {
            const lenBytes = len | 0xc00000;
            result[offset++] = (lenBytes >> 16) & 0xff;
            result[offset++] = (lenBytes >> 8) & 0xff;
            result[offset++] = lenBytes & 0xff;
        } else if (headerLen === 4) {
            const lenBytes = len | 0xe0000000;
            result[offset++] = (lenBytes >>> 24) & 0xff;
            result[offset++] = (lenBytes >> 16) & 0xff;
            result[offset++] = (lenBytes >> 8) & 0xff;
            result[offset++] = lenBytes & 0xff;
        } else {
            result[offset++] = 0xf0;
            result[offset++] = (len >>> 24) & 0xff;
            result[offset++] = (len >> 16) & 0xff;
            result[offset++] = (len >> 8) & 0xff;
            result[offset++] = len & 0xff;
        }

        // 3. Write the string payload directly into the remaining space of the buffer
        // `write` encodes directly into the pre-allocated memory space.
        result.write(str, offset, len, 'utf8');

        return result;
    }

    /**
     * Attempts to read the length of the next packet in the buffer.
     * Refactored from Receiver.ts
     * * @param buffer The raw data buffer received from the socket
     * @returns An object containing the message length and the header byte size,
     * or NULL if there is not enough data yet.
     */
    public static decodeLength(buffer: Buffer): { length: number; byteLength: number } | null {
        // OPTIMIZATION: Cache length to avoid calling the property getter repeatedly
        const bufLen = buffer.length;
        if (bufLen === 0) return null;

        const b = buffer[0];

        // Inverse bitwise logic to detect which length scheme was used

        // Case 1 byte (0xxxxxxx)
        if ((b & 0x80) === 0x00) {
            return { length: b, byteLength: 1 };
        }

        // Case 2 bytes (10xxxxxx ...)
        if ((b & 0xC0) === 0x80) {
            if (bufLen < 2) return null;
            const len = ((b & 0x3F) << 8) | buffer[1];
            return { length: len, byteLength: 2 };
        }

        // Case 3 bytes (110xxxxx ...)
        if ((b & 0xE0) === 0xC0) {
            if (bufLen < 3) return null;
            const len = ((b & 0x1F) << 16) | (buffer[1] << 8) | buffer[2];
            return { length: len, byteLength: 3 };
        }

        // Case 4 bytes (1110xxxx ...)
        if ((b & 0xF0) === 0xE0) {
            if (bufLen < 4) return null;
            // BUG FIX & OPTIMIZATION: `>>> 0` forces JS to treat the result as a 32-bit UNSIGNED integer.
            // Without this, large chunks from the router might be interpreted as negative lengths.
            const len = (((b & 0x0F) << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3]) >>> 0;
            return { length: len, byteLength: 4 };
        }

        // Case 5 bytes (11110000 ...)
        if (b === 0xF0) {
            if (bufLen < 5) return null;
            const len = ((buffer[1] << 24) | (buffer[2] << 16) | (buffer[3] << 8) | buffer[4]) >>> 0;
            return { length: len, byteLength: 5 };
        }

        // If we reach here, the initial byte is invalid according to the protocol
        return null;
    }
}