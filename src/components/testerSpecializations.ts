export type SpecializationOption = {
  id: string;
  label: string;
};

export type SpecializationGroup = {
  id: string;
  title: string;
  options: SpecializationOption[];
};

// TODO: Replace with Supabase query
export const SPECIALIZATION_GROUPS: SpecializationGroup[] = [
  {
    id: 'device',
    title: 'Device Specializations',
    options: [
      { id: 'samsung-a-series', label: 'Samsung Galaxy (A-series)' },
      { id: 'samsung-s-series', label: 'Samsung Galaxy (S-series)' },
      { id: 'iphone-6-11', label: 'iPhone (older models 6-11)' },
      { id: 'iphone-12-plus', label: 'iPhone (newer models 12+)' },
      { id: 'huawei-honor', label: 'Huawei/Honor devices' },
      { id: 'budget-android', label: 'Budget Android (under R2,000)' },
      { id: 'desktop-laptop', label: 'Desktop / Laptop' },
    ],
  },
  {
    id: 'network',
    title: 'Network Conditions',
    options: [
      { id: 'township-network', label: 'Township/informal settlement network' },
      { id: 'rural-network', label: 'Rural area network' },
      { id: '2g-3g-only', label: '2G/3G only testing' },
      { id: 'lte-4g-5g', label: 'LTE / 4G / 5G testing' },
      { id: 'load-shedding', label: 'Load shedding conditions testing' },
    ],
  },
  {
    id: 'language',
    title: 'Language Skills',
    options: [
      { id: 'zulu', label: 'Zulu / isiZulu' },
      { id: 'xhosa', label: 'Xhosa / isiXhosa' },
      { id: 'sotho', label: 'Sotho / Sesotho' },
      { id: 'afrikaans', label: 'Afrikaans' },
      { id: 'english', label: 'English' },
      { id: 'venda', label: 'Venda / Tshivenda' },
      { id: 'tsonga', label: 'Tsonga / Xitsonga' },
    ],
  },
  {
    id: 'expertise',
    title: 'App Expertise',
    options: [
      { id: 'banking', label: 'Mobile banking apps' },
      { id: 'ecommerce', label: 'E-commerce / shopping apps' },
      { id: 'government', label: 'Government / civic apps' },
      { id: 'education', label: 'Education apps' },
      { id: 'health', label: 'Health and wellness apps' },
      { id: 'transport', label: 'Transport / taxi apps' },
    ],
  },
];

export function getSpecializationLabel(id: string) {
  for (const group of SPECIALIZATION_GROUPS) {
    const found = group.options.find((option) => option.id === id);
    if (found) return found.label;
  }
  return id;
}

export function getSpecializationIds() {
  return SPECIALIZATION_GROUPS.flatMap((group) => group.options.map((option) => option.id));
}

export function hasSaLanguageTag(selected: string[]) {
  return selected.some((id) =>
    ['zulu', 'xhosa', 'sotho', 'afrikaans', 'venda', 'tsonga'].includes(id),
  );
}

