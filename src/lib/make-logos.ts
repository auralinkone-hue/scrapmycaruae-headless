const logoByMake: Record<string, string> = {
  TOYOTA: '/brands/toyota.svg',
  NISSAN: '/brands/nissan.svg',
  'MERCEDES-BENZ': '/brands/mercedes.svg',
  BMW: '/brands/bmw.svg',
  HONDA: '/brands/honda.svg',
  LEXUS: '/brands/lexus.svg',
  MITSUBISHI: '/brands/mitsubishi.svg',
  HYUNDAI: '/brands/hyundai.svg'
};

export const makeLogoForName = (name: string) => logoByMake[name.trim().toUpperCase()];
