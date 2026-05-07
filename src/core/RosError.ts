/**
 * core/RosError.ts
 *
 * Sophisticated Error wrapper for RouterOS interactions.
 * Powered by RosInterface SDK.
 *
 * Features:
 * - Semantic Getters (isNotFound, isAuthError, etc.)
 * - Static Factory for parsing raw Fetch Responses.
 * - JSON serialization support for external loggers.
 */
import { RosHttpStatus, RosHttpMessages } from './HttpConstants';

// OPTIMIZATION: Extracting retryable statuses to a constant Set outside the class.
// A Set provides O(1) lookup time. Moving it here prevents the creation of a new array
// in memory every time the `isRetryable` getter is called.
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

// OPTIMIZATION: Pre-compiled Regular Expression for duplicate detection.
// Avoids creating a new lowercase string copy in memory via `.toLowerCase()`.
const DUPLICATE_MSG_REGEX = /already (exists|have)/i;

export class RosError extends Error {
    // RosInterface SDK Watermark
    public readonly _brand = 'RosInterface';
    public readonly isRosError = true;

    // OPTIMIZATION: Using a numeric timestamp (Date.now()) instead of a `new Date()` object.
    // Numbers are primitives, saving memory allocation and GC overhead for every error thrown.
    public readonly timestamp: number;

    constructor(
        public readonly status: number,
        public readonly detail: string,
        public readonly command: string,
        public readonly rawResponse?: any // Saves the full JSON body for deep debugging
    ) {
        // Construct a highly readable log message
        const prefix = RosHttpMessages[status] ?? 'Unknown Error';
        super(`[RosInterface] ${status} ${prefix} (${command}) -> ${detail}`);

        this.name = 'RosError';
        this.timestamp = Date.now();

        // Fix for extending built-ins in TypeScript/ES6 environments
        Object.setPrototypeOf(this, RosError.prototype);
    }

    // --- 1. Surgical Precision Getters ---
    // All O(1) primitive comparisons.

    /** Resource missing (404) */
    get isNotFound(): boolean {
        return this.status === RosHttpStatus.NOT_FOUND;
    }

    /** Authentication failure (401) */
    get isAuthError(): boolean {
        return this.status === RosHttpStatus.UNAUTHORIZED;
    }

    /** Permissions failure (403) */
    get isPermissionError(): boolean {
        return this.status === RosHttpStatus.FORBIDDEN;
    }

    /**
     * Critical: Detects if the error is due to a duplicate item.
     * Useful for Idempotency logic.
     */
    get isDuplicate(): boolean {
        if (this.status !== RosHttpStatus.BAD_REQUEST) return false;
        // OPTIMIZATION: Using RegExp test instead of string allocation.
        return DUPLICATE_MSG_REGEX.test(this.detail);
    }

    /** Rate Limiting hit (429) */
    get isRateLimit(): boolean {
        return this.status === RosHttpStatus.TOO_MANY_REQUESTS;
    }

    /** True if the error is likely temporary (503, 429, etc) */
    get isRetryable(): boolean {
        // O(1) memory-safe lookup.
        return RETRYABLE_STATUSES.has(this.status);
    }

    // --- 2. Factory Method (The Logic Cleaner) ---

    /**
     * Static factory to parse a Fetch Response and throw/return a typed RosError.
     * Encapsulates all the "dirty" JSON parsing logic from RouterOS.
     */
    public static async fromResponse(response: Response, command: string): Promise<RosError> {
        const status = response.status;
        let detail = response.statusText;
        let rawBody: any = null;

        try {
            const text = await response.text();

            // OPTIMIZATION: Quick check before attempting JSON parse to avoid
            // the heavy try/catch block if the response is obviously not JSON (e.g. HTML proxy error).
            if (text && text.startsWith('{')) {
                try {
                    rawBody = JSON.parse(text);
                    detail = rawBody.detail ?? rawBody.message ?? text;
                } catch {
                    detail = text;
                }
            } else {
                detail = text || detail;
            }
        } catch {
            detail = "Could not read response body";
        }

        return new RosError(status, detail, command, rawBody);
    }

    /**
     * Custom generic JSON representation for logging systems (DataDog, Sentry, etc.)
     */
    public toJSON() {
        return {
            sdk: this._brand,
            errorType: this.name,
            status: this.status,
            message: this.message,
            detail: this.detail,
            command: this.command,
            isRetryable: this.isRetryable,
            // Convert back to ISO string for standard log ingestion
            timestamp: new Date(this.timestamp).toISOString()
        };
    }
}