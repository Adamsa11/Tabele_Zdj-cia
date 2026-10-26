# SupaTable Studio - Menedżer Tabel, Danych i Zdjęć w Supabase

Nowoczesny panel administracyjny do kompleksowej obsługi bazy danych Supabase: dynamiczne przeglądanie wszystkich tabel, pełny CRUD (dodawanie, edycja, usuwanie), zaawansowany import masowy z plików CSV, Excel (.xlsx) i JSON z mapowaniem kolumn oraz bezpośredni upload zdjęć do Supabase Storage wraz z automatycznym wiązaniem linków w tabelach.

### User Review & Critical Decisions

> [!IMPORTANT]
> Na podstawie odpowiedzi w fazie pytań przyjęto następujące decyzje architektoniczne:
> - **Połączenie z Supabase**: Interaktywny panel konfiguracji w aplikacji z natychmiastowym testem połączenia, bezpiecznym zapisem w przeglądarce oraz prekonfigurowanym, gotowym do testów trybem demonstracyjnym (Demo Mode).
> - **Import plików**: Pełna obsługa plików CSV, arkuszy Excel (.xlsx) oraz JSON z intuicyjnym interfejsem mapowania nagłówków pliku do kolumn tabeli i podglądem przed zapisem.
> - **Obsługa zdjęć**: Bezpośredni upload plików graficznych do Supabase Storage z generowaniem publicznych adresów URL, automatycznym wstawianiem linku do wybranej kolumny oraz podglądem miniaturek i powiększeniem w oknie modalnym (lightbox).

---

## 1. Overview & Core Concept

**SupaTable Studio** to specjalistyczny menedżer danych i multimediów dla każdego projektu w ekosystemie Supabase. Pozwala użytkownikowi podłączyć dowolny projekt Supabase (lub przetestować funkcje w bogatym trybie demonstracyjnym) i w pełni kontrolować strukturę oraz dane:
- **Przegląd wszystkich tabel**: Automatyczne wykrywanie schematu i tabel lub ręczny wybór tabel, podgląd definicji kolumn i typów danych.
- **Pełny CRUD**: Dodawanie pojedynczych rekordów z dedykowanymi kontrolkami według typów danych, szybka edycja wierszy, usuwanie pojedyncze oraz masowe z potwierdzeniem.
- **Masowy import danych**: Przeciągnij plik (CSV, XLSX, JSON), dopasuj kolumny pliku do kolumn w bazie, zweryfikuj podgląd i zaimportuj setki rekordów w jednej operacji.
- **Zarządzanie zdjęciami i mediami**: Przesyłanie zdjęć (drag & drop / picker) bezpośrednio do bucketa Supabase Storage, generowanie publicznych URL, miniatury w komórkach tabeli i modalny podgląd w wysokiej rozdzielczości.
- **Eksport danych**: Eksport tabel do plików CSV lub JSON za jednym kliknięciem.

---

## 2. User Experience & Visual Design

Zgodnie z wytycznymi dla systemów SaaS i konsol deweloperskich (`references/3_saas_dashboard.md`), interfejs zaprojektowano w profesjonalnej estetyce inspirowanej konsolami inżynierskimi:
- **Układ przestrzenny (1440px Workspace Canvas)**:
  - **Sidebar nawigacyjny (260px)**: Lista wykrytych tabel, wyszukiwarka tabel, licznik rekordów, skróty do magazynu mediów (Storage) i ustawień połączenia.
  - **Górny pasek kontekstowy (Top Bar Contract)**: Ścieżka okruchowa (np. `Supabase / Projekt Produkcyjny / Tabela: products`), przełącznik trybu (Live / Demo), status połączenia oraz główny przycisk akcji (np. `+ Dodaj rekord`).
  - **Główny obszar roboczy**: Tabela danych o wysokiej gęstości z możliwością sortowania, filtrowania, stronicowania i selekcji wierszy.
- **Typografia i Liczby**:
  - Nagłówki i etykiety: *Plus Jakarta Sans* / *Outfit* dla precyzji i czytelności.
  - Kolumny numeryczne, identyfikatory UUID, klucze i znaczniki czasu: ściśle z wyrównaniem `tabular-nums` i krojem monospace (*JetBrains Mono* / *font-mono*).
- **Zasada Zero-Pill & Czyste metadane**:
  - Typy kolumn, liczniki wierszy i daty prezentowane jako czysty tekst z subtelnymi separatorami (`·`, `/`).
  - Przyciski i przełączniki to jednoznaczne, funkcyjne kontrolki (`whitespace-nowrap`).
- **Obsługa stanów interfejsu**:
  - Szkieletowe ładowanie (skeletons) podczas zaciągania danych ze zdalnego API.
  - Wyrazisty stan pusty (Empty State) dla nowo utworzonych tabel z jasną zachętą do dodania pierwszego wpisu lub importu pliku.
  - Spójne komunikaty powiadomień toast (sukces, błędy walidacji, postęp uploadu zdjęć).

---

## 3. Key Product Decisions & Trade-Offs

- **Klient Supabase & Uniwersalne API REST**:
  - *Podejście*: Użycie oficjalnej biblioteki `@supabase/supabase-js` do komunikacji z bazą i Storage, połączone z dynamicznym zapytaniem o schemat tabel (PostgREST OpenAPI schema `/rest/v1/?apikey=...` oraz RPC / zapytań o tabele).
  - *Dlaczego*: Umożliwia użytkownikom natychmiastowe podłączenie dowolnego zewnętrznego projektu Supabase bez konieczności rekonfiguracji serwera aplikacji.
- **Wbudowany tryb Demo (Fallback)**:
  - *Podejście*: Pełna symulacja tabel (`products`, `orders`, `customers`, `media_library`) działająca w pamięci / localStorage, dzięki czemu użytkownik może natychmiast testować edycję, import plików i zdjęcia jeszcze przed wpisaniem własnych kluczy API.
- **Parser XLSX i CSV po stronie klienta**:
  - *Podejście*: Wykorzystanie sprawdzonych bibliotek `xlsx` oraz natywnego parsera CSV/JSON do szybkiego przetwarzania plików bezpośrednio w przeglądarce przed wysłaniem do bazy.
  - *Dlaczego*: Zapewnia natychmiastowy podgląd mapowania kolumn, eliminując ryzyko uszkodzenia danych w bazie przy błędnym formacie pliku.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SupaTable Studio UI                             │
├───────────────────────┬────────────────────────────────────────────────┤
│    Sidebar (260px)    │               Main Workspace                   │
│ ┌───────────────────┐ │ ┌────────────────────────────────────────────┐ │
│ │ Connection Badge  │ │ │ Topbar: Breadcrumbs + Search + Actions     │ │
│ │ Tables List       │ │ ├────────────────────────────────────────────┤ │
│ │ + Add New Table   │ │ │ High-Density Data Table / Grid             │ │
│ │ Storage Explorer  │ │ │ - Sorting, Pagination, Quick Filter        │ │
│ │ Settings Modal    │ │ │ - Inline Actions (Edit, Delete, Preview)   │ │
│ └───────────────────┘ │ └────────────────────────────────────────────┘ │
└───────────┬───────────────────────────────────┬────────────────────────┘
            │                                   │
            ▼                                   ▼
┌───────────────────────┐           ┌────────────────────────────────────┐
│ Connection & Schema   │           │ Data Import & Storage Engines      │
│ - Supabase Client     │           │ - File Parser (CSV, XLSX, JSON)    │
│ - Dynamic Table Det.  │           │ - Column Mapper & Data Validator   │
│ - Local Demo Fallback │           │ - Supabase Storage Image Uploader  │
└───────────┬───────────┘           └─────────────────┬──────────────────┘
            │                                         │
            ▼                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Supabase Project Cloud                            │
│   • PostgreSQL Database (REST API via PostgREST)                       │
│   • Supabase Storage (Buckets & Public CDN Image URLs)                 │
└────────────────────────────────────────────────────────────────────────┘
```

### Planowane komponenty i moduły:
1. **`ConnectionManager`**:
   - Modal z polami: Supabase URL, Anon / Service Key, wybór domyślnego bucketa Storage.
   - Przycisk "Testuj połączenie" z walidacją odpowiedzi API.
   - Przełącznik "Używaj trybu demonstracyjnego".
2. **`TableExplorer & SchemaViewer`**:
   - Dynamiczne pobieranie listy tabel i kolumn.
   - Możliwość rejestracji i tworzenia nowych struktur tabel.
3. **`DataGrid` & CRUD**:
   - Tabela rekordów ze stronicowaniem, zaznaczaniem wielu wierszy, sortowaniem po kolumnach.
   - Miniaturka ze zdjęciem z automatyczną detekcją kolumn zawierających URL do obrazu.
   - Modal dodawania/edycji rekordu z walidacją typów i zintegrowanym uploadem zdjęć.
   - Bezpieczne usuwanie (pojedyncze i masowe) z oknem potwierdzenia.
4. **`FileImporterModal`**:
   - Drag & Drop dla `.csv`, `.xlsx`, `.json`.
   - Analiza nagłówków i podgląd pierwszych 5 wierszy.
   - Macierz mapowania: Kolumna z pliku ➔ Kolumna w tabeli docelowej z możliwością pominięcia.
   - Pasek postępu zapisu i raport błędów.
5. **`MediaStorageUploader & Lightbox`**:
   - Bezpośredni upload zdjęć do wskazanego bucketa w Supabase Storage (`supabase.storage.from(...).upload()`).
   - Podgląd przesłanego zdjęcia, pobranie publicznego URL i automatyczne podstawienie do edytowanego rekordu.
   - Lightbox modal do przeglądania zdjęć w pełnej rozdzielczości.
