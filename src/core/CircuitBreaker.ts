/**
 * CircuitBreakerState Enum
 * Defines the possible states of the protection mechanism.
 *
 * OPTIMIZATION: Using `const enum` instead of `enum`.
 * TypeScript will inline these values (0, 1, 2) at compile time instead of
 * creating a reverse-mapping object at runtime. This saves memory and
 * avoids object lookups.
 */
export const enum CircuitBreakerState {
    /** Normal operation. Requests pass through. */
    CLOSED = 0,
    /** Failure threshold reached. Requests are blocked immediately. */
    OPEN = 1,
    /** Cool-down period over. A test request is allowed to check health. */
    HALF_OPEN = 2
}

/**
 * OPTIMIZATION: Pre-allocated array for O(1) state name resolution.
 * Since we used `const enum`, we lose TypeScript's reverse mapping.
 * An array index lookup is significantly faster than an object property lookup.
 */
const STATE_NAMES = ['CLOSED', 'OPEN', 'HALF_OPEN'];

export interface CircuitBreakerOptions {
    /** Number of failures allowed before opening the circuit (Default: 5) */
    failureThreshold?: number;
    /** Time in ms to wait before trying to reconnect (Default: 10000ms) */
    resetTimeout?: number;
}

/**
 * CircuitBreaker
 * * Implements the classic stability pattern.
 * * Wraps potentially dangerous network calls.
 * * If the router fails repeatedly, the breaker "trips" and prevents further load
 * until the system recovers.
 */
export class CircuitBreaker {
    private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
    private failureCount: number = 0;
    private lastFailureTime: number = 0;

    private readonly failureThreshold: number;
    private readonly resetTimeout: number;

    constructor(options: CircuitBreakerOptions = {}) {
        this.failureThreshold = options.failureThreshold ?? 5;
        this.resetTimeout = options.resetTimeout ?? 10000;
    }

    /**
     * Executes an async action (like client.connect() or client.write())
     * through the safety mechanism of the breaker.
     */
    public async execute<T>(action: () => Promise<T>): Promise<T> {
        // 1. Check State
        if (this.state === CircuitBreakerState.OPEN) {
            // OPTIMIZATION: Call Date.now() only once and store it in a constant.
            // System clock calls are slightly expensive, doing it once saves CPU cycles.
            const now = Date.now();
            const timeSinceLastFailure = now - this.lastFailureTime;

            if (timeSinceLastFailure > this.resetTimeout) {
                this.transitionTo(CircuitBreakerState.HALF_OPEN);
            } else {
                const timeLeft = this.resetTimeout - timeSinceLastFailure;
                // Note: Throwing creates an Error object (garbage collection overhead),
                // but this is the failure path, so stability is prioritized over GC here.
                throw new Error(`CircuitBreaker is OPEN. Fast-failing. Retry in ${timeLeft}ms.`);
            }
        }

        // 2. Attempt Execution
        try {
            const result = await action();
            return this.onSuccess(result);
        } catch (error) {
            return this.onFailure(error as Error);
        }
    }

    /**
     * Handles successful execution. Resets failure counts.
     */
    private onSuccess<T>(result: T): T {
        // OPTIMIZATION: Strict equality check is faster. Only transition if
        // we are NOT already CLOSED, avoiding unnecessary function calls.
        if (this.state !== CircuitBreakerState.CLOSED) {
            this.transitionTo(CircuitBreakerState.CLOSED);
        }
        this.failureCount = 0;
        return result;
    }

    /**
     * Handles execution failures. Trips the breaker if needed.
     */
    private onFailure(error: Error): never {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitBreakerState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
            this.transitionTo(CircuitBreakerState.OPEN);
        }

        throw error;
    }

    private transitionTo(newState: CircuitBreakerState): void {
        this.state = newState;
        console.warn(`[CircuitBreaker] State changed to: ${STATE_NAMES[newState]}`);
    }

    public getState(): CircuitBreakerState {
        return this.state;
    }
}