// DotRep - Simple Event Checker (v2 - Corrected)
// Author: Synapse
// Date: 28 September 2025
// Objetivo: Script simple para encontrar eventos `balances.Transfer` de una billetera específica en Polkadot.

import { ApiPromise, WsProvider } from '@polkadot/api';
import type { EventRecord } from '@polkadot/types/interfaces';

// --- CONFIGURACIÓN ---
const POLKADOT_RPC_ENDPOINT = 'wss://rpc.polkadot.io';
const BLOCKS_TO_SCAN = 100; // Reducido para una ejecución más rápida.

// --- FUNCIÓN PRINCIPAL ---

async function main() {
    // Declaramos la variable `api` aquí para que sea accesible en el bloque `finally`.
    let api: ApiPromise | undefined;

    try {
        // 1. Obtener la dirección de la billetera desde los argumentos.
        const targetAddress = process.argv[2];
        if (!targetAddress) {
            console.error('[ERROR] Por favor, proporciona una dirección de billetera de Polkadot como argumento.');
            console.error('Ejemplo: ts-node src/simple-event-checker.ts 15Gf6...\n');
            process.exit(1);
        }

        console.log(`[INFO] Iniciando chequeo para la billetera: ${targetAddress}`);
        console.log(`[INFO] Escaneando los últimos ${BLOCKS_TO_SCAN} bloques en la red de Polkadot...\n`);

        const wsProvider = new WsProvider(POLKADOT_RPC_ENDPOINT);
        api = await ApiPromise.create({ provider: wsProvider });
        await api.isReady;

        // 2. Obtener el número del bloque más reciente.
        const latestHeader = await api.rpc.chain.getHeader();
        const latestBlockNumber = latestHeader.number.toNumber();
        const startBlock = Math.max(0, latestBlockNumber - BLOCKS_TO_SCAN);

        let eventsFound = 0;

        // 3. Iterar hacia atrás desde el bloque más reciente.
        for (let i = latestBlockNumber; i > startBlock; i--) {
            // Imprime un mensaje de progreso cada 25 bloques para dar feedback.
            if ((latestBlockNumber - i) % 25 === 0 && (latestBlockNumber - i) > 0) {
                console.log(`[SCAN]... bloques procesados: ${latestBlockNumber - i} de ${BLOCKS_TO_SCAN}`);
            }

            const blockHash = await api.rpc.chain.getBlockHash(i);
            const allRecords = await api.query.system.events.at(blockHash);

            // 4. Buscar el evento específico para la billetera objetivo.
            (allRecords as unknown as EventRecord[]).forEach(record => {
                const { event } = record;
                if (event.section === 'balances' && event.method === 'Transfer') {
                    const [from, to] = event.data;
                    if (from.toString() === targetAddress || to.toString() === targetAddress) {
                        console.log(`\n[FOUND] Evento 'balances.Transfer' encontrado en el bloque #${i}`);
                        eventsFound++;
                    }
                }
            });
        }

        // 5. Mostrar el resultado final.
        console.log(`\n\n[DONE] Escaneo completo.`);
        if (eventsFound > 0) {
            console.log(`[RESULT] Se encontraron ${eventsFound} eventos 'balances.Transfer' para la billetera especificada.`);
        } else {
            console.log(`[RESULT] No se encontraron eventos 'balances.Transfer' en los últimos ${BLOCKS_TO_SCAN} bloques.`);
        }

    } catch (error) {
        console.error('\n[FATAL] Ha ocurrido un error inesperado:', error);
        process.exit(1);
    } finally {
        // 6. Desconectar de la API en el bloque `finally` para asegurar que siempre se ejecute.
        if (api) {
            // console.log('[INFO] Desconectando de la API...');
            await api.disconnect();
        }
    }
}

main();