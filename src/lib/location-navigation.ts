/** Published location navigation shared by the desktop and mobile header. */
export const locationOverview = { href: '/locations/', label: 'All UAE Locations', icon: 'ph-map-trifold' } as const;

export const locationGroups = [
  { id: 'dubai', label: 'Dubai', icon: 'ph-buildings', items: [
    { href: '/locations/dubai/', label: 'Dubai overview' },
    { href: '/locations/dubai/al-quoz/', label: 'Al Quoz' },
    { href: '/locations/dubai/ras-al-khor/', label: 'Ras Al Khor' },
    { href: '/locations/dubai/jebel-ali/', label: 'Jebel Ali' },
    { href: '/locations/dubai/dubai-investments-park/', label: 'Dubai Investments Park' },
    { href: '/locations/dubai/al-qusais/', label: 'Al Qusais' }
  ] },
  { id: 'abu-dhabi', label: 'Abu Dhabi', icon: 'ph-map-pin', items: [
    { href: '/locations/abu-dhabi/', label: 'Abu Dhabi overview' },
    { href: '/locations/abu-dhabi/musaffah/', label: 'Musaffah' },
    { href: '/locations/abu-dhabi/mohammed-bin-zayed-city/', label: 'Mohammed Bin Zayed City' },
    { href: '/locations/abu-dhabi/khalifa-city/', label: 'Khalifa City' }
  ] },
  { id: 'sharjah', label: 'Sharjah', icon: 'ph-warehouse', items: [
    { href: '/locations/sharjah/', label: 'Sharjah overview' },
    { href: '/locations/sharjah/sajaa/', label: 'Sajaa / Al Sajaa' },
    { href: '/locations/sharjah/industrial-area/', label: 'Sharjah Industrial Area' }
  ] },
  { id: 'other', label: 'Other UAE Locations', icon: 'ph-map-trifold', items: [
    { href: '/locations/ajman/', label: 'Ajman' },
    { href: '/locations/ras-al-khaimah/', label: 'Ras Al Khaimah' },
    { href: '/locations/al-ain/', label: 'Al Ain' },
    { href: '/locations/fujairah/', label: 'Fujairah' },
    { href: '/locations/umm-al-quwain/', label: 'Umm Al Quwain' }
  ] }
] as const;

export const isLocationPageActive = (pathname: string, href: string) =>
  pathname.replace(/\/$/, '') === href.replace(/\/$/, '');

export const isLocationGroupActive = (pathname: string, group: typeof locationGroups[number]) =>
  group.items.some(item => isLocationPageActive(pathname, item.href));
