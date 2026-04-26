-- Migration: 0011_discovery_details.sql
ALTER TABLE ingested_offers ADD COLUMN signup_requirements TEXT;
ALTER TABLE ingested_offers ADD COLUMN reward_details TEXT;
