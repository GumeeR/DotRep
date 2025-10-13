import type { VercelRequest, VercelResponse } from '@vercel/node';
import { calculateRepScoreV1 } from '../src/scoring-engine-v1';

interface BlockchainEvent {
    timestamp: Date;
    value?: number;
}

interface WalletData {
    acala: { loanRepaid: BlockchainEvent[]; loanLiquidated: BlockchainEvent[]; };
    hydraDx: { omnipoolLpAdded: BlockchainEvent[]; };
    bifrost: { stakingJoined: BlockchainEvent[]; };
    moonbeam: { governanceVoted: BlockchainEvent[]; };
    polkadotRelay: { identitySet: BlockchainEvent[]; };
    generic: { walletCreationDate: Date; transactionCountLastMonth: number; };
}

const SUBSCAN_NETWORK_MAP: Record<string, string> = {
    polkadot: 'polkadot',
    moonbeam: 'moonbase',
};

// Consulta API de Subscan
async function subscanFetch(network: string, body: object): Promise<any> {
    const SUBSCAN_API = process.env.SUBSCAN_API;
    if (!SUBSCAN_API) {
        throw new Error('Clave de API de Subscan no configurada.');
    }

    const subscanDomain = SUBSCAN_NETWORK_MAP[network];
    if (!subscanDomain) {
        throw new Error(`Red no soportada: ${network}`);
    }

    const response = await fetch(`https://${subscanDomain}.api.subscan.io/api/v2/scan/extrinsics`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': SUBSCAN_API,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Error de Subscan: ${response.statusText}`);
    const responseBody = await response.json();
    if (responseBody.code !== 0) throw new Error(`Error de Subscan: ${responseBody.message}`);
    return responseBody.data;
}

// Obtiene eventos on-chain de la wallet
async function scanViaSubscan(network: string, targetAddress: string): Promise<Partial<WalletData>> {
    const recentHistoryData = await subscanFetch(network, { row: 100, page: 0, address: targetAddress });
    const totalExtrinsics = recentHistoryData?.count || 0;
    const recentExtrinsics = recentHistoryData?.extrinsics || [];
    let walletCreationDate = new Date();

    // Obtiene fecha de creación desde el primer extrinsic
    if (totalExtrinsics > 0) {
        const rowsPerPage = 100;
        const lastPage = Math.floor((totalExtrinsics - 1) / rowsPerPage);
        const oldestHistoryData = await subscanFetch(network, { row: rowsPerPage, page: lastPage, address: targetAddress });
        const oldestExtrinsics = oldestHistoryData?.extrinsics || [];
        if (oldestExtrinsics.length > 0) {
            const firstExtrinsic = oldestExtrinsics[oldestExtrinsics.length - 1];
            walletCreationDate = new Date(firstExtrinsic.block_timestamp * 1000);
        }
    }

    const identitySet: BlockchainEvent[] = [];
    const governanceVoted: BlockchainEvent[] = [];
    let transferCount = 0;
    const stringEvents: string[] = [];

    // Procesa extrinsics y filtra eventos relevantes
    for (const extrinsic of recentExtrinsics) {
        const timestamp = new Date(extrinsic.block_timestamp * 1000);
        if (extrinsic.call_module === 'balances' && extrinsic.call_module_function.startsWith('transfer')) {
            transferCount++;
            stringEvents.push(`Extrínseco 'balances.transfer' encontrado en bloque ${extrinsic.block_num}`);
        }
        if ((extrinsic.call_module === 'convictionVoting' || extrinsic.call_module === 'democracy') && extrinsic.call_module_function === 'vote') {
            governanceVoted.push({ timestamp, value: 1 });
            stringEvents.push(`Voto de gobernanza encontrado en bloque ${extrinsic.block_num}`);
        }
        if (extrinsic.call_module === 'identity' && extrinsic.call_module_function === 'set_identity') {
            identitySet.push({ timestamp, value: 1 });
            stringEvents.push(`Identidad establecida encontrada en bloque ${extrinsic.block_num}`);
        }
    }

    return {
        polkadotRelay: { identitySet },
        moonbeam: { governanceVoted },
        generic: { transactionCountLastMonth: transferCount, walletCreationDate },
        __stringEvents: stringEvents,
    } as any;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const network = req.query.network as string || 'polkadot';
    const targetAddress = req.query.address as string;

    try {
        if (!targetAddress) return res.status(400).json({ error: 'El parámetro "address" es requerido.' });
        if (!SUBSCAN_NETWORK_MAP[network]) return res.status(400).json({ error: `Red no soportada.` });

        const realData = await scanViaSubscan(network, targetAddress);

        let walletData: WalletData = {
            acala: { loanRepaid: [], loanLiquidated: [] },
            hydraDx: { omnipoolLpAdded: [] },
            bifrost: { stakingJoined: [] },
            moonbeam: { governanceVoted: [] },
            polkadotRelay: { identitySet: [] },
            generic: { walletCreationDate: new Date(), transactionCountLastMonth: 0 },
        };

        walletData = {
            ...walletData,
            polkadotRelay: { ...walletData.polkadotRelay, ...realData.polkadotRelay },
            moonbeam: { ...walletData.moonbeam, ...realData.moonbeam },
            generic: { ...walletData.generic, ...realData.generic },
        };

        const repScore = calculateRepScoreV1(walletData);
        const stringEvents = (realData as any).__stringEvents || [];

        res.status(200).json({
            wallet: targetAddress,
            network: network,
            repScore: repScore,
            events: stringEvents,
            scoreFactors: walletData,
        });

    } catch (error) {
        console.error(`[API_ERROR][${network}]`, error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({ error: `Error interno del servidor: ${errorMessage}` });
    }
}