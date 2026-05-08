/**
 *
 * Defines the standard contract for RosInterface plugins.
 * Community developers must implement this interface to create extensions.
 * Powered by RosInterface SDK.
 */


import {RosProtocol} from "../core/RosProtocol";
import {RosToolkit} from "../core/RosToolkit";

/**
 * The injected context provided to every plugin during installation.
 * Grants safe access to the main client and highly optimized internal engines.
 */
export interface RosPluginContext {
    /**
     * The main instance of the SDK (MikrotikClient).
     * Type is set to 'any' here to prevent circular dependency issues during compilation,
     * but plugins can safely cast this to MikrotikClient in their own code.
     */
    client: any;

    /**
     * Direct access to the low-level encoding/decoding engine.
     * Allows plugins to manipulate or inspect bytes according to MikroTik's standard.
     */
    protocol: typeof RosProtocol;

    /**
     * The Standard Library for Plugins.
     * Contains zero-dependency, C++ level performance tools for Math, Forensics, and Parsing.
     */
    toolkit: typeof RosToolkit;
}

export interface RosPlugin {
    // ====================================================================
    // PLUGIN METADATA
    // ====================================================================

    /**
     * Unique identifier for the plugin.
     * Used by the core engine to prevent duplicate installations.
     * @example 'rosinterface-smart-cache'
     */
    readonly name: string;

    /**
     * Semantic version of the plugin (Optional but recommended for compatibility checks).
     * @example '1.0.0'
     */
    readonly version?: string;

    // ====================================================================
    // BOOTSTRAP
    // ====================================================================

    /**
     * Bootstraps the plugin. Executed strictly ONCE when `client.use()` is called.
     * This is where you should save the toolkit/client references or inject middlewares.
     *
     * @param context Provides safe access to the client and low-level engines.
     */
    install(context: RosPluginContext): void;

    // ====================================================================
    // HIGH-LEVEL LIFECYCLE HOOKS (Business Logic)
    // ====================================================================

    /**
     * Triggered right after a successful login to the RouterOS device.
     * Ideal for setting up initial cache states or background polling tasks.
     */
    onConnect?: () => void;

    /**
     * Triggered when the socket disconnects unexpectedly or manually.
     * Use this to clean up intervals, streams, or memory leaks.
     */
    onDisconnect?: () => void;

    /**
     * Middleware hook: Intercepts and potentially modifies a command string
     * right before it is passed to the mathematical encoder.
     *
     * @param command The raw command string (e.g., '/ip/address/print')
     * @returns The mutated or untouched command string.
     */
    beforeCommand?: (command: string) => string;

    // ====================================================================
    // LOW-LEVEL ENGINE HOOKS (Socket & Buffer Interceptors)
    // ====================================================================

    /**
     * Intercepts raw bytes incoming from the MikroTik router BEFORE
     * they are decoded by RosProtocol.
     * Perfect for custom logging, Deep Packet Inspection (DPI), or Wireshark-like tools.
     *
     * @param chunk The raw Buffer directly from the TCP/TLS socket.
     * @returns Must return the buffer (modified or untouched) to continue the network flow.
     */
    onRawBufferReceived?: (chunk: Buffer) => Buffer;

    /**
     * Intercepts the fully encoded payload right BEFORE it is written
     * to the TCP/TLS socket.
     *
     * @param payload The final Buffer encoded by RosProtocol.
     * @returns Must return the buffer to continue sending data to the router.
     */
    onRawBufferSend?: (payload: Buffer) => Buffer;
}