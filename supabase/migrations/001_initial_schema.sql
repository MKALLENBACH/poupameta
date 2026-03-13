-- ───────────────────────────────────────────────
-- PoupaMeta Initial Schema
-- Run this in the Supabase SQL Editor
-- ───────────────────────────────────────────────

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────
-- Enum types
-- ───────────────────────────────────────────────
CREATE TYPE frequencia_tipo  AS ENUM ('diaria', 'semanal');
CREATE TYPE recorrencia_tipo AS ENUM ('nenhuma', 'diaria', 'semanal', 'mensal');
CREATE TYPE conta_status     AS ENUM ('ativa', 'concluida', 'pausada');
CREATE TYPE caixinha_status  AS ENUM ('ativa', 'concluida');
CREATE TYPE registro_status  AS ENUM ('saved', 'partial', 'skipped');

-- ───────────────────────────────────────────────
-- contas
-- ───────────────────────────────────────────────
CREATE TABLE contas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                TEXT NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 100),
  valor               NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  data_vencimento     DATE NOT NULL,
  frequencia_economia frequencia_tipo NOT NULL DEFAULT 'diaria',
  recorrencia_tipo    recorrencia_tipo NOT NULL DEFAULT 'nenhuma',
  prioridade          BOOLEAN NOT NULL DEFAULT FALSE,
  status              conta_status NOT NULL DEFAULT 'ativa',
  icone               TEXT DEFAULT '💰',
  categoria           TEXT,
  notas               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- caixinhas
-- ───────────────────────────────────────────────
CREATE TABLE caixinhas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id          UUID NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
  meta_valor        NUMERIC(12,2) NOT NULL CHECK (meta_valor > 0),
  valor_guardado    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (valor_guardado >= 0),
  valor_por_periodo NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (valor_por_periodo >= 0),
  frequencia        frequencia_tipo NOT NULL,
  data_inicio       DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento   DATE NOT NULL,
  status            caixinha_status NOT NULL DEFAULT 'ativa',
  ultimo_calculo    TIMESTAMPTZ,
  CONSTRAINT data_valida CHECK (data_vencimento >= data_inicio)
);

-- ───────────────────────────────────────────────
-- registros_economia
-- ───────────────────────────────────────────────
CREATE TABLE registros_economia (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caixinha_id UUID NOT NULL REFERENCES caixinhas(id) ON DELETE CASCADE,
  valor       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  data        DATE NOT NULL DEFAULT CURRENT_DATE,
  status      registro_status NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (caixinha_id, data)
);

-- ───────────────────────────────────────────────
-- Indexes
-- ───────────────────────────────────────────────
CREATE INDEX idx_contas_user_prioridade
  ON contas(user_id, prioridade DESC, data_vencimento ASC)
  WHERE status = 'ativa';

CREATE INDEX idx_caixinhas_conta ON caixinhas(conta_id);

CREATE INDEX idx_registros_caixinha_data
  ON registros_economia(caixinha_id, data DESC);

-- ───────────────────────────────────────────────
-- Trigger: auto-update updated_at
-- ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contas_updated_at
  BEFORE UPDATE ON contas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ───────────────────────────────────────────────
-- Row Level Security (RLS)
-- ───────────────────────────────────────────────

-- contas
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contas: leitura própria"
  ON contas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "contas: inserção própria"
  ON contas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contas: atualização própria"
  ON contas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contas: exclusão própria"
  ON contas FOR DELETE
  USING (auth.uid() = user_id);

-- caixinhas
ALTER TABLE caixinhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "caixinhas: acesso via conta"
  ON caixinhas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contas
      WHERE contas.id = caixinhas.conta_id
        AND contas.user_id = auth.uid()
    )
  );

-- registros_economia
ALTER TABLE registros_economia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registros: acesso via caixinha"
  ON registros_economia FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM caixinhas c
      JOIN contas co ON co.id = c.conta_id
      WHERE c.id = registros_economia.caixinha_id
        AND co.user_id = auth.uid()
    )
  );
