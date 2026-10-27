# 🚀 Wdrażanie SupaTable Studio na GitHub Pages

Aplikacja została w pełni przygotowana do uruchomienia na **GitHub Pages**:
- W `vite.config.ts` ustawiono `base: './'`, dzięki czemu wszystkie skrypty i style ładują się poprawnie z dowolnej podścieżki repozytorium (`https://twoj-login.github.io/nazwa-repozytorium/`).
- W katalogu `.github/workflows/deploy.yml` dodano automatyczny skrypt CI/CD (GitHub Actions), który samoczynnie buduje i publikuje stronę po każdym wysłaniu zmian (`git push`).
- W katalogu `public/` dodano plik `.nojekyll` oraz fallback `404.html` zapobiegający problemom przy odświeżaniu strony.

---

## Krok 1: Utworzenie repozytorium na GitHub

1. Zaloguj się na swoje konto na [github.com](https://github.com).
2. Kliknij **New** (Nowe repozytorium) lub wejdź na [github.com/new](https://github.com/new).
3. Podaj nazwę repozytorium, np. `supatable-studio` (lub dowolną inną).
4. Wybierz widoczność **Public** (w darmowym planie GitHub Pages wymaga publicznego repozytorium).
5. **Nie zaznaczaj** opcji dodawania README, .gitignore ani licencji (ponieważ projekt ma już te pliki).
6. Kliknij **Create repository**.

---

## Krok 2: Wypchnięcie kodu z Twojego komputera

Otwórz terminal w folderze z projektem i wykonaj następujące polecenia (zamieniając `TWOJ_LOGIN` i `NAZWA_REPOZYTORIUM` na Twoje dane):

```bash
# 1. Inicjalizacja repozytorium lokalnego (jeśli jeszcze nie zainicjowano)
git init

# 2. Dodanie wszystkich plików
git add .

# 3. Zatwierdzenie zmian
git commit -m "SupaTable Studio - wersja dla GitHub Pages"

# 4. Ustawienie głównej gałęzi jako main
git branch -M main

# 5. Powiązanie z Twoim repozytorium na GitHubie
git remote add origin https://github.com/TWOJ_LOGIN/NAZWA_REPOZYTORIUM.git

# 6. Wysłanie kodu do GitHuba
git push -u origin main
```

---

## Krok 3: Włączenie GitHub Pages w ustawieniach repozytorium

1. W przeglądarce przejdź do swojego repozytorium na GitHubie.
2. Kliknij zakładkę **Settings** (Ustawienia) na górnym pasku.
3. W menu bocznym po lewej stronie przejdź do sekcji **Pages** (w sekcji "Code and automation").
4. W części **Build and deployment**:
   - W polu **Source** zmień z *"Deploy from a branch"* na **GitHub Actions**.
5. To wszystko! Nie musisz nic więcej zapisywać w tym formularzu.

---

## Krok 4: Sprawdzenie działania i adres strony

1. Przejdź do zakładki **Actions** w menu głównym swojego repozytorium.
2. Zobaczysz uruchomiony workflow o nazwie **Wdróż na GitHub Pages**.
3. Po około 1-2 minutach zadanie zakończy się z zielonym symbolem sukcesu (✓).
4. Kliknij na to zadanie – w sekcji wdrożenia zobaczysz bezpośredni link do Twojej działającej strony:
   `https://TWOJ_LOGIN.github.io/NAZWA_REPOZYTORIUM/`

---

## 🔒 Ważne informacje o połączeniu z Supabase

- **Bezserwerowa architektura (SPA)**: Cała aplikacja działa w 100% po stronie przeglądarki użytkownika i łączy się bezpośrednio z Supabase przez bezpieczne API HTTPS.
- **Klucz anonimowy**: Używany w projekcie klucz `sb_publishable_...` jest przeznaczony do publicznego użycia po stronie klienta (chroniony regułami RLS w bazie Supabase).
- **Zapisywanie sesji**: Parametry połączenia i wybrane tabele są zapamiętywane w pamięci podręcznej przeglądarki (`localStorage`).
- W razie potrzeby każdy użytkownik może w oknie **Połączenie** wprowadzić własny adres URL oraz klucz API lub uruchomić wbudowane narzędzie diagnostyczne.
