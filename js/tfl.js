// ── TfL API wrapper ──────────────────────────────────────────────────────────
// Docs: https://api.tfl.gov.uk
// Get a free API key at: https://api.tfl.gov.uk/swagger/ui/index.html
// Add your key to js/config.js

window.TFL = (() => {

  const BASE = 'https://api.tfl.gov.uk';

  function qs(params) {
    const p = { ...params };
    if (window.TFL_CONFIG && window.TFL_CONFIG.appKey) {
      p.app_key = window.TFL_CONFIG.appKey;
    }
    return '?' + new URLSearchParams(p).toString();
  }

  async function get(path, params = {}) {
    const res = await fetch(BASE + path + qs(params));
    if (!res.ok) throw new Error(`TfL ${res.status}: ${res.statusText}`);
    return res.json();
  }

  // ── Line statuses ────────────────────────────────────────────────────────
  async function lineStatuses() {
    const lines = [
      'bakerloo','central','circle','district','elizabeth',
      'hammersmith-city','jubilee','metropolitan','northern',
      'piccadilly','victoria','waterloo-city','dlr','london-overground','tram'
    ];
    return get(`/Line/${lines.join(',')}/Status`);
  }

  // ── Journey planner ──────────────────────────────────────────────────────
  async function planJourney(from, to, time, timeIs = 'Departing') {
    const params = { from, to, timeIs };
    if (time) params.time = time;  // HHMM format
    return get('/Journey/JourneyResults/' + encodeURIComponent(from) + '/to/' + encodeURIComponent(to), params);
  }

  // ── Stop search ──────────────────────────────────────────────────────────
  async function searchStops(query) {
    return get('/StopPoint/Search/' + encodeURIComponent(query), {
      modes: 'tube,elizabeth-line,dlr,overground,bus',
      maxResults: 5
    });
  }

  // ── Arrivals by lat/lon ──────────────────────────────────────────────────
  async function nearbyStops(lat, lon, radius = 500) {
    return get('/StopPoint', {
      lat, lon,
      stopTypes: 'NaptanMetroStation,NaptanRailStation,NaptanPublicBusCoachTram',
      radius,
      useStopPointHierarchy: false,
      modes: 'tube,elizabeth-line,dlr,overground,bus',
      returnLines: true
    });
  }

  async function arrivals(stopId) {
    return get(`/StopPoint/${stopId}/Arrivals`);
  }

  return { lineStatuses, planJourney, searchStops, nearbyStops, arrivals };

})();

// ── Tube line colours ────────────────────────────────────────────────────────
window.LINE_COLOURS = {
  'bakerloo':          '#894e24',
  'central':           '#e1251b',
  'circle':            '#ffd329',
  'district':          '#007229',
  'elizabeth':         '#6950a1',
  'hammersmith-city':  '#f3a9bb',
  'jubilee':           '#a1a5a7',
  'metropolitan':      '#9b0056',
  'northern':          '#000000',
  'piccadilly':        '#003688',
  'victoria':          '#0098d4',
  'waterloo-city':     '#93ceba',
  'dlr':               '#00a4a7',
  'london-overground': '#ee7c0e',
  'tram':              '#66cc00'
};

window.LINE_NAMES = {
  'bakerloo':          'Bakerloo',
  'central':           'Central',
  'circle':            'Circle',
  'district':          'District',
  'elizabeth':         'Elizabeth',
  'hammersmith-city':  'Hammersmith & City',
  'jubilee':           'Jubilee',
  'metropolitan':      'Metropolitan',
  'northern':          'Northern',
  'piccadilly':        'Piccadilly',
  'victoria':          'Victoria',
  'waterloo-city':     'Waterloo & City',
  'dlr':               'DLR',
  'london-overground': 'Overground',
  'tram':              'Tram'
};
