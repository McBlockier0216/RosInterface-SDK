import { MikrotikClient, IWriteOptions } from "../client/MikrotikClient";

export class PPPWrapper {
    private client: MikrotikClient;

    constructor(client: MikrotikClient) {
        this.client = client;
    }

    // ==========================================
    // SECRETS (User Management)
    // ==========================================

    /**
     * **Retrieve: PPP Secrets (PRINT)**
     *
     * Sends a `/ppp/secret/print` command to list user accounts.
     *
     * **Feature: Filtered Search**
     * You can pass a dictionary of parameters to filter the results directly on the router,
     * reducing the amount of data transferred over the network.
     *
     * @param filter Optional dictionary to filter results (e.g., `{"?profile": "Plan_50M"}`).
     * @param options Advanced write options (idempotency, forced protocol).
     * @returns A promise resolving to an array of secret objects.
     *
     * @example
     * ```typescript
     * // Get all users
     * const allUsers = await mk.ppp.getSecrets();
     * * // Get users assigned to a specific profile
     * const basicUsers = await mk.ppp.getSecrets({ "?profile": "Plan_20M" });
     * ```
     */
    async getSecrets(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ppp/secret/print', filter || {}, options);
    }

    /**
     * **Resource Creation: PPP Secret (ADD)**
     *
     * Sends a `/ppp/secret/add` command to create a new PPPoE user account.
     *
     * **Feature: Account Provisioning**
     * Essential for onboarding new clients, allowing you to specify their
     * authentication credentials and link them to a specific bandwidth profile.
     *
     * @param name The username for the PPPoE connection.
     * @param password The password for the connection.
     * @param profile The PPP profile (plan) to assign. Defaults to 'default'.
     * @param service The service type. Defaults to 'pppoe'.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Add a new client with a specific plan
     * await mk.ppp.addSecret('john_doe', 'securePass123', 'Plan_50M');
     * ```
     */
    async addSecret(
        name: string,
        password: string,
        profile: string = 'default',
        service: string = 'pppoe',
        additionalParams?: Record<string, string | boolean | number>,
        options?: IWriteOptions
    ) {
        return this.client.write('/ppp/secret/add', {
            name,
            password,
            profile,
            service,
            ...additionalParams
        }, options);
    }

    /**
     * **Resource Modification: Update Secret (SET)**
     *
     * Sends a `/ppp/secret/set` command to modify an existing user account.
     *
     * **Feature: Dynamic Provisioning**
     * Automatically resolves the internal `.id` based on the username and applies
     * the new parameters. Useful for changing passwords or upgrading plans.
     *
     * @param name The exact username of the secret to modify.
     * @param paramsToUpdate Dictionary containing the fields to update.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Upgrade a user's plan and change their password
     * await mk.ppp.setSecret('john_doe', {
     * profile: 'Plan_100M',
     * password: 'newPassword456'
     * });
     * ```
     */
    async setSecret(
        name: string,
        paramsToUpdate: Record<string, string | boolean | number>,
        options?: IWriteOptions
    ) {
        const result = await this.getSecrets({ "?name": name }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ppp/secret/set', {
                ".id": result[0]['.id'],
                ...paramsToUpdate // Inject new values
            }, options);
        }
        throw new Error(`PPP Secret '${name}' not found.`);
    }

    /**
     * **State Modification: Enable Secret (ENABLE)**
     *
     * Sends a `/ppp/secret/enable` command to activate a previously disabled account.
     *
     * **Feature: Service Reactivation**
     * Restores access for a client, typically used automatically after an invoice is paid.
     *
     * @param name The username to enable.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Reactivate service for a user who paid their invoice
     * await mk.ppp.enableSecret('john_doe');
     * ```
     */
    async enableSecret(name: string, options?: IWriteOptions) {
        const result = await this.getSecrets({ "?name": name }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ppp/secret/enable', {
                ".id": result[0]['.id']
            }, options);
        }
        throw new Error(`PPP Secret '${name}' not found.`);
    }

    /**
     * **State Modification: Disable Secret (DISABLE)**
     *
     * Sends a `/ppp/secret/disable` command to suspend a user account.
     *
     * **Feature: Service Suspension**
     * Prevents the user from authenticating. Does not drop active connections
     * automatically (use `killActiveSession` for that).
     *
     * @param name The username to disable.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Suspend a user for non-payment
     * await mk.ppp.disableSecret('john_doe');
     * * // Note: To immediately drop their connection, call killActiveSession() after this.
     * ```
     */
    async disableSecret(name: string, options?: IWriteOptions) {
        const result = await this.getSecrets({ "?name": name }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ppp/secret/disable', {
                ".id": result[0]['.id']
            }, options);
        }
        throw new Error(`PPP Secret '${name}' not found.`);
    }

    /**
     * **Execution Terminator: Delete Secret (REMOVE)**
     *
     * Sends a `/ppp/secret/remove` command to permanently delete a user account.
     *
     * **Feature: Safe Deletion**
     * Searches for the exact dynamic ID before attempting removal, preventing errors.
     *
     * @param name The username to delete.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Delete a user who canceled their subscription
     * try {
     * await mk.ppp.removeSecret('john_doe');
     * console.log('User deleted successfully');
     * } catch (error) {
     * console.error(error.message);
     * }
     * ```
     */
    async removeSecret(name: string, options?: IWriteOptions) {
        const result = await this.getSecrets({ "?name": name }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ppp/secret/remove', {
                ".id": result[0]['.id']
            }, options);
        }
        throw new Error(`PPP Secret '${name}' not found.`);
    }

    // ==========================================
    // ACTIVE (Active Sessions Management)
    // ==========================================

    /**
     * **Retrieve: Active Sessions (PRINT)**
     *
     * Sends a `/ppp/active/print` command to list currently connected sessions.
     *
     * **Feature: Real-time Monitoring**
     * Allows you to check who is currently authenticated and connected to the router.
     *
     * @param filter Optional dictionary to filter results (e.g., searching by IP).
     * @param options Advanced write options.
     * @returns A promise resolving to an array of active connection objects.
     *
     * @example
     * ```typescript
     * // Check if a specific user is currently online
     * const activeSessions = await mk.ppp.getActiveConnections({ "?name": "john_doe" });
     * const isOnline = activeSessions.length > 0;
     * ```
     */
    async getActiveConnections(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ppp/active/print', filter || {}, options);
    }

    /**
     * **Execution Terminator: Disconnect Session (REMOVE)**
     *
     * Sends a `/ppp/active/remove` command to force an active session to disconnect.
     *
     * **Feature: Session Management**
     * Ideal for forcing a reconnection after changing a profile, upgrading bandwidth,
     * or suspending service, ensuring the new rules apply immediately.
     *
     * @param name The username of the active session to disconnect.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response, or false if the user wasn't active.
     *
     * @example
     * ```typescript
     * // Suspend user and immediately drop their current session
     * await mk.ppp.disableSecret('john_doe');
     * await mk.ppp.killActiveSession('john_doe');
     * ```
     */
    async killActiveSession(name: string, options?: IWriteOptions) {
        const result = await this.getActiveConnections({ "?name": name }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ppp/active/remove', {
                ".id": result[0]['.id']
            }, options);
        }
        // If the user is not active, the objective is already met
        return false;
    }

    // ==========================================
    // PROFILES (Plan Management)
    // ==========================================

    /**
     * **Retrieve: PPP Profiles (PRINT)**
     *
     * Sends a `/ppp/profile/print` command to list existing service plans.
     *
     * @param filter Optional dictionary to filter results.
     * @param options Advanced write options.
     * @returns A promise resolving to an array of profile objects.
     *
     * @example
     * ```typescript
     * // Get all configured plans on the router
     * const profiles = await mk.ppp.getProfiles();
     * ```
     */
    async getProfiles(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ppp/profile/print', filter || {}, options);
    }

    /**
     * **Resource Creation: PPP Profile (ADD)**
     *
     * Sends a `/ppp/profile/add` command to create a new service plan.
     *
     * **Feature: Bandwidth Allocation**
     * Defines a centralized template for speed limits and routing rules that
     * can be assigned to multiple PPPoE secrets.
     *
     * @param name The name of the new profile.
     * @param rateLimit The bandwidth limit format (Rx/Tx) e.g., '10M/20M'.
     * @param localAddress The local IP address for the tunnel endpoint. Defaults to '192.168.89.1'.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Create a 50 Megabit download / 20 Megabit upload plan
     * await mk.ppp.addProfile('Plan_50M', '20M/50M', '10.0.0.1');
     * ```
     */
    async addProfile(
        name: string,
        rateLimit: string,
        localAddress: string = '192.168.89.1',
        options?: IWriteOptions
    ) {
        return this.client.write('/ppp/profile/add', {
            name,
            "local-address": localAddress,
            "rate-limit": rateLimit
        }, options);
    }
}