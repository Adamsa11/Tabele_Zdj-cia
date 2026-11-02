import { TableMeta, StorageBucketItem, StorageFileItem } from '../types';

export const DEMO_TABLES: TableMeta[] = [
  {
    name: 'v_model',
    schema: 'public',
    isView: true,
    description: 'Główny widok roboczy integrujący tabele Model_Podstawowy, Model_Specyfikacja, Model_Ceny i Model_Multimedia',
    rowCount: 6,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'nazwa_modelu', dataType: 'text', isNullable: false },
      { name: 'seria', dataType: 'text', isNullable: false },
      { name: 'typ_napedu', dataType: 'text', isNullable: false },
      { name: 'udzwig_kg', dataType: 'number', isNullable: false },
      { name: 'wysokosc_podnoszenia_mm', dataType: 'number', isNullable: false },
      { name: 'typ_masztu', dataType: 'text', isNullable: false },
      { name: 'cena_netto_pln', dataType: 'number', isNullable: false },
      { name: 'waluta', dataType: 'text', isNullable: false, defaultValue: 'PLN' },
      { name: 'rok_produkcji', dataType: 'number', isNullable: false },
      { name: 'dostepnosc', dataType: 'text', isNullable: false },
      { name: 'zdjecie_glowne', dataType: 'image', isNullable: true },
      { name: 'uwagi', dataType: 'text', isNullable: true }
    ]
  },
  {
    name: 'Model_Podstawowy',
    schema: 'public',
    isView: false,
    description: 'Tabela bazowa: identyfikator, nazwa, seria, napęd i dostępność',
    rowCount: 6,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'nazwa_modelu', dataType: 'text', isNullable: false },
      { name: 'seria', dataType: 'text', isNullable: false },
      { name: 'typ_napedu', dataType: 'text', isNullable: false },
      { name: 'rok_produkcji', dataType: 'number', isNullable: false },
      { name: 'dostepnosc', dataType: 'text', isNullable: false }
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
      typ_napedu: 'Elektryczny Li-Ion 80V',
      udzwig_kg: 2500,
      wysokosc_podnoszenia_mm: 4800,
      typ_masztu: 'Triplex z wolnym skokiem',
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
      typ_napedu: 'Diesel Kubota V2403 Euro V',
      udzwig_kg: 3000,
      wysokosc_podnoszenia_mm: 4500,
      typ_masztu: 'Triplex szerokowidokowy',
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
      typ_napedu: 'Elektryczny AC 48V',
      udzwig_kg: 1600,
      wysokosc_podnoszenia_mm: 7500,
      typ_masztu: 'Triplex High-Reach z kamerą',
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
      typ_napedu: 'Elektryczny Li-Ion 24V',
      udzwig_kg: 1500,
      wysokosc_podnoszenia_mm: 200,
      typ_masztu: 'Pojedynczy widłowy',
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
      typ_napedu: 'Diesel Mitsubishi S6S',
      udzwig_kg: 5000,
      wysokosc_podnoszenia_mm: 4000,
      typ_masztu: 'Duplex Standard',
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
      typ_napedu: 'LPG / Benzyna Nissan K21',
      udzwig_kg: 1800,
      wysokosc_podnoszenia_mm: 3300,
      typ_masztu: 'Duplex Panoramiczny',
      cena_netto_pln: 52000.0,
      waluta: 'PLN',
      rok_produkcji: 2022,
      dostepnosc: 'Dostępny od ręki',
      zdjecie_glowne: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      uwagi: 'Cicha i oszczędna praca z instalacją LPG. Ważny przegląd UDT.'
    }
  ],
  Model_Podstawowy: [
    { id: 1, nazwa_modelu: 'Saw-Trak Heli CPD25-GB2LI (Litowo-jonowy)', seria: 'G2 Lithium', typ_napedu: 'Elektryczny Li-Ion 80V', rok_produkcji: 2025, dostepnosc: 'Dostępny od ręki' },
    { id: 2, nazwa_modelu: 'Saw-Trak Heli CPCD30 Diesel Triplex', seria: 'H3 Series Heavy', typ_napedu: 'Diesel Kubota V2403 Euro V', rok_produkcji: 2024, dostepnosc: 'Dostępny w salonie Saw-Trak' },
    { id: 3, nazwa_modelu: 'Saw-Trak Reach Truck CQD16-D2', seria: 'CQD Wysokiego Składowania', typ_napedu: 'Elektryczny AC 48V', rok_produkcji: 2025, dostepnosc: 'Dostępny na zamówienie (7 dni)' },
    { id: 4, nazwa_modelu: 'Saw-Trak Elektryczny Paletowy CBD15J-Li', seria: 'Compact Pallet Li-Ion', typ_napedu: 'Elektryczny Li-Ion 24V', rok_produkcji: 2025, dostepnosc: 'Dostępny od ręki (magazyn)' },
    { id: 5, nazwa_modelu: 'Saw-Trak Heli CPCD50 Heavy Duty', seria: 'G-Series Industrial Heavy', typ_napedu: 'Diesel Mitsubishi S6S', rok_produkcji: 2023, dostepnosc: 'Certyfikowany używany z gwarancją' },
    { id: 6, nazwa_modelu: 'Saw-Trak Czołowy Gazowy CPQ18-M1', seria: 'Eco-LPG Series', typ_napedu: 'LPG / Benzyna Nissan K21', rok_produkcji: 2022, dostepnosc: 'Dostępny od ręki' }
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
