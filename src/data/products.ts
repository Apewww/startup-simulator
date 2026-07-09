import type { ComponentRequirement } from '../types';

export interface FeatureDef {
  id: string;
  name: string;
  description: string;
  requiredComponents: ComponentRequirement[];
  baseTraffic: number;
}

export interface ProductDef {
  id: string;
  name: string;
  description: string;
  tagline: string;
  features: FeatureDef[];
}

export const PRODUCTS: ProductDef[] = [
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Bangun platform sosial yang menghubungkan orang di seluruh dunia. Fokus pada engagement, user-generated content, dan fitur interaksi real-time.',
    tagline: 'Connect the world',
    features: [
      {
        id: 'user_profiles',
        name: 'User Profiles',
        description: 'Profil pengguna dengan foto, bio, dan daftar teman',
        requiredComponents: [
          { componentId: 'ui_component', amount: 2 },
          { componentId: 'backend_code', amount: 1 },
        ],
        baseTraffic: 50,
      },
      {
        id: 'news_feed',
        name: 'News Feed',
        description: 'Feed konten personal yang diperbarui terus-menerus',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'network_module', amount: 1 },
        ],
        baseTraffic: 200,
      },
      {
        id: 'messaging',
        name: 'Messaging',
        description: 'Fitur pesan instan antar pengguna',
        requiredComponents: [
          { componentId: 'network_module', amount: 3 },
          { componentId: 'backend_code', amount: 2 },
        ],
        baseTraffic: 150,
      },
      {
        id: 'photo_sharing',
        name: 'Photo Sharing',
        description: 'Unggah, filter, dan bagikan foto dengan mudah',
        requiredComponents: [
          { componentId: 'graphics_component', amount: 3 },
          { componentId: 'backend_code', amount: 2 },
          { componentId: 'ui_component', amount: 1 },
        ],
        baseTraffic: 180,
      },
      {
        id: 'stories',
        name: 'Stories',
        description: 'Konten sementara 24 jam yang hilang otomatis',
        requiredComponents: [
          { componentId: 'graphics_component', amount: 4 },
          { componentId: 'network_module', amount: 2 },
          { componentId: 'ui_component', amount: 2 },
        ],
        baseTraffic: 300,
      },
      {
        id: 'groups',
        name: 'Groups',
        description: 'Komunitas untuk minat dan hobi bersama',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'ui_component', amount: 2 },
          { componentId: 'network_module', amount: 2 },
        ],
        baseTraffic: 250,
      },
      {
        id: 'live_streaming',
        name: 'Live Streaming',
        description: 'Siaran video real-time ke pengikut',
        requiredComponents: [
          { componentId: 'network_module', amount: 4 },
          { componentId: 'graphics_component', amount: 3 },
          { componentId: 'backend_code', amount: 2 },
        ],
        baseTraffic: 400,
      },
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Marketplace online untuk menjual berbagai produk. Tekankan pada pengalaman belanja, sistem pembayaran, dan rekomendasi cerdas.',
    tagline: 'Shop smarter',
    features: [
      {
        id: 'product_listing',
        name: 'Product Listing',
        description: 'Katalog produk dengan pencarian dan filter',
        requiredComponents: [
          { componentId: 'ui_component', amount: 2 },
          { componentId: 'backend_code', amount: 2 },
        ],
        baseTraffic: 60,
      },
      {
        id: 'shopping_cart',
        name: 'Shopping Cart',
        description: 'Keranjang belanja dengan wishlist dan checkout',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'network_module', amount: 1 },
        ],
        baseTraffic: 150,
      },
      {
        id: 'payment_gateway',
        name: 'Payment Gateway',
        description: 'Sistem pembayaran multi-metode yang aman',
        requiredComponents: [
          { componentId: 'backend_code', amount: 4 },
          { componentId: 'network_module', amount: 3 },
          { componentId: 'ui_component', amount: 1 },
        ],
        baseTraffic: 250,
      },
      {
        id: 'review_system',
        name: 'Review System',
        description: 'Ulasan, rating, dan sistem reputasi penjual',
        requiredComponents: [
          { componentId: 'backend_code', amount: 2 },
          { componentId: 'ui_component', amount: 2 },
        ],
        baseTraffic: 100,
      },
      {
        id: 'recommendation_engine',
        name: 'Recommendation Engine',
        description: 'Rekomendasi produk berbasis data pengguna',
        requiredComponents: [
          { componentId: 'backend_code', amount: 5 },
          { componentId: 'network_module', amount: 3 },
        ],
        baseTraffic: 350,
      },
      {
        id: 'wishlist',
        name: 'Wishlist',
        description: 'Simpan favorit untuk dibeli nanti',
        requiredComponents: [
          { componentId: 'backend_code', amount: 1 },
          { componentId: 'ui_component', amount: 2 },
        ],
        baseTraffic: 80,
      },
      {
        id: 'seller_dashboard',
        name: 'Seller Dashboard',
        description: 'Analitik penjualan dan manajemen inventaris',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'ui_component', amount: 1 },
          { componentId: 'network_module', amount: 1 },
        ],
        baseTraffic: 200,
      },
    ],
  },
  {
    id: 'search_engine',
    name: 'Search Engine',
    description: 'Mesin pencari cepat dan akurat. Kembangkan crawler, algoritma pencarian, dan layanan tambahan seperti pencarian gambar & peta.',
    tagline: 'Find anything',
    features: [
      {
        id: 'web_crawler',
        name: 'Web Crawler',
        description: 'Crawler otomatis yang mengindeks jutaan halaman',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'network_module', amount: 2 },
        ],
        baseTraffic: 80,
      },
      {
        id: 'search_algorithm',
        name: 'Search Algorithm',
        description: 'Algoritma perankingan hasil pencarian',
        requiredComponents: [
          { componentId: 'backend_code', amount: 4 },
          { componentId: 'network_module', amount: 2 },
        ],
        baseTraffic: 300,
      },
      {
        id: 'index_builder',
        name: 'Index Builder',
        description: 'Sistem indexing cepat untuk hasil pencarian real-time',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'network_module', amount: 3 },
        ],
        baseTraffic: 200,
      },
      {
        id: 'image_search',
        name: 'Image Search',
        description: 'Pencarian gambar dengan pengenalan visual',
        requiredComponents: [
          { componentId: 'graphics_component', amount: 3 },
          { componentId: 'backend_code', amount: 2 },
          { componentId: 'network_module', amount: 1 },
        ],
        baseTraffic: 150,
      },
      {
        id: 'maps_integration',
        name: 'Maps',
        description: 'Peta interaktif dengan navigasi dan pencarian lokal',
        requiredComponents: [
          { componentId: 'graphics_component', amount: 4 },
          { componentId: 'backend_code', amount: 4 },
          { componentId: 'network_module', amount: 2 },
          { componentId: 'ui_component', amount: 2 },
        ],
        baseTraffic: 400,
      },
      {
        id: 'voice_search',
        name: 'Voice Search',
        description: 'Pencarian suara dengan natural language processing',
        requiredComponents: [
          { componentId: 'network_module', amount: 3 },
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'graphics_component', amount: 1 },
        ],
        baseTraffic: 250,
      },
      {
        id: 'analytics_dashboard',
        name: 'Analytics',
        description: 'Dashboard analitik pencarian dan tren',
        requiredComponents: [
          { componentId: 'backend_code', amount: 2 },
          { componentId: 'ui_component', amount: 1 },
          { componentId: 'graphics_component', amount: 1 },
        ],
        baseTraffic: 150,
      },
    ],
  },
];

export function getProductDef(id: string): ProductDef | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
