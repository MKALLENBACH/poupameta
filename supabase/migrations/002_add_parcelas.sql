-- Add parcelamento features to contas
ALTER TABLE contas
  ADD COLUMN parcelas_total INTEGER DEFAULT NULL CHECK (parcelas_total > 0),
  ADD COLUMN parcela_atual INTEGER DEFAULT 1 CHECK (parcela_atual IS NULL OR parcela_atual > 0);
