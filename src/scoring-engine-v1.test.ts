import { calculateRepScoreV1 } from './scoring-engine-v1';

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

// Usuario ideal: historial positivo y activo
const diegoData: WalletData = {
    acala: {
        loanRepaid: [
            { timestamp: new Date(new Date().setMonth(new Date().getMonth() - 2)) },
            { timestamp: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
            { timestamp: new Date(new Date().setMonth(new Date().getMonth() - 11)) },
        ],
        loanLiquidated: [],
    },
    hydraDx: {
        omnipoolLpAdded: [{ timestamp: new Date(new Date().setMonth(new Date().getMonth() - 1)) }],
    },
    bifrost: {
        stakingJoined: [{ timestamp: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }],
    },
    moonbeam: {
        governanceVoted: [{ timestamp: new Date(new Date().setMonth(new Date().getMonth() - 3)) }],
    },
    polkadotRelay: {
        identitySet: [{ timestamp: new Date(new Date().setFullYear(new Date().getFullYear() - 2)) }],
    },
    generic: {
        walletCreationDate: new Date(new Date().setFullYear(new Date().getFullYear() - 3)),
        transactionCountLastMonth: 50,
    },
};

// Usuario de alto riesgo: liquidación reciente
const riskyUserData: WalletData = {
    acala: {
        loanRepaid: [
            { timestamp: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
        ],
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
        walletCreationDate: new Date(new Date().setMonth(new Date().getMonth() - 7)),
        transactionCountLastMonth: 5,
    },
};

console.log("--- Running Scoring Engine v1 Tests ---");

const diegoScore = calculateRepScoreV1(diegoData);
console.log(`RepScore for Diego (Ideal User): ${diegoScore}`);

const riskyUserScore = calculateRepScoreV1(riskyUserData);
console.log(`RepScore for High-Risk User: ${riskyUserScore}`);

if (diegoScore > riskyUserScore) {
    console.log("\n[SUCCESS] The algorithm correctly scored the ideal user higher than the high-risk user.");
} else {
    console.log("\n[FAILURE] The algorithm failed to differentiate between user profiles correctly.");
}

console.log("--- Test Run Complete ---");

