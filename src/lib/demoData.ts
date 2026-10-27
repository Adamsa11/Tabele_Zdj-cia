import { TableMeta, StorageBucketItem, StorageFileItem } from '../types';

export const DEMO_TABLES: TableMeta[] = [
  {
    name: 'wozki_widlowe',
    schema: 'public',
    rowCount: 6,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'model', dataType: 'text', isNullable: false },
      { name: 'typ_napedu', dataType: 'text', isNullable: false },
      { name: 'udzwig_kg', dataType: 'number', isNullable: false },
      { name: 'wysokosc_podnoszenia_mm', dataType: 'number', isNullable: false },
      { name: 'cena_pln', dataType: 'number', isNullable: false },
      { name: 'zdjecie_url', dataType: 'image', isNullable: true },
      { name: 'dostepny_od_reki', dataType: 'boolean', isNullable: false, defaultValue: 'true' },
      { name: 'rok_produkcji', dataType: 'number', isNullable: false },
      { name: 'stan_techniczny', dataType: 'text', isNullable: false }
    ]
  },
  {
    name: 'czesci_zamienne',
    schema: 'public',
    rowCount: 5,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'kod_katalogowy', dataType: 'text', isNullable: false },
      { name: 'nazwa_czesci', dataType: 'text', isNullable: false },
      { name: 'kategoria', dataType: 'text', isNullable: false },
      { name: 'stan_magazynowy', dataType: 'number', isNullable: false },
      { name: 'cena_netto_pln', dataType: 'number', isNullable: false },
      { name: 'zdjecie_czesci', dataType: 'image', isNullable: true }
    ]
  },
  {
    name: 'klienci_flotowi',
    schema: 'public',
    rowCount: 5,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'nazwa_firmy', dataType: 'text', isNullable: false },
      { name: 'nip', dataType: 'text', isNullable: false },
      { name: 'miasto', dataType: 'text', isNullable: false },
      { name: 'liczba_wozkow_wynajem', dataType: 'number', isNullable: false, defaultValue: '0' },
      { name: 'opiekun_klienta', dataType: 'text', isNullable: false },
      { name: 'status_umowy', dataType: 'text', isNullable: false }
    ]
  },
  {
    name: 'zlecenia_serwisowe',
    schema: 'public',
    rowCount: 5,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'nr_zlecenia', dataType: 'text', isNullable: false },
      { name: 'klient', dataType: 'text', isNullable: false },
      { name: 'wozek_model', dataType: 'text', isNullable: false },
      { name: 'rodzaj_uslugi', dataType: 'text', isNullable: false },
      { name: 'protokol_zdjecie', dataType: 'image', isNullable: true },
      { name: 'status', dataType: 'text', isNullable: false },
      { name: 'data_wykonania', dataType: 'datetime', isNullable: false }
    ]
  }
];

export const DEMO_DATA: Record<string, Record<string, any>[]> = {
  wozki_widlowe: [
    {
      id: 1,
      model: 'Saw-Trak Heli CPD25-GB2LI (Litowo-jonowy)',
      typ_napedu: 'Elektryczny Li-Ion',
      udzwig_kg: 2500,
      wysokosc_podnoszenia_mm: 4800,
      cena_pln: 89500.00,
      zdjecie_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      dostepny_od_reki: true,
      rok_produkcji: 2025,
      stan_techniczny: 'Fabrycznie nowy'
    },
    {
      id: 2,
      model: 'Saw-Trak Heli CPCD30 Diesel Triplex',
      typ_napedu: 'Diesel Kubota',
      udzwig_kg: 3000,
      wysokosc_podnoszenia_mm: 4500,
      cena_pln: 104000.00,
      zdjecie_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      dostepny_od_reki: true,
      rok_produkcji: 2024,
      stan_techniczny: 'Nowy'
    },
    {
      id: 3,
      model: 'Saw-Trak Reach Truck CQD16-D2',
      typ_napedu: 'Elektryczny AC',
      udzwig_kg: 1600,
      wysokosc_podnoszenia_mm: 7500,
      cena_pln: 118000.00,
      zdjecie_url: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80',
      dostepny_od_reki: true,
      rok_produkcji: 2025,
      stan_techniczny: 'Fabrycznie nowy'
    },
    {
      id: 4,
      model: 'Elektryczny Wózek Paletowy CBD15J-Li',
      typ_napedu: 'Elektryczny Li-Ion 24V',
      udzwig_kg: 1500,
      wysokosc_podnoszenia_mm: 200,
      cena_pln: 6490.00,
      zdjecie_url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
      dostepny_od_reki: true,
      rok_produkcji: 2025,
      stan_techniczny: 'Nowy'
    },
    {
      id: 5,
      model: 'Saw-Trak Heli CPCD50 Heavy Duty',
      typ_napedu: 'Diesel Mitsubishi',
      udzwig_kg: 5000,
      wysokosc_podnoszenia_mm: 4000,
      cena_pln: 168000.00,
      zdjecie_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      dostepny_od_reki: false,
      rok_produkcji: 2023,
      stan_techniczny: 'Używany - Certyfikowany po przeglądzie'
    },
    {
      id: 6,
      model: 'Czołowy Gazowy LPG CPQ18-M1',
      typ_napedu: 'LPG / Benzyna',
      udzwig_kg: 1800,
      wysokosc_podnoszenia_mm: 3300,
      cena_pln: 52000.00,
      zdjecie_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      dostepny_od_reki: true,
      rok_produkcji: 2021,
      stan_techniczny: 'Używany - Stan bardzo dobry'
    }
  ],
  czesci_zamienne: [
    {
      id: 101,
      kod_katalogowy: 'ST-BAT-48V-600AH',
      nazwa_czesci: 'Bateria trakcyjna 48V 600Ah z systemem BFS',
      kategoria: 'Zasilanie i Akumulatory',
      stan_magazynowy: 14,
      cena_netto_pln: 18900.00,
      zdjecie_czesci: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 102,
      kod_katalogowy: 'ST-WID-FEM2A-1200',
      nazwa_czesci: 'Widły kute 1200mm klasa karetki 2A (para)',
      kategoria: 'Osprzęt i Widły',
      stan_magazynowy: 48,
      cena_netto_pln: 1150.00,
      zdjecie_czesci: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 103,
      kod_katalogowy: 'ST-OP-SE-18X7-8',
      nazwa_czesci: 'Opona superelastyczna 18x7-8 Black Quick',
      kategoria: 'Koła i Ogumienie',
      stan_magazynowy: 32,
      cena_netto_pln: 540.00,
      zdjecie_czesci: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 104,
      kod_katalogowy: 'ST-FIL-SET-KUBOTA',
      nazwa_czesci: 'Zestaw filtrów przeglądowych 500mth Kubota V2403',
      kategoria: 'Filtry i Oleje',
      stan_magazynowy: 95,
      cena_netto_pln: 380.00,
      zdjecie_czesci: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 105,
      kod_katalogowy: 'ST-PRZ-KAUP-2T',
      nazwa_czesci: 'Przesuw boczny zintegrowany KAUP 2.5T',
      kategoria: 'Hydraulika siłowa',
      stan_magazynowy: 6,
      cena_netto_pln: 3900.00,
      zdjecie_czesci: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
    }
  ],
  klienci_flotowi: [
    {
      id: 1,
      nazwa_firmy: 'Logistyka Polska Sp. z o.o.',
      nip: '5252849102',
      miasto: 'Warszawa',
      liczba_wozkow_wynajem: 18,
      opiekun_klienta: 'Marek Pawlak',
      status_umowy: 'Aktywna (Wynajem długoterminowy)'
    },
    {
      id: 2,
      nazwa_firmy: 'Centrum Dystrybucji Wielkopolska S.A.',
      nip: '7781492019',
      miasto: 'Poznań',
      liczba_wozkow_wynajem: 32,
      opiekun_klienta: 'Ewa Dąbrowska',
      status_umowy: 'Aktywna (Full Serwis)'
    },
    {
      id: 3,
      nazwa_firmy: 'Hurtownia Budowlana Stal-Tech',
      nip: '8971829103',
      miasto: 'Wrocław',
      liczba_wozkow_wynajem: 6,
      opiekun_klienta: 'Tomasz Czarnecki',
      status_umowy: 'Aktywna (Umowa serwisowa)'
    },
    {
      id: 4,
      nazwa_firmy: 'Śląskie Zakłady Przetwórstwa Mięsnego',
      nip: '6342819022',
      miasto: 'Katowice',
      liczba_wozkow_wynajem: 12,
      opiekun_klienta: 'Marek Pawlak',
      status_umowy: 'W trakcie przedłużenia'
    },
    {
      id: 5,
      nazwa_firmy: 'Baltic Logistics Terminal',
      nip: '5832910291',
      miasto: 'Gdańsk',
      liczba_wozkow_wynajem: 24,
      opiekun_klienta: 'Ewa Dąbrowska',
      status_umowy: 'Aktywna (Wynajem floty)'
    }
  ],
  zlecenia_serwisowe: [
    {
      id: 7001,
      nr_zlecenia: 'SRV/2026/04/012',
      klient: 'Logistyka Polska Sp. z o.o.',
      wozek_model: 'Heli CPD25-GB2LI',
      rodzaj_uslugi: 'Okresowy przegląd UDT (500 mth)',
      protokol_zdjecie: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      status: 'Zakończone / Podpisane',
      data_wykonania: '2026-04-10T14:30:00Z'
    },
    {
      id: 7002,
      nr_zlecenia: 'SRV/2026/04/015',
      klient: 'Centrum Dystrybucji Wielkopolska',
      wozek_model: 'Reach Truck CQD16-D2',
      rodzaj_uslugi: 'Wymiana rolek masztu i kalibracja sensora wysokości',
      protokol_zdjecie: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
      status: 'W realizacji przez serwisanta',
      data_wykonania: '2026-04-12T09:15:00Z'
    },
    {
      id: 7003,
      nr_zlecenia: 'SRV/2026/04/018',
      klient: 'Hurtownia Budowlana Stal-Tech',
      wozek_model: 'Heli CPCD30 Diesel',
      rodzaj_uslugi: 'Przegląd układu hydrauliki i wymiana uszczelnień',
      protokol_zdjecie: null,
      status: 'Oczekuje na części',
      data_wykonania: '2026-04-14T11:00:00Z'
    },
    {
      id: 7004,
      nr_zlecenia: 'SRV/2026/04/021',
      klient: 'Śląskie Zakłady Przetwórstwa',
      wozek_model: 'Elektryczny Wózek Paletowy CBD15J',
      rodzaj_uslugi: 'Wymiana baterii Li-Ion oraz koła napędowego Vulkollan',
      protokol_zdjecie: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      status: 'Zakończone',
      data_wykonania: '2026-04-15T16:00:00Z'
    },
    {
      id: 7005,
      nr_zlecenia: 'SRV/2026/04/025',
      klient: 'Baltic Logistics Terminal',
      wozek_model: 'Heli CPCD50 Heavy Duty',
      rodzaj_uslugi: 'Rewizja roczna masztu i badanie UDT',
      protokol_zdjecie: null,
      status: 'Zaplanowane na kolejny tydzień',
      data_wykonania: '2026-04-22T08:00:00Z'
    }
  ]
};

export const DEMO_STORAGE_BUCKETS: StorageBucketItem[] = [
  { id: 'wozki-multimedia', name: 'wozki-multimedia', isPublic: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'czesci-zamienne', name: 'czesci-zamienne', isPublic: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'protokoly-udt', name: 'protokoly-udt', isPublic: true, createdAt: '2026-01-01T00:00:00Z' }
];

export const DEMO_STORAGE_FILES: Record<string, StorageFileItem[]> = {
  'wozki-multimedia': [
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
    }
  ],
  'czesci-zamienne': [
    {
      name: 'bateria-trakcyjna-48v.jpg',
      id: 'f-4',
      size: 380000,
      createdAt: '2026-01-15T08:00:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    },
    {
      name: 'widly-kute-1200mm.jpg',
      id: 'f-5',
      size: 290000,
      createdAt: '2026-01-20T12:30:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    }
  ],
  'protokoly-udt': [
    {
      name: 'protokol-udt-srv-7001.jpg',
      id: 'f-6',
      size: 310000,
      createdAt: '2026-04-10T14:30:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    }
  ]
};
