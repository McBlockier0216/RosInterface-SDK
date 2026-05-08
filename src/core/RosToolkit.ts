/**
 * core/RosToolkit.ts
 *
 * The Ultimate Utility Belt for RosInterface Plugins.
 * Provides high-performance, zero-dependency tools for Data Science,
 * Cybersecurity, and Deep Packet Inspection.
 */

export const RosToolkit = {
    // ====================================================================
    // CYBERSECURITY & FORENSICS (Byte-Level Tools)
    // ====================================================================
    Bytes: {
        /**
         * Ultra-fast Hex Dumper for packet inspection.
         * Generates a Wireshark-like hex output without heavy memory allocation.
         */
        toHexDump: (buffer: Buffer, maxBytes: number = 64): string => {
            const limit = Math.min(buffer.length, maxBytes);
            const hex = buffer.toString('hex', 0, limit);
            // Formats: "ff a1 00 2b..."
            return hex.match(/.{1,2}/g)?.join(' ') + (buffer.length > limit ? ' ...' : '');
        },

        /**
         * Detects malformed or injected payloads by measuring entropy.
         * Useful for detecting encrypted tunnels hidden in plain traffic.
         */
        calculateEntropy: (buffer: Buffer): number => {
            const frequencies = new Uint32Array(256);
            for (let i = 0; i < buffer.length; i++) frequencies[buffer[i]]++;
            let entropy = 0;
            for (let i = 0; i < 256; i++) {
                if (frequencies[i] === 0) continue;
                const p = frequencies[i] / buffer.length;
                entropy -= p * Math.log2(p);
            }
            return entropy; // Value between 0 and 8. Closer to 8 = Encrypted/Compressed
        }
    },

    // ====================================================================
    // DATA SCIENCE & TELEMETRY (High-Performance Math)
    // ====================================================================
    Metrics: {
        /**
         * Calculates moving averages over a stream of numeric data.
         * Uses Float64Array for memory-contiguous, C++ level performance.
         */
        movingAverage: (data: Float64Array, windowSize: number): number => {
            if (data.length === 0) return 0;
            const size = Math.min(data.length, windowSize);
            let sum = 0;
            // Native loop is faster than .reduce()
            for (let i = data.length - size; i < data.length; i++) sum += data[i];
            return sum / size;
        },

        /**
         * Calculates the throughput (Bits per second) securely.
         * @param bytes Number of bytes transferred
         * @param ms Time elapsed in milliseconds
         */
        calculateBps: (bytes: number, ms: number): number => {
            if (ms === 0) return 0;
            return Math.floor((bytes * 8) / (ms / 1000));
        }
    },

    // ====================================================================
    // AUTOMATION & PARSING (For Hobbyists and DevOps)
    // ====================================================================
    Parser: {
        /**
         * Safely transforms a weird MikroTik string array into a clean JSON Object.
         * Example: ["=name=ether1", "=mtu=1500"] -> { name: "ether1", mtu: 1500 }
         */
        wordsToObject: (words: string[]): Record<string, any> => {
            const obj: Record<string, any> = {};
            for (const word of words) {
                if (!word.startsWith('=')) continue;
                const splitIndex = word.indexOf('=', 1);
                if (splitIndex === -1) continue;

                const key = word.substring(1, splitIndex);
                let value: any = word.substring(splitIndex + 1);

                // Auto-cast types
                if (value === 'true' || value === 'yes') value = true;
                else if (value === 'false' || value === 'no') value = false;
                else if (!isNaN(Number(value)) && value !== '') value = Number(value);

                obj[key] = value;
            }
            return obj;
        }
    }
};