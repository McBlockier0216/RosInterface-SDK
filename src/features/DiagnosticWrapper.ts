import { MikrotikClient, IWriteOptions } from "../client/MikrotikClient";

export class DiagnosticWrapper {
    private client: MikrotikClient;

    constructor(client: MikrotikClient) {
        this.client = client;
    }

    /**
     * **Retrieve: Comprehensive System Report (Aggregated)**
     *
     * Executes multiple API calls (`resource`, `health`, `routerboard`) concurrently
     * to build a complete snapshot of the router's hardware and operational status.
     *
     * **Feature: MCP `mk-report` Equivalent**
     * Solves the problem of fragmented system data in RouterOS by returning a single,
     * unified object. Perfect for centralized WISP monitoring dashboards.
     *
     * @param options Advanced write options.
     * @returns A promise resolving to an aggregated system report object.
     *
     * @example
     * ```typescript
     * // Generate a full diagnostic report for your dashboard
     * const report = await mk.diagnostic.generateSystemReport();
     * console.log(`Model: ${report.board.boardName}`);
     * console.log(`CPU: ${report.resources.cpuLoad}% | Temp: ${report.health.temperature}C`);
     * ```
     */
    async generateSystemReport(options?: IWriteOptions) {
        // Ejecutamos las 3 llamadas en paralelo para máxima velocidad
        const [resources, health, board] = await Promise.all([
            this.client.write('/system/resource/print', {}, options),
            this.client.write('/system/health/print', {}, options).catch(() => []), // Some routers don't support health
            this.client.write('/system/routerboard/print', {}, options)
        ]);

        return {
            resources: resources.length > 0 ? resources[0] : null,
            health: health.length > 0 ? health[0] : null,
            board: board.length > 0 ? board[0] : null,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * **Execution: Automated Security Audit (AWR)**
     *
     * Scans critical router configurations (DNS, Services, Users) to detect common
     * security vulnerabilities and misconfigurations.
     *
     * **Feature: MCP `mk-awr` Equivalent**
     * Acts as an Automated Workload Repository (AWR) security scanner. It checks if
     * dangerous services (Telnet, FTP) are open, if DNS recursion is allowed on the WAN,
     * and if default credentials exist.
     *
     * @param options Advanced write options.
     * @returns A promise resolving to an array of security warnings (empty if secure).
     *
     * @example
     * ```typescript
     * // Run a security audit on a newly provisioned router
     * const vulnerabilities = await mk.diagnostic.runSecurityAudit();
     * if (vulnerabilities.length > 0) {
     * console.warn('Security risks detected:', vulnerabilities);
     * } else {
     * console.log('Router is fully secured!');
     * }
     * ```
     */
    async runSecurityAudit(options?: IWriteOptions): Promise<string[]> {
        const warnings: string[] = [];

        const [services, dns, users] = await Promise.all([
            this.client.write('/ip/service/print', {}, options),
            this.client.write('/ip/dns/print', {}, options),
            this.client.write('/user/print', {}, options)
        ]);

        // 1. Check for insecure services
        const insecureServices = ['telnet', 'ftp', 'www'];
        services.forEach((srv: any) => {
            if (insecureServices.includes(srv.name) && srv.disabled !== 'true') {
                warnings.push(`Insecure service '${srv.name}' is enabled on port ${srv.port}.`);
            }
        });

        // 2. Check for DNS Amplification Attack vulnerability
        if (dns.length > 0 && dns[0]['allow-remote-requests'] === 'true') {
            warnings.push('DNS allow-remote-requests is ENABLED. Ensure port 53 is blocked on WAN to prevent DDoS attacks.');
        }

        // 3. Check for default admin user
        const hasDefaultAdmin = users.some((u: any) => u.name === 'admin');
        if (hasDefaultAdmin) {
            warnings.push('Default "admin" user still exists. It is highly recommended to rename or remove it.');
        }

        return warnings;
    }
}