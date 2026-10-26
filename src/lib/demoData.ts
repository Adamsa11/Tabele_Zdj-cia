import { TableMeta, StorageBucketItem, StorageFileItem } from '../types';

export const DEMO_TABLES: TableMeta[] = [
  {
    name: 'products',
    schema: 'public',
    rowCount: 6,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'title', dataType: 'text', isNullable: false },
      { name: 'category', dataType: 'text', isNullable: false },
      { name: 'price', dataType: 'number', isNullable: false },
      { name: 'stock', dataType: 'number', isNullable: false },
      { name: 'image_url', dataType: 'image', isNullable: true },
      { name: 'is_active', dataType: 'boolean', isNullable: false, defaultValue: 'true' },
      { name: 'created_at', dataType: 'datetime', isNullable: false }
    ]
  },
  {
    name: 'customers',
    schema: 'public',
    rowCount: 5,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'full_name', dataType: 'text', isNullable: false },
      { name: 'email', dataType: 'text', isNullable: false },
      { name: 'avatar_url', dataType: 'image', isNullable: true },
      { name: 'phone', dataType: 'text', isNullable: true },
      { name: 'status', dataType: 'text', isNullable: false, defaultValue: 'active' },
      { name: 'total_orders', dataType: 'number', isNullable: false, defaultValue: '0' },
      { name: 'created_at', dataType: 'datetime', isNullable: false }
    ]
  },
  {
    name: 'orders',
    schema: 'public',
    rowCount: 5,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'customer_name', dataType: 'text', isNullable: false },
      { name: 'total_amount', dataType: 'number', isNullable: false },
      { name: 'status', dataType: 'text', isNullable: false },
      { name: 'receipt_image', dataType: 'image', isNullable: true },
      { name: 'delivery_city', dataType: 'text', isNullable: false },
      { name: 'created_at', dataType: 'datetime', isNullable: false }
    ]
  },
  {
    name: 'media_assets',
    schema: 'public',
    rowCount: 4,
    columns: [
      { name: 'id', dataType: 'number', isPrimary: true, isNullable: false },
      { name: 'title', dataType: 'text', isNullable: false },
      { name: 'file_name', dataType: 'text', isNullable: false },
      { name: 'file_url', dataType: 'image', isNullable: false },
      { name: 'file_size_kb', dataType: 'number', isNullable: false },
      { name: 'category', dataType: 'text', isNullable: false },
      { name: 'uploaded_at', dataType: 'datetime', isNullable: false }
    ]
  }
];

export const DEMO_DATA: Record<string, Record<string, any>[]> = {
  products: [
    {
      id: 101,
      title: 'Studio Monitor Audio Pro X',
      category: 'Audio',
      price: 1299.00,
      stock: 24,
      image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
      is_active: true,
      created_at: '2026-02-14T10:20:00Z'
    },
    {
      id: 102,
      title: 'Mechaniczna Klawiatura RGB Silent',
      category: 'Akcesoria',
      price: 450.50,
      stock: 85,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
      is_active: true,
      created_at: '2026-03-01T14:10:00Z'
    },
    {
      id: 103,
      title: 'Słuchawki Bezprzewodowe ANC',
      category: 'Audio',
      price: 899.99,
      stock: 42,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      is_active: true,
      created_at: '2026-03-12T09:45:00Z'
    },
    {
      id: 104,
      title: 'Kamera Internetowa 4K Ultra HD',
      category: 'Video',
      price: 620.00,
      stock: 15,
      image_url: 'https://images.unsplash.com/photo-1588796289154-1596e1082a93?auto=format&fit=crop&w=600&q=80',
      is_active: true,
      created_at: '2026-03-18T16:30:00Z'
    },
    {
      id: 105,
      title: 'Podkładka Biurkowa z Naturalnej Skóry',
      category: 'Biuro',
      price: 180.00,
      stock: 120,
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
      is_active: true,
      created_at: '2026-04-02T11:00:00Z'
    },
    {
      id: 106,
      title: 'Ergonomiczny Fotel Biurowy Mesh',
      category: 'Meble',
      price: 2150.00,
      stock: 8,
      image_url: 'https://images.unsplash.com/photo-1580481077111-9a74fc958862?auto=format&fit=crop&w=600&q=80',
      is_active: false,
      created_at: '2026-04-10T15:20:00Z'
    }
  ],
  customers: [
    {
      id: 1,
      full_name: 'Jan Kowalski',
      email: 'jan.kowalski@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      phone: '+48 501 234 567',
      status: 'active',
      total_orders: 8,
      created_at: '2026-01-15T08:00:00Z'
    },
    {
      id: 2,
      full_name: 'Anna Nowak',
      email: 'anna.nowak@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      phone: '+48 602 345 678',
      status: 'active',
      total_orders: 14,
      created_at: '2026-01-20T12:30:00Z'
    },
    {
      id: 3,
      full_name: 'Piotr Wiśniewski',
      email: 'p.wisniewski@company.pl',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      phone: '+48 703 456 789',
      status: 'vip',
      total_orders: 29,
      created_at: '2026-02-05T14:15:00Z'
    },
    {
      id: 4,
      full_name: 'Magdalena Zielińska',
      email: 'magda.zielinska@domain.com',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
      phone: '+48 512 889 123',
      status: 'inactive',
      total_orders: 1,
      created_at: '2026-02-28T09:10:00Z'
    },
    {
      id: 5,
      full_name: 'Tomasz Lewandowski',
      email: 'tomasz.l@techlab.io',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      phone: '+48 691 223 344',
      status: 'active',
      total_orders: 5,
      created_at: '2026-03-15T18:00:00Z'
    }
  ],
  orders: [
    {
      id: 5001,
      customer_name: 'Jan Kowalski',
      total_amount: 1749.50,
      status: 'delivered',
      receipt_image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      delivery_city: 'Warszawa',
      created_at: '2026-03-01T11:22:00Z'
    },
    {
      id: 5002,
      customer_name: 'Anna Nowak',
      total_amount: 899.99,
      status: 'shipped',
      receipt_image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
      delivery_city: 'Kraków',
      created_at: '2026-03-14T15:40:00Z'
    },
    {
      id: 5003,
      customer_name: 'Piotr Wiśniewski',
      total_amount: 3449.00,
      status: 'processing',
      receipt_image: null,
      delivery_city: 'Gdańsk',
      created_at: '2026-03-25T09:15:00Z'
    },
    {
      id: 5004,
      customer_name: 'Tomasz Lewandowski',
      total_amount: 450.50,
      status: 'delivered',
      receipt_image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      delivery_city: 'Wrocław',
      created_at: '2026-04-03T16:05:00Z'
    },
    {
      id: 5005,
      customer_name: 'Magdalena Zielińska',
      total_amount: 180.00,
      status: 'cancelled',
      receipt_image: null,
      delivery_city: 'Poznań',
      created_at: '2026-04-08T13:50:00Z'
    }
  ],
  media_assets: [
    {
      id: 1,
      title: 'Broszura Produktowa 2026',
      file_name: 'brochure_spring_2026.jpg',
      file_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      file_size_kb: 480,
      category: 'marketing',
      uploaded_at: '2026-02-10T14:00:00Z'
    },
    {
      id: 2,
      title: 'Zdjęcie Stanowiska Testowego',
      file_name: 'hardware_lab_bench.jpg',
      file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      file_size_kb: 1240,
      category: 'technical',
      uploaded_at: '2026-02-22T09:30:00Z'
    },
    {
      id: 3,
      title: 'Nowe Opakowanie Ekologiczne',
      file_name: 'eco_packaging_box.jpg',
      file_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      file_size_kb: 890,
      category: 'products',
      uploaded_at: '2026-03-05T16:15:00Z'
    },
    {
      id: 4,
      title: 'Plakat Konferencji Q2',
      file_name: 'q2_summit_keynote.jpg',
      file_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
      file_size_kb: 670,
      category: 'events',
      uploaded_at: '2026-04-01T10:00:00Z'
    }
  ]
};

export const DEMO_STORAGE_BUCKETS: StorageBucketItem[] = [
  { id: 'products-images', name: 'products-images', isPublic: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'user-avatars', name: 'user-avatars', isPublic: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'documents-receipts', name: 'documents-receipts', isPublic: true, createdAt: '2026-01-01T00:00:00Z' }
];

export const DEMO_STORAGE_FILES: Record<string, StorageFileItem[]> = {
  'products-images': [
    {
      name: 'monitor-pro.jpg',
      id: 'f-1',
      size: 452000,
      createdAt: '2026-02-14T10:20:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    },
    {
      name: 'keyboard-mech.jpg',
      id: 'f-2',
      size: 312000,
      createdAt: '2026-03-01T14:10:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    },
    {
      name: 'headphones-anc.jpg',
      id: 'f-3',
      size: 580000,
      createdAt: '2026-03-12T09:45:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    }
  ],
  'user-avatars': [
    {
      name: 'avatar-jan.jpg',
      id: 'f-4',
      size: 140000,
      createdAt: '2026-01-15T08:00:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      mimeType: 'image/jpeg'
    },
    {
      name: 'avatar-anna.jpg',
      id: 'f-5',
      size: 180000,
      createdAt: '2026-01-20T12:30:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      mimeType: 'image/jpeg'
    }
  ],
  'documents-receipts': [
    {
      name: 'receipt-5001.jpg',
      id: 'f-6',
      size: 290000,
      createdAt: '2026-03-01T11:22:00Z',
      publicUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      mimeType: 'image/jpeg'
    }
  ]
};
