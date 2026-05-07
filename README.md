
# RosInterface `v2.0`
### **The Modern Infrastructure Standard for MikroTik**


> **The Ultimate Node.js SDK for MikroTik RouterOS Orchestration.**  
> Engineered for enterprise SaaS, ISPs, and massive network deployments.
> RosInterface goes far beyond a traditional API client by introducing a secure Hybrid Engine (REST + Sockets).
> Reactive Streaming, and a Swarm Mode to manage fleets of routers seamlessly.
>
> Build fault-tolerant, offline-first network applications with zero CPU saturation.

> **El SDK Definitivo en Node.js para la Orquestación de MikroTik RouterOS.**  
> Diseñado para entornos SaaS empresariales, ISPs y despliegues masivos de red.
> RosInterface va mucho más allá de un cliente API tradicional introduciendo un Motor Híbrido seguro (REST + Sockets).
> Streaming Reactivo, y un Swarm Mode para gestionar flotas de routers sin fricción.
>
> Construye aplicaciones de red tolerantes a fallos, offline-first y con cero saturación de CPU.

[![npm version](https://img.shields.io/npm/v/rosinterface-sdk.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/rosinterface-sdk)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)

---


<details>
<summary><b>Installation & Quick Start</b></summary>

## Installation & Setup

### Prerequisites
Before installing the SDK, make sure your environment meets the following requirements:

- **Node.js:** `>=18.0.0` (Recommended for full REST support)
- **RouterOS:**
    - `v6.x` → Socket Mode
    - `v7.x` → Hybrid REST / Socket Mode

---

### 1. Install via npm

Run the following command in the root of your project:

```bash
npm install rosinterface
```

</details>


<details>
<summary><b>English Documentation</b></summary>
<br>


## English Documentation

**RosInterface** is not just another API wrapper—it is an enterprise-grade infrastructure SDK engineered specifically for ISPs,
SaaS platforms, and mission-critical network topologies.

At its core lies a revolutionary **Hybrid Engine** that intelligently bridges the gap between protocol generations.
By seamlessly unifying the transactional reliability of REST (HTTPS) with the ultra-low latency of persistent Sockets (TCP),
it delivers unprecedented real-time orchestration across mixed RouterOS environments (v6 & v7) with zero codebase fragmentation.

Designed with a strict **hardware-first protection philosophy**, RosInterface actively defends your edge devices. Through intelligent rate-limiting,
circuit breakers, and an offline-first queuing system, it guarantees deterministic performance even under severe network degradation—completely eliminating the CPU spikes,
memory leaks, and connection floods that plague traditional automation scripts.


---

### ✨ Key Features

- **Hardware Protection**  
  Built-in **Rate Limiter** with intelligent backoff to prevent RouterOS CPU saturation.

- **Offline-First Architecture**  
  Commands marked with `.persistent()` are automatically queued if the router is offline and synchronized once connectivity is restored.

- **Smart Caching**  
  Read operations are cached for **5 seconds (TTL)** to reduce redundant API calls and router load.

- **Source-Side Filtering**  
  Use `.findBy()` and `.findOne()` to filter data **directly on the router**, minimizing bandwidth and latency.

- **On-time changes**  
  Use `.collection()` and `.onSnapshot()` to get changes on real time **directly the router**, for to get new data without call to many times to your router.

- **Fault Tolerance (Circuit Breaker)**

  Implements the `Circuit Breaker` pattern. If the router stops responding or encounters critical errors, the library temporarily "cuts the circuit" to prevent the accumulation of failed requests and protect the stability of your Node.js server.

- **Native Observability**

  Built-in `.getMetrics()` method. Exports traffic statistics and router status directly in a format compatible with Prometheus and Grafana without the need for external plugins.

- **Transport Security**

  Full support for **TLS/SSL (SSL API)**, allowing secure encrypted connections over port 8729 (recommended to change this), ideal for managing routers over the public internet.

- **Fluent API**  
  Chainable, expressive syntax for clean and maintainable automation code.

- **CLI Code Generator**  
  Auto-generate TypeScript interfaces from your live router. No more guessing field names.

- **Differential Updates (onDiff)**  
  Receive atomic added, modified, and removed events instead of full arrays. Optimized for high-performance UIs.

- **Intelligent Throttling**  
  Control the flow of real-time data with "Leading + Trailing Edge" strategies.

- **Intelligent Hybrid Engine:**

    - Combines the security of the **REST (HTTPS)** protocol for CRUD commands with the speed of **Sockets (TCP)** for data streaming.
    - *RouterOS v7:* Uses HTTPS + Sockets (Background).
    - *RouterOS v6:* Uses pure Sockets (Legacy Mode).

- **Swarm Mode:**
  Manages fleets of **50+ routers** from a single instance.
    - Supports **Broadcast** (all nodes) and **Multicast** (selected groups).
    - Fault Tolerance: If one router fails, the rest of the swarm continues operating.
    - Protocol Agnosticism: Mixes modern and legacy routers in the same control group.

- **O(1) Plugin Engine:** A highly extensible architecture. Inject community plugins or build your own Deep Packet Inspection tools without sacrificing a single millisecond of performance.
- **Built-in Fault Tolerance:** Native Circuit Breakers and Token-Bucket Rate Limiters protect both your Node.js server and the RouterOS CPU from cascading failures.
-  **Lazy-Loaded Subsystems:** Modules (Firewall, Queue, PPP) are strictly lazy-loaded. Memory is only allocated for the specific tools you actually invoke.
- **The RosToolkit:** A built-in standard library providing zero-dependency, C++ level performance tools for Math, Forensics, and Packet Parsing.

  
---


---

### ✨ Important Considerations

#### Environment Variables (.env)

Create a `.env` file in the root directory of your project:

```text
Basic Credentials
These are the standard login credentials.

MIKROTIK_HOST: Your router's IP address (e.g., 192.168.1.1).

MIKROTIK_USER: Username with write permissions (e.g., admin).

MIKROTIK_PASSWORD: User password.

The Brain (Main Protocol)
Here you decide how commands (Create, Edit, Delete) will be sent.

MIKROTIK_PROTOCOL

rest: (Recommended for RouterOS v7+). Uses HTTPS. It is more secure and handles errors better.

socket: (For RouterOS v6). Uses a raw TCP connection. Use it only if your router is old and does not support REST.

MIKROTIK_PORT

This is the port for the protocol chosen above.

If you use rest: Enter 443 (the router's www-ssl port).

If you're using a socket: Enter 8728 (the API port).

SSL Security
MIKROTIK_INSECURE

true: (Almost always necessary on local networks). Tells the library: "Trust the router's certificate even if it's self-signed." Uses the secure dispatcher internally.

false: Only use this if you've purchased a real domain (e.g., router.example.com) and installed a valid certificate on the Mikrotik.

The "Listen" (Hybrid Engine)
This is the main variable for real-time events (onSnapshot) while using REST.

MIKROTIK_PORT_APISSL (or socketPort in the code)

If you leave it empty: Hybrid mode is disabled. You can only send commands, but you won't be able to listen for live changes.

If you enter 8728: You activate Hybrid Mode. The library will use REST to send commands and will open a hidden channel on 8728 to listen for onSnapshot.
```

> ⚠️ **Security Notice**  
> The `allowInsecureConfig` flag is a **critical** security measure in RosInterface.  
> Prevents accidental exposure of credentials or use of unencrypted protocols in production.
>
> Use **only in controlled, local or test environments**.


>⚠️ **Performance Warning**
>
> The `onSnapshot` function allows you to receive **real-time** router changes in RosInterface.
> To avoid negative performance impacts on low-spec devices, it is recommended to use it with **Resilience** enabled.
>
> Use it **in moderation; excessive use of onSnapshot can negatively affect the performance of your devices**.


> ⚠️ **Basic Configurations on Your Equipment**
>
> Before running these codes, ensure your RouterOS configuration matches:
> > **Ports (Hybrid Mode):**
>>
> > REST (Commands): Requires the www-ssl service enabled on the router (Default port 443).
>>
> > Socket (Streaming): Requires the api service (Default 8728) or api-ssl (Default 8729).
> >
>> **Certificates (Self-Signed):**
> >
> > By setting `rejectUnauthorized: false` in the MikrotikClient options, the library uses the Undici Dispatcher (Agent with Scope).
> >
> **This means that traffic remains encrypted (HTTPS), but the library will accept the router's self-generated certificate without failure. This does not compromise the security of other external connections (such as Stripe/AWS) in your Node.js application.**

---


### Usage Examples

#### 1. Basic Connection

```ts
import { MikrotikClient } from 'rosinterface';

const client = new MikrotikClient({
    host: 'ROUTER_IP (LOCAL OR REMOTE)',
    user: 'admin',
    password: 'password',
    protocol: 'rest', // Can change this by 'socket' if you use only api-ssl
    port: 443, // We recommended change the default port (Use www-ssl)
    socketPort: 8729, // We recommended change the default port (Use api-ssl)
    useTLS: true,
    allowInsecureConfig: true, // Only if you do not have a trusted certificate
    rejectUnauthorized: false // Allow self-certificates
});

await client.connect();
```
---


#### 2. Recommended connection (Production/Release)

```ts
import { MikrotikClient } from 'rosinterface';
import 'dotenv/config';

const client = new MikrotikClient({
  host: process.env.MIKROTIK_HOST,
  user: process.env.MIKROTIK_USER,
  password: process.env.MIKROTIK_PASSWORD,
  protocol: process.env.MIKROTIK_PROTOCOL, 
  port: 443,
  socketPort: 8729,
  useTLS: true, // Always use TLS between TLS v1.2 or TLS v1.3 deppend that your devices
  allowInsecureConfig: true, // Only if you do not have a trusted certificate
  rejectUnauthorized: false, // We allow self-signed certificates
  timeout: 10 // Adjust the time tolerance, so that the library throws an error (10s)  
});

await client.connect();
```

---



#### 3. Optimized Read (select + findOne)

```ts
const user = await client.command('/ppp/secret')
  .select(['name', 'profile', 'last-logged-out'])
  .findOne({ name: 'john_doe' });

console.log(`User: ${user?.name}, Profile: ${user?.profile}`);
```

---

#### 4. Resilience with Persistence (Offline-Safe)

```ts
const result = await client.command('/ppp/secret')
  .persistent()
  .add({
    name: 'new_user',
    password: 'securePassword123',
    profile: 'default'
  });

if (result === 'QUEUED_OFFLINE') {
  console.log('Router unreachable. Task stored and will sync automatically.');
}
```


#### 5. Time-Limited Listener

```ts
// Start the subscription and store the cleanup function (unsubscribe)
const unsubscribe = client.collection('/ppp/secret')
    .onSnapshot((secrets) => {
        console.log(`Update received. Total users: ${secrets.length}`);
    });

// Set a timer to stop listening
setTimeout(() => {
    console.log('Time up. Stopping subscription...');

    // Stops the Router stream and clears local memory
    unsubscribe();

    // Optional: Close the connection if no further tasks are needed
    client.close();
}, 60000); // 60 seconds
```


#### 6. Persistent Listener (Always On)

```ts
// The client automatically handles Keep-Alive pings (every 10s)
// to prevent idle disconnects. No need to call 'unsubscribe'.

client.collection('/interface')
    .where('disabled', false) // Optional: Only active interfaces
    .onSnapshot((interfaces) => {
        // This callback will execute infinitely whenever a physical change
        // occurs on the router (cable unplugged, traffic state, rename, etc.)
        const downInterfaces = interfaces.filter(i => i.running === 'false');

        if (downInterfaces.length > 0) {
            console.alert(`ALERT: ${downInterfaces.length} interfaces are down.`);
        }
    });

// Important: Handle network errors to reconnect if power or internet is lost
client.on('close', () => {
    console.log('Connection lost. Restarting service in 5s...');
    setTimeout(() => connectAndListen(), 5000);
});
```



#### 7. Prometheus Metric

```ts
// 1. Define the map: Mikrotik Field -> Prometheus Metric
const metricsDef = [
    {
        name: 'mikrotik_iface_rx_total', // Final name in Prometheus
        help: 'Bytes received',          // Description
        type: 'counter',                 // Type: 'counter' or 'gauge'
        path: 'rx-byte',                 // Original field in RouterOS
        labels: ['name', 'type']         // Labels for filtering (e.g., wan, bridge)
    },
    {
        name: 'mikrotik_iface_tx_total',
        help: 'Bytes transmitted',
        type: 'counter',
        path: 'tx-byte',
        labels: ['name', 'type']
    }
];

// 2. Get the formatted plain text ready for Prometheus
// (Internally executes /interface/print and transforms the data)
const result = await client.getMetrics('/interface', metricsDef);

console.log(result);
```



#### 8. Type-Safe Realtime Stream (onDiff)

```ts
client.collection('/ppp/secret')
    .onSnapshot((data) => {
    // Check if we are in Diff Mode
    if ('added' in data) {
        // TypeScript automatically infers that 'data' is a SnapshotDiff!

        // Added items
        data.added.forEach(secret => console.log('New:', secret.name));

        // Modified items
        data.modified.forEach(secret => console.log('Modified:', secret.name));

        // Removed items
        data.removed.forEach(secret => console.log('Removed:', secret.name));
    }
    else {
        // If execution reaches here, .onDiff() was NOT used, so 'data' is a standard Array
        console.log('Full list size:', data.length);
    }
}).onDiff();
```


#### 9. Data Transformers With Print

```ts
// EXAMPLE 1: Using .toMap() for O(1) Lookup
// Scenario: Quickly finding a specific user by name without looping through an array.
client.command('/ppp/secret').print().then(result => {
    // Transform the array into a Dictionary (Map) indexed by 'name'
    const usersMap = result.toMap('name');

    // Instant access! No .find() required.
    const john = usersMap['john_doe'];
    if (john) {
        console.log(`User Found: ${john.profile}`);
    }
});

// EXAMPLE 2: Using .toGrouped() for Reporting
// Scenario: Grouping active connections by their service profile (e.g. 10mb, 50mb plans).
client.command('/ppp/active').print().then(result => {
    // Group users by the 'profile' property
    const byProfile = result.toGrouped('profile');

    console.log('--- Connected Users Summary ---');
    Object.keys(byProfile).forEach(profile => {
        console.log(`Plan ${profile}: ${byProfile[profile].length} users`);
    });
});

// EXAMPLE 3: Using .toPages() for Pagination
// Scenario: Displaying a large list of logs in a frontend table, page by page.
const PAGE_SIZE = 50;
const CURRENT_PAGE = 1;

client.command('/log').print().then(result => {
    // Get only the items for the first page
    const pageData = result.toPages(CURRENT_PAGE, PAGE_SIZE);

    console.log(`Showing ${pageData.length} logs (Page ${CURRENT_PAGE})`);
    pageData.forEach(log => console.log(`[${log.time}] ${log.message}`));
});

```


#### 10. CLI Codegen - Automatic Type Generation

> **OPTION A: Using .env file (Recommended for Security)**  
> Create a .env file with MIKROTIK_HOST, MIKROTIK_USER, MIKROTIK_PASS
> Run the command:
> > npm run codegen -- -p /ppp/secret -n ISecret
>
> OPTION B: Manual Configuration (Quick Testing / CI)
> Pass connection details directly via flags. Use double quotes for passwords with special chars.
> >npm run codegen -- -p /ppp/secret -n ISecret --host ROUTER_IP --user admin --pass "secret123" --port 8728


```ts
// Usage A: Type-Safe Reading (Auto-complete for properties)
// Pass the interface <ISecret> to .collection() or .command()
client.collection<ISecret>('/ppp/secret').onSnapshot((diff) => {
    if ('added' in diff) {
        diff.added.forEach(secret => {
            // TypeScript knows 'profile' and 'service' exist!
            // If you type "secret.", your IDE will show all available fields.
            console.log(`New User: ${secret.name} (Plan: ${secret.profile})`);
        });
    }
});

// Usage B: Type-Safe Writing (Validation for .add)
async function createSecureUser() {
    const api = client.command<ISecret>('/ppp/secret');

    // TypeScript ensures you only pass valid fields defined in ISecret.
    // It prevents typos like 'passwrod' or using invalid profile names if unions were generated.
    await api.add({
        name: 'vip_user',
        password: 'secure_password',
        profile: 'default',
        service: 'pppoe',
        disabled: false
    });
}

```

#### 11. Swarm Mode (Mass Management)

```ts
import { MikrotikSwarm } from 'rosinterface';

async function runSwarmTest() {
    const swarm = new MikrotikSwarm();

    // Node A: Modern Router (v7) -> Uses REST
    swarm.addNode('CORE_ROUTER', {
        host: '10.0.0.1',
        user: 'admin',
        password: 'safe12',
        protocol: 'rest',
        port: 443,
        socketPort: 8729,
        useTLS: true, // Always use TLS between TLS v1.2 or TLS v1.3 deppend that your devices
        allowInsecureConfig: true, // Only if you do not have a trusted certificate
        rejectUnauthorized: false, // We allow self-signed certificates
        timeout: 10 // Adjust the time tolerance, so that the library throws an error (10s)
    });

    // Node B: Legacy Router (v6) -> Uses Sockets
    swarm.addNode('TOWER_A', {
        host: '10.0.0.2',
        user: 'admin',
        password: 'safe1234',
        protocol: 'socket',
        port: 8729,
        useTLS: true, // Always use TLS between TLS v1.2 or TLS v1.3 deppend that your devices
        allowInsecureConfig: true, // Only if you do not have a trusted certificate
        rejectUnauthorized: false, // We allow self-signed certificates
        timeout: 10 // Adjust the time tolerance, so that the library throws an error (10s)
    });

    console.log("Connecting Swarm...");
    await swarm.connectAll();

    // BROADCAST: Send command to ALL routers in parallel
    console.log("Broadcasting Firewall Rule...");
    const results = await swarm.broadcast('/ip/dns/set', {
        'allow-remote-requests': 'yes'
    });

    results.forEach(res => {
        console.log(`[${res.nodeId}] Success: ${res.success}`);
    });

    swarm.closeAll();
}

runSwarmTest();
```


#### 12. Full Integration Testing (Hybrid Engine & Wrappers)

```ts
import { MikrotikClient } from 'rosinterface';

async function manageWispNetwork() {

    const client = new MikrotikClient({
        host: process.env.MIKROTIK_HOST,
        user: process.env.MIKROTIK_USER,
        password: process.env.MIKROTIK_PASSWORD,
        protocol: process.env.MIKROTIK_PROTOCOL,
        port: 443,
        socketPort: 8729, // Remember to change the default port
        useTLS: true, // Always use TLS v1.2 or TLS v1.3, depending on your devices
        allowInsecureConfig: true, // Only if reliable certificates are not available
        rejectUnauthorized: false, // Allows self-signed certificates
        timeout: 10 // Adjusts the timeout tolerance before the library throws an error (10s)
    });

    await client.connect();

    // ==========================================
    // 1. DIAGNOSTICS & SYSTEM INFO
    // ==========================================

    // Get a unified report of CPU, Memory, and Board info
    const report = await client.diagnostic.generateSystemReport();
    console.log(`Model: ${report.board['boardName']} | CPU Load: ${report.resources['cpu-load']}%`);

    // Run an Automated Security Audit (Checks for open ports, default users, DNS vulnerabilities)
    const vulnerabilities = await client.diagnostic.runSecurityAudit();
    console.log("Security Alerts:", vulnerabilities);

    // ==========================================
    // 2. CUSTOMER PROVISIONING (PPPoE & Queues)
    // ==========================================

    // Create a new PPPoE user with a specific plan
    await client.ppp.addSecret('john_doe', 'securePass123', 'Plan_50M');

    // Limit bandwidth using Simple Queues (e.g., 20Mbps Upload / 50Mbps Download)
    await client.queue.addQueue('John_Home', '10.0.0.5/32', '20M/50M');

    // ==========================================
    // 3. SECURITY & FIREWALL
    // ==========================================

    // Suspend a customer by adding them to an Address List
    await client.firewall.addAddressList('10.0.0.5', 'suspended_users', { comment: 'Unpaid Invoice' });

    // Easy Port Forwarding (nat-api style) - Map public port 8080 to an internal camera on port 80
    await client.firewall.mapPort(8080, '10.0.0.5', 80, 'tcp');

    // Close the port when no longer needed
    await client.firewall.unmapPort(8080, 'tcp');

    // ==========================================
    // 4. LIVE TRAFFIC MONITORING
    // ==========================================

    // Get real-time bandwidth usage of a specific interface
    const traffic = await client.interface.getLiveTraffic('ether1');
    console.log(`Download: ${traffic['rx-bits-per-second']} bps`);
    console.log(`Upload:   ${traffic['tx-bits-per-second']} bps`);

    await client.disconnect();
}
```


---

</details>

<details>
<summary><b>Documentación en Español</b></summary>
<br>

## Documentación en Español

**RosInterface** no es solo otro wrapper de API; es un SDK de infraestructura de grado empresarial diseñado específicamente para ISPs, plataformas SaaS y topologías de red de misión crítica.
En su núcleo se encuentra un revolucionario **Motor Híbrido** que cierra inteligentemente la brecha entre generaciones de protocolos.
Al unificar sin problemas la fiabilidad transaccional de REST (HTTPS) con la latencia ultrabaja de los Sockets persistentes (TCP),
ofrece una orquestación en tiempo real sin precedentes en entornos mixtos de RouterOS (v6 y v7) con cero fragmentación de código.

Diseñado con una estricta **filosofía de protección centrada en el hardware**, RosInterface defiende activamente tus dispositivos de borde.
A través de limitadores de tasa inteligentes, circuit breakers y un sistema de colas offline-first, garantiza un rendimiento determinista incluso bajo una degradación severa de la red,
eliminando por completo los picos de CPU, las fugas de memoria y las inundaciones de conexiones que plagan los scripts de automatización tradicionales.

---

### ✨ Características Principales

- **Protección del Hardware**  
  Limitador de tasa integrado con retroceso inteligente para evitar saturación de CPU.

- **Arquitectura Offline-First**  
  Los comandos con `.persistent()` se guardan en cola si el router no está disponible y se ejecutan automáticamente al reconectar.

- **Caché Inteligente**  
  Consultas con TTL de **5 segundos**, reduciendo llamadas innecesarias.

- **Filtrado en Origen**  
  `.findBy()` y `.findOne()` filtran directamente en RouterOS sin descargar tablas completas.

- **Cambios puntuales**  
  Usa `.collection()` y `.onSnapshot()` para obtener cambios en tiempo real **directamente desde el router**, para obtener datos nuevos, sin llamar a su router repetidamente.

- **Tolerancia a Fallos (Circuit Breaker)**  
  Implementa el patrón `Circuit Breaker` . Si el router deja de responder o da errores críticos, la librería "corta el circuito" temporalmente para evitar acumular peticiones fallidas y proteger la estabilidad de tu servidor Node.js.

- **Observabilidad Nativa**  
  Método `.getMetrics()`integrado. Exporta estadísticas de tráfico y estado del router directamente en formato compatible con Prometheus y Grafana sin necesidad de plugins externos.

- **Seguridad de Transporte**  
  Soporte completo para **TLS/SSL (API-SSL)**, permitiendo conexiones encriptadas seguras a través del puerto 8729 (Recomendado cambiar), ideal para administrar routers a través de internet pública.

- **API Fluida**  
  Sintaxis encadenable y clara.

- **Generador de código CLI**

  Genere automáticamente interfaces TypeScript desde su enrutador en vivo. Olvídese de adivinar los nombres de los campos.

- **Actualizaciones diferenciales (onDiff)**

  Reciba eventos atómicos de adición, modificación y eliminación en lugar de matrices completas. Optimizado para interfaces de usuario de alto rendimiento.

- **Limitación inteligente**

  Controle el flujo de datos en tiempo real con estrategias de vanguardia y vanguardia.

- **Motor Híbrido Inteligente:**

  Combina la seguridad del protocolo **REST (HTTPS)** para comandos CRUD con la velocidad de **Sockets (TCP)** para streaming de datos.
    - *RouterOS v7:* Usa HTTPS + Sockets (Background).
    - *RouterOS v6:* Usa Sockets puro (Legacy Mode).

- **Modo Enjambre (Swarm):**

  Administra flotas de **50+ routers** desde una sola instancia.
    - Soporte para **Broadcast** (todos los nodos) y **Multicast** (grupos selectos).
    - Tolerancia a fallos: Si un router no responde, el resto del enjambre sigue operando.
    - Agnosticismo de Protocolo: Mezcla routers modernos y antiguos en el mismo grupo de control.
    - 
- **Motor de plugins O(1):** Una arquitectura altamente extensible. Inyecte plugins de la comunidad o cree sus propias herramientas de inspección profunda de paquetes sin sacrificar ni un solo milisegundo de rendimiento.

- **Tolerancia a fallos integrada:** Los disyuntores nativos y los limitadores de velocidad de tipo Token-Bucket protegen tanto su servidor Node.js como la CPU de RouterOS de fallos en cascada.

- **Subsistemas de carga diferida:** Los módulos (Firewall, Queue, PPP) se cargan estrictamente de forma diferida. La memoria solo se asigna para las herramientas específicas que usted invoque.

- **RosToolkit:** Una biblioteca estándar integrada que proporciona herramientas de rendimiento sin dependencias, escritas en C++, para matemáticas, análisis forense y análisis de paquetes.


---

### ✨ Consideraciones Importantes

#### Variables de Entorno (.env)

Crea un archivo `.env` en el directorio raíz de tu proyecto:

```text
Credenciales Básicas
Son los datos de acceso estándar.

MIKROTIK_HOST: La IP de tu router (ej. 192.168.1.1).

MIKROTIK_USER: Usuario con permisos de escritura (ej. admin).

MIKROTIK_PASSWORD: Contraseña del usuario.

El Cerebro (Protocolo Principal)
Aquí decides cómo se enviarán los comandos (Crear, Editar, Borrar).

MIKROTIK_PROTOCOL

rest: (Recomendado para RouterOS v7+). Usa HTTPS. Es más seguro y maneja mejor los errores.

socket: (Para RouterOS v6). Usa conexión TCP cruda. Úsalo solo si tu router es viejo y no soporta REST.

MIKROTIK_PORT

Es el puerto del protocolo elegido arriba.

Si usas rest: Pon 443 (el puerto www-ssl del router).

Si usas socket: Pon 8728 (el puerto api).

Seguridad SSL
MIKROTIK_INSECURE

true: (Casi siempre necesario en redes locales). Le dice a la librería: "Confía en el certificado del router aunque sea autofirmado". Usa el Dispatcher seguro internamente.

false: Solo úsalo si has comprado un dominio real (ej. router.ejemplo.com) y le instalaste un certificado válido al Mikrotik.


El "Oído" (Motor Híbrido)
Esta es la variable principal para tener eventos en tiempo real (onSnapshot) mientras usas REST.

MIKROTIK_PORT_APISSL (o socketPort en el código)

Si lo dejas vacío: El modo híbrido se apaga. Solo podrás enviar comandos, pero no escuchar cambios en vivo.

Si pones 8728: Activas el Modo Híbrido. La librería usará REST para mandar órdenes y abrirá un canal oculto en el 8728 para escuchar el onSnapshot.

```

> ⚠️ **Aviso de Seguridad**  
> La bandera `allowInsecureConfig` es una medida de seguridad **crítica** en RosInterface.  
> Previene la exposición accidental de credenciales o el uso de protocolos no cifrados en producción.
>
> Úsala **solo en entornos controlados, locales o de prueba**.


> ⚠️ **Aviso de Rendimiento**  
> La función `onSnapshot` permite recibir cambios en **tiempo real** del router en RosInterface.  
> Para evitar el impacto negativo de rendimiento en equipos con pocas prestaciones, se recomienda usarlo con **Resiliencia**.
>
> Úsala **con moderación, el abuso de onSnapshot puede afectar el rendimiento de tus equipos**.


> ⚠️ **Configuraciones básicas en tus equipos**  
> Antes de ejecutar estos códigos, asegúrese de que la configuración de RouterOS coincida:
> > **Puertos (Modo Híbrido):**
> >
> > REST (Comandos): Requiere el servicio www-ssl habilitado en el router (Puerto predeterminado 443).
> >
> > Socket (Streaming): Requiere el servicio api (Predeterminado 8728) o api-ssl (Predeterminado 8729).
> >
>> **Certificados (Autofirmados):**
> >
> >Al configurar `rejectUnauthorized: false` en las opciones de MikrotikClient, la biblioteca utiliza el Despachador Undici (Agente con Ámbito).
> >
> **Esto implica que el tráfico sigue estando cifrado (HTTPS), pero la biblioteca aceptará el certificado autogenerado del router sin fallar. Esto no compromete la seguridad de otras conexiones externas (como Stripe/AWS) en su aplicación Node.js.**




---

### Ejemplos de Uso

#### 1. Conexión rápida (solo pruebas)

```ts
import { MikrotikClient } from 'rosinterface';

const client = new MikrotikClient({
  host: 'IP_DEL_ROUTER (LOCAL O REMOTO)',
  user: 'admin',
  password: 'password',
  port: 443, // Se recomienda cambiar el puerto por defecto (Usa www-ssl)
  socketPort: 8729, // Se recomienda cambiar el puerto por defecto (Usa api-ssl)  
  useTLS: true, 
  allowInsecureConfig: true, // Permite si no tienes un certificado confiable
  rejectUnauthorized: false // Permite certificados auto firmados 
});

await client.connect();
```

---

#### 2. Conexión Recomendada (Producción)

```ts
import { MikrotikClient } from 'rosinterface';
import 'dotenv/config';

const client = new MikrotikClient({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASSWORD,
    protocol: process.env.MIKROTIK_PROTOCOL,
    port: 443,
    socketPort: 8729, // Recuerda cambiar el puerto por defecto
    useTLS: true, // Siempre usa TLS v1.2 o TLS v1.3, depende de tus dispocitivos
    allowInsecureConfig: true, // Solo si no se cuenta con certificados confiables
    rejectUnauthorized: false, // Permite los certificados auto firmados
    timeout: 10 // Ajusta la tolerancia de tiempo, para que la libreria arroje un error (10s)
});

await client.connect();
```

---

#### 3. Lectura Optimizada

```ts
const user = await client.command('/ppp/secret')
  .select(['name', 'profile', 'last-logged-out'])
  .findOne({ name: 'john_doe' });

console.log(`User: ${user?.name}, Profile: ${user?.profile}`);
```

---

#### 4. Persistencia Offline

```ts
const result = await client.command('/ppp/secret')
  .persistent()
  .add({
    name: 'new_user',
    password: 'securePassword123',
    profile: 'default'
  });

if (result === 'QUEUED_OFFLINE') {
  console.log('Router unreachable. Task stored and will sync automatically.');
}
```


#### 5. Escuchar por un Tiempo Determinado (Time-Limited)

```ts
// Iniciar la suscripción y guardar la función de limpieza (unsubscribe)
const unsubscribe = client.collection('/ppp/secret')
    .onSnapshot((secrets) => {
        console.log(`Actualización recibida. Total usuarios: ${secrets.length}`);
    });

// Establecer un temporizador para detener la escucha
setTimeout(() => {
    console.log('Tiempo finalizado. Cerrando suscripción...');

    // Detiene el stream del Router y limpia la memoria local
    unsubscribe();

    // Opcional: Cerrar la conexión si ya no harás más tareas
    client.close();
}, 60000); // 60 segundos
```



#### 6. Escucha Persistente (Always On)

```ts
// Configuración para mantener la conexión viva (Keep-Alive)
// El cliente enviará pings internos cada 10s para evitar desconexiones por inactividad.
// No es necesario llamar a 'unsubscribe' ni poner timeouts.

client.collection('/interface')
    .where('disabled', false) // Opcional: Solo interfaces activas
    .onSnapshot((interfaces) => {
        // Este callback se ejecutará infinitamente cada vez que haya un cambio
        // físico en el router (cable desconectado, tráfico, cambio de nombre, etc.)
        const downInterfaces = interfaces.filter(i => i.running === 'false');

        if (downInterfaces.length > 0) {
            console.alert(`ALERTA: ${downInterfaces.length} interfaces caídas.`);
        }
    });

// Importante: Manejar errores de red para reconectar si se va la luz o internet
client.on('close', () => {
    console.log('Conexión perdida. Reiniciando servicio en 5s...');
    setTimeout(() => connectAndListen(), 5000);
});
```


#### 7. Métricas Prometheus

```ts
// 1. Define el mapeo: Campo Mikrotik -> Métrica Prometheus
const metricasDef = [
    {
        name: 'mikrotik_iface_rx_total', // Nombre final en Prometheus
        help: 'Bytes recibidos',         // Descripción
        type: 'counter',                 // Tipo: 'counter' o 'gauge'
        path: 'rx-byte',                 // Campo original en RouterOS
        labels: ['name', 'type']         // Etiquetas para filtrar (ej: wan, bridge)
    },
    {
        name: 'mikrotik_iface_tx_total',
        help: 'Bytes transmitidos',
        type: 'counter',
        path: 'tx-byte',
        labels: ['name', 'type']
    }
];

// 2. Obtén el texto formateado listo para Prometheus
// (Internamente ejecuta /interface/print y transforma los datos)
const resultado = await client.getMetrics('/interface', metricasDef);

console.log(resultado);
```

#### 8. Transmisión en tiempo real con seguridad de tipos (onDiff)

```ts
client.collection('/ppp/secret') // Sin <T>, se asume Record<string, any>
    .onSnapshot((data) => {
        // Verificar si estamos en modo Diff
        if ('added' in data) {
            // TypeScript infiere automáticamente que 'data' es un SnapshotDiff

            // Elementos Agregados
            data.added.forEach(secret => console.log('Nuevo:', secret.name));

            // Elementos Modificados
            data.modified.forEach(secret => console.log('Editado:', secret.name));

            // Elementos Eliminados
            data.removed.forEach(secret => console.log('Borrado:', secret.name));
        }
        else {
            // Si entra aquí, es que NO se usó .onDiff() y es un Array normal
            console.log('Tamaño lista completa:', data.length);
        }
    })
    .onDiff(); // <--- IMPORTANTE: Activa el modo diferencial
```


#### 9. Tranformadores de tipo de datos con Print

```ts
// EJEMPLO 1: Usando .toMap() para Búsqueda Instantánea O(1)
// Escenario: Encontrar rápidamente un usuario específico por nombre sin recorrer un array.
client.command('/ppp/secret').print().then(result => {
    // Transformar el array en un Diccionario (Map) indexado por 'name'
    const usersMap = result.toMap('name');

    // ¡Acceso instantáneo! No se requiere .find().
    const john = usersMap['john_doe'];
    if (john) {
        console.log(`Usuario Encontrado: ${john.profile}`);
    }
});


// EJEMPLO 2: Usando .toGrouped() para Reportes
// Escenario: Agrupar conexiones activas por su perfil de servicio (ej. planes de 10mb, 50mb).
client.command('/ppp/active').print().then(result => {
    // Agrupar usuarios por la propiedad 'profile'
    const byProfile = result.toGrouped('profile');

    console.log('--- Resumen de Usuarios Conectados ---');
    Object.keys(byProfile).forEach(profile => {
        console.log(`Plan ${profile}: ${byProfile[profile].length} usuarios`);
    });
});


// EJEMPLO 3: Usando .toPages() para Paginación
// Escenario: Mostrar una lista grande de logs en una tabla frontend, página por página.
const PAGE_SIZE = 50;
const CURRENT_PAGE = 1;

client.command('/log').print().then(result => {
    // Obtener solo los elementos para la primera página
    const pageData = result.toPages(CURRENT_PAGE, PAGE_SIZE);

    console.log(`Mostrando ${pageData.length} logs (Página ${CURRENT_PAGE})`);
    pageData.forEach(log => console.log(`[${log.time}] ${log.message}`));
});

```


#### 10. CLI Codegen - Generación Automática de Tipos

> **OPCIÓN A: Usando archivo .env (Recomendado por Seguridad)**  
> Crea un archivo .env con MIKROTIK_HOST, MIKROTIK_USER, MIKROTIK_PASS
> Ejecuta el comando:
> > npm run codegen -- -p /ppp/secret -n ISecret
>
> OPCIÓN B: Configuración Manual (Pruebas Rápidas / CI)
> Pasa los detalles de conexión directamente mediante banderas. Usa comillas dobles para contraseñas con caracteres especiales.
> >npm run codegen -- -p /ppp/secret -n ISecret --host ROUTER_IP --user admin --pass "secret123" --port 8728


```ts
// Uso A: Lectura con Tipado Seguro (Auto-completado para propiedades)
// Pasar la interfaz <ISecret> a .collection() o .command()
client.collection<ISecret>('/ppp/secret').onSnapshot((diff) => {
    if ('added' in diff) {
        diff.added.forEach(secret => {
            // ¡TypeScript sabe que 'profile' y 'service' existen!
            // Si escribes "secret.", tu IDE mostrará todos los campos disponibles.
            console.log(`Nuevo Usuario: ${secret.name} (Plan: ${secret.profile})`);
        });
    }
});

// Uso B: Escritura con Tipado Seguro (Validación para .add)
async function createSecureUser() {
    const api = client.command<ISecret>('/ppp/secret');

    // TypeScript asegura que solo pases campos válidos definidos en ISecret.
    // Previene errores tipográficos como 'passwrod' o usar nombres de perfil inválidos si se generaron uniones.
    await api.add({
        name: 'vip_user',
        password: 'secure_password',
        profile: 'default',
        service: 'pppoe',
        disabled: false
    });
}

```

#### 11. Swarm Mode (Mass Management)

```ts
import { MikrotikSwarm } from 'rosinterface';

async function ejecutarTestEnjambre() {
    const enjambre = new MikrotikSwarm();

    // Nodo A: Router Moderno (v7) -> Usa API-REST bajo HTTPS
    enjambre.addNode('CORE_ROUTER', {
        host: '10.0.0.1',
        user: 'admin',
        password: 'safe12',
        protocol: 'rest',
        port: 443,
        socketPort: 8729,
        useTLS: true, 
        allowInsecureConfig: true, 
        rejectUnauthorized: false, 
        timeout: 10 
    });

    // Node B: Legacy Router (v6) -> Usas Sockets
    swarm.addNode('TOWER_A', {
        host: '10.0.0.2',
        user: 'admin',
        password: 'safe1234',
        protocol: 'socket',
        port: 8729,
        useTLS: true, 
        allowInsecureConfig: true, 
        rejectUnauthorized: false, 
        timeout: 10 
    });

    console.log("Conectando Enjambre...");
    await enjambre.connectAll();

    // BROADCAST: Enviar comando a TODOS los routers en paralelo
    console.log("Difundiendo configuración DNS...");
    const resultados = await enjambre.broadcast('/ip/dns/set', {
        'allow-remote-requests': 'yes',
        'servers': '8.8.8.8,1.1.1.1'
    });

    resultados.forEach(res => {
        if (res.success) {
            console.log(`[${res.nodeId}] Éxito`);
        } else {
            console.log(`[${res.nodeId}] Falló: ${res.error}`);
        }
    });

    enjambre.closeAll();
}

ejecutarTestEnjambre();
```

#### 12. Pruebas de integración completa (motor híbrido y envoltorios)

```ts
import { MikrotikClient } from 'rosinterface';

async function manageWispNetwork() {

    const client = new MikrotikClient({
        host: process.env.MIKROTIK_HOST,
        user: process.env.MIKROTIK_USER,
        password: process.env.MIKROTIK_PASSWORD,
        protocol: process.env.MIKROTIK_PROTOCOL,
        port: 443,
        socketPort: 8729, // Recuerda cambiar el puerto por defecto
        useTLS: true, // Siempre usa TLS v1.2 o TLS v1.3, dependiendo de tus dispositivos
        allowInsecureConfig: true, // Solo si no se cuenta con certificados confiables
        rejectUnauthorized: false, // Permite los certificados autofirmados
        timeout: 10 // Ajusta la tolerancia de tiempo para que la librería arroje un error (10s)
    });

    await client.connect();

    // ==========================================
    // 1. DIAGNÓSTICO E INFORMACIÓN DEL SISTEMA
    // ==========================================

    // Obtiene un reporte unificado de CPU, Memoria e información de la placa
    const report = await client.diagnostic.generateSystemReport();
    console.log(`Modelo: ${report.board['boardName']} | Carga CPU: ${report.resources['cpu-load']}%`);

    // Ejecuta una Auditoría de Seguridad Automatizada (Revisa puertos abiertos, usuarios por defecto, vulnerabilidades DNS)
    const vulnerabilities = await client.diagnostic.runSecurityAudit();
    console.log("Alertas de Seguridad:", vulnerabilities);

    // ==========================================
    // 2. APROVISIONAMIENTO DE CLIENTES (PPPoE y Colas)
    // ==========================================

    // Crea un nuevo usuario PPPoE con un plan específico
    await client.ppp.addSecret('juan_perez', 'securePass123', 'Plan_50M');

    // Limita el ancho de banda usando Simple Queues (ej. 20Mbps Subida / 50Mbps Bajada)
    await client.queue.addQueue('Casa_Juan', '10.0.0.5/32', '20M/50M');

    // ==========================================
    // 3. SEGURIDAD Y FIREWALL
    // ==========================================

    // Suspende a un cliente agregándolo a una Lista de Direcciones (Address List)
    await client.firewall.addAddressList('10.0.0.5', 'usuarios_suspendidos', { comment: 'Factura Vencida' });

    // Redirección de puertos fácil (estilo nat-api) - Mapea el puerto público 8080 a una cámara interna en el puerto 80
    await client.firewall.mapPort(8080, '10.0.0.5', 80, 'tcp');

    // Cierra el puerto cuando ya no se necesite
    await client.firewall.unmapPort(8080, 'tcp');

    // ==========================================
    // 4. MONITOREO DE TRÁFICO EN VIVO
    // ==========================================

    // Obtiene el uso de ancho de banda en tiempo real de una interfaz específica
    const traffic = await client.interface.getLiveTraffic('ether1');
    console.log(`Descarga: ${traffic['rx-bits-per-second']} bps`);
    console.log(`Subida:   ${traffic['tx-bits-per-second']} bps`);

    await client.disconnect();
}
```

---

</details>

<details>
<summary><b>Creating Custom Plugins</b></summary>
<br>

RosInterface includes a fully modular Plugin Engine that allows developers to extend the SDK with custom automation systems, packet analyzers, telemetry collectors, middleware interceptors, and advanced RouterOS integrations.

Every plugin must implement the `RosPlugin` interface.

---

## Basic Plugin Structure

```ts
import { RosPlugin, RosPluginContext } from "rosinterface";

export class SmartLoggerPlugin implements RosPlugin {
    public readonly name = "rosinterface-smart-logger";
    public readonly version = "1.0.0";

    private client!: any;
    private toolkit!: RosPluginContext["toolkit"];

    install(context: RosPluginContext): void {
        this.client = context.client;
        this.toolkit = context.toolkit;

        console.log("[Plugin] Smart Logger Initialized");
    }

    onConnect(): void {
        console.log("[Plugin] Router Connected");
    }

    onDisconnect(): void {
        console.log("[Plugin] Router Disconnected");
    }

    beforeCommand(command: string): string {
        console.log("[Command]", command);
        return command;
    }
}
```

## Installing a Plugin

```ts
import { MikrotikClient } from "rosinterface";
import { SmartLoggerPlugin } from "./plugins/SmartLoggerPlugin";

const client = new MikrotikClient({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASSWORD,
    protocol: process.env.MIKROTIK_PROTOCOL,
    port: 443,
    socketPort: 8729, 
    useTLS: true, 
    allowInsecureConfig: true,
    rejectUnauthorized: false,
});

client.use(new SmartLoggerPlugin());

```
> During installation, RosInterface injects a secure high-performance context into your plugin.

```ts

install(context: RosPluginContext): void {
    context.client;    // Main MikrotikClient instance
    context.protocol;  // Low-level RosProtocol engine
    context.toolkit;   // RosToolkit utilities
}

```

## Lifecycle Hooks

> RosInterface plugins support high-level lifecycle hooks for business logic automation.

| Hook | Description |
|------|-------------|
| `onConnect()` | Executed after successful authentication |
| `onDisconnect()` | Triggered when socket closes |
| `beforeCommand(command)` | Intercepts commands before encoding |

## Low-Level Socket Interceptors
> Plugins can intercept raw network buffers before and after encoding.

# Incoming Packet Interceptor
```ts
onRawBufferReceived(chunk: Buffer): Buffer {
    console.log(chunk);
    return chunk;
}

```

# Outgoing Packet Interceptor
```ts
onRawBufferSend(payload: Buffer): Buffer {
    console.log(payload);
    return payload;
}

```

## Using RosToolkit
```ts

const dump = this.toolkit.Bytes.toHexDump(buffer);
console.log(dump);
```
> Example output: `ff a1 00 2b 9c 01 ...`

## Best Practices

- Always return buffers in low-level interceptors
- Avoid blocking the event loop
- Keep plugins stateless whenever possible
- Use `Float64Array` for telemetry calculations
- Clean intervals and streams in `onDisconnect()`
- Use semantic versioning for compatibility tracking

---

## Recommended Plugin Ideas

- Smart Cache Engine
- Real-Time Traffic Analyzer
- Intrusion Detection System (IDS)
- RouterOS Telemetry Dashboard
- AI-Based Anomaly Detection
- Auto Failover Manager
- Network Digital Twin
- Packet Recorder
- QoS Optimizer
- PPPoE Monitoring Engine

</details>



<details>
<summary><b>Creación de Plugins Personalizados</b></summary>
<br>

RosInterface incluye un motor de plugins totalmente modular que permite a los desarrolladores extender el SDK con sistemas de automatización personalizados, analizadores de paquetes, recolectores de telemetría, interceptores middleware e integraciones avanzadas con RouterOS.

Cada plugin debe implementar la interfaz `RosPlugin`.

---

## Estructura Básica de un Plugin

```ts
import { RosPlugin, RosPluginContext } from "rosinterface";

export class SmartLoggerPlugin implements RosPlugin {
    public readonly name = "rosinterface-smart-logger";
    public readonly version = "1.0.0";

    private client!: any;
    private toolkit!: RosPluginContext["toolkit"];

    install(context: RosPluginContext): void {
        this.client = context.client;
        this.toolkit = context.toolkit;

        console.log("[Plugin] Smart Logger Initialized");
    }

    onConnect(): void {
        console.log("[Plugin] Router Connected");
    }

    onDisconnect(): void {
        console.log("[Plugin] Router Disconnected");
    }

    beforeCommand(command: string): string {
        console.log("[Command]", command);
        return command;
    }
}
```

---

## Instalación de un Plugin

```ts
import { MikrotikClient } from "rosinterface";
import { SmartLoggerPlugin } from "./plugins/SmartLoggerPlugin";

const client = new MikrotikClient({
    host: process.env.MIKROTIK_HOST,
    user: process.env.MIKROTIK_USER,
    password: process.env.MIKROTIK_PASSWORD,
    protocol: process.env.MIKROTIK_PROTOCOL,
    port: 443,
    socketPort: 8729,
    useTLS: true,
    allowInsecureConfig: true,
    rejectUnauthorized: false,
});

client.use(new SmartLoggerPlugin());
```

---

## Contexto del Plugin

Durante la instalación, RosInterface inyecta un contexto seguro y de alto rendimiento en cada plugin.

```ts
install(context: RosPluginContext): void {
    context.client;    // Instancia principal de MikrotikClient
    context.protocol;  // Motor RosProtocol de bajo nivel
    context.toolkit;   // Utilidades RosToolkit
}
```

---

## Hooks del Ciclo de Vida

Los plugins de RosInterface soportan hooks de alto nivel para automatización y lógica de negocio.

| Hook | Descripción |
|------|-------------|
| `onConnect()` | Se ejecuta después de una autenticación exitosa |
| `onDisconnect()` | Se activa cuando el socket se cierra |
| `beforeCommand(command)` | Intercepta comandos antes de ser codificados |

---

## Interceptores de Socket de Bajo Nivel

Los plugins pueden interceptar buffers de red sin procesar antes y después de la codificación.

### Interceptor de Paquetes Entrantes

```ts
onRawBufferReceived(chunk: Buffer): Buffer {
    console.log(chunk);
    return chunk;
}
```

### Interceptor de Paquetes Salientes

```ts
onRawBufferSend(payload: Buffer): Buffer {
    console.log(payload);
    return payload;
}
```

---

## Uso de RosToolkit

### Hex Dump Utility

```ts
const dump = this.toolkit.Bytes.toHexDump(buffer);

console.log(dump);
```

Ejemplo de salida:

```txt
ff a1 00 2b 9c 01 ...
```

---

## Mejores Prácticas

- Siempre devuelve buffers en interceptores de bajo nivel
- Evita bloquear el Event Loop
- Mantén los plugins sin estado siempre que sea posible
- Usa `Float64Array` para cálculos de telemetría
- Limpia intervalos y streams en `onDisconnect()`
- Utiliza versionado semántico para compatibilidad

---

## Ideas de Plugins Recomendados

- Motor de caché inteligente
- Analizador de Tráfico en Tiempo Real
- Sistema de Detección de Intrusiones (IDS)
- Dashboard de Telemetría RouterOS
- Detección de Anomalías con IA
- Gestor Automático de Failover
- Digital Twin de Red
- Grabador de Paquetes
- Optimizador QoS
- Motor de Monitoreo PPPoE

</details>





<details>
<summary><b>Creating Custom Wrappers</b></summary>
<br>

## Extending the SDK with Custom Wrappers
>The rosinterface-sdk provides many high-level wrappers for common RouterOS operations.
> However, RouterOS contains hundreds of commands and it is impossible for the SDK to abstract every possible feature.
>
> For this reason, the SDK exposes the **write()** method.
>
> This method is the low-level core execution layer that allows developers to send raw commands directly to the **RouterOS API**.
>
> This enables you to:
- Build your own custom abstractions 
- Create feature-specific wrappers
- Implement advanced RouterOS functionality
- Share community wrapper packages
> If you develop useful wrappers, you are encouraged to share them with the community as small wrapper packages built on top of **write()**.
>

```typescript
class PPPoEWrapper {

    constructor(private client: MikrotikClient) {}

    /**
     * Create a PPPoE Secret
     */
    async createSecret(
        name: string,
        password: string,
        profile: string,
        service: string = "pppoe"
    ) {

        return this.client.write("/ppp/secret/add", {
            name,
            password,
            profile,
            service
        });

    }

}

```

## Usage

```typescript
const pppoe = new PPPoEWrapper(client);

await pppoe.createSecret(
    "customer01",
    "securePassword",
    "basic-profile"
);
```
## What Happens Internally?
When write() is executed, the SDK automatically handles:

- Circuit Breaker protection
- Rate Limiting
- Protocol selection (REST for RouterOS v7 / Socket for v6)
- Automatic response normalization

This means your wrapper benefits from the full reliability architecture of the SDK without needing to implement it yourself.

</details>





<details>
<summary><b>Creación de envoltorios personalizados</b></summary>
<br>

## Ampliación del SDK con envoltorios personalizados
>El SDK de rosinterface proporciona numerosos envoltorios de alto nivel para operaciones comunes de RouterOS.
>Sin embargo, RouterOS contiene cientos de comandos y es imposible que el SDK abstraiga todas las funcionalidades posibles.
>Por este motivo, el SDK expone el método **write()**.
>Este método es la capa de ejecución principal de bajo nivel que permite a los desarrolladores enviar comandos directamente a la **API de RouterOS**.

>Esto permite:
- Crear abstracciones personalizadas
- Crear envoltorios específicos para funcionalidades
- Implementar funcionalidades avanzadas de RouterOS
- Compartir paquetes de envoltorios de la comunidad
>Si desarrolla envoltorios útiles, le animamos a compartirlos con la comunidad como pequeños paquetes de envoltorios basados ​​en **write()**.
> 

```typescript
class PPPoEWrapper {

    constructor(private client: MikrotikClient) {}

    /**
     * Create a PPPoE Secret
     */
    async createSecret(
        name: string,
        password: string,
        profile: string,
        service: string = "pppoe"
    ) {

        return this.client.write("/ppp/secret/add", {
            name,
            password,
            profile,
            service
        });

    }

}

```

## Su uso

```typescript
const pppoe = new PPPoEWrapper(client);

await pppoe.createSecret(
    "customer01",
    "securePassword",
    "basic-profile"
);
```
## ¿Qué sucede internamente?

Cuando se ejecuta `write()`, el SDK gestiona automáticamente:

- Protección mediante disyuntor
- Limitación de velocidad
- Selección de protocolo (REST para RouterOS v7 / Socket para v6)
- Normalización automática de la respuesta

Esto significa que su envoltorio se beneficia de la arquitectura de confiabilidad completa del SDK sin necesidad de implementarla usted mismo.
</details>







## Author's Note & Contributions / Nota del Autor y Contribuciones

<details>
<summary><b>English</b></summary>
<br>

> **RosInterface SDK** was born from the necessity to solve real-world challenges in managing MikroTik networks at scale. My goal is to provide developers and ISPs with the most resilient, high-performance, and secure tool possible.
>
> **Join the Mission:** This project is open for everyone. If you want to contribute—whether by optimizing performance, fixing bugs, or proposing new enterprise features—your pull requests are more than welcome. Let's build the industry standard together for the benefit of the entire networking community.
>
> Happy Coding!  
> — **McBlockier**
</details>

<details>
<summary><b>Español</b></summary>
<br>

> **RosInterface SDK** nació de la necesidad de resolver desafíos reales en la gestión de redes MikroTik a gran escala. Mi objetivo es proporcionar a los desarrolladores e ISPs la herramienta más resiliente, de alto rendimiento y segura posible.
>
> **Únete a la Misión:** Este proyecto es de código abierto y para todos. Si deseas contribuir—ya sea optimizando el rendimiento, corrigiendo errores o proponiendo nuevas funciones empresariales—tus *pull requests* son más que bienvenidos. Construyamos juntos el estándar de la industria para el beneficio de toda la comunidad de redes.
>
> ¡Feliz código!  
> — **McBlockier**
</details>

---
