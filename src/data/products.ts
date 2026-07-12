import type { ComponentRequirement, FeatureGroup } from '../types';

export interface SynergyPair {
  featureA: string;
  featureB: string;
  description: string;
  minLevel: number;
  maxLevelGap: number;
  trafficBonus: number;
  revenueBonus: number;
}

export interface FeatureDef {
  id: string;
  name: string;
  description: string;
  group: FeatureGroup;
  requiredComponents: ComponentRequirement[];
  baseTraffic: number;
}

export interface ProductDef {
  id: string;
  name: string;
  description: string;
  tagline: string;
  features: FeatureDef[];
  synergies: SynergyPair[];
}

export const PRODUCTS: ProductDef[] = [
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Bangun platform sosial yang menghubungkan orang di seluruh dunia. Fokus pada engagement, user-generated content, dan fitur interaksi real-time.',
    tagline: 'Connect the world',
    features: [
      {
        id: 'user_profiles', name: 'User Profiles',
        description: 'Profil pengguna dengan foto, bio, dan daftar teman',
        group: 'core',
        requiredComponents: [
          { componentId: 'ui_component', amount: 2 },
          { componentId: 'backend_code', amount: 1 },
        ],
        baseTraffic: 50,
      },
      {
        id: 'news_feed', name: 'News Feed',
        description: 'Feed konten personal yang diperbarui terus-menerus',
        group: 'core',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'network_module', amount: 1 },
        ],
        baseTraffic: 200,
      },
      {
        id: 'messaging', name: 'Messaging',
        description: 'Fitur pesan instan antar pengguna',
        group: 'business',
        requiredComponents: [
          { componentId: 'network_module', amount: 3 },
          { componentId: 'backend_code', amount: 2 },
        ],
        baseTraffic: 150,
      },
      {
        id: 'photo_sharing', name: 'Photo Sharing',
        description: 'Unggah, filter, dan bagikan foto dengan mudah',
        group: 'engagement',
        requiredComponents: [
          { componentId: 'graphics_component', amount: 3 },
          { componentId: 'backend_code', amount: 2 },
          { componentId: 'ui_component', amount: 1 },
        ],
        baseTraffic: 180,
      },
      {
        id: 'stories', name: 'Stories',
        description: 'Konten sementara 24 jam yang hilang otomatis',
        group: 'engagement',
        requiredComponents: [
          { componentId: 'graphics_component', amount: 4 },
          { componentId: 'network_module', amount: 2 },
          { componentId: 'ui_component', amount: 2 },
        ],
        baseTraffic: 300,
      },
      {
        id: 'groups', name: 'Groups',
        description: 'Komunitas untuk minat dan hobi bersama',
        group: 'business',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'ui_component', amount: 2 },
          { componentId: 'network_module', amount: 2 },
        ],
        baseTraffic: 250,
      },
      {
        id: 'live_streaming', name: 'Live Streaming',
        description: 'Siaran video real-time ke pengikut',
        group: 'engagement',
        requiredComponents: [
          { componentId: 'network_module', amount: 4 },
          { componentId: 'graphics_component', amount: 3 },
          { componentId: 'backend_code', amount: 2 },
        ],
        baseTraffic: 400,
      },
      {
        id: 'ad_platform', name: 'Ad Platform Interface',
        description: 'Iklan terukur berbasis level fitur. Mengaktifkan tier Ads (linear) saat fitur aktif.',
        group: 'business',
        requiredComponents: [
          { componentId: 'backend_code', amount: 2 },
          { componentId: 'network_module', amount: 1 },
        ],
        baseTraffic: 100,
      },
    ],
    synergies: [
      {
        featureA: 'news_feed', featureB: 'user_profiles',
        description: 'Personalized feed berdasarkan profil',
        minLevel: 3, maxLevelGap: 2,
        trafficBonus: 0.15, revenueBonus: 0,
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
        id: 'product_listing', name: 'Product Listing',
        description: 'Katalog produk dengan pencarian dan filter',
        group: 'core',
        requiredComponents: [
          { componentId: 'ui_component', amount: 2 },
          { componentId: 'backend_code', amount: 2 },
        ],
        baseTraffic: 60,
      },
      {
        id: 'shopping_cart', name: 'Shopping Cart',
        description: 'Keranjang belanja dengan wishlist dan checkout',
        group: 'core',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'network_module', amount: 1 },
        ],
        baseTraffic: 150,
      },
      {
        id: 'payment_gateway', name: 'Payment Gateway',
        description: 'Sistem pembayaran multi-metode yang aman',
        group: 'core',
        requiredComponents: [
          { componentId: 'backend_code', amount: 4 },
          { componentId: 'network_module', amount: 3 },
          { componentId: 'ui_component', amount: 1 },
        ],
        baseTraffic: 250,
      },
      {
        id: 'review_system', name: 'Review System',
        description: 'Ulasan, rating, dan sistem reputasi penjual',
        group: 'business',
        requiredComponents: [
          { componentId: 'backend_code', amount: 2 },
          { componentId: 'ui_component', amount: 2 },
        ],
        baseTraffic: 100,
      },
      {
        id: 'recommendation_engine', name: 'Recommendation Engine',
        description: 'Rekomendasi produk berbasis data pengguna',
        group: 'business',
        requiredComponents: [
          { componentId: 'backend_code', amount: 5 },
          { componentId: 'network_module', amount: 3 },
        ],
        baseTraffic: 350,
      },
      {
        id: 'wishlist', name: 'Wishlist',
        description: 'Simpan favorit untuk dibeli nanti',
        group: 'engagement',
        requiredComponents: [
          { componentId: 'backend_code', amount: 1 },
          { componentId: 'ui_component', amount: 2 },
        ],
        baseTraffic: 80,
      },
      {
        id: 'seller_dashboard', name: 'Seller Dashboard',
        description: 'Analitik penjualan dan manajemen inventaris',
        group: 'engagement',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'ui_component', amount: 1 },
          { componentId: 'network_module', amount: 1 },
        ],
        baseTraffic: 200,
      },
    ],
    synergies: [
      {
        featureA: 'shopping_cart', featureB: 'payment_gateway',
        description: 'Seamless checkout experience',
        minLevel: 3, maxLevelGap: 2,
        trafficBonus: 0, revenueBonus: 0.1,
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
        id: 'web_crawler', name: 'Web Crawler',
        description: 'Crawler otomatis yang mengindeks jutaan halaman',
        group: 'core',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'network_module', amount: 2 },
        ],
        baseTraffic: 80,
      },
      {
        id: 'search_algorithm', name: 'Search Algorithm',
        description: 'Algoritma perankingan hasil pencarian',
        group: 'core',
        requiredComponents: [
          { componentId: 'backend_code', amount: 4 },
          { componentId: 'network_module', amount: 2 },
        ],
        baseTraffic: 300,
      },
      {
        id: 'index_builder', name: 'Index Builder',
        description: 'Sistem indexing cepat untuk hasil pencarian real-time',
        group: 'core',
        requiredComponents: [
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'network_module', amount: 3 },
        ],
        baseTraffic: 200,
      },
      {
        id: 'image_search', name: 'Image Search',
        description: 'Pencarian gambar dengan pengenalan visual',
        group: 'business',
        requiredComponents: [
          { componentId: 'graphics_component', amount: 3 },
          { componentId: 'backend_code', amount: 2 },
          { componentId: 'network_module', amount: 1 },
        ],
        baseTraffic: 150,
      },
      {
        id: 'maps_integration', name: 'Maps',
        description: 'Peta interaktif dengan navigasi dan pencarian lokal',
        group: 'engagement',
        requiredComponents: [
          { componentId: 'graphics_component', amount: 4 },
          { componentId: 'backend_code', amount: 4 },
          { componentId: 'network_module', amount: 2 },
          { componentId: 'ui_component', amount: 2 },
        ],
        baseTraffic: 400,
      },
      {
        id: 'voice_search', name: 'Voice Search',
        description: 'Pencarian suara dengan natural language processing',
        group: 'engagement',
        requiredComponents: [
          { componentId: 'network_module', amount: 3 },
          { componentId: 'backend_code', amount: 3 },
          { componentId: 'graphics_component', amount: 1 },
        ],
        baseTraffic: 250,
      },
      {
        id: 'analytics_dashboard', name: 'Analytics',
        description: 'Dashboard analitik pencarian dan tren',
        group: 'business',
        requiredComponents: [
          { componentId: 'backend_code', amount: 2 },
          { componentId: 'ui_component', amount: 1 },
          { componentId: 'graphics_component', amount: 1 },
        ],
        baseTraffic: 150,
      },
      {
        id: 'ad_platform', name: 'Ad Platform Interface',
        description: 'Iklan terukur berbasis level fitur. Mengaktifkan tier Ads (linear) saat fitur aktif.',
        group: 'business',
        requiredComponents: [
          { componentId: 'backend_code', amount: 2 },
          { componentId: 'network_module', amount: 1 },
        ],
        baseTraffic: 100,
      },
      {
        id: 'b2b_search_api', name: 'B2B Search API',
        description: 'API pencarian enterprise berpendapatan flat, terikat Data compliance ratio. Potensi penuh di fitur Lv.5.',
        group: 'business',
        requiredComponents: [
          { componentId: 'backend_code', amount: 4 },
          { componentId: 'network_module', amount: 2 },
        ],
        baseTraffic: 150,
      },
    ],
    synergies: [
      {
        featureA: 'search_algorithm', featureB: 'index_builder',
        description: 'Real-time indexing mempercepat hasil pencarian',
        minLevel: 3, maxLevelGap: 2,
        trafficBonus: 0.15, revenueBonus: 0,
      },
    ],
  },
];

export function getProductDef(id: string): ProductDef | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
