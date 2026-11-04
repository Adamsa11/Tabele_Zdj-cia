import { TableMeta, StorageBucketItem, StorageFileItem } from '../types';

export const DEMO_TABLES: TableMeta[] = [
  {
    name: 'v_model',
    schema: 'public',
    isView: true,
    description: 'Główny widok roboczy integrujący tabele Model_Podstawowy, Model_Specyfikacja, Model_Ceny, Model_Gwarancje i Model_Multimedia',
    rowCount: 6,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'nazwa_modelu', dataType: 'text', isNullable: false },
      { name: 'seria', dataType: 'text', isNullable: false },
      {
        name: 'rodzaj',
        dataType: 'text',
        isNullable: false,
        foreignKey: { table: 'Model_Rodzaj', column: 'nazwa' }
      },
      { name: 'typ_napedu', dataType: 'text', isNullable: false },
      { name: 'udzwig_kg', dataType: 'number', isNullable: false },
      { name: 'wysokosc_podnoszenia_mm', dataType: 'number', isNullable: false },
      { name: 'typ_masztu', dataType: 'text', isNullable: false },
      {
        name: 'gwarancja_detal',
        dataType: 'text',
        isNullable: false,
        foreignKey: { table: 'Model_Gwarancja_Detal', column: 'nazwa' }
      },
      {
        name: 'gwarancja_hurt',
        dataType: 'text',
        isNullable: false,
        foreignKey: { table: 'Model_Gwarancja_Hurt', column: 'nazwa' }
      },
      { name: 'cena_netto_pln', dataType: 'number', isNullable: false },
      { name: 'waluta', dataType: 'text', isNullable: false, defaultValue: 'PLN' },
      { name: 'rok_produkcji', dataType: 'number', isNullable: false },
      { name: 'dostepnosc', dataType: 'text', isNullable: false },
      { name: 'zdjecie_glowne', dataType: 'image', isNullable: true },
      { name: 'uwagi', dataType: 'text', isNullable: true }
    ]
  },
  {
    name: 'Model_Rodzaj',
    schema: 'public',
    isView: false,
    description: 'Walidowana tabela słownikowa: rodzaje wózków i maszyn Saw-Trak',
    rowCount: 7,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'nazwa', dataType: 'text', isNullable: false },
      { name: 'kod', dataType: 'text', isNullable: false },
      { name: 'opis', dataType: 'text', isNullable: true }
    ]
  },
  {
    name: 'Model_Gwarancja_Detal',
    schema: 'public',
    isView: false,
    description: 'Walidowana tabela słownikowa: warianty gwarancji detalicznej (B2C/Klient końcowy)',
    rowCount: 5,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'nazwa', dataType: 'text', isNullable: false },
      { name: 'okres_miesiace', dataType: 'number', isNullable: false },
      { name: 'limit_mth', dataType: 'number', isNullable: false },
      { name: 'zakres', dataType: 'text', isNullable: true }
    ]
  },
  {
    name: 'Model_Gwarancja_Hurt',
    schema: 'public',
    isView: false,
    description: 'Walidowana tabela słownikowa: pakiety gwarancji hurtowej dla dealerów (B2B)',
    rowCount: 5,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'nazwa', dataType: 'text', isNullable: false },
      { name: 'okres_miesiace', dataType: 'number', isNullable: false },
      { name: 'limit_mth', dataType: 'number', isNullable: false },
      { name: 'warunki_b2b', dataType: 'text', isNullable: true }
    ]
  },
  {
    name: 'Model_Podstawowy',
    schema: 'public',
    isView: false,
    description: 'Tabela bazowa: identyfikator, nazwa, seria, rodzaj, napęd i dostępność',
    rowCount: 6,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'nazwa_modelu', dataType: 'text', isNullable: false },
      { name: 'seria', dataType: 'text', isNullable: false },
      { name: 'rodzaj', dataType: 'text', isNullable: false },
      { name: 'typ_napedu', dataType: 'text', isNullable: false },
      { name: 'rok_produkcji', dataType: 'number', isNullable: false },
      { name: 'dostepnosc', dataType: 'text', isNullable: false }
    ]
  },
  {
    name: 'Model_Gwarancje',
    schema: 'public',
    isView: false,
    description: 'Tabela powiązań gwarancyjnych: gwarancja detaliczna i hurtowa',
    rowCount: 6,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'model_id', dataType: 'number', isNullable: false },
      { name: 'gwarancja_detal', dataType: 'text', isNullable: false },
      { name: 'gwarancja_hurt', dataType: 'text', isNullable: false }
    ]
  },
  {
    name: 'Model_Specyfikacja',
    schema: 'public',
    isView: false,
    description: 'Tabela techniczna: udźwig, wysokość masztu, typ masztu',
    rowCount: 6,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'model_id', dataType: 'number', isNullable: false },
      { name: 'udzwig_kg', dataType: 'number', isNullable: false },
      { name: 'wysokosc_podnoszenia_mm', dataType: 'number', isNullable: false },
      { name: 'typ_masztu', dataType: 'text', isNullable: false }
    ]
  },
  {
    name: 'Model_Ceny',
    schema: 'public',
    isView: false,
    description: 'Tabela finansowa: cennik netto, waluta i stan magazynowy',
    rowCount: 6,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'model_id', dataType: 'number', isNullable: false },
      { name: 'cena_netto_pln', dataType: 'number', isNullable: false },
      { name: 'waluta', dataType: 'text', isNullable: false, defaultValue: 'PLN' }
    ]
  },
  {
    name: 'Model_Multimedia',
    schema: 'public',
    isView: false,
    description: 'Tabela mediów: fotografie katalogowe, schematy i uwagi serwisowe',
    rowCount: 6,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'model_id', dataType: 'number', isNullable: false },
      { name: 'zdjecie_glowne', dataType: 'image', isNullable: true },
      { name: 'uwagi', dataType: 'text', isNullable: true }
    ]
  }
];

export const DEMO_DATA: Record<string, Record<string, any>[]> = {
  v_model: [
    {
      id: 1,
      nazwa_modelu: 'Saw-Trak Heli CPD25-GB2LI (Litowo-jonowy)',
      seria: 'G2 Lithium',
      rodzaj: 'Wózek czołowy elektryczny',
      typ_napedu: 'Elektryczny Li-Ion 80V',
      udzwig_kg: 2500,
      wysokosc_podnoszenia_mm: 4800,
      typ_masztu: 'Triplex z wolnym skokiem',
      gwarancja_detal: '60 miesięcy / 5000 mth (Li-Ion Ultra)',
      gwarancja_hurt: '24 miesiące na układ napędowy i Li-Ion',
      cena_netto_pln: 89500.0,
      waluta: 'PLN',
      rok_produkcji: 2025,
      dostepnosc: 'Dostępny od ręki',
      zdjecie_glowne: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      uwagi: 'Fabrycznie nowy. Bateria Li-Ion 80V/271Ah z szybkim ładowaniem w 2h.'
    },
    {
      id: 2,
      nazwa_modelu: 'Saw-Trak Heli CPCD30 Diesel Triplex',
      seria: 'H3 Series Heavy',
      rodzaj: 'Wózek czołowy spalinowy (Diesel)',
      typ_napedu: 'Diesel Kubota V2403 Euro V',
      udzwig_kg: 3000,
      wysokosc_podnoszenia_mm: 4500,
      typ_masztu: 'Triplex szerokowidokowy',
      gwarancja_detal: '24 miesiące / 2000 mth (Rozszerzona)',
      gwarancja_hurt: '12 miesięcy / 1000 mth (Hurt Standard)',
      cena_netto_pln: 104000.0,
      waluta: 'PLN',
      rok_produkcji: 2024,
      dostepnosc: 'Dostępny w salonie Saw-Trak',
      zdjecie_glowne: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      uwagi: 'Zintegrowany przesuw boczny wideł KAUP, pełna kabina z ogrzewaniem.'
    },
    {
      id: 3,
      nazwa_modelu: 'Saw-Trak Reach Truck CQD16-D2',
      seria: 'CQD Wysokiego Składowania',
      rodzaj: 'Wózek wysokiego składowania (Reach Truck)',
      typ_napedu: 'Elektryczny AC 48V',
      udzwig_kg: 1600,
      wysokosc_podnoszenia_mm: 7500,
      typ_masztu: 'Triplex High-Reach z kamerą',
      gwarancja_detal: '36 miesięcy / 3000 mth (Saw-Trak Care)',
      gwarancja_hurt: '12 miesięcy / 1000 mth (Hurt Standard)',
      cena_netto_pln: 118000.0,
      waluta: 'PLN',
      rok_produkcji: 2025,
      dostepnosc: 'Dostępny na zamówienie (7 dni)',
      zdjecie_glowne: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80',
      uwagi: 'System redukcji drgań masztu, elektroniczny wskaźnik wysokości podnoszenia.'
    },
    {
      id: 4,
      nazwa_modelu: 'Saw-Trak Elektryczny Paletowy CBD15J-Li',
      seria: 'Compact Pallet Li-Ion',
      rodzaj: 'Elektryczny wózek paletowy (Paleciak)',
      typ_napedu: 'Elektryczny Li-Ion 24V',
      udzwig_kg: 1500,
      wysokosc_podnoszenia_mm: 200,
      typ_masztu: 'Pojedynczy widłowy',
      gwarancja_detal: '12 miesięcy / 1000 mth (Standard B2C)',
      gwarancja_hurt: '6 miesięcy na podzespoły główne (B2B)',
      cena_netto_pln: 6490.0,
      waluta: 'PLN',
      rok_produkcji: 2025,
      dostepnosc: 'Dostępny od ręki (magazyn)',
      zdjecie_glowne: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
      uwagi: 'Najlżejszy paleciak elektryczny w klasie. Wymienna kasetowa bateria Li-Ion.'
    },
    {
      id: 5,
      nazwa_modelu: 'Saw-Trak Heli CPCD50 Heavy Duty',
      seria: 'G-Series Industrial Heavy',
      rodzaj: 'Wózek czołowy spalinowy (Diesel)',
      typ_napedu: 'Diesel Mitsubishi S6S',
      udzwig_kg: 5000,
      wysokosc_podnoszenia_mm: 4000,
      typ_masztu: 'Duplex Standard',
      gwarancja_detal: '12 miesięcy / 1000 mth (Standard B2C)',
      gwarancja_hurt: 'Gwarancja rozruchowa 30 dni',
      cena_netto_pln: 168000.0,
      waluta: 'PLN',
      rok_produkcji: 2023,
      dostepnosc: 'Certyfikowany używany z gwarancją',
      zdjecie_glowne: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      uwagi: 'Po pełnym przeglądzie w autoryzowanym serwisie Saw-Trak. Nowe ogumienie pneumatyczne.'
    },
    {
      id: 6,
      nazwa_modelu: 'Saw-Trak Czołowy Gazowy CPQ18-M1',
      seria: 'Eco-LPG Series',
      rodzaj: 'Wózek czołowy gazowy (LPG)',
      typ_napedu: 'LPG / Benzyna Nissan K21',
      udzwig_kg: 1800,
      wysokosc_podnoszenia_mm: 3300,
      typ_masztu: 'Duplex Panoramiczny',
      gwarancja_detal: '24 miesiące / 2000 mth (Rozszerzona)',
      gwarancja_hurt: '12 miesięcy / 1000 mth (Hurt Standard)',
      cena_netto_pln: 52000.0,
      waluta: 'PLN',
      rok_produkcji: 2022,
      dostepnosc: 'Dostępny od ręki',
      zdjecie_glowne: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      uwagi: 'Cicha i oszczędna praca z instalacją LPG. Ważny przegląd UDT.'
    }
  ],
  Model_Rodzaj: [
    { id: 1, nazwa: 'Wózek czołowy elektryczny', kod: 'ELEKTR_CZOLOWY', opis: 'Czołowe wózki 3- i 4-kołowe z baterią Li-Ion lub kwasową' },
    { id: 2, nazwa: 'Wózek czołowy spalinowy (Diesel)', kod: 'DIESEL_CZOLOWY', opis: 'Wózki do pracy zewnętrznej i w ciężkich warunkach przemysłowych' },
    { id: 3, nazwa: 'Wózek czołowy gazowy (LPG)', kod: 'LPG_CZOLOWY', opis: 'Niskoemisyjne wózki spalinowe do hal i placów przeładunkowych' },
    { id: 4, nazwa: 'Wózek wysokiego składowania (Reach Truck)', kod: 'REACH_TRUCK', opis: 'Wózki z wysuwnym masztem do regałów wysokich do 12,5m' },
    { id: 5, nazwa: 'Elektryczny wózek paletowy (Paleciak)', kod: 'PALECIAK_EL', opis: 'Kompaktowe wózki do transportu poziomego palet' },
    { id: 6, nazwa: 'Wózek prowadzony masztowy (Stacker)', kod: 'STACKER', opis: 'Układnice paletowe z masztem do mniejszych magazynów' },
    { id: 7, nazwa: 'Wózek boczny wielokierunkowy', kod: 'SIDE_LOADER', opis: 'Do transportu dłużyc, profili stalowych i drewna' }
  ],
  Model_Gwarancja_Detal: [
    { id: 1, nazwa: '12 miesięcy / 1000 mth (Standard B2C)', okres_miesiace: 12, limit_mth: 1000, zakres: 'Podstawowa gwarancja fabryczna Saw-Trak' },
    { id: 2, nazwa: '24 miesiące / 2000 mth (Rozszerzona)', okres_miesiace: 24, limit_mth: 2000, zakres: 'Pełna ochrona układu jezdnego i hydrauliki' },
    { id: 3, nazwa: '36 miesięcy / 3000 mth (Saw-Trak Care)', okres_miesiace: 36, limit_mth: 3000, zakres: 'Pakiet serwisowy VIP z corocznym UDT' },
    { id: 4, nazwa: '60 miesięcy / 5000 mth (Li-Ion Ultra)', okres_miesiace: 60, limit_mth: 5000, zakres: 'Gwarancja premium na ogniwa baterii litowo-jonowej' },
    { id: 5, nazwa: 'Stan zastany (Bez gwarancji)', okres_miesiace: 0, limit_mth: 0, zakres: 'Dla sprzętu komisowego i przeznaczonego do remontu' }
  ],
  Model_Gwarancja_Hurt: [
    { id: 1, nazwa: '6 miesięcy na podzespoły główne (B2B)', okres_miesiace: 6, limit_mth: 500, warunki_b2b: 'Silnik, skrzynia, pompa hydrauliczna' },
    { id: 2, nazwa: '12 miesięcy / 1000 mth (Hurt Standard)', okres_miesiace: 12, limit_mth: 1000, warunki_b2b: 'Wymagane przeglądy co 250 mth' },
    { id: 3, nazwa: '24 miesiące na układ napędowy i Li-Ion', okres_miesiace: 24, limit_mth: 2000, warunki_b2b: 'Dla autoryzowanych dealerów i partnerów' },
    { id: 4, nazwa: 'Gwarancja rozruchowa 30 dni', okres_miesiace: 1, limit_mth: 100, warunki_b2b: 'Weryfikacja sprawności przy odbiorze' },
    { id: 5, nazwa: 'Wyłączenie rękojmi hurtowej (As-Is B2B)', okres_miesiace: 0, limit_mth: 0, warunki_b2b: 'Cena hurtowa netto bez roszczeń gwarancyjnych' }
  ],
  Model_Podstawowy: [
    { id: 1, nazwa_modelu: 'Saw-Trak Heli CPD25-GB2LI (Litowo-jonowy)', seria: 'G2 Lithium', rodzaj: 'Wózek czołowy elektryczny', typ_napedu: 'Elektryczny Li-Ion 80V', rok_produkcji: 2025, dostepnosc: 'Dostępny od ręki' },
    { id: 2, nazwa_modelu: 'Saw-Trak Heli CPCD30 Diesel Triplex', seria: 'H3 Series Heavy', rodzaj: 'Wózek czołowy spalinowy (Diesel)', typ_napedu: 'Diesel Kubota V2403 Euro V', rok_produkcji: 2024, dostepnosc: 'Dostępny w salonie Saw-Trak' },
    { id: 3, nazwa_modelu: 'Saw-Trak Reach Truck CQD16-D2', seria: 'CQD Wysokiego Składowania', rodzaj: 'Wózek wysokiego składowania (Reach Truck)', typ_napedu: 'Elektryczny AC 48V', rok_produkcji: 2025, dostepnosc: 'Dostępny na zamówienie (7 dni)' },
    { id: 4, nazwa_modelu: 'Saw-Trak Elektryczny Paletowy CBD15J-Li', seria: 'Compact Pallet Li-Ion', rodzaj: 'Elektryczny wózek paletowy (Paleciak)', typ_napedu: 'Elektryczny Li-Ion 24V', rok_produkcji: 2025, dostepnosc: 'Dostępny od ręki (magazyn)' },
    { id: 5, nazwa_modelu: 'Saw-Trak Heli CPCD50 Heavy Duty', seria: 'G-Series Industrial Heavy', rodzaj: 'Wózek czołowy spalinowy (Diesel)', typ_napedu: 'Diesel Mitsubishi S6S', rok_produkcji: 2023, dostepnosc: 'Certyfikowany używany z gwarancją' },
    { id: 6, nazwa_modelu: 'Saw-Trak Czołowy Gazowy CPQ18-M1', seria: 'Eco-LPG Series', rodzaj: 'Wózek czołowy gazowy (LPG)', typ_napedu: 'LPG / Benzyna Nissan K21', rok_produkcji: 2022, dostepnosc: 'Dostępny od ręki' }
  ],
  Model_Gwarancje: [
    { id: 1, model_id: 1, gwarancja_detal: '60 miesięcy / 5000 mth (Li-Ion Ultra)', gwarancja_hurt: '24 miesiące na układ napędowy i Li-Ion' },
    { id: 2, model_id: 2, gwarancja_detal: '24 miesiące / 2000 mth (Rozszerzona)', gwarancja_hurt: '12 miesięcy / 1000 mth (Hurt Standard)' },
    { id: 3, model_id: 3, gwarancja_detal: '36 miesięcy / 3000 mth (Saw-Trak Care)', gwarancja_hurt: '12 miesięcy / 1000 mth (Hurt Standard)' },
    { id: 4, model_id: 4, gwarancja_detal: '12 miesięcy / 1000 mth (Standard B2C)', gwarancja_hurt: '6 miesięcy na podzespoły główne (B2B)' },
    { id: 5, model_id: 5, gwarancja_detal: '12 miesięcy / 1000 mth (Standard B2C)', gwarancja_hurt: 'Gwarancja rozruchowa 30 dni' },
    { id: 6, model_id: 6, gwarancja_detal: '24 miesiące / 2000 mth (Rozszerzona)', gwarancja_hurt: '12 miesięcy / 1000 mth (Hurt Standard)' }
  ],
  Model_Specyfikacja: [
    { id: 1, model_id: 1, udzwig_kg: 2500, wysokosc_podnoszenia_mm: 4800, typ_masztu: 'Triplex z wolnym skokiem' },
    { id: 2, model_id: 2, udzwig_kg: 3000, wysokosc_podnoszenia_mm: 4500, typ_masztu: 'Triplex szerokowidokowy' },
    { id: 3, model_id: 3, udzwig_kg: 1600, wysokosc_podnoszenia_mm: 7500, typ_masztu: 'Triplex High-Reach z kamerą' },
    { id: 4, model_id: 4, udzwig_kg: 1500, wysokosc_podnoszenia_mm: 200, typ_masztu: 'Pojedynczy widłowy' },
    { id: 5, model_id: 5, udzwig_kg: 5000, wysokosc_podnoszenia_mm: 4000, typ_masztu: 'Duplex Standard' },
    { id: 6, model_id: 6, udzwig_kg: 1800, wysokosc_podnoszenia_mm: 3300, typ_masztu: 'Duplex Panoramiczny' }
  ],
  Model_Ceny: [
    { id: 1, model_id: 1, cena_netto_pln: 89500.0, waluta: 'PLN' },
    { id: 2, model_id: 2, cena_netto_pln: 104000.0, waluta: 'PLN' },
    { id: 3, model_id: 3, cena_netto_pln: 118000.0, waluta: 'PLN' },
    { id: 4, model_id: 4, cena_netto_pln: 6490.0, waluta: 'PLN' },
    { id: 5, model_id: 5, cena_netto_pln: 168000.0, waluta: 'PLN' },
    { id: 6, model_id: 6, cena_netto_pln: 52000.0, waluta: 'PLN' }
  ],
  Model_Multimedia: [
    { id: 1, model_id: 1, zdjecie_glowne: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80', uwagi: 'Fabrycznie nowy. Bateria Li-Ion 80V/271Ah z szybkim ładowaniem w 2h.' },
    { id: 2, model_id: 2, zdjecie_glowne: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', uwagi: 'Zintegrowany przesuw boczny wideł KAUP, pełna kabina z ogrzewaniem.' },
    { id: 3, model_id: 3, zdjecie_glowne: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80', uwagi: 'System redukcji drgań masztu, elektroniczny wskaźnik wysokości podnoszenia.' },
    { id: 4, model_id: 4, zdjecie_glowne: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80', uwagi: 'Najlżejszy paleciak elektryczny w klasie. Wymienna kasetowa bateria Li-Ion.' },
    { id: 5, model_id: 5, zdjecie_glowne: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80', uwagi: 'Po pełnym przeglądzie w autoryzowanym serwisie Saw-Trak. Nowe ogumienie pneumatyczne.' },
    { id: 6, model_id: 6, zdjecie_glowne: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80', uwagi: 'Cicha i oszczędna praca z instalacją LPG. Ważny przegląd UDT.' }
  ]
};

export const DEMO_STORAGE_BUCKETS: StorageBucketItem[] = [
  { id: 'zdjecia_modeli', name: 'zdjecia_modeli', isPublic: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'katalogi_techniczne', name: 'katalogi_techniczne', isPublic: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'certyfikaty_udt', name: 'certyfikaty_udt', isPublic: true, createdAt: '2026-01-01T00:00:00Z' }
];

export const DEMO_STORAGE_FILES: Record<string, StorageFileItem[]> = {
  zdjecia_modeli: [
    {
      name: 'heli-cpd25-li-ion.jpg',
      id: 'f-1',
      size: 512000,
      createdAt: '2026-02-14T10:20:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    },
    {
      name: 'reach-truck-cqd16.jpg',
      id: 'f-2',
      size: 640000,
      createdAt: '2026-03-01T14:10:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    },
    {
      name: 'paleciak-cbd15j.jpg',
      id: 'f-3',
      size: 420000,
      createdAt: '2026-03-12T09:45:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    },
    {
      name: 'saw-trak-cpcd50-heavy.jpg',
      id: 'f-4',
      size: 780000,
      createdAt: '2026-03-15T11:20:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    }
  ],
  katalogi_techniczne: [
    {
      name: 'saw-trak-heli-katalog-2026.pdf',
      id: 'f-5',
      size: 2450000,
      createdAt: '2026-01-15T08:00:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      mimeType: 'application/pdf'
    }
  ],
  certyfikaty_udt: [
    {
      name: 'badanie-udt-protokol-2026.pdf',
      id: 'f-6',
      size: 310000,
      createdAt: '2026-04-10T14:30:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      mimeType: 'application/pdf'
    }
  ]
};
