import { MikrotikClient, IWriteOptions } from "../client/MikrotikClient";

export class FirewallWrapper {
    private client: MikrotikClient;

    constructor(client: MikrotikClient) {
        this.client = client;
    }

    // ==========================================
    // ADDRESS LISTS (Client Isolation & Grouping)
    // ==========================================

    /**
     * **Retrieve: Address Lists (PRINT)**
     *
     * Sends an `/ip/firewall/address-list/print` command to retrieve IP groupings.
     *
     * **Feature: Filtered Search**
     * Highly useful for checking if a specific customer IP is currently flagged
     * in a suspension or walled-garden list.
     *
     * @param filter Optional dictionary to filter results.
     * @param options Advanced write options.
     * @returns A promise resolving to an array of address list entries.
     *
     * @example
     * ```typescript
     * // 1. Get all IPs currently in the "suspended_users" list
     * const suspended = await mk.firewall.getAddressLists({ "?list": "suspended_users" });
     * * // 2. Check which lists a specific IP belongs to
     * const userLists = await mk.firewall.getAddressLists({ "?address": "192.168.20.50" });
     * ```
     */
    async getAddressLists(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/address-list/print', filter || {}, options);
    }

    /**
     * **Resource Creation: Address List Entry (ADD)**
     *
     * Sends an `/ip/firewall/address-list/add` command to add an IP to a named list.
     *
     * **Feature: Dynamic Grouping & Timeouts**
     * Essential for billing automation. You can add a client to a suspension list
     * indefinitely, or use the `timeout` parameter for temporary bans.
     *
     * @param address The target IP address or subnet (e.g., '192.168.20.50').
     * @param listName The name of the group (e.g., 'suspended_users').
     * @param additionalParams Optional parameters like 'comment' or 'timeout'.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // 1. Suspend a user indefinitely for non-payment
     * await mk.firewall.addAddressList('192.168.20.50', 'suspended_users', {
     * comment: 'Invoice #1045 unpaid'
     * });
     * * // 2. Temporarily block an IP for 1 hour (e.g., due to suspicious activity)
     * await mk.firewall.addAddressList('10.0.0.15', 'temp_blacklist', {
     * timeout: '1h',
     * comment: 'Auto-blocked: SSH brute force'
     * });
     * ```
     */
    async addAddressList(
        address: string,
        listName: string,
        additionalParams?: Record<string, string | boolean | number>,
        options?: IWriteOptions
    ) {
        return this.client.write('/ip/firewall/address-list/add', {
            address,
            list: listName,
            ...additionalParams
        }, options);
    }

    /**
     * **Execution Terminator: Delete Address List Entry (REMOVE)**
     *
     * Sends an `/ip/firewall/address-list/remove` command.
     *
     * **Feature: Safe Deletion**
     * Automatically resolves the dynamic `.id` based on the IP and List Name combination
     * before attempting to remove it.
     *
     * @param address The IP address to remove.
     * @param listName The name of the list from which to remove the IP.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // 1. Restore service by removing the IP from the suspended list
     * await mk.firewall.removeAddressList('192.168.20.50', 'suspended_users');
     * ```
     */
    async removeAddressList(address: string, listName: string, options?: IWriteOptions) {
        const result = await this.getAddressLists({ "?address": address, "?list": listName }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ip/firewall/address-list/remove', {
                ".id": result[0]['.id']
            }, options);
        }
        throw new Error(`IP '${address}' not found in list '${listName}'.`);
    }

    // ==========================================
    // NAT (Network Address Translation)
    // ==========================================

    /**
     * **Retrieve: NAT Rules (PRINT)**
     *
     * Sends an `/ip/firewall/nat/print` command to list translation rules.
     *
     * @param filter Optional dictionary to filter results.
     * @param options Advanced write options.
     * @returns A promise resolving to an array of NAT rules.
     *
     * @example
     * ```typescript
     * // 1. Retrieve all Port Forwarding (dstnat) rules
     * const portForwards = await mk.firewall.getNatRules({ "?chain": "dstnat" });
     * ```
     */
    async getNatRules(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/nat/print', filter || {}, options);
    }

    /**
     * **Resource Creation: NAT Rule (ADD)**
     *
     * Sends an `/ip/firewall/nat/add` command to create routing translations.
     *
     * **Feature: Internet Access & Port Forwarding**
     * Core functionality for giving clients internet access (masquerade) or
     * opening ports for security cameras and servers (dst-nat).
     *
     * @param chain Usually 'srcnat' (for internet access) or 'dstnat' (for port forwarding).
     * @param action The action to perform (e.g., 'masquerade', 'dst-nat', 'accept').
     * @param additionalParams Dictionary defining the traffic match conditions and target.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // 1. Provide Internet Access (Masquerade) to a specific subnet
     * await mk.firewall.addNatRule('srcnat', 'masquerade', {
     * "src-address": "192.168.20.0/24",
     * "out-interface": "ether1-WAN",
     * comment: "Main LAN Internet Access"
     * });
     * * // 2. Port Forwarding: Open port 8080 to an internal camera server
     * await mk.firewall.addNatRule('dstnat', 'dst-nat', {
     * protocol: 'tcp',
     * "dst-port": "8080",
     * "in-interface": "ether1-WAN",
     * "to-addresses": "192.168.20.100",
     * "to-ports": "80",
     * comment: "Camera Server Forwarding"
     * });
     * ```
     */
    async addNatRule(
        chain: 'srcnat' | 'dstnat',
        action: string,
        additionalParams: Record<string, string | boolean | number>,
        options?: IWriteOptions
    ) {
        return this.client.write('/ip/firewall/nat/add', {
            chain,
            action,
            ...additionalParams
        }, options);
    }

    /**
     * **Execution Terminator: Delete NAT Rule (REMOVE)**
     *
     * Sends an `/ip/firewall/nat/remove` command.
     *
     * @param comment The exact comment of the rule to delete (safest way to target dynamically).
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // 1. Remove a specific port forwarding rule by its comment
     * await mk.firewall.removeNatRuleByComment('Camera Server Forwarding');
     * ```
     */
    async removeNatRuleByComment(comment: string, options?: IWriteOptions) {
        const result = await this.getNatRules({ "?comment": comment }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ip/firewall/nat/remove', {
                ".id": result[0]['.id']
            }, options);
        }
        throw new Error(`NAT rule with comment '${comment}' not found.`);
    }

    // ==========================================
    // FILTER RULES (Security & Traffic Control)
    // ==========================================

    /**
     * **Retrieve: Filter Rules (PRINT)**
     *
     * Sends an `/ip/firewall/filter/print` command to list security rules.
     *
     * @param filter Optional dictionary to filter results.
     * @param options Advanced write options.
     * @returns A promise resolving to an array of filter rules.
     *
     * @example
     * ```typescript
     * // 1. Check for any rules dropping traffic in the forward chain
     * const dropRules = await mk.firewall.getFilterRules({ "?action": "drop", "?chain": "forward" });
     * ```
     */
    async getFilterRules(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/filter/print', filter || {}, options);
    }

    /**
     * **Resource Creation: Filter Rule (ADD)**
     *
     * Sends an `/ip/firewall/filter/add` command to control traffic flow.
     *
     * **Feature: Automated Network Security**
     * Use this to programmatically drop traffic from suspended users, block external
     * DNS queries, or secure the router's management ports.
     *
     * @param chain 'input' (to router), 'forward' (through router), or 'output' (from router).
     * @param action The action to take ('accept', 'drop', 'reject', etc.).
     * @param additionalParams Dictionary defining the match conditions.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // 1. Block Internet access for suspended users (Forward Chain)
     * await mk.firewall.addFilterRule('forward', 'drop', {
     * "src-address-list": "suspended_users",
     * comment: "Block Internet for suspended clients"
     * });
     * * // 2. Protect the router: Drop external DNS requests (Input Chain)
     * await mk.firewall.addFilterRule('input', 'drop', {
     * protocol: 'udp',
     * "dst-port": "53",
     * "in-interface": "ether1-WAN",
     * comment: "Drop external DNS"
     * });
     * ```
     */
    async addFilterRule(
        chain: 'input' | 'forward' | 'output',
        action: string,
        additionalParams: Record<string, string | boolean | number>,
        options?: IWriteOptions
    ) {
        return this.client.write('/ip/firewall/filter/add', {
            chain,
            action,
            ...additionalParams
        }, options);
    }

    /**
     * **State Modification: Enable/Disable Filter Rule (SET)**
     *
     * Sends an `/ip/firewall/filter/set` command to toggle a rule without deleting it.
     *
     * @param comment The exact comment of the rule to toggle.
     * @param disable Boolean true to disable, false to enable.
     * @param options Advanced write options.
     * @returns A promise resolving to the API response.
     *
     * @example
     * ```typescript
     * // 1. Temporarily disable the rule that blocks suspended clients
     * await mk.firewall.toggleFilterRuleByComment('Block Internet for suspended clients', true);
     * ```
     */
    async toggleFilterRuleByComment(comment: string, disable: boolean, options?: IWriteOptions) {
        const result = await this.getFilterRules({ "?comment": comment }, options);

        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ip/firewall/filter/set', {
                ".id": result[0]['.id'],
                disabled: disable ? 'yes' : 'no'
            }, options);
        }
        throw new Error(`Filter rule with comment '${comment}' not found.`);
    }
}