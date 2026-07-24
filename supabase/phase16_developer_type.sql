-- Phase 16: Developer Account Types
-- Adds fields to developer_profiles to support "Individual" vs "Company" accounts.

ALTER TABLE public.developer_profiles
ADD COLUMN IF NOT EXISTS developer_type text NOT NULL DEFAULT 'company' CHECK (developer_type IN ('company', 'individual')),
ADD COLUMN IF NOT EXISTS nickname text;

-- (Optional) If we want to allow public select, but this is a private settings table.
-- Existing RLS for developer_profiles should be sufficient.
