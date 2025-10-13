interface BlockchainEvent {
    timestamp: Date;
    value?: number; // Valor opcional, por defecto 1
}

interface WalletData {
    acala: {
        loanRepaid: BlockchainEvent[];
        loanLiquidated: BlockchainEvent[];
    };
    hydraDx: {
        omnipoolLpAdded: BlockchainEvent[];
    };
    bifrost: {
        stakingJoined: BlockchainEvent[];
    };
    moonbeam: {
        governanceVoted: BlockchainEvent[];
    };
    polkadotRelay: {
        identitySet: BlockchainEvent[];
    };
    generic: {
        walletCreationDate: Date;
        transactionCountLastMonth: number;
    };
}

// Pesos de acciones on-chain
const ACTION_WEIGHTS = {
    LOAN_REPAID: 100,
    LOAN_LIQUIDATED: -300,
    OMNIPOOL_LP_ADDED: 50,
    STAKING_JOINED: 50,
    GOVERNANCE_VOTED: 25,
    IDENTITY_SET: 25,
    WALLET_AGE_YEAR: 50,
    TX_COUNT_LAST_MONTH: 1,
};

const MIN_SCORE = 300;
const MAX_SCORE = 850;

// Calcula factor de decaimiento temporal: <6 meses = 1.0, >2 años = 0.0, lineal entre ambos
function calculateTimeDecayFactor(eventDate: Date): number {
    const now = new Date();
    const daysOld = (now.getTime() - eventDate.getTime()) / (1000 * 3600 * 24);

    const sixMonths = 180;
    const twoYears = 730;

    if (daysOld <= sixMonths) {
        return 1.0;
    }
    if (daysOld > twoYears) {
        return 0.0;
    }

    return 1 - ((daysOld - sixMonths) / (twoYears - sixMonths));
}

// Normaliza score bruto al rango 300-850
function normalizeScore(rawScore: number): number {
    const assumedMaxRawScore = 1500;
    const normalized = (rawScore / assumedMaxRawScore) * (MAX_SCORE - MIN_SCORE);
    const finalScore = MIN_SCORE + normalized;

    return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(finalScore)));
}

// Calcula RepScore V1: Σ (Peso * Valor * Decaimiento)
export function calculateRepScoreV1(walletData: WalletData): number {
    let rawScore = 0;

    // Longevidad y actividad
    const walletAgeYears = (new Date().getTime() - walletData.generic.walletCreationDate.getTime()) / (1000 * 3600 * 24 * 365);
    rawScore += walletAgeYears * ACTION_WEIGHTS.WALLET_AGE_YEAR;
    rawScore += walletData.generic.transactionCountLastMonth * ACTION_WEIGHTS.TX_COUNT_LAST_MONTH;

    // Gestión de deuda
    walletData.acala.loanRepaid.forEach(event => {
        const value = event.value || 1;
        const decay = calculateTimeDecayFactor(event.timestamp);
        rawScore += ACTION_WEIGHTS.LOAN_REPAID * value * decay;
    });
    walletData.acala.loanLiquidated.forEach(event => {
        const value = event.value || 1;
        const decay = calculateTimeDecayFactor(event.timestamp);
        rawScore += ACTION_WEIGHTS.LOAN_LIQUIDATED * value * decay;
    });

    // Participación en ecosistema
    walletData.hydraDx.omnipoolLpAdded.forEach(event => {
        const value = event.value || 1;
        const decay = calculateTimeDecayFactor(event.timestamp);
        rawScore += ACTION_WEIGHTS.OMNIPOOL_LP_ADDED * value * decay;
    });
    walletData.bifrost.stakingJoined.forEach(event => {
        const value = event.value || 1;
        const decay = calculateTimeDecayFactor(event.timestamp);
        rawScore += ACTION_WEIGHTS.STAKING_JOINED * value * decay;
    });
    walletData.moonbeam.governanceVoted.forEach(event => {
        const value = event.value || 1;
        const decay = calculateTimeDecayFactor(event.timestamp);
        rawScore += ACTION_WEIGHTS.GOVERNANCE_VOTED * value * decay;
    });
    walletData.polkadotRelay.identitySet.forEach(event => {
        const value = event.value || 1;
        const decay = calculateTimeDecayFactor(event.timestamp);
        rawScore += ACTION_WEIGHTS.IDENTITY_SET * value * decay;
    });

    return normalizeScore(rawScore);
}