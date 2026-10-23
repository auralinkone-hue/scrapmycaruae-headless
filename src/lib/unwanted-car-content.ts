export const unwantedCarTitle = 'Sell Unwanted Car in UAE | Free Valuation | Scrap My Car UAE';
export const unwantedCarDescription = 'Sell an unwanted or unused car in the UAE. Request a free valuation for a spare, long-parked or non-running vehicle and discuss practical collection arrangements.';
export const unwantedCarConditions = [
  { id: 'drives', icon: 'ph-steering-wheel', label: 'Still drives normally', title: 'No longer needed can still mean useful.', text: 'A running spare car may have resale potential. Share its make, model, year, mileage and service history rather than assuming it belongs in a scrapyard.', href: '/sell-my-car/', link: 'Explore selling your car', note: 'Useful detail: recent use and service history.' },
  { id: 'parked', icon: 'ph-clock-counter-clockwise', label: 'Parked and unused', title: 'Start with how long it has been sitting.', text: 'Months or years without use can leave battery, tyre or fluid issues. Describe the last time it ran, its present condition and the parking position. You do not need to start it to request a valuation.', href: '/car-removal/', link: 'Read about collection access', note: 'Useful detail: time parked, available keys and access.' },
  { id: 'repairs', icon: 'ph-wrench', label: 'Requires expensive repairs', title: 'Compare the next repair with moving on.', text: 'Rising maintenance bills can make an otherwise familiar car unwanted. Share known faults and any existing repair estimate; a valuation helps you consider your options without committing to more work.', href: '/sell-my-car/', link: 'Understand the selling options', note: 'Useful detail: known faults and existing estimates.' },
  { id: 'body', icon: 'ph-car-profile', label: 'Body or cosmetic damage', title: 'Show the wear as it is.', text: 'Faded paint, parking dents and bumper scuffs tell part of the story. Explain any accident history and mechanical issues too, so cosmetic wear is not confused with the overall state of the vehicle.', href: '/sell-damaged-car/', link: 'See damaged-car guidance', note: 'Useful detail: clear photographs and known damage.' },
  { id: 'no-start', icon: 'ph-power', label: 'No longer starts', title: 'A no-start car needs an individual review.', text: 'A car left unused may have a flat battery or a more substantial fault. Tell us what you know without guessing a diagnosis. Do not drive or attempt to move an unsafe vehicle for a valuation.', href: '/sell-non-running-car/', link: 'Explore non-running car options', note: 'Useful detail: last running date and symptoms.' },
  { id: 'deteriorated', icon: 'ph-recycle', label: 'Heavily deteriorated', title: 'Condition helps determine the right route.', text: 'Extensive deterioration, missing parts or several unresolved faults may make a scrap assessment more appropriate. The team reviews the vehicle before discussing a sale, collection or scrapping arrangements.', href: '/scrap-old-car/', link: 'Read the old-car scrap guide', note: 'Useful detail: missing parts and available paperwork.' }
] as const;

const sedanPhoto = (base: string, alt: string) => ({
  src: `/sections/${base}-640.webp`,
  srcset: `/sections/${base}-640.webp 640w, /sections/${base}-960.webp 960w`,
  width: 960, height: 640, alt
});
export const unwantedConditionPhotos = {
  drives: sedanPhoto('nissan-altima-workshop', 'Used silver family sedan parked outside a UAE workshop'),
  parked: sedanPhoto('hyundai-elantra-valuation', 'Older silver sedan with visible wear parked on a UAE forecourt'),
  repairs: { src: '/sections/gearbox-inspection-workshop.webp', srcset: '', width: 1200, height: 900, alt: 'A worn gearbox being examined on a workshop bench' },
  body: sedanPhoto('honda-accord-valuation', 'Silver family sedan with a dented front wing and bumper scuffs'),
  'no-start': sedanPhoto('mitsubishi-lancer-valuation', 'Used silver sedan awaiting a condition assessment at a UAE forecourt'),
  deteriorated: { src: '/sections/older-worn-car-uae.webp', srcset: '', width: 1536, height: 1024, alt: 'Older silver sedan with faded paint, worn headlights and bumper wear' }
} as const;

export const unwantedCarFaqs = [
  ['Can I sell an unwanted car that still runs?', 'Yes, you can request a valuation for a running second car or an older vehicle you no longer need. Unwanted describes your circumstances, not a scrap classification. The team assesses its condition before discussing an offer or next steps.'],
  ['Can a car parked for months or years still have value?', 'It may. Make, model, year, completeness and current condition matter alongside time unused. Share how long it has been parked, when it last ran and any known faults. A long parking period does not establish a fixed value.'],
  ['Can I request a valuation if the unwanted car no longer starts?', 'Yes. You can submit its vehicle details without repairing or starting it first. Explain the no-start condition, available keys and whether the wheels can move when discussing practical recovery options.'],
  ['Is an unwanted car always bought as scrap?', 'No. A usable car may be considered for resale, while a heavily deteriorated vehicle may be more suitable for a scrap assessment. The decision depends on its individual condition and circumstances, not simply its age or the fact that it is unused.'],
  ['Can you collect an unwanted vehicle from my parking space?', 'Collection can be discussed across supported UAE locations. Tell the team about basement height restrictions, locked wheels, flat tyres, available keys and any access permission needed. Collection is arranged only when practical and agreed.'],
  ['What paperwork should I check before selling a long-parked car?', 'Have the available Mulkiya, ownership information and identification ready for the discussion. Expired registration, outstanding finance or restrictions may affect handover. Confirm the applicable traffic authority and lender requirements for the vehicle before proceeding. A valuation does not replace those requirements.'],
  ['Do I have to accept the valuation or an offer?', 'No. A valuation request starts an assessment; it is not an accepted purchase offer or a booking for collection. Review the proposed terms and decide whether you want to proceed before agreeing a handover.'],
  ['Is the valuation free, and are there collection costs?', 'Submitting the valuation request is free. Any collection, recovery or other charges depend on the vehicle, access and agreed arrangements. Ask the team to confirm the proposed costs and terms before accepting an offer or arranging collection.']
] as const;
