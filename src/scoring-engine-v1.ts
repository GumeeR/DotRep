
// DotRep Scoring Engine v1
// Author: Synapse, Lead Technical Architect
// Date: 28 September 2025
// Aligns with: README.md v0.2.0, Sections 4.2, 4.3

// --- DATA STRUCTURES ---
// As per section 4.2, we need to handle events from multiple parachains.
// Each event includes a timestamp to enable time decay calculations (Section 4.3).

interface BlockchainEvent {
    timestamp: Date;
    value?: number; // Optional value, e.g., amount for a loan. Default to 1 if not present.
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

// --- SCORING CONSTANTS ---

/**
 * Weights for different on-chain actions, derived from the "Impact on Reputación"
 * table in README.md Section 4.2.
 * The values are chosen to reflect the qualitative impact levels:
 * +++ (Muy Positivo): 100
 * ++  (Positivo): 50
 * +   (Positivo): 25
 * --- (Muy Negativo): -300
 */
const ACTION_WEIGHTS = {
    // Acala
    LOAN_REPAID: 100,       // +++
    LOAN_LIQUIDATED: -300,  // ---
    // HydraDX
    OMNIPOOL_LP_ADDED: 50,  // ++
    // Bifrost
    STAKING_JOINED: 50,     // ++
    // Moonbeam
    GOVERNANCE_VOTED: 25,   // +
    // Polkadot Relay
    IDENTITY_SET: 25,       // +
    // Generic
    WALLET_AGE_YEAR: 50,    // ++ (per year)
    TX_COUNT_LAST_MONTH: 1, // + (per transaction)
};

// The target score range, similar to traditional credit scores.
const MIN_SCORE = 300;
const MAX_SCORE = 850;

// --- HELPER FUNCTIONS ---

/**
 * Calculates a time decay factor based on the age of an event.
 * As per Section 4.3, recent actions (last 6 months) have higher weight.
 * This function implements a linear decay over 2 years (730 days).
 * - Actions < 6 months old have a factor of 1.0.
 * - Actions > 2 years old have a factor of 0.
 * - Actions between 6 months and 2 years have a linearly decreasing factor.
 * @param eventDate The date of the on-chain event.
 * @returns A decay factor between 0 and 1.
 */
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

    // Linear decay between 6 months and 2 years
    return 1 - ((daysOld - sixMonths) / (twoYears - sixMonths));
}

/**
 * Normalizes a raw score to the target range of 300-850.
 * This requires an assumption for a "maximum raw score" to scale against.
 * Based on our weights, a highly active, long-term user might achieve a raw score
 * around 1500. We will use this as our initial ceiling. This is a key parameter
 * that will need refinement during testing (Hito 3).
 * @param rawScore The calculated raw score from all actions.
 * @returns The normalized score, clamped between 300 and 850.
 */
function normalizeScore(rawScore: number): number {
    const assumedMaxRawScore = 1500;
    const normalized = (rawScore / assumedMaxRawScore) * (MAX_SCORE - MIN_SCORE);
    const finalScore = MIN_SCORE + normalized;

    // Clamp the score to the defined min/max range
    return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(finalScore)));
}


// --- CORE SCORING FUNCTION ---

/**
 * Calculates the RepScore V1 based on provided wallet data.
 * Implements the conceptual formula from Section 4.3:
 * RepScore = Σ (Weight_action * Value_action * TimeDecay_factor)
 *
 * @param walletData An object containing the user's on-chain activity.
 * @returns The final, normalized RepScore as an integer.
 */
export function calculateRepScoreV1(walletData: WalletData): number {
    let rawScore = 0;

    // --- Category: Longevity and Actividad Base (Section 4.3) ---
    const walletAgeYears = (new Date().getTime() - walletData.generic.walletCreationDate.getTime()) / (1000 * 3600 * 24 * 365);
    rawScore += walletAgeYears * ACTION_WEIGHTS.WALLET_AGE_YEAR;
    rawScore += walletData.generic.transactionCountLastMonth * ACTION_WEIGHTS.TX_COUNT_LAST_MONTH;

    // --- Category: Gestión de Deuda (Section 4.3) ---
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

    // --- Category: Participación en el Ecosistema (Section 4.3) ---
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

    // --- Final Normalization ---
    return normalizeScore(rawScore);
}
