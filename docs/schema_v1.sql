-- DotRep - Esquema de Base de Datos v1 (Conceptual)
-- Author: Synapse, Lead Technical Architect
-- Este esquema está archivado y representa la visión a largo plazo (ver PLAN.md).

-- ENUM para las parachains que soportamos en la visión a largo plazo.
CREATE TYPE parachain_name AS ENUM (
    'ACALA',
    'HYDRADX',
    'BIFROST',
    'MOONBEAM',
    'POLKADOT_RELAY'
);

-- ENUM para los tipos de eventos que vamos a rastrear.
CREATE TYPE event_category AS ENUM (
    'LOAN_REPAID',
    'LOAN_LIQUIDATED',
    'OMNIPOOL_LP_ADDED',
    'STAKING_JOINED',
    'GOVERNANCE_VOTED',
    'IDENTITY_SET'
);

-- Tabla para nuestro registro maestro de billeteras únicas.
CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    address VARCHAR(48) NOT NULL UNIQUE,
    first_seen_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallets_address ON wallets(address);

-- Tabla principal para almacenar cada acción on-chain relevante.
CREATE TABLE on_chain_events (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    parachain parachain_name NOT NULL,
    event_type event_category NOT NULL,
    value NUMERIC(40, 18),
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    event_timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_events_wallet_id ON on_chain_events(wallet_id);
CREATE INDEX idx_events_event_type ON on_chain_events(event_type);
CREATE INDEX idx_events_timestamp ON on_chain_events(event_timestamp);
