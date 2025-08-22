-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  name text NOT NULL,
  type USER-DEFINED NOT NULL,
  balance numeric DEFAULT 0.00,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id)
);
CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  category_id uuid NOT NULL,
  month_year text NOT NULL,
  allocated_amount numeric NOT NULL DEFAULT 0,
  spent_amount numeric NOT NULL DEFAULT 0,
  available_amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT budgets_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  name text NOT NULL,
  type USER-DEFINED NOT NULL,
  color text DEFAULT '#6366f1'::text,
  priority_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  parent_id uuid,
  budget_amount numeric DEFAULT 0,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id),
  CONSTRAINT categories_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id)
);
CREATE TABLE public.export_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  family_id uuid NOT NULL,
  ip text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT export_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.export_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  requested_at timestamp with time zone DEFAULT now(),
  period_type text,
  transaction_count integer,
  CONSTRAINT export_requests_pkey PRIMARY KEY (id),
  CONSTRAINT export_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.families (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  settings jsonb DEFAULT '{"currency": "USD", "timezone": "UTC", "date_format": "MM/DD/YYYY", "start_of_week": 0}'::jsonb,
  CONSTRAINT families_pkey PRIMARY KEY (id)
);
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  target_amount numeric NOT NULL,
  target_date timestamp with time zone,
  current_amount numeric NOT NULL DEFAULT 0.00,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  category_id uuid,
  CONSTRAINT goals_pkey PRIMARY KEY (id),
  CONSTRAINT goals_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id),
  CONSTRAINT goals_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.session (
  id text NOT NULL,
  user_id text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL,
  account_id uuid NOT NULL,
  category_id uuid,
  user_id uuid,
  amount numeric NOT NULL,
  transaction_date timestamp with time zone NOT NULL,
  description text NOT NULL,
  memo text,
  is_cleared boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT transactions_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  family_id uuid,
  email text NOT NULL,
  role USER-DEFINED DEFAULT 'member'::user_role,
  display_name text,
  created_at timestamp with time zone DEFAULT now(),
  last_seen timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id)
);