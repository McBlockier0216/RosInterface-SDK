import { MikrotikClient, IWriteOptions } from "../client/MikrotikClient";

export class SystemWrapper {
    private client: MikrotikClient;

    constructor(client: MikrotikClient) {
        this.client = client;
    }

    // ==========================================
    // NETWORK DISCOVERY (Inspired by nat-api)
    // ==========================================

    /**
     * **Retrieve: External Public IP (PRINT)**
     *
     * Queries the router's Cloud/DDNS service or specific interfaces to find the true external IP.
     *
     * **Feature: Dynamic IP Discovery & CGNAT Bypass**
     * Inspired by `nat-api`, this method retrieves the public IP. By utilizing RouterOS's
     * built-in `/ip/cloud`, it can often discover the true public IP even if the router
     * is behind an ISP's NAT (CGNAT).
     *
     * @param forceCloud If true, forces the use of MikroTik's Cloud service to detect the IP.
     * @param options Advanced write options (Highly recommended to use Sockets for speed here).
     * @returns A promise resolving to the public IP address as a string.
     *
     * @example
     * ```typescript
     * // Get the true external IP (useful for dynamic DNS updates in your app)
     * const myPublicIp = await mk.system.getExternalIp(true);
     * console.log(`Router is reachable at: ${myPublicIp}`);
     * ```
     */
    async getExternalIp(forceCloud: boolean = true, options?: IWriteOptions): Promise<string> {
        if (forceCloud) {
            // Force an update to ensure we have the latest IP from MikroTik servers
            await this.client.write('/ip/cloud/force-update', {}, options);
            const cloudResult = await this.client.write('/ip/cloud/print', {}, options);

            if (cloudResult.length > 0 && cloudResult[0]['public-address']) {
                return cloudResult[0]['public-address'].toString();
            }
            throw new Error('Could not retrieve public IP from MikroTik Cloud. Ensure Cloud is enabled.');
        } else {
            // Fallback: Just grab the first IP that isn't a local subnet (Simplified logic)
            const result = await this.client.write('/ip/address/print', {}, options);
            const externalObj = result.find(r => r.address && !r.address.startsWith('192.168.') && !r.address.startsWith('10.'));

            if (externalObj) return externalObj.address.toString().split('/')[0];
            throw new Error('No external IP found on any interface.');
        }
    }

    // ==========================================
    // HARDWARE & HEALTH MONITORING
    // ==========================================

    /**
     * **Retrieve: System Resources (PRINT)**
     *
     * Sends a `/system/resource/print` command to fetch hardware health metrics.
     *
     * **Feature: Real-time Telemetry**
     * Perfect for dashboards. Returns CPU load, free memory, disk space, and total uptime.
     *
     * @param options Advanced write options.
     * @returns A promise resolving to an object containing vital system metrics.
     *
     * @example
     * ```typescript
     * // Fetch and log CPU load and uptime
     * const resources = await mk.system.getResources();
     * console.log(`CPU Load: ${resources[0]['cpu-load']}%`);
     * console.log(`Uptime: ${resources[0]['uptime']}`);
     * ```
     */
    async getResources(options?: IWriteOptions) {
        return this.client.write('/system/resource/print', {}, options);
    }

    // ==========================================
    // MAINTENANCE & BACKUPS
    // ==========================================

    /**
     * **Execution: Generate Configuration Backup (SAVE)**
     *
     * Sends a `/system/backup/save` command to generate an encrypted `.backup` file.
     *
     * **Feature: Hybrid Protocol Advantage (REST vs Sockets)**
     * You can force this command via REST using your `IWriteOptions`. REST is much
     * more stable for operations that write large files to the router's NAND flash.
     *
     * @param name The desired name for the backup file (e.g., 'weekly-backup').
     * @param password Optional password to encrypt the backup.
     * @param options Advanced write options (Tip: `{ forceProtocol: 'rest' }`).
     * @returns A promise resolving when the backup is complete.
     *
     * @example
     * ```typescript
     * // Generate a secure backup forcing the REST API to avoid socket timeouts
     * await mk.system.createBackup('Example_Core_Backup', 'superSecret123', {
     * forceProtocol: 'rest'
     * });
     * console.log('Backup file saved in router storage.');
     * ```
     */
    async createBackup(name: string, password?: string, options?: IWriteOptions) {
        const params: Record<string, string> = { name };
        if (password) params.password = password;

        return this.client.write('/system/backup/save', params, options);
    }

    /**
     * **Execution Terminator: Reboot Router (REBOOT)**
     *
     * Sends a `/system/reboot` command.
     *
     * **Feature: Emergency Recovery**
     * Restarts the operating system. The connection will be dropped immediately
     * after executing this command.
     *
     * @param options Advanced write options.
     * @returns A promise that resolves before the connection drops.
     *
     * @example
     * ```typescript
     * // Reboot the router at 3:00 AM for maintenance
     * try {
     * await mk.system.reboot();
     * } catch (e) {
     * console.log('Connection closed expectedly during reboot.');
     * }
     * ```
     */
    async reboot(options?: IWriteOptions) {
        // We catch the error internally because MikroTik will immediately sever
        // the TCP socket, which often throws an EOF error in Node.js.
        try {
            return await this.client.write('/system/reboot', {}, options);
        } catch (error: any) {
            if (error.message.includes('socket hang up') || error.message.includes('closed')) {
                return true; // Expected behavior
            }
            throw error;
        }
    }
}