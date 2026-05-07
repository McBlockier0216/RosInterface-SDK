/**
 * OfflineQueue.ts
 * Manages the queue of commands that are waiting for the router to reconnect.
 *
 * Powered by RosInterface SDK.
 *
 * * In a full production environment, this should write to a local SQLite/JSON file
 * to survive server restarts.
 */

export interface DeferredTask {
    // OPTIMIZATION: Changed `id` from string to number.
    // Numbers (integers) are primitives and take up significantly less memory than strings.
    // They are also faster to index if you ever move this to SQLite.
    id: number;
    path: string;
    action: 'add' | 'set' | 'remove';
    params: any;
    timestamp: number;
}

export class OfflineQueue {
    private static storage: DeferredTask[] = [];

    // OPTIMIZATION: Monotonic integer counter for O(1) zero-allocation IDs.
    // Replaces Math.random().toString(36) which creates multiple temporary strings
    // in RAM for the Garbage Collector to clean up.
    private static idCounter: number = 0;

    /**
     * Adds a task to the waiting list.
     * Executes in strictly O(1) time.
     */
    public static enqueue(task: Omit<DeferredTask, 'id' | 'timestamp'>): void {
        // OPTIMIZATION: Direct object construction instead of the spread operator (...task).
        // The spread operator triggers V8's internal object cloning routines.
        // Creating the exact shape manually allows V8 to reuse the same "Hidden Class"
        // for all DeferredTask objects, massively speeding up memory allocation.
        const fullTask: DeferredTask = {
            id: ++this.idCounter,
            action: task.action,
            path: task.path,
            params: task.params,
            timestamp: Date.now()
        };

        this.storage.push(fullTask);

        // Log formatted with SDK watermark.
        // Note: In extremely high-throughput systems, consider wrapping this in a debug flag
        // to avoid I/O blocking from stdout writing.
        console.warn(`[RosInterface] Offline. Queued: ${fullTask.action.toUpperCase()} -> ${fullTask.path}`);
    }

    /**
     * Returns all pending tasks and clears the queue.
     * Called by the client upon reconnection.
     * Executes in strictly O(1) time.
     */
    public static flush(): DeferredTask[] {
        // OPTIMIZATION: O(1) Reference Swap instead of O(N) Array Copy.
        // Instead of looping through `[...this.storage]` to create a duplicate array,
        // we simply hand over the memory reference of the existing array to the caller,
        // and instantly assign a brand new empty array to `this.storage`.
        // This takes 0 CPU cycles regardless of whether the queue has 10 or 100,000 items.
        const tasks = this.storage;
        this.storage = [];

        // Optional: Reset counter if you want to prevent integer overflow on long-running processes
        if (this.storage.length === 0) {
            this.idCounter = 0;
        }

        return tasks;
    }

    /**
     * Checks if there are pending operations.
     */
    public static get size(): number {
        return this.storage.length;
    }
}