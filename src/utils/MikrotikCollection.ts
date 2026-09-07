/**
 * A generic wrapper around MikroTik result arrays to provide O(1) lookups,
 * advanced grouping, pagination, data type casting, and efficient sorting algorithms.
 *
 * @template T The type of the items in the collection (usually a MikroTik resource interface).
 */
export class MikrotikCollection<T extends Record<string, any>> {
    private _items: T[];

    /**
     * Creates a new instance of MikrotikCollection.
     * @param items The raw array of data received from the router.
     */
    constructor(items: T[]) {
        this._items = items;
    }

    // ==========================================
    // DATA TRANSFORMATION & CASTING
    // ==========================================

    /**
     * Mutates the collection by transforming specific string fields into Numbers.
     * MikroTik API often returns numbers as strings (e.g., "1234").
     *
     * @param keys The properties to convert to numbers.
     * @returns The current instance for chaining.
     *
     * @example
     * collection.castToNumbers('mtu', 'l2mtu', 'vlan-id');
     */
    public castToNumbers(...keys: (keyof T)[]): this {
        for (const item of this._items) {
            for (const key of keys) {
                if (item[key] !== undefined && item[key] !== null) {
                    const parsed = Number(item[key]);
                    // Only assign if it's a valid number to prevent NaNs
                    if (!isNaN(parsed)) {
                        item[key] = parsed as any;
                    }
                }
            }
        }
        return this;
    }

    /**
     * Mutates the collection by transforming specific string fields into Booleans.
     * Handles MikroTik's standard string booleans ("true", "false", "yes", "no").
     *
     * @param keys The properties to convert to booleans.
     * @returns The current instance for chaining.
     *
     * @example
     * collection.castToBooleans('disabled', 'running', 'dynamic');
     */
    public castToBooleans(...keys: (keyof T)[]): this {
        for (const item of this._items) {
            for (const key of keys) {
                if (typeof item[key] === 'string') {
                    const val = item[key].toLowerCase().trim();
                    item[key] = (val === 'true' || val === 'yes' || val === '1') as any;
                } else if (item[key] !== undefined) {
                    item[key] = Boolean(item[key]) as any;
                }
            }
        }
        return this;
    }

    /**
     * Applies a transformation function to every item in the collection.
     * Useful for custom data hydration or property renaming.
     *
     * @param transformer A function that mutates the item.
     * @returns The current instance for chaining.
     */
    public transform(transformer: (item: T) => void): this {
        for (const item of this._items) {
            transformer(item);
        }
        return this;
    }

    // ==========================================
    // OUTPUT FINALIZERS (JSON Friendly)
    // ==========================================

    public toArray(): T[] {
        return this._items;
    }

    public toList(): T[] {
        return this._items;
    }

    public toCollection(): this {
        return this;
    }

    public toMap(key: keyof T): Record<string, T> {
        return this._items.reduce((acc, item) => {
            const indexValue = String(item[key]);
            acc[indexValue] = item;
            return acc;
        }, {} as Record<string, T>);
    }

    public toGrouped(field: keyof T): Record<string, T[]> {
        return this._items.reduce((groups, item) => {
            const groupKey = String(item[field]);
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {} as Record<string, T[]>);
    }

    public toPages(page: number, pageSize: number): T[] {
        if (page < 1) page = 1;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return this._items.slice(start, end);
    }

    // ==========================================
    // ACCESSORS AND HELPERS
    // ==========================================

    public first(): T | null {
        return this._items.length > 0 ? this._items[0] : null;
    }

    public last(): T | null {
        return this._items.length > 0 ? this._items[this._items.length - 1] : null;
    }

    public count(): number {
        return this._items.length;
    }

    public keyBy(key: keyof T): Map<string, T> {
        const map = new Map<string, T>();
        for (const item of this._items) {
            map.set(String(item[key]), item);
        }
        return map;
    }

    public groupBy(key: keyof T): Map<string, MikrotikCollection<T>> {
        const map = new Map<string, T[]>();

        for (const item of this._items) {
            const groupValue = String(item[key]);
            if (!map.has(groupValue)) {
                map.set(groupValue, []);
            }
            map.get(groupValue)!.push(item);
        }

        const collectionMap = new Map<string, MikrotikCollection<T>>();
        for (const [k, v] of map) {
            collectionMap.set(k, new MikrotikCollection(v));
        }

        return collectionMap;
    }

    public isEmpty(): boolean {
        return this._items.length === 0;
    }

    public filter(predicate: (item: T) => boolean): MikrotikCollection<T> {
        return new MikrotikCollection(this._items.filter(predicate));
    }

    // ==========================================
    // ADVANCED SORTING ALGORITHMS
    // ==========================================

    /**
     * Sorts the collection by a specific key.
     * Uses Natural Sort (`localeCompare` with `numeric: true`).
     * Solves the issue where "ether10" incorrectly appeared before "ether2".
     *
     * @param key The property to sort by.
     * @param direction 'asc' (ascending) or 'desc' (descending).
     */
    public sortBy(key: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
        this._items.sort((a, b) => {
            const valA = a[key];
            const valB = b[key];

            if (typeof valA === 'number' && typeof valB === 'number') {
                return direction === 'asc' ? valA - valB : valB - valA;
            }

            const strA = String(valA || '');
            const strB = String(valB || '');

            const comparison = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
            return direction === 'asc' ? comparison : -comparison;
        });
        return this;
    }

    /**
     * Specifically sorts IP Addresses and MAC Addresses.
     * Automatically detects and handles IPv4 (numerical sort) and IPv6/MACs (lexical sort).
     *
     * @param key The property containing the IP address.
     * @param direction 'asc' (ascending) or 'desc' (descending).
     */
    public sortByIp(key: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
        this._items.sort((a, b) => {
            const ipA = String(a[key] || '');
            const ipB = String(b[key] || '');

            const isIPv6A = ipA.includes(':');
            const isIPv6B = ipB.includes(':');

            // Fallback to lexical sort if IPv6 or MAC addresses are involved
            if (isIPv6A && isIPv6B) {
                const comparison = ipA.localeCompare(ipB);
                return direction === 'asc' ? comparison : -comparison;
            }
            if (isIPv6A || isIPv6B) return isIPv6A ? 1 : -1;

            // Strict IPv4 numerical sort
            const numA = this.ipToLong(ipA);
            const numB = this.ipToLong(ipB);
            return direction === 'asc' ? numA - numB : numB - numA;
        });
        return this;
    }

    /**
     * Sorts data volumetrics correctly (e.g., rx-byte, tx-byte).
     * Utilizes BigInt to prevent truncation of massive byte counts that exceed
     * JavaScript's `Number.MAX_SAFE_INTEGER`.
     *
     * @param key The property containing the byte count string.
     * @param direction 'asc' (ascending) or 'desc' (descending).
     */
    public sortByBytes(key: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
        this._items.sort((a, b) => {
            const safeA = String(a[key] || '0').replace(/\D/g, ''); // Remove non-digits just in case
            const safeB = String(b[key] || '0').replace(/\D/g, '');

            const bytesA = BigInt(safeA || '0');
            const bytesB = BigInt(safeB || '0');

            if (bytesA === bytesB) return 0;
            const isGreater = bytesA > bytesB;

            if (direction === 'asc') return isGreater ? 1 : -1;
            return isGreater ? -1 : 1;
        });
        return this;
    }

    /**
     * Sorts connection durations using MikroTik's standard uptime format.
     * Parses strings like "1w2d3h4m5s" into total seconds for accurate comparison.
     *
     * @param key The property containing the uptime string (e.g., 'uptime').
     * @param direction 'asc' (ascending) or 'desc' (descending).
     */
    public sortByUptime(key: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
        this._items.sort((a, b) => {
            const secA = this.parseRouterOsUptime(String(a[key] || ''));
            const secB = this.parseRouterOsUptime(String(b[key] || ''));

            return direction === 'asc' ? secA - secB : secB - secA;
        });
        return this;
    }

    // ==========================================
    // INTERNAL PARSERS
    // ==========================================

    /**
     * Converts an IPv4 string into a 32-bit unsigned integer.
     */
    private ipToLong(ip: string): number {
        if (!ip || ip.trim() === '') return 0;
        const cleanIp = ip.split('/')[0]; // Remove CIDR suffix (e.g. /24)
        return cleanIp.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    }

    /**
     * Parses a MikroTik uptime string (e.g., "1w3d2h5m10s") into total seconds.
     */
    private parseRouterOsUptime(uptime: string): number {
        if (!uptime) return 0;

        // Regex matches optional weeks(w), days(d), hours(h), minutes(m), seconds(s)
        const regex = /(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
        const match = uptime.match(regex);

        if (!match) return 0;

        const w = parseInt(match[1] || '0', 10);
        const d = parseInt(match[2] || '0', 10);
        const h = parseInt(match[3] || '0', 10);
        const m = parseInt(match[4] || '0', 10);
        const s = parseInt(match[5] || '0', 10);

        // Calculate total seconds
        return (w * 604800) + (d * 86400) + (h * 3600) + (m * 60) + s;
    }
}