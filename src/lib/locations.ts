export type LocationGroup = {
  id: 'dubai' | 'abu-dhabi' | 'other-emirates';
  label: string;
  locations: readonly string[];
};

export const dubaiLocations = [
  'Al Qusais',
  'Muhaisnah',
  'Al Mizhar',
  'Mirdif',
  'Jumeirah Beach',
  'Dubai Marina',
  'Sheikh Zayed Road',
  'Dubai Media City',
  'Barsha Heights',
  'Dubai Internet City',
  'The Greens',
  'Emirates Living',
  'Palm Jumeirah',
  'The Gardens',
  'Jumeirah Park',
  'Jumeirah Islands',
  'Jumeirah Lakes Towers (JLT)',
  'Dubai Production City',
  'Jumeirah Golf Estates',
  'Dubai Sports City',
  'Arabian Ranches',
  'Dubai Investments Park (DIP)',
  'Falcon City of Wonders',
  'The Villa',
  'Dubailand',
  'Dubai Silicon Oasis',
  'Discovery Gardens',
  'International City',
  'Umm Suqeim',
  'Al Quoz',
  'Al Safa',
  'Business Bay',
  'Downtown Dubai',
  'Jumeirah',
  'DIFC',
  'Al Satwa',
  'Bur Dubai',
  'Oud Metha',
  'Al Karama',
  'Dubai Waterfront'
] as const;

export const abuDhabiLocations = [
  'Abu Dhabi',
  'Delma Street',
  'Al Karamah Street',
  'Reem Island',
  'Khalifa City',
  'Shakhbout City',
  'Al Bandar',
  'Al Zeina',
  'Al Reef',
  'Al Raha Beach',
  'Musaffah',
  'Mohammed Bin Zayed City',
  'Al Ghadeer'
] as const;

export const otherEmirateLocations = [
  'Ajman',
  'Sharjah',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
  'Al Ain'
] as const;

export const priorityCoverageLocations = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
  'Al Ain'
] as const;

export const footerDubaiLocations = [
  'Al Qusais',
  'Mirdif',
  'Dubai Marina',
  'Business Bay',
  'Downtown Dubai',
  'Al Quoz'
] as const;

export const footerUaeLocations = [
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Al Ain'
] as const;

export const uaeLocationGroups: readonly LocationGroup[] = [
  { id: 'dubai', label: 'Dubai areas', locations: dubaiLocations },
  { id: 'abu-dhabi', label: 'Abu Dhabi areas', locations: abuDhabiLocations },
  { id: 'other-emirates', label: 'Other UAE locations', locations: otherEmirateLocations }
];

export const emirateCoverageSummary = priorityCoverageLocations.join(', ');
