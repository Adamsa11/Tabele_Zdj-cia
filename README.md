# SupaTable Studio

Nowoczesny menedżer danych, tabel, importu plików (CSV/Excel/JSON) oraz magazynu Storage (zdjęcia, pliki multimedialne) dla platformy **Supabase**.

## 🚀 Wdrożenie na GitHub Pages

Projekt jest w pełni skonfigurowany pod automatyczne wdrożenie przez **GitHub Actions** na **GitHub Pages**:
- Konfiguracja `base: './'` w `vite.config.ts` gwarantuje poprawne ładowanie zasobów na każdej podścieżce repozytorium.
- Gotowy workflow `.github/workflows/deploy.yml` wykonuje automatyczny build i publikację przy każdym `git push`.
- Pliki `public/404.html` i `public/.nojekyll` gwarantują bezproblemowe działanie tras SPA i ominięcie silnika Jekyll.

Szczegółową instrukcję krok po kroku znajdziesz w pliku [INSTRUKCJA_GITHUB_PAGES.md](INSTRUKCJA_GITHUB_PAGES.md).

## 🛠️ Uruchomienie lokalne

```bash
# Instalacja zależności
npm install

# Uruchomienie serwera deweloperskiego
npm run dev

# Zbudowanie wersji produkcyjnej
npm run build
```

## 📋 Główne funkcje
- **Wykrywanie i przeglądanie tabel**: Automatyczna analiza schematu oraz szybkie otwieranie tabel takich jak `Model`, `Model_zdjecia`, itp.
- **Pełny CRUD**: Dodawanie, edycja, usuwanie pojedynczych i masowych rekordów z walidacją typów.
- **Supabase Storage**: Podgląd i przesyłanie zdjęć bezpośrednio do bucketów (np. `zdjecia_modeli`, `Dane`).
- **Narzędzia diagnostyczne**: Wbudowany test uprawnień do `information_schema` i Schema Cache PostgREST.
- **Import / Eksport**: Obsługa plików CSV, XLSX i JSON z podglądem mapowania kolumn.
