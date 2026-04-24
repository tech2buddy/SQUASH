import {
  Accessibility,
  Globe,
  Languages,
  ShoppingCart,
  Smartphone,
  UserPlus,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type TestCategoryId =
  | 'mobile-app-testing'
  | 'website-testing'
  | 'ecommerce-testing'
  | 'onboarding-testing'
  | 'accessibility-testing'
  | 'localization-testing'
  | 'low-data-testing'
  | 'performance-testing';

export type TestCategory = {
  id: TestCategoryId;
  name: string;
  description: string;
  color: string;
  icon: LucideIcon;
  saExclusive?: boolean;
};

// TODO: Replace with Supabase query
export const TEST_CATEGORIES: TestCategory[] = [
  {
    id: 'mobile-app-testing',
    name: 'Mobile App Testing',
    description: 'Android and iOS app testing',
    color: '#00C853',
    icon: Smartphone,
  },
  {
    id: 'website-testing',
    name: 'Website Testing',
    description: 'Desktop and mobile browser testing',
    color: '#3b82f6',
    icon: Globe,
  },
  {
    id: 'ecommerce-testing',
    name: 'E-commerce Testing',
    description: 'Checkout flows, cart and payment testing',
    color: '#f97316',
    icon: ShoppingCart,
  },
  {
    id: 'onboarding-testing',
    name: 'Onboarding Testing',
    description: 'First time user experience testing',
    color: '#14b8a6',
    icon: UserPlus,
  },
  {
    id: 'accessibility-testing',
    name: 'Accessibility Testing',
    description: 'Disability-friendly design testing',
    color: '#8b5cf6',
    icon: Accessibility,
  },
  {
    id: 'localization-testing',
    name: 'Localization Testing',
    description: 'SA language and regional testing',
    color: '#ec4899',
    icon: Languages,
    saExclusive: true,
  },
  {
    id: 'low-data-testing',
    name: 'Low Data Testing',
    description: 'Testing on 2G/3G network conditions',
    color: '#ef4444',
    icon: Wifi,
    saExclusive: true,
  },
  {
    id: 'performance-testing',
    name: 'Performance Testing',
    description: 'Speed, battery and data usage testing',
    color: '#eab308',
    icon: Zap,
  },
];

export function getCategoryById(id: TestCategoryId) {
  return TEST_CATEGORIES.find((category) => category.id === id) ?? TEST_CATEGORIES[0];
}

export function getCategoryByName(name: string) {
  return (
    TEST_CATEGORIES.find((category) => category.name.toLowerCase() === name.toLowerCase()) ??
    TEST_CATEGORIES[0]
  );
}

