import { MikrotikClient, IWriteOptions } from "../client/MikrotikClient";

export class FirewallWrapper {
    private client: MikrotikClient;

    constructor(client: MikrotikClient) {
        this.client = client;
    }

    // ==========================================
    // 1. FILTER RULES (Security & Traffic Control)
    // ==========================================

    async getFilterRules(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/filter/print', filter || {}, options);
    }

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

    async removeFilterRuleByComment(comment: string, options?: IWriteOptions) {
        const result = await this.getFilterRules({ "?comment": comment }, options);
        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ip/firewall/filter/remove', { ".id": result[0]['.id'] }, options);
        }
        throw new Error(`Filter rule with comment '${comment}' not found.`);
    }

    // ==========================================
    // 2. NAT (Network Address Translation)
    // ==========================================

    async getNatRules(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/nat/print', filter || {}, options);
    }

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

    async removeNatRuleByComment(comment: string, options?: IWriteOptions) {
        const result = await this.getNatRules({ "?comment": comment }, options);
        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ip/firewall/nat/remove', { ".id": result[0]['.id'] }, options);
        }
        throw new Error(`NAT rule with comment '${comment}' not found.`);
    }

    // ==========================================
    // 3. MANGLE (Packet Marking & QoS)
    // ==========================================

    /**
     * **Retrieve: Mangle Rules (PRINT)**
     */
    async getMangleRules(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/mangle/print', filter || {}, options);
    }

    /**
     * **Resource Creation: Mangle Rule (ADD)**
     * Essential for PCC load balancing, packet marking, and queue trees.
     */
    async addMangleRule(
        chain: 'prerouting' | 'postrouting' | 'forward' | 'input' | 'output',
        action: string,
        additionalParams: Record<string, string | boolean | number>,
        options?: IWriteOptions
    ) {
        return this.client.write('/ip/firewall/mangle/add', {
            chain,
            action,
            ...additionalParams
        }, options);
    }

    async removeMangleRuleByComment(comment: string, options?: IWriteOptions) {
        const result = await this.getMangleRules({ "?comment": comment }, options);
        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ip/firewall/mangle/remove', { ".id": result[0]['.id'] }, options);
        }
        throw new Error(`Mangle rule with comment '${comment}' not found.`);
    }

    // ==========================================
    // 4. RAW (DDoS & Fast-Path Bypass)
    // ==========================================

    /**
     * **Retrieve: RAW Rules (PRINT)**
     */
    async getRawRules(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/raw/print', filter || {}, options);
    }

    /**
     * **Resource Creation: RAW Rule (ADD)**
     * Useful for dropping volumetric attacks before connection tracking (saves massive CPU).
     */
    async addRawRule(
        chain: 'prerouting' | 'output',
        action: string,
        additionalParams: Record<string, string | boolean | number>,
        options?: IWriteOptions
    ) {
        return this.client.write('/ip/firewall/raw/add', {
            chain,
            action,
            ...additionalParams
        }, options);
    }

    // ==========================================
    // 5. SERVICE PORTS (ALG Management)
    // ==========================================

    /**
     * **Retrieve: Service Ports (PRINT)**
     * Lists Application Layer Gateways (FTP, TFTP, SIP, PPTP, etc.).
     */
    async getServicePorts(options?: IWriteOptions) {
        return this.client.write('/ip/firewall/service-port/print', {}, options);
    }

    /**
     * **State Modification: Toggle Service Port (SET)**
     * Frequently used by ISPs to disable SIP or FTP helpers when they interfere with VoIP traffic.
     */
    async toggleServicePort(name: string, disable: boolean, options?: IWriteOptions) {
        const result = await this.client.write('/ip/firewall/service-port/print', { "?name": name }, options);
        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ip/firewall/service-port/set', {
                ".id": result[0]['.id'],
                disabled: disable ? 'yes' : 'no'
            }, options);
        }
        throw new Error(`Service port '${name}' not found.`);
    }

    // ==========================================
    // 6. CONNECTIONS (Real-Time Monitoring via Watchdog)
    // ==========================================

    /**
     * **Retrieve: Active Connections (PRINT)**
     * Views the connection tracking table.
     */
    async getConnections(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/connection/print', filter || {}, options);
    }

    /**
     * **Real-Time Stream: Connections (.onSnapshot)**
     * Potentiated with your streaming architecture. Ideal for real-time security dashboards
     * to track active heavy downloaders or live attacks.
     *
     * @example
     * ```typescript
     * const sub = mk.firewall.watchConnections((connections) => {
     *    console.log(`Active connections: ${connections.length}`);
     * });
     * ```
     */
    public watchConnections(callback: (data: any) => void) {
        return this.client.collection('/ip/firewall/connection').onSnapshot(callback);
    }

    /**
     * **Execution Terminator: Kill Connection (REMOVE)**
     * Forces the immediate drop of a specific stateful connection.
     */
    async killConnectionById(id: string, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/connection/remove', { ".id": id }, options);
    }

    // ==========================================
    // 7. ADDRESS LISTS (Client Isolation & Grouping)
    // ==========================================

    async getAddressLists(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/address-list/print', filter || {}, options);
    }

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

    async removeAddressList(address: string, listName: string, options?: IWriteOptions) {
        const result = await this.getAddressLists({ "?address": address, "?list": listName }, options);
        if (result.length > 0 && result[0]['.id']) {
            return this.client.write('/ip/firewall/address-list/remove', { ".id": result[0]['.id'] }, options);
        }
        throw new Error(`IP '${address}' not found in list '${listName}'.`);
    }

    // ==========================================
    // 8. LAYER 7 PROTOCOLS (Deep Packet Inspection)
    // ==========================================

    /**
     * **Retrieve: Layer 7 Protocols (PRINT)**
     */
    async getLayer7Protocols(filter?: Record<string, string>, options?: IWriteOptions) {
        return this.client.write('/ip/firewall/layer7-protocol/print', filter || {}, options);
    }

    /**
     * **Resource Creation: Layer 7 Protocol (ADD / UPSERT)**
     * Defines regex patterns for DPI (e.g., matching Netflix, YouTube, or Tor).
     * Automatically handles upsert logic (updates if name already exists).
     *
     * @example
     * ```typescript
     * await mk.firewall.setLayer7Protocol('netflix', '^.*get_profile.*$');
     * ```
     */
    async setLayer7Protocol(name: string, regexp: string, comment?: string, options?: IWriteOptions) {
        const existing = await this.client.write('/ip/firewall/layer7-protocol/print', { "?name": name }, options);

        const params: Record<string, string> = { name, regexp };
        if (comment) params.comment = comment;

        if (existing.length > 0 && existing[0]['.id']) {
            return this.client.write('/ip/firewall/layer7-protocol/set', {
                ".id": existing[0]['.id'],
                ...params
            }, options);
        } else {
            return this.client.write('/ip/firewall/layer7-protocol/add', params, options);
        }
    }

    /**
     * **Execution Terminator: Delete Layer 7 Protocol (REMOVE)**
     */
    async removeLayer7Protocol(name: string, options?: IWriteOptions) {
        const existing = await this.client.write('/ip/firewall/layer7-protocol/print', { "?name": name }, options);
        if (existing.length > 0 && existing[0]['.id']) {
            return this.client.write('/ip/firewall/layer7-protocol/remove', { ".id": existing[0]['.id'] }, options);
        }
        throw new Error(`Layer 7 protocol '${name}' not found.`);
    }
}