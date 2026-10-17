import { dubaiLocations } from './locations.ts';

/** Local guide destinations stay on this page until child pages are published. */
export const dubaiAreaGuides = [
  { id: 'al-quoz', name: 'Al Quoz', icon: 'sharjah', group: 'industrial', copy: 'For a car at a workshop or industrial yard, share the entrance, available space around the vehicle and who can authorise its release.' },
  { id: 'ras-al-khor', name: 'Ras Al Khor', icon: 'sharjah', group: 'industrial', copy: 'Include the exact yard or workshop position, gate restrictions and whether the vehicle can roll and steer. A site contact can help clarify access.' },
  { id: 'jebel-ali', name: 'Jebel Ali', icon: 'collection', group: 'industrial', copy: 'Tell us the specific site and any security or entry requirements. For a restricted site, access arrangements need to be reviewed before collection is agreed.' },
  { id: 'dubai-investments-park', name: 'Dubai Investments Park (DIP)', icon: 'sharjah', group: 'industrial', copy: 'Identify the premises, parking position and vehicle count. Share any loading-space restrictions, site permissions and the contact for handover.' },
  { id: 'al-qusais', name: 'Al Qusais', icon: 'access', group: 'neighbourhoods', copy: 'Whether the car is in residential parking or a workshop, describe the entrance, parking level and any obstacles between the car and the road.' }
] as const;

const industrialNames = ['Al Quoz', 'Dubai Investments Park (DIP)'];
const neighbourhoodNames = ['Al Qusais', 'Muhaisnah', 'Al Mizhar', 'Mirdif', 'Dubai Silicon Oasis', 'International City', 'Dubailand', 'The Villa', 'Arabian Ranches', 'Falcon City of Wonders'];
export const dubaiCoverageGroups = [
  { id: 'industrial', label: 'Industrial & yards', icon: 'sharjah', heading: 'Workshops, yards and commercial sites', copy: 'Al Quoz, Ras Al Khor, Jebel Ali and DIP each need precise site information. An area name is the starting point; access and release arrangements shape the collection plan.', areas: [...dubaiLocations.filter(area => industrialNames.includes(area)), 'Ras Al Khor', 'Jebel Ali'] },
  { id: 'neighbourhoods', label: 'Neighbourhoods', icon: 'access', heading: 'Residential areas and local parking', copy: 'Share the building or community, parking position and any gates or clearance limits. A vehicle on a driveway may need a different approach from one in a basement.', areas: dubaiLocations.filter(area => neighbourhoodNames.includes(area)) },
  { id: 'city-coast', label: 'City & coast', icon: 'dubai', heading: 'City streets, towers and coastal communities', copy: 'For tower parking and managed communities, include the parking level, visitor access and permission arrangements. Tell us whether the car can move from its current position.', areas: dubaiLocations.filter(area => !industrialNames.includes(area) && !neighbourhoodNames.includes(area)) }
];
