

-- Asegurarnos de que el bucket exista y sea público
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-portraits', 'character-portraits', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Limpiar políticas viejas si existieran
DROP POLICY IF EXISTS "Permitir lectura publica de retratos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida de retratos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizacion de retratos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrado de retratos" ON storage.objects;

-- Crear políticas nuevas (Permitiendo acceso a usuarios anónimos ya que Kingdoom usa auth custom)
CREATE POLICY "Permitir lectura publica de retratos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'character-portraits');

CREATE POLICY "Permitir subida de retratos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'character-portraits');

CREATE POLICY "Permitir actualizacion de retratos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'character-portraits');

CREATE POLICY "Permitir borrado de retratos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'character-portraits');
