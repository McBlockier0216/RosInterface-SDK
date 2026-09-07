import 'dotenv/config'; // Asegura cargar el .env primero
import { MikrotikClient } from "./src";

const client = new MikrotikClient({
    useTLS: true,
    rejectUnauthorized: false,
    timeout: 10
});

async function main() {
    try {
        console.log('🔄 Conectando al router...');
        await client.connect();
        console.log('✅ ¡Conexión exitosa!\n');

        const secretName = 'usuario_prueba_01';

        // ==========================================
        // 1. CREATE
        // ==========================================
        console.log(`➕ 1. Creando el secret '${secretName}'...`);
        await client.command('/ppp/secret').add({
            name: secretName,
            password: 'password_super_seguro_123',
            service: 'pppoe',
            profile: 'default'
        });
        console.log('✅ Secret creado correctamente.\n');

        // ==========================================
        // 2. READ
        // ==========================================
        console.log(`🔍 2. Buscando los datos de '${secretName}'...`);
        const userList = await client.command('/ppp/secret')
            .where('name', secretName)
            .print();

        // FIX: Usamos el método .first() de tu clase MikrotikCollection
        const myUser = userList.first();

        if (!myUser) {
            console.warn('⚠️ No se encontró el usuario recién creado.');
            return;
        }

        console.log('✅ Datos obtenidos:', myUser);
        console.log('');

        // ==========================================
        // 3. UPDATE
        // ==========================================
        const userId = myUser['.id'];

        console.log(`✏️ 3. Actualizando el password y perfil de '${secretName}' (ID: ${userId})...`);
        await client.command('/ppp/secret').set(userId, {
            password: 'nuevo_password_456',
            profile: 'default-encryption',
            comment: 'Usuario actualizado por RosInterface'
        });
        console.log('✅ Secret actualizado correctamente.\n');

        // ==========================================
        // (Opcional) Verificar actualización
        // ==========================================
        const updatedUserList = await client.command('/ppp/secret').where('name', secretName).print();

        // FIX: Usamos de nuevo el método .first()
        const updatedData = updatedUserList.first();

        if (updatedData) {
            console.log('✅ Verificación de cambios:', {
                password: updatedData.password,
                comment: updatedData.comment
            });
            console.log('');
        }

        // ==========================================
        // 4. DELETE
        // ==========================================
        console.log(`🗑️ 4. Eliminando el secret '${secretName}'...`);
        await client.command('/ppp/secret').remove(userId);
        console.log('✅ Secret eliminado correctamente.\n');

    } catch (error) {
        console.error('❌ Ocurrió un error en la ejecución:');
        console.error(error);
    } finally {
        if (client.isConnected) {
            client.close();
            console.log('🔌 Conexión cerrada.');
        }
    }
}

main().catch(console.error);