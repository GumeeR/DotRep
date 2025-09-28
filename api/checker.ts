
// DotRep - API Endpoint para el Event Checker
// Author: Synapse
// Adaptado para funcionar como una API Serverless en Vercel.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { EventRecord } from '@polkadot/types/interfaces';

// --- CONFIGURACIÓN ---
const POLKADOT_RPC_ENDPOINT = 'wss://rpc.polkadot.io';
const BLOCKS_TO_SCAN = 100;

// --- API HANDLER ---

// La función se exporta por defecto y maneja las peticiones entrantes.
export default async function handler(req: VercelRequest, res: VercelResponse) {
    let api: ApiPromise | undefined;

    try {
        // 1. Obtener la dirección de la billetera desde los parámetros de la URL.
        // La URL será como: /api/checker?address=15Gf6...
        const targetAddress = req.query.address as string;

        if (!targetAddress) {
            return res.status(400).json({ error: 'El parámetro "address" es requerido.' });
        }

        // --- Lógica de conexión y escaneo (adaptada del script original) ---
        const wsProvider = new WsProvider(POLKADOT_RPC_ENDPOINT);
        api = await ApiPromise.create({ provider: wsProvider });
        await api.isReady;

        const latestHeader = await api.rpc.chain.getHeader();
        const latestBlockNumber = latestHeader.number.toNumber();
        const startBlock = Math.max(0, latestBlockNumber - BLOCKS_TO_SCAN);

        const foundEvents: string[] = []; // Array para guardar los resultados

        for (let i = latestBlockNumber; i > startBlock; i--) {
            const blockHash = await api.rpc.chain.getBlockHash(i);
            const allRecords = await api.query.system.events.at(blockHash);

            (allRecords as unknown as EventRecord[]).forEach(record => {
                const { event } = record;
                if (event.section === 'balances' && event.method === 'Transfer') {
                    const [from, to] = event.data;
                    if (from.toString() === targetAddress || to.toString() === targetAddress) {
                        // En lugar de imprimir en consola, guardamos el resultado.
                        foundEvents.push(`Evento 'balances.Transfer' encontrado en el bloque #${i}`);
                    }
                }
            });
        }

        // 2. Devolver los resultados como una respuesta JSON.
        res.status(200).json({
            wallet: targetAddress,
            blocksScanned: BLOCKS_TO_SCAN,
            events: foundEvents,
            message: foundEvents.length > 0 ? `Se encontraron ${foundEvents.length} eventos.` : 'No se encontraron eventos de transferencia en los bloques recientes.'
        });

    } catch (error) {
        console.error('[API_ERROR]', error);
        res.status(500).json({ error: 'Ha ocurrido un error en el servidor al procesar la petición.' });
    } finally {
        // 3. Asegurar la desconexión de la API.
        if (api) {
            await api.disconnect();
        }
    }
}
