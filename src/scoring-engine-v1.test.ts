

// DotRep Scoring Engine v1 - Test File
// Author: Synapse, Lead Technical Architect
// Date: 28 September 2025
// Purpose: Verify the implementation of calculateRepScoreV1 (Hito 3, Fase 1).

import { calculateRepScoreV1 } from './scoring-engine-v1';

// Re-declaring interfaces for clarity in this standalone test file.
// In a full project, these would be imported from a shared types file.
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

// --- Test Persona 1: Diego, the Ideal DeFi User (from README Section 2.1) ---
// Simulates a user with a strong, positive on-chain history.
const diegoData: WalletData = {
    acala: {
        // 3 loans repaid, all within the last year.
        loanRepaid: [
            { timestamp: new Date(new Date().setMonth(new Date().getMonth() - 2)) },
            { timestamp: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
            { timestamp: new Date(new Date().setMonth(new Date().getMonth() - 11)) },
        ],
        loanLiquidated: [],
    },
    hydraDx: {
        // Provided liquidity recently.
        omnipoolLpAdded: [{ timestamp: new Date(new Date().setMonth(new Date().getMonth() - 1)) }],
    },
    bifrost: {
        // Staking for over a year.
        stakingJoined: [{ timestamp: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }],
    },
    moonbeam: {
        governanceVoted: [{ timestamp: new Date(new Date().setMonth(new Date().getMonth() - 3)) }],
    },
    polkadotRelay: {
        identitySet: [{ timestamp: new Date(new Date().setFullYear(new Date().getFullYear() - 2)) }],
    },
    generic: {
        // Wallet is 3 years old.
        walletCreationDate: new Date(new Date().setFullYear(new Date().getFullYear() - 3)),
        transactionCountLastMonth: 50, // Active user
    },
};

// --- Test Persona 2: A High-Risk User ---
// Simulates a user with a recent negative event.
const riskyUserData: WalletData = {
    acala: {
        loanRepaid: [
            { timestamp: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
        ],
        // A very recent liquidation event.
        loanLiquidated: [{ timestamp: new Date(new Date().setMonth(new Date().getMonth() - 1)) }],
    },
    hydraDx: {
        omnipoolLpAdded: [],
    },
    bifrost: {
        stakingJoined: [],
    },
    moonbeam: {
        governanceVoted: [],
    },
    polkadotRelay: {
        identitySet: [],
    },
    generic: {
        // Wallet is newer.
        walletCreationDate: new Date(new Date().setMonth(new Date().getMonth() - 7)),
        transactionCountLastMonth: 5,
    },
};

// --- EXECUTION ---

console.log("--- Running Scoring Engine v1 Tests ---");

const diegoScore = calculateRepScoreV1(diegoData);
console.log(`RepScore for Diego (Ideal User): ${diegoScore}`);

const riskyUserScore = calculateRepScoreV1(riskyUserData);
console.log(`RepScore for High-Risk User: ${riskyUserScore}`);

// Basic validation check
if (diegoScore > riskyUserScore) {
    console.log("\n[SUCCESS] The algorithm correctly scored the ideal user higher than the high-risk user.");
} else {
    console.log("\n[FAILURE] The algorithm failed to differentiate between user profiles correctly.");
}

console.log("--- Test Run Complete ---");

