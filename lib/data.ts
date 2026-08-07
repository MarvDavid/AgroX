import { Product } from '@/types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'ag-1',
    name: 'Organic Fresh Yellow Maize',
    category: 'Grains & Cereals',
    price: 45.00,
    originalPrice: 52.00,
    unit: 'bag (50kg)',
    rating: 4.8,
    reviewsCount: 124,
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800',
    description: 'Premium grade sun-dried yellow maize harvested directly from sustainable farms. Dried to 12% moisture content suitable for storage or processing.',
    seller: {
      id: 's-101',
      name: 'SunValley Grain Farms',
      location: 'Oyo State, Nigeria',
      verified: true,
      rating: 4.9
    },
    inStock: true,
    stockCount: 450,
    isOrganic: true,
    featured: true,
    tags: ['Corn', 'Maize', 'Grain', 'Bulk']
  },
  {
    id: 'ag-2',
    name: 'Fresh Harvest Roma Tomatoes',
    category: 'Fresh Produce',
    price: 28.50,
    originalPrice: 34.00,
    unit: 'crate (25kg)',
    rating: 4.7,
    reviewsCount: 89,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
    description: 'Farm-fresh firm red Roma tomatoes. Plucked at peak ripeness, rich in flavor, ideal for retail distribution and food processing.',
    seller: {
      id: 's-102',
      name: 'GreenField Produce Co.',
      location: 'Plateau State, Nigeria',
      verified: true,
      rating: 4.8
    },
    inStock: true,
    stockCount: 120,
    isOrganic: true,
    featured: true,
    tags: ['Tomato', 'Fresh', 'Vegetable']
  },
  {
    id: 'ag-3',
    name: 'Hybrid Tomato Seeds (F1 Resistance)',
    category: 'Seeds & Seedlings',
    price: 15.00,
    unit: 'pack (500 seeds)',
    rating: 4.9,
    reviewsCount: 67,
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800',
    description: 'High-yield hybrid tomato seeds with high resistance to wilt and leaf curl viruses. Fast germination rate guaranteed above 95%.',
    seller: {
      id: 's-103',
      name: 'AgroSeed Innovations',
      location: 'Kaduna, Nigeria',
      verified: true,
      rating: 4.95
    },
    inStock: true,
    stockCount: 850,
    isOrganic: false,
    featured: true,
    tags: ['Seeds', 'Tomato', 'Hybrid', 'Farming']
  },
  {
    id: 'ag-4',
    name: 'Bio-Organic NPK 15-15-15 Fertilizer',
    category: 'Fertilizers & Soil',
    price: 38.00,
    originalPrice: 42.00,
    unit: 'bag (50kg)',
    rating: 4.6,
    reviewsCount: 210,
    image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=800',
    description: 'Balanced compound fertilizer providing nitrogen, phosphorus, and potassium for accelerated crop growth and soil nutrient enrichment.',
    seller: {
      id: 's-104',
      name: 'TerraNutri Agri Supplies',
      location: 'Kano, Nigeria',
      verified: true,
      rating: 4.7
    },
    inStock: true,
    stockCount: 300,
    isOrganic: true,
    featured: false,
    tags: ['Fertilizer', 'NPK', 'Soil', 'Nutrients']
  },
  {
    id: 'ag-5',
    name: 'Heavy Duty Walk-Behind Knapsack Sprayer (20L)',
    category: 'Farm Equipment',
    price: 65.00,
    originalPrice: 75.00,
    unit: 'unit',
    rating: 4.85,
    reviewsCount: 54,
    image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=800',
    description: 'Ergonomic 20-liter manual pressure sprayer with brass nozzle attachments, corrosion-resistant tank, and adjustable padded shoulder straps.',
    seller: {
      id: 's-105',
      name: 'Mechanized Agri Hardware',
      location: 'Lagos, Nigeria',
      verified: true,
      rating: 4.9
    },
    inStock: true,
    stockCount: 75,
    isOrganic: false,
    featured: true,
    tags: ['Tools', 'Sprayer', 'Equipment']
  },
  {
    id: 'ag-6',
    name: 'High-Protein Broiler Starter Feed',
    category: 'Livestock & Poultry',
    price: 32.00,
    unit: 'bag (25kg)',
    rating: 4.75,
    reviewsCount: 142,
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=800',
    description: 'Nutritionally formulated poultry starter mash with essential amino acids, vitamins, and minerals for fast chick weight gain.',
    seller: {
      id: 's-106',
      name: 'Apex Poultry Feeds',
      location: 'Ogun State, Nigeria',
      verified: true,
      rating: 4.8
    },
    inStock: true,
    stockCount: 500,
    isOrganic: false,
    featured: false,
    tags: ['Poultry', 'Feed', 'Livestock']
  }
];

export const CATEGORIES = [
  'All',
  'Fresh Produce',
  'Grains & Cereals',
  'Seeds & Seedlings',
  'Fertilizers & Soil',
  'Farm Equipment',
  'Livestock & Poultry'
] as const;
