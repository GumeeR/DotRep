// DotRep - API Endpoint Cross-Chain v2
// Author: Synapse
// Soporta múltiples cadenas (Polkadot, Moonbeam) a través de un parámetro en la URL.

import '@moonbeam-network/api-augment';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { EventRecord } from '@polkadot/types/interfaces';

// --- CONFIGURACIÓN DE CADENAS ---
type NetworkConfig = {
    rpc: string;
};

const NETWORKS: Record<string, NetworkConfig> = {
    polkadot: {
        rpc: 'wss://rpc.polkadot.io',
    },
    moonbeam: { // Changed from acala
        rpc: 'wss://wss.api.moonbase.moonbeam.network', // New RPC for Moonbeam
    }
};

const BLOCKS_TO_SCAN = 100;

// --- LÓGICA DE ESCANEO ESPECÍFICA POR CADENA ---

/**
 * Escanea la red de Polkadot en busca de eventos 'balances.Transfer'.
 */
async function scanPolkadot(api: ApiPromise, targetAddress: string): Promise<string[]> {
    const latestHeader = await api.rpc.chain.getHeader();
    const latestBlockNumber = latestHeader.number.toNumber();
    const startBlock = Math.max(0, latestBlockNumber - BLOCKS_TO_SCAN);
    const foundEvents: string[] = [];

    for (let i = latestBlockNumber; i > startBlock; i--) {
        const blockHash = await api.rpc.chain.getBlockHash(i);
        const allRecords = await api.query.system.events.at(blockHash);

        (allRecords as unknown as EventRecord[]).forEach(record => {
            const { event } = record;
            if (event.section === 'balances' && event.method === 'Transfer') {
                const [from, to] = event.data;
                if (from.toString() === targetAddress || to.toString() === targetAddress) {
                    foundEvents.push(`Evento 'balances.Transfer' encontrado en el bloque #${i}`);
                }
            }
        });
    }
    return foundEvents;
}

/**
 * Escanea la red de Moonbeam (Moonbase Alpha) en busca de eventos 'balances.Transfer'.
 */
async function scanMoonbeam(api: ApiPromise, targetAddress: string): Promise<string[]> {
    const latestHeader = await api.rpc.chain.getHeader();
    const latestBlockNumber = latestHeader.number.toNumber();
    const startBlock = Math.max(0, latestBlockNumber - BLOCKS_TO_SCAN);
    const foundEvents: string[] = [];

    for (let i = latestBlockNumber; i > startBlock; i--) {
        const blockHash = await api.rpc.chain.getBlockHash(i);
        const allRecords = await api.query.system.events.at(blockHash);

        (allRecords as unknown as EventRecord[]).forEach(record => {
            const { event } = record;
            if (event.section === 'balances' && event.method === 'Transfer') {
                const [from, to] = event.data;
                if (from.toString() === targetAddress || to.toString() === targetAddress) {
                    foundEvents.push(`Evento 'balances.Transfer' encontrado en el bloque #${i}`);
                }
            }
        });
    }
    return foundEvents;
}

// --- API HANDLER PRINCIPAL ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
    let api: ApiPromise | undefined;
    const network = req.query.network as string || 'polkadot'; // Polkadot por defecto
    const targetAddress = req.query.address as string;

    try {
        if (!targetAddress) {
            return res.status(400).json({ error: 'El parámetro "address" es requerido.' });
        }

        const selectedNetwork = NETWORKS[network];
        if (!selectedNetwork) {
            return res.status(400).json({ error: `Red no soportada. Redes disponibles: ${Object.keys(NETWORKS).join(', ')}` });
        }

        const wsProvider = new WsProvider(selectedNetwork.rpc);
        api = await ApiPromise.create({ provider: wsProvider });
        await api.isReady;

        let foundEvents: string[] = [];
        // Selecciona la función de escaneo correcta según la red
        if (network === 'moonbeam') { // Changed from acala
            foundEvents = await scanMoonbeam(api, targetAddress);
        } else {
            foundEvents = await scanPolkadot(api, targetAddress);
        }

        res.status(200).json({
            network: network,
            wallet: targetAddress,
            blocksScanned: BLOCKS_TO_SCAN,
            events: foundEvents,
            message: foundEvents.length > 0 ? `Se encontraron ${foundEvents.length} eventos.` : 'No se encontraron eventos relevantes en los bloques recientes.'
        });

    } catch (error) {
        console.error(`[API_ERROR][${network}]`, error);
        res.status(500).json({ error: 'Ha ocurrido un error en el servidor al procesar la petición.' });
    } finally {
        if (api) {
            await api.disconnect();
        }
    }
}