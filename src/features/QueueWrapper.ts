import { MikrotikClient, IWriteOptions } from "../client/MikrotikClient";

export class QueueWrapper {
    private client: MikrotikClient;

    constructor(client: MikrotikClient) {
        this.client = client;
    }

    /**
     * **Retrieve: Simple Queues (PRINT)**
     *
     * Sends a `/queue/simple/print` command to list bandwidth queues.
     *
     * **Feature: Filtered Search**
     * You can pass a dictionary of parameters to filter the results directly on the router,
     * reducing network overhead and processing time.
     *
     * @param filter Optional dictionary to filter results (e.g., `{"?target": "192.168.10.50/32"}`).
     * @param options Advanced write options (idempotency, forced protocol).
     * @returns A promise resolving to an array of queue objects.
     *
     * @example
     * ```typescript
     * // Get all configured queues
     * const allQueues = await mk.queue.getQueues();
     * * // Find a specific queue by its target IP
     * const clientQueue = await mk.queue.getQueues({ "?target": "192.168.10.50/32" });
     * ```
     */
    async getQueues(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/queue/simple/print', filter || {}, options);
    }

    /**
     * **Resource Creation: Simple Queue (ADD)**
     *
     * Sends a `/queue/simple/add` command to limit bandwidth for a specific target.
     *
     * **Feature: Bandwidth Allocation (QoS)**
     * Creates basic rules to limit upload and download speeds. You can also pass
     * additional parameters to build hierarchical QoS trees.
     *
     * @param name The identifier name for the queue (e.g., 'Client_John').
     * @param target The target IP address or subnet (e.g., '192.168.10.50/32').
     * @param maxLimit The maximum bandwidth allowed format (Upload/Download) e.g., '10M/20M'.
     * @param additionalParams Optional dictionary for extra parameters like priority, parent queue, etc.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Create a 20 Megabit download / 10 Megabit upload limit for a single IP
     * await mk.queue.addQueue('Client_John', '192.168.10.50/32', '10M/20M');
     * * // Create a queue with a specific parent for hierarchical QoS
     * await mk.queue.addQueue('Client_Jane', '192.168.10.51/32', '5M/10M', { parent: 'Main_Node' });
     * ```
     */
    async addQueue(
        name: string,
        target: string,
        maxLimit: string,
        additionalParams?: Record<string, string | boolean | number>,
        options?: IWriteOptions
    ) {
        return this.client.write('/queue/simple/add', {
            name,
            target,
            "max-limit": maxLimit,
            ...additionalParams // Spread any extra config like parent, priority, limit-at
        }, options);
    }

    /**
     * **Resource Modification: Update Queue (SET)**
     *
     * Sends a `/queue/simple/set` command to modify an existing Simple Queue.
     *
     * **Feature: Dynamic Speed Adjustment**
     * Automatically resolves the internal `.id` based on the target IP and applies
     * the new parameters, allowing for on-the-fly plan upgrades/downgrades.
     *
     * @param target The exact target IP or subnet of the queue to modify.
     * @param paramsToUpdate Dictionary containing the fields to update (e.g., `{"max-limit": "50M/100M"}`).
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Upgrade a user's bandwidth on the fly
     * await mk.queue.setQueueLimit('192.168.10.50/32', { "max-limit": "20M/50M" });
     * ```
     */
    async setQueueLimit(
        target: string,
        paramsToUpdate: Record<string, string | boolean | number>,
        options?: IWriteOptions
    ) {
        const result = await this.getQueues({ "?target": target }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/queue/simple/set', {
                ".id": result[0]['.id'],
                ...paramsToUpdate // Inject new values
            }, options);
        }
        throw new Error(`Queue with target '${target}' not found.`);
    }

    /**
     * **Execution Terminator: Delete Queue (REMOVE)**
     *
     * Sends a `/queue/simple/remove` command to permanently delete a Simple Queue.
     *
     * **Feature: Safe Deletion**
     * Searches for the exact dynamic ID before attempting removal, preventing errors
     * if the queue does not exist.
     *
     * @param target The exact target IP or subnet of the queue to delete.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Remove bandwidth limits for a specific IP
     * try {
     * await mk.queue.removeQueue('192.168.10.50/32');
     * console.log('Queue removed successfully');
     * } catch (error) {
     * console.error(error.message);
     * }
     * ```
     */
    async removeQueue(target: string, options?: IWriteOptions) {
        const result = await this.getQueues({ "?target": target }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/queue/simple/remove', {
                ".id": result[0]['.id']
            }, options);
        }
        throw new Error(`Queue with target '${target}' not found.`);
    }

    /**
     * **Execution: Reset Statistics (RESET-COUNTERS)**
     *
     * Sends a `/queue/simple/reset-counters` command to clear traffic data.
     *
     * **Feature: Traffic Monitoring Reset**
     * Useful for billing cycles or data cap management when you need to reset
     * the bytes/packets counted by the router for a specific target.
     *
     * @param target The exact target IP or subnet of the queue to reset.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Reset traffic statistics at the beginning of a billing cycle
     * await mk.queue.resetCounters('192.168.10.50/32');
     * ```
     */
    async resetCounters(target: string, options?: IWriteOptions) {
        const result = await this.getQueues({ "?target": target }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/queue/simple/reset-counters', {
                ".id": result[0]['.id']
            }, options);
        }
        throw new Error(`Queue with target '${target}' not found.`);
    }
}