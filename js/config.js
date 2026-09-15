// ════════════════════════════════════════════════════════════
//  MY LONDON TRANSIT — Configuration
// ════════════════════════════════════════════════════════════
//
//  HOW TO GET YOUR FREE TfL API KEY:
//  1. Go to https://api.tfl.gov.uk
//  2. Click "Register" (top right)
//  3. Fill in name + email — it's free, no card needed
//  4. Check your email and confirm your account
//  5. Log in → go to "My Applications" → "Register Application"
//  6. Give it any name (e.g. "My Transit App") → Submit
//  7. Copy the "App Key" shown — it looks like: a1b2c3d4e5f6...
//  8. Paste it below between the quotes
//
// ════════════════════════════════════════════════════════════

window.TFL_CONFIG = {

  // ← PASTE YOUR TfL APP KEY HERE:
  appKey: 'c3d46f90760446e2beccee2bb4b435de',

  // Your usual starting station when in London:
  defaultFrom: "King's Cross St. Pancras",

  // IDs of attractions to pin to the top of the Explore tab.
  // Options: 'nhm','sciencemuseum','britishmuseum','victoria-albert',
  //          'tate-modern','national-gallery','museum-london',
  //          'tower-london','london-eye','sea-life','harry-potter',
  //          'kew-gardens','zoo','hyde-park','greenwich','south-bank',
  //          'olympic-park','west-end','covent-garden','windsor','hampton-court'
  favouriteAttractions: ['nhm', 'tower-london', 'harry-potter', 'zoo']

};
