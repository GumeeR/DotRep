// DotRep Acala Connector v0.1
// Author: Synapse, Lead Technical Architect
// Date: 28 September 2025
// Aligns with: README.md v0.2.0, Fase 1, Hito 1

import { ApiPromise, WsProvider } from '@polkadot/api';
import type { EventRecord } from '@polkadot/types/interfaces';

// Endpoint RPC público para la testnet Mandala de Acala.
const ACALA_MANDALA_RPC = 'wss://mandala.aca-staging.network/ws';

/**
 * Función principal que inicializa el conector y se suscribe a los eventos.
 */
async function main() {
    console.log(`[INFO] Conectando al nodo RPC de Acala: ${ACALA_MANDALA_RPC}...`);

    const wsProvider = new WsProvider(ACALA_MANDALA_RPC);
    const api = await ApiPromise.create({ provider: wsProvider });

    await api.isReady;
    console.log(`[SUCCESS] Conexión establecida con la parachain de Acala (Mandala).`);
    console.log(`[INFO] Escuchando nuevos bloques para encontrar eventos 'loans.Repaid'...
`);

    let blockCount = 0;
    const blockLimit = 5;

    // 1. Suscripción a las cabeceras de nuevos bloques.
    const unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header) => {
        try {
            const blockHash = header.hash;
            console.log(`[BLOCK] Nuevo bloque procesado: #${header.number} (${blockHash.toHex()})`);

            // 2. Obtener todos los registros de eventos para ese bloque.
            const allRecords = await api.query.system.events.at(blockHash);

            // 3. Iterar sobre cada evento del bloque, casteando el resultado a un array de EventRecord.
            (allRecords as unknown as EventRecord[]).forEach((record) => {
                const { event, phase } = record;

                // 4. Filtrar: nos interesa solo el evento 'loans.Repaid'.
                if (event.section === 'loans' && event.method === 'Repaid') {
                    
                    // 5. Extraer la información relevante del evento.
                    // La estructura de datos de 'loans.Repaid' es [accountId, amount].
                    const [accountId] = event.data;

                    // Para obtener el hash de la transacción, necesitamos encontrar el extrinsic
                    // al que está asociado este evento.
                    let txHash = 'N/A';
                    if (phase.isApplyExtrinsic) {
                        const extrinsicIndex = phase.asApplyExtrinsic.toNumber();
                        // Obtenemos el bloque completo para acceder a los extrinsics
                        api.rpc.chain.getBlock(blockHash).then(signedBlock => {
                            const extrinsic = signedBlock.block.extrinsics[extrinsicIndex];
                            if (extrinsic) {
                                txHash = extrinsic.hash.toHex();
                            }

                            // 6. Imprimir la información en la consola (paso final por ahora).
                            console.log(
`-------------------------------------------------
[EVENT FOUND] loans.Repaid
  -> Billetera: ${accountId.toString()}
  -> Hash de Tx: ${txHash}
-------------------------------------------------
`
                            );
                        });
                    }
                }
            });
        } catch (error) {
            console.error(`[ERROR] No se pudo procesar el bloque #${header.number}:`, error);
        }

        // Lógica de finalización después de procesar un número de bloques
        blockCount++;
        if (blockCount >= blockLimit) {
            console.log(`\n[INFO] Límite de ${blockLimit} bloques alcanzado. Desconectando...`);
            unsubscribe();
            process.exit(0);
        }
    });
}

main().catch(error => {
    console.error('[FATAL] El conector ha fallado:', error);
    process.exit(1);
});