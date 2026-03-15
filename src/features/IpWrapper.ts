import { MikrotikClient, IWriteOptions } from "../client/MikrotikClient";

export class IpWrapper {
    private client: MikrotikClient;

    constructor(client: MikrotikClient) {
        this.client = client;
    }

    // ==========================================
    // DHCP LEASES (Static IP Assignment)
    // ==========================================

    /**
     * **Retrieve: DHCP Leases (PRINT)**
     *
     * Sends a `/ip/dhcp-server/lease/print` command to get active or static leases.
     *
     * **Feature: Filtered Search**
     * You can pass a dictionary of parameters to filter the results directly on the router,
     * reducing the amount of data transferred over the network.
     *
     * @param filter Optional dictionary to filter results (e.g., `{"?mac-address": "00:11:22:33:44:55"}`).
     * @param options Advanced write options (idempotency, forced protocol).
     * @returns A promise resolving to an array of DHCP lease objects.
     *
     * @example
     * ```typescript
     * // Find the IP address currently assigned to a specific MAC
     * const leases = await mk.ip.getDhcpLeases({ "?mac-address": "00:11:22:33:44:55" });
     * if (leases.length > 0) {
     * console.log(`Assigned IP: ${leases[0].address}`);
     * }
     * ```
     */
    async getDhcpLeases(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/dhcp-server/lease/print', filter || {}, options);
    }

    /**
     * **Resource Creation: Static Lease (ADD)**
     *
     * Sends an `/ip/dhcp-server/lease/add` command to bind an IP to a MAC address.
     *
     * **Feature: Permanent IP Binding**
     * Essential for IPoE networks where clients require a fixed IP address
     * based on their hardware address without using PPPoE.
     *
     * @param macAddress The hardware MAC address of the client's router/device.
     * @param ipAddress The static IP address to assign.
     * @param server The name of the DHCP server instance (e.g., 'dhcp_lan').
     * @param additionalParams Optional dictionary for extra parameters (comment, client-id).
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Assign a static IP to a new customer's router
     * await mk.ip.addStaticLease(
     * '00:11:22:33:44:55',
     * '192.168.20.50',
     * 'dhcp_lan',
     * { comment: 'Customer: Alice Smith - Plan Basic' }
     * );
     * ```
     */
    async addStaticLease(
        macAddress: string,
        ipAddress: string,
        server: string,
        additionalParams?: Record<string, string | boolean | number>,
        options?: IWriteOptions
    ) {
        return this.client.write('/ip/dhcp-server/lease/add', {
            "mac-address": macAddress,
            address: ipAddress,
            server: server,
            ...additionalParams
        }, options);
    }

    /**
     * **Execution Terminator: Delete Lease (REMOVE)**
     *
     * Sends an `/ip/dhcp-server/lease/remove` command to delete a lease.
     *
     * **Feature: Safe Deletion**
     * It automatically searches for the dynamic internal ID (`.id`) using the provided IP
     * before attempting to remove it.
     *
     * @param ipAddress The exact IP address of the lease to remove.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Remove a customer's IP binding after service cancellation
     * try {
     * await mk.ip.removeDhcpLease('192.168.20.50');
     * console.log('Lease removed successfully');
     * } catch (error) {
     * console.error(error.message);
     * }
     * ```
     */
    async removeDhcpLease(ipAddress: string, options?: IWriteOptions) {
        const result = await this.getDhcpLeases({ "?address": ipAddress }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ip/dhcp-server/lease/remove', {
                ".id": result[0]['.id']
            }, options);
        }
        throw new Error(`DHCP Lease for IP '${ipAddress}' not found.`);
    }

    // ==========================================
    // ARP (Address Resolution Protocol / Security)
    // ==========================================

    /**
     * **Retrieve: ARP Table (PRINT)**
     *
     * Sends an `/ip/arp/print` command to list current ARP entries.
     *
     * @param filter Optional dictionary to filter results (e.g., searching by interface or IP).
     * @param options Advanced write options.
     * @returns A promise resolving to an array of ARP entries.
     *
     * @example
     * ```typescript
     * // Check if a specific IP is reachable at layer 2
     * const arpEntries = await mk.ip.getArpEntries({ "?address": "192.168.20.50" });
     * const isConnected = arpEntries.length > 0;
     * ```
     */
    async getArpEntries(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/arp/print', filter || {}, options);
    }

    /**
     * **Resource Creation: Static ARP (ADD)**
     *
     * Sends an `/ip/arp/add` command to create a static layer 2 binding.
     *
     * **Feature: Layer 2 Security**
     * Highly recommended for WISP security to prevent IP spoofing when
     * the router interface is set to `reply-only`.
     *
     * @param macAddress The hardware MAC address of the client.
     * @param ipAddress The exact IP address assigned to the client.
     * @param interfaceName The physical or logical interface facing the client.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Secure a static IP customer by binding their MAC to the interface
     * await mk.ip.addStaticArp(
     * '00:11:22:33:44:55',
     * '192.168.20.50',
     * 'ether3_Clients'
     * );
     * ```
     */
    async addStaticArp(
        macAddress: string,
        ipAddress: string,
        interfaceName: string,
        options?: IWriteOptions
    ) {
        return this.client.write('/ip/arp/add', {
            "mac-address": macAddress,
            address: ipAddress,
            interface: interfaceName
        }, options);
    }

    /**
     * **Execution Terminator: Delete ARP Entry (REMOVE)**
     *
     * Sends an `/ip/arp/remove` command to delete a static or dynamic ARP entry.
     *
     * @param ipAddress The IP address of the ARP entry to delete.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // Clean up the ARP table when a client is permanently disconnected
     * await mk.ip.removeArpEntry('192.168.20.50');
     * ```
     */
    async removeArpEntry(ipAddress: string, options?: IWriteOptions) {
        const result = await this.getArpEntries({ "?address": ipAddress }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ip/arp/remove', {
                ".id": result[0]['.id']
            }, options);
        }
        throw new Error(`ARP entry for IP '${ipAddress}' not found.`);
    }
}