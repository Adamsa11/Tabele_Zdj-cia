/**
 * Gotowy skrypt SQL do zainicjowania bazy danych Supabase dla użytkownika.
 * Zawiera:
 * 1. Tabelę 'produkty' z obsługą zdjęć (kolumna zdjecie_url)
 * 2. Polityki Row Level Security (RLS) dla operacji SELECT, INSERT, UPDATE, DELETE
 * 3. Publiczny bucket Storage 'images'
 * 4. Polityki Storage pozwalające na upload i odczyt zdjęć
 * 5. Przykładowe dane startowe ze zdjęciami
 */

export const STARTER_SETUP_SQL = `-- =========================================================
-- SUPABASE SZYBKI START: TABELE + STORAGE + UPRAWNIENIA (RLS)
-- Wklej cały ten kod w: Supabase Dashboard -> SQL Editor -> Run
-- =========================================================

-- 1. UTWORZENIE TABELI PRODUKTÓW ZE ZDJĘCIAMI
CREATE TABLE IF NOT EXISTS public.produkty (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nazwa text NOT NULL,
  cena numeric(10,2) NOT NULL DEFAULT 0.00,
  kategoria text DEFAULT 'Ogólne',
  zdjecie_url text,
  dostepny boolean DEFAULT true,
  opis text,
  created_at timestamptz DEFAULT now()
);

-- 2. KONFIGURACJA ROW LEVEL SECURITY (RLS) DLA PEŁNEGO CRUD
ALTER TABLE public.produkty ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publiczny odczyt produktow" ON public.produkty;
CREATE POLICY "Publiczny odczyt produktow" 
  ON public.produkty FOR SELECT 
  TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Publiczne dodawanie produktow" ON public.produkty;
CREATE POLICY "Publiczne dodawanie produktow" 
  ON public.produkty FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Publiczna edycja produktow" ON public.produkty;
CREATE POLICY "Publiczna edycja produktow" 
  ON public.produkty FOR UPDATE 
  TO anon, authenticated 
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Publiczne usuwanie produktow" ON public.produkty;
CREATE POLICY "Publiczne usuwanie produktow" 
  ON public.produkty FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- 3. UTWORZENIE PUBLICZNEGO BUCKETA STORAGE 'images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. POLITYKI STORAGE NA UPLOAD I ODCZYT PLIKÓW
DROP POLICY IF EXISTS "Publiczny odczyt zdjec z bucketa images" ON storage.objects;
CREATE POLICY "Publiczny odczyt zdjec z bucketa images" 
  ON storage.objects FOR SELECT 
  TO anon, authenticated 
  USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Publiczny upload zdjec do bucketa images" ON storage.objects;
CREATE POLICY "Publiczny upload zdjec do bucketa images" 
  ON storage.objects FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Publiczne usuwanie zdjec z bucketa images" ON storage.objects;
CREATE POLICY "Publiczne usuwanie zdjec z bucketa images" 
  ON storage.objects FOR DELETE 
  TO anon, authenticated 
  USING (bucket_id = 'images');

-- 5. REKORDY POCZĄTKOWE
INSERT INTO public.produkty (nazwa, cena, kategoria, zdjecie_url, dostepny, opis)
VALUES
  ('Aparat Fotograficzny Pro 4K', 2899.00, 'Foto & Video', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80', true, 'Aparat bezlusterkowy z matrycą pełnoklatkową'),
  ('Słuchawki Bezprzewodowe Studio', 599.00, 'Audio', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', true, 'Studyjne brzmienie i aktywna redukcja szumów ANC'),
  ('Zegarek Sportowy Titan GPS', 899.99, 'Smartwatche', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', true, 'Pulsometr, GPS, wodoodporność 50m oraz bateria 14 dni'),
  ('Klawiatura Mechaniczna RGB', 349.50, 'Akcesoria', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', true, 'Przełączniki mechaniczne i podświetlenie RGB');
`;

export const STORAGE_ONLY_SQL = `-- Utworzenie publicznego bucketa 'images' w Supabase:
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Uprawnienia do odczytu i uploadu zdjęć dla roli anon i authenticated:
DROP POLICY IF EXISTS "Publiczny odczyt zdjec z bucketa images" ON storage.objects;
CREATE POLICY "Publiczny odczyt zdjec z bucketa images" 
  ON storage.objects FOR SELECT 
  TO anon, authenticated 
  USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Publiczny upload zdjec do bucketa images" ON storage.objects;
CREATE POLICY "Publiczny upload zdjec do bucketa images" 
  ON storage.objects FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (bucket_id = 'images');
`;
