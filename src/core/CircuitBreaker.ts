/**
 * CircuitBreakerState Enum
 * Defines the possible states of the protection mechanism.
 */
export const enum CircuitBreakerState {
    CLOSED = 0,
    OPEN = 1,
    HALF_OPEN = 2
}

const STATE_NAMES = ['CLOSED', 'OPEN', 'HALF_OPEN'];

export interface CircuitBreakerOptions {
    /** Number of failures allowed before opening the circuit (Default: 5) */
    failureThreshold?: number;
    /** Time in ms to wait before trying to reconnect (Default: 10000ms) */
    resetTimeout?: number;
}

/**
 * CircuitBreaker
 * Implements the classic stability pattern with Concurrency Locks.
 */
export class CircuitBreaker {
    private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
    private failureCount: number = 0;
    private lastFailureTime: number = 0;

    // NEW: Concurrency lock for the HALF_OPEN state
    private isTesting: boolean = false;

    private readonly failureThreshold: number;
    private readonly resetTimeout: number;

    constructor(options: CircuitBreakerOptions = {}) {
        this.failureThreshold = options.failureThreshold ?? 5;
        this.resetTimeout = options.resetTimeout ?? 10000;
    }

    /**
     * Executes an async action through the safety mechanism of the breaker.
     */
    public async execute<T>(action: () => Promise<T>): Promise<T> {
        // 1. Check State and Concurrency Locks
        if (this.state === CircuitBreakerState.OPEN) {
            const now = Date.now();
            const timeSinceLastFailure = now - this.lastFailureTime;

            if (timeSinceLastFailure > this.resetTimeout) {
                // Time is up. We transition to HALF_OPEN.
                this.transitionTo(CircuitBreakerState.HALF_OPEN);
                // LOCK ACQUIRED: This specific request becomes the "Probe"
                this.isTesting = true;
            } else {
                const timeLeft = this.resetTimeout - timeSinceLastFailure;
                throw new Error(`CircuitBreaker is OPEN. Fast-failing. Retry in ${timeLeft}ms.`);
            }
        }
        else if (this.state === CircuitBreakerState.HALF_OPEN) {
            // Anti-Thundering-Herd: If another request comes in while the probe
            // is still executing, reject it immediately to protect the router.
            if (this.isTesting) {
                throw new Error('CircuitBreaker is HALF_OPEN. Probe request in progress. Fast-failing.');
            }
            // Fallback lock acquisition
            this.isTesting = true;
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
     * Handles successful execution. Resets failure counts and releases locks.
     */
    private onSuccess<T>(result: T): T {
        // RELEASE LOCK
        this.isTesting = false;

        if (this.state !== CircuitBreakerState.CLOSED) {
            this.transitionTo(CircuitBreakerState.CLOSED);
        }
        this.failureCount = 0;
        return result;
    }

    /**
     * Handles execution failures. Trips the breaker if needed and releases locks.
     */
    private onFailure(error: Error): never {
        // RELEASE LOCK
        this.isTesting = false;

        this.failureCount++;
        this.lastFailureTime = Date.now();

        // If the probe failed, OR we reached the limit during normal operations, trip it.
        if (this.state === CircuitBreakerState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
            this.transitionTo(CircuitBreakerState.OPEN);
        }

        throw error;
    }

    private transitionTo(newState: CircuitBreakerState): void {
        this.state = newState;
        // OPTIONAL: In production, consider changing console.warn to a custom
        // Event Emitter or logging interface, as console logs are synchronous and block the thread slightly.
        console.warn(`[CircuitBreaker] State changed to: ${STATE_NAMES[newState]}`);
    }

    public getState(): CircuitBreakerState {
        return this.state;
    }
}