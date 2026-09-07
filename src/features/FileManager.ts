import { MikrotikClient } from '../client/MikrotikClient';

/**
 * Represents a file object from RouterOS /file/print
 */
export interface IFileEntry {
    '.id': string;
    name: string;
    type: string;
    size: string | number;
    'creation-time': string;
    contents?: string;
}

/**
 * **FileManager (v7.24+ Optimized)**
 * Advanced abstraction layer for file and storage operations on RouterOS.
 *
 * Features:
 * - Strict parameter handling to prevent v7.24 runtime errors.
 * - Text File I/O (Read/Write scripts/logs) with smart I/O polling.
 * - System Backup & Secure Export management.
 * - RSC Script Execution.
 * - NEW: Disk maintenance (Trim and Format with discard).
 */
export class FileManager {
    private client: MikrotikClient;

    constructor(client: MikrotikClient) {
        this.client = client;
    }

    // ==========================================
    // CORE FILE OPERATIONS
    // ==========================================

    /**
     * Lists files on the router, optionally filtering by name.
     * @param filterName Optional substring to filter files (e.g., ".backup").
     */
    public async list(filterName?: string): Promise<IFileEntry[]> {
        const result = await this.client.write('/file/print');
        const files = result as IFileEntry[];

        if (filterName) {
            return files.filter(f => f.name.includes(filterName));
        }
        return files;
    }

    /**
     * Checks if a file exists on the router and returns its exact internal ID.
     * @param fileName The exact name of the file.
     * @returns The dynamic `.id` of the file, or null if not found.
     */
    public async getFileId(fileName: string): Promise<string | null> {
        const result = await this.client.write('/file/print', { '?name': fileName });
        return result.length > 0 ? result[0]['.id'] : null;
    }

    /**
     * Checks if a file exists on the router.
     */
    public async exists(fileName: string): Promise<boolean> {
        const id = await this.getFileId(fileName);
        return id !== null;
    }

    /**
     * Deletes a file or multiple files safely using dynamic IDs.
     * @param fileName Name of the file (or array of names).
     */
    public async delete(fileName: string | string[]): Promise<void> {
        const targets = Array.isArray(fileName) ? fileName : [fileName];

        for (const name of targets) {
            const fileId = await this.getFileId(name);
            if (fileId) {
                await this.client.write('/file/remove', { '.id': fileId });
                console.log(`[FileManager] Deleted: ${name}`);
            }
        }
    }

    // ==========================================
    // TEXT I/O (Scripts, Configs, Logs)
    // ==========================================

    /**
     * Writes text content to a file.
     * Handles safe creation and I/O sync delays inherent to RouterOS flash/USB storage.
     *
     * @param fileName The target filename.
     * @param content The text content to write.
     */
    public async writeText(fileName: string, content: string): Promise<void> {
        if (content.length > 512 * 1024) {
            console.warn(`[FileManager] Warning: Uploading content larger than 512KB via API is risky and may block the router CPU.`);
        }

        let fileId = await this.getFileId(fileName);

        // 1. Safe File Creation Phase
        if (!fileId) {
            // Trick: 'print file=name' creates an empty physical file on disk
            await this.client.write('/file/print', {
                file: fileName,
                detail: 'false' // Suppress excessive output processing
            }).catch(() => {}); // Suppress intentional API interruptions

            // Polling loop: Wait for the filesystem to sync and register the file
            for (let i = 0; i < 10; i++) {
                await new Promise(resolve => setTimeout(resolve, 150)); // Wait 150ms
                fileId = await this.getFileId(fileName);
                if (fileId) break;
            }

            if (!fileId) {
                throw new Error(`[FileManager] Filesystem timeout: Failed to create file '${fileName}'.`);
            }
        }

        // 2. Strict Content Injection (v7.24+)
        // MUST use '.id'. Using 'numbers=fileName' is deprecated and throws runtime errors.
        await this.client.write('/file/set', {
            '.id': fileId,
            'contents': content
        });

        console.log(`[FileManager] Saved successfully: ${fileName}`);
    }

    /**
     * Reads text content from a file.
     * @returns string content. Throws an error if the file is binary or too large for the API buffer.
     */
    public async readText(fileName: string): Promise<string> {
        const result = await this.client.write('/file/print', { '?name': fileName });

        if (result.length === 0) throw new Error(`File '${fileName}' not found.`);

        const file = result[0] as IFileEntry;

        // RouterOS logic: If 'contents' is missing, the file is binary or exceeds API buffer size
        if (file.contents === undefined) {
            const size = Number(file.size);
            if (size > 65536) {
                throw new Error(`File '${fileName}' is too large (${size} bytes) to read via API. Use SFTP/FTP instead.`);
            }
            return ''; // Empty file
        }

        return file.contents;
    }

    // ==========================================
    // DISK & STORAGE MANAGEMENT (v7.24+ Specific)
    // ==========================================

    /**
     * Performs a manual TRIM operation on an SSD or supported USB drive.
     * Introduced natively in RouterOS 7.24 for storage maintenance.
     *
     * @param diskName The internal name of the disk (e.g., "disk1", "sata1").
     */
    public async trimDisk(diskName: string): Promise<void> {
        console.log(`[FileManager] Trimming disk: ${diskName}...`);
        await this.client.write('/disk/trim', { disk: diskName });
    }

    /**
     * Formats a disk using the updated v7.24 syntax.
     * The old `file-system=trim` was replaced by the `discard` parameter.
     *
     * @param diskName The internal name of the disk.
     * @param discard If true, enables TRIM (discard) on the formatted filesystem.
     * @param secure If true, performs a secure erase before formatting (takes longer).
     */
    public async formatDisk(diskName: string, discard: boolean = true, secure: boolean = false): Promise<void> {
        const params: Record<string, string> = { disk: diskName };

        if (discard) params.discard = 'yes';
        if (secure) params['discard-secure'] = 'yes';

        console.warn(`[FileManager] Formatting disk ${diskName}. ALL DATA WILL BE LOST.`);
        await this.client.write('/disk/format', params);
    }

    // ==========================================
    // SYSTEM & AUTOMATION
    // ==========================================

    /**
     * Creates a System Backup (.backup) file.
     * @param name Backup name (without extension).
     * @param password Optional encryption password.
     */
    public async createSystemBackup(name: string, password?: string): Promise<string> {
        const fullName = `${name}.backup`;
        const params: Record<string, string> = { name: name };
        if (password) params.password = password;

        console.log(`[FileManager] Creating system backup: ${fullName}...`);
        await this.client.write('/system/backup/save', params);
        return fullName;
    }

    /**
     * Exports configuration to a human-readable RSC script file.
     *
     * @param name File name (e.g., "daily_export").
     * @param showSensitive If true, exports passwords and IPsec secrets (Requires v7+).
     */
    public async createExport(name: string, showSensitive: boolean = false): Promise<string> {
        const fullName = name.endsWith('.rsc') ? name : `${name}.rsc`;
        const params: Record<string, string> = { file: name };

        if (showSensitive) {
            params['show-sensitive'] = 'yes';
        }

        console.log(`[FileManager] Exporting config to ${fullName}...`);
        await this.client.write('/export', params);
        return fullName;
    }

    /**
     * Uploads a script (.rsc) and immediately executes it.
     * Great for mass provisioning. If the script contains invalid v7 syntax,
     * it will strictly throw a runtime error.
     */
    public async runScript(content: string, scriptName: string = 'temp_worker.rsc'): Promise<void> {
        try {
            await this.writeText(scriptName, content);

            console.log(`[FileManager] Executing script: ${scriptName}...`);
            await this.client.write('/import', { 'file-name': scriptName });

            console.log(`[FileManager] Script executed successfully.`);
        } catch (error: any) {
            console.error(`[FileManager] Script execution failed (Check v7.24 syntax strictness):`, error.message);
            throw error;
        } finally {
            await this.delete(scriptName);
        }
    }
}