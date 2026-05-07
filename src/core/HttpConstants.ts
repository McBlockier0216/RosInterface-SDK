/**
 * core/HttpConstants.ts
 *
 * The authoritative dictionary for RouterOS REST API Status Codes.
 * Maps standard HTTP codes to specific MikroTik behaviors and meanings.
 */

// OPTIMIZATION: Converted to `const enum`.
// Standard enums create a physical, bidirectional JavaScript object at runtime.
// A `const enum` is completely erased during compilation; TypeScript simply inlines
// the integer values (e.g., replaces `RosHttpStatus.OK` directly with `200` in the final JS).
// This results in 0 bytes of memory footprint for the enum itself.
export const enum RosHttpStatus {
    // --- Success ---
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,

    // --- Client Errors (Usually fixable by code changes) ---
    BAD_REQUEST = 400,          // Validation, Missing Params, or "Already Exists"
    UNAUTHORIZED = 401,         // Invalid Credentials
    FORBIDDEN = 403,            // Valid credentials, but insufficient Group Permissions
    NOT_FOUND = 404,            // Menu path wrong OR Item ID not found
    METHOD_NOT_ALLOWED = 405,   // e.g. POST on a Read-Only menu
    NOT_ACCEPTABLE = 406,       // Invalid data types (e.g. string instead of int)
    CONFLICT = 409,             // Resource state conflict
    GONE = 410,                 // Endpoint deprecated in this RouterOS version
    PAYLOAD_TOO_LARGE = 413,    // Uploading a file larger than RAM/Flash
    UNSUPPORTED_MEDIA_TYPE = 415, // Forgot 'application/json' header
    LOCKED = 423,               // Database locked (rare)
    TOO_MANY_REQUESTS = 429,    // REST API rate limit hit

    // --- Server Errors (Router issues) ---
    INTERNAL_SERVER_ERROR = 500, // Script error, Lua crash, or filesystem error
    NOT_IMPLEMENTED = 501,       // Feature not installed (e.g. missing 'wireless' package)
    BAD_GATEWAY = 502,           // Proxy error (if traversing another router)
    SERVICE_UNAVAILABLE = 503,   // System overloaded / booting up
    GATEWAY_TIMEOUT = 504        // Command took too long (timeout)
}

/**
 * Human-readable, RouterOS-contextual descriptions.
 * This remains a standard dictionary as we need runtime string lookups.
 */
export const RosHttpMessages: Record<number, string> = {
    400: "Bad Request: Parameter validation failed, syntax error, or item already exists.",
    401: "Unauthorized: Invalid username/password or token expired.",
    403: "Forbidden: Your user group does not have permission for this policy/menu.",
    404: "Not Found: The menu path or specific item ID (*id) does not exist.",
    405: "Method Not Allowed: This action (verb) is not supported on this menu.",
    406: "Not Acceptable: One or more parameters have invalid types/formats.",
    413: "Payload Too Large: The file/body size exceeds RouterOS limits.",
    429: "Too Many Requests: REST API concurrency limit reached. Slow down.",
    500: "RouterOS Internal Error: The command caused a script failure or system crash.",
    501: "Not Implemented: The required package is disabled or not installed.",
    503: "Service Unavailable: Router is booting, overloaded, or maintenance mode.",
    504: "Gateway Timeout: The command execution exceeded the timeout limit.",
};

/**
 * Helper to determine if a request should be retried automatically.
 * Useful for Circuit Breakers and Retry Policies.
 */
export function isRetryableCode(status: number): boolean {
    // OPTIMIZATION: Replaced `[...].includes(status)` with a `switch` statement.
    // 1. `[...].includes()` is O(N) and allocates a new Array in memory on EVERY call.
    // 2. A `switch` statement evaluating literal integers is optimized by the V8 engine
    //    into a "Jump Table" at the machine code level.
    // 3. This executes in strictly O(1) time and requires exactly ZERO memory allocation.
    switch (status) {
        case RosHttpStatus.TOO_MANY_REQUESTS:     // 429
        case RosHttpStatus.INTERNAL_SERVER_ERROR: // 500
        case RosHttpStatus.BAD_GATEWAY:           // 502
        case RosHttpStatus.SERVICE_UNAVAILABLE:   // 503
        case RosHttpStatus.GATEWAY_TIMEOUT:       // 504
        case RosHttpStatus.LOCKED:                // 423
            return true;
        default:
            return false;
    }
}