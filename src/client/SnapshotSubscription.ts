import { MikrotikClient } from './MikrotikClient';

export interface SnapshotDiff<T> {
    added: T[];
    modified: T[];
    removed: T[];
    current: T[];
}

export class SnapshotSubscription<T extends Record<string, any>> {
    // ==========================================
    // CONFIGURATION STATE
    // ==========================================
    private isDiffMode = false;
    private throttleMs = 0;
    private joinConfig: { from: string; localField: string; foreignField: string; as: string } | null = null;

    // ==========================================
    // JOIN CACHE STATE (Protects Router CPU)
    // ==========================================
    private cachedForeignData: Map<string, any> | null = null;
    private lastJoinFetchTime = 0;
    private joinCacheTtlMs = 30000; // 30s

    // ==========================================
    // EXECUTION STATE
    // ==========================================
    private lastExecutionTime = 0;
    private previousSnapshot: T[] = [];

    // ==========================================
    // THROTTLING BUFFER
    // ==========================================
    private throttleTimer: NodeJS.Timeout | null = null;
    private pendingUpdate: T[] | null = null;

    // ==========================================
    // DEPENDENCIES
    // ==========================================
    private readonly callback: (data: T[] | SnapshotDiff<T>) => void;
    private readonly client: MikrotikClient;
    private readonly unsubscribeFn: () => void;

    constructor(
        client: MikrotikClient,
        callback: (data: any) => void,
        unsubscribeFn: () => void
    ) {
        this.client = client;
        this.callback = callback;
        this.unsubscribeFn = unsubscribeFn;
    }

    public onDiff(): this {
        this.isDiffMode = true;
        return this;
    }

    public throttle(ms: number): this {
        this.throttleMs = ms;
        return this;
    }

    /**
     * @param config Configuration object for the join.
     * @param ttlMs Time-to-live for the join cache in milliseconds (default: 30000ms).
     */
    public join(config: { from: string; localField: string; foreignField: string; as: string }, ttlMs: number = 30000): this {
        this.joinConfig = config;
        this.joinCacheTtlMs = ttlMs;
        return this;
    }

    public stop(): void {
        this.clearPending();
        this.unsubscribeFn();
    }

    /**
     * **CRÍTICO:** `newData` debe ser SIEMPRE el array completo (el estado actual),
     * no los fragmentos (deltas) crudos que envía MikroTik. La clase padre (`LiveCollection`)
     * es responsable de acumular los deltas de RouterOS y pasar el array final aquí.
     */
    public async processUpdate(newData: T[]): Promise<void> {
        const now = Date.now();
        const timeSinceLast = now - this.lastExecutionTime;

        if (this.throttleMs === 0) {
            await this.executeCallbackLogic(newData);
            this.lastExecutionTime = Date.now();
            return;
        }

        if (timeSinceLast >= this.throttleMs) {
            this.clearPending();
            await this.executeCallbackLogic(newData);
            this.lastExecutionTime = Date.now();
        } else {
            this.pendingUpdate = newData;

            if (!this.throttleTimer) {
                const waitTime = this.throttleMs - timeSinceLast;
                this.throttleTimer = setTimeout(() => {
                    this.flushPending();
                }, waitTime);
            }
        }
    }

    private async flushPending() {
        this.throttleTimer = null;
        if (this.pendingUpdate) {
            await this.executeCallbackLogic(this.pendingUpdate);
            this.lastExecutionTime = Date.now();
            this.pendingUpdate = null;
        }
    }

    private clearPending() {
        if (this.throttleTimer) {
            clearTimeout(this.throttleTimer);
            this.throttleTimer = null;
        }
        this.pendingUpdate = null;
    }

    private async executeCallbackLogic(currentData: T[]): Promise<void> {
        let processedData = currentData;

        // JOIN LOGIC
        if (this.joinConfig) {
            try {
                const now = Date.now();
                if (!this.cachedForeignData || (now - this.lastJoinFetchTime > this.joinCacheTtlMs)) {
                    const foreignData = await this.client.write(`${this.joinConfig.from}/print`);

                    this.cachedForeignData = new Map<string, any>();
                    foreignData.forEach((item: any) => {
                        const key = String(item[this.joinConfig!.foreignField]);
                        this.cachedForeignData!.set(key, item);
                    });

                    this.lastJoinFetchTime = now;
                }

                // Merge Data usando el mapa en memoria (O(1))
                processedData = currentData.map(localItem => {
                    const key = String(localItem[this.joinConfig!.localField]);
                    return {
                        ...localItem,
                        [this.joinConfig!.as]: this.cachedForeignData!.get(key) || null
                    };
                });
            } catch (error) {
                console.warn(`RosInterface: Join failed for ${this.joinConfig.from}. Returning un-joined data.`, error);
            }
        }

        // DIFF LOGIC
        if (this.isDiffMode) {
            const diff = this.calculateDiff(this.previousSnapshot, processedData);
            this.previousSnapshot = processedData;

            if (diff.added.length > 0 || diff.modified.length > 0 || diff.removed.length > 0) {
                this.callback(diff);
            }
        } else {
            this.previousSnapshot = processedData;
            this.callback(processedData);
        }
    }

    private calculateDiff(oldData: T[], newData: T[]): SnapshotDiff<T> {
        const diff: SnapshotDiff<T> = { added: [], modified: [], removed: [], current: newData };

        const getId = (item: any) => {
            if (item['.id']) return item['.id'];
            if (item['name']) return `name:${item['name']}`;
            return JSON.stringify(item); // Fallback
        };

        const oldMap = new Map();
        oldData.forEach(item => oldMap.set(getId(item), item));

        const newMap = new Map();
        newData.forEach(item => newMap.set(getId(item), item));

        // Detectar Added & Modified
        for (const newItem of newData) {
            const id = getId(newItem);

            if (!oldMap.has(id)) {
                diff.added.push(newItem);
            } else {
                const oldItem = oldMap.get(id);
                // Usamos Shallow Compare en lugar de JSON.stringify
                if (!this.shallowEqual(oldItem, newItem)) {
                    diff.modified.push(newItem);
                }
            }
        }

        // Detectar Removed
        for (const oldItem of oldData) {
            const id = getId(oldItem);
            if (!newMap.has(id)) {
                diff.removed.push(oldItem);
            }
        }

        return diff;
    }

    /**
     * Comparación superficial de objetos.
     * Inmune al desorden de propiedades (multithreading del router) y más rápida que JSON.stringify.
     */
    private shallowEqual(obj1: any, obj2: any): boolean {
        if (obj1 === obj2) return true;

        if (typeof obj1 !== 'object' || obj1 === null ||
            typeof obj2 !== 'object' || obj2 === null) {
            return false;
        }

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) return false;

        for (const key of keys1) {
            if (obj1[key] !== obj2[key]) {
                return false;
            }
        }

        return true;
    }
}