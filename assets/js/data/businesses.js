/**
 * Every business shown on the site, in three groups kept apart deliberately:
 *
 *   clients      Businesses Pathway built for. Ours to claim.
 *   sanFrancisco Independent local businesses we feature and send customers
 *                to. We did not build these sites.
 *   featured     Reference builds from the wider small-business web, shown as
 *                examples of good work. Not ours either.
 *
 * Keep new entries in the right group: the labelling on the page depends on it.
 *
 * Locations. San Francisco entries carry a street address and exact
 * coordinates. Entries elsewhere carry only the place their source states, so
 * they sit at the centre of that place and are marked approximate. Businesses
 * with no stated location are simply left off the map; they still appear in
 * the list.
 */
(function (root) {
  'use strict';

  // key: [label, latitude, longitude, zoom]
  var PLACES = {
    "us": [
      "United States",
      39.8283,
      -98.5795,
      4
    ],
    "sanfrancisco": [
      "San Francisco, CA",
      37.7749,
      -122.4194,
      12
    ],
    "campbell": [
      "Campbell, CA",
      37.2872,
      -121.95,
      13
    ],
    "bayarea": [
      "Bay Area, CA",
      37.6688,
      -122.081,
      9
    ],
    "eastbay": [
      "East Bay, CA",
      37.8044,
      -122.2712,
      11
    ],
    "sandiego": [
      "San Diego County, CA",
      32.7157,
      -117.1611,
      10
    ],
    "orangecounty": [
      "Orange County, CA",
      33.7175,
      -117.8311,
      10
    ],
    "inlandempire": [
      "Inland Empire, CA",
      34.0633,
      -117.2898,
      10
    ],
    "visalia": [
      "Visalia, CA",
      36.3302,
      -119.2921,
      12
    ],
    "chicago": [
      "Chicago, IL",
      41.8781,
      -87.6298,
      11
    ],
    "berwyn": [
      "Berwyn, IL",
      41.8506,
      -87.7936,
      13
    ],
    "elgin": [
      "Elgin, IL",
      42.0354,
      -88.2826,
      12
    ],
    "tinley": [
      "Tinley Park, IL",
      41.5734,
      -87.7845,
      12
    ],
    "rockford": [
      "Rockford, IL",
      42.2711,
      -89.094,
      12
    ],
    "dallas": [
      "Dallas, TX",
      32.7767,
      -96.797,
      10
    ],
    "kansascity": [
      "Kansas City, MO",
      39.0997,
      -94.5786,
      11
    ],
    "michigan": [
      "Michigan",
      44.3148,
      -85.6024,
      7
    ],
    "macomb": [
      "Macomb County, MI",
      42.6722,
      -82.9,
      10
    ],
    "newjersey": [
      "New Jersey",
      40.0583,
      -74.4057,
      8
    ],
    "brooklyn": [
      "Brooklyn, NY",
      40.6782,
      -73.9442,
      12
    ],
    "maryland": [
      "Maryland",
      39.0458,
      -76.6413,
      8
    ],
    "southflorida": [
      "South Florida",
      26.1224,
      -80.1373,
      9
    ],
    "lasvegas": [
      "Las Vegas, NV",
      36.1699,
      -115.1398,
      11
    ],
    "norway": [
      "Norway",
      60.472,
      8.4689,
      5
    ]
  };

  var clientItems = [
    {"name":"Sunny Bay Daycare","domain":"sunnybaydaycare.com","url":"https://sunnybaydaycare.com","cat":"Childcare","area":"Mission Bay, San Francisco","address":"400 China Basin St, San Francisco, CA 94158","lat":37.7776,"lng":-122.3893,"image":"assets/img/clients/sunny.png","description":"Immigrant-owned daycare with a safe bilingual environment. We rebuilt their Google presence so local parents could find them.","metric":"130% more Google visibility"},
    {"name":"Jenara Wellness","domain":"jenarawellness.netlify.app","url":"https://jenarawellness.netlify.app","cat":"Wellness & spa","area":"Campbell, CA","address":"197 E Hamilton Ave #101, Campbell, CA 95008","lat":37.2946,"lng":-121.944,"image":"assets/img/clients/jen.png","description":"Holistic wellness studio. New site plus a cleaned-up local listing, now competitive for wellness searches in the South Bay.","metric":"Top 3 in local wellness search"},
    {"name":"Ben Blends","domain":"benblends.netlify.app","url":"https://benblends.netlify.app","cat":"Barbering","area":"San Francisco","address":"San Francisco, CA","lat":37.7749,"lng":-122.4194,"image":"assets/img/clients/ben.jpg","description":"Signature fades and precision cuts. We built a booking site so clients can find and book him online.","metric":"Online booking + social growth"}
  ];

  var clientPlace = {
    "sunnybaydaycare.com": "sanfrancisco",
    "jenarawellness.netlify.app": "campbell",
    "benblends.netlify.app": "sanfrancisco"
  };

  // name, domain, category, neighbourhood, address, lat, lng
  var sfLocal = [
    ["Zuni Café","zunicafe.com","Restaurant","Hayes Valley","1658 Market St, San Francisco, CA 94102",37.7726,-122.4219],
    ["Tartine Bakery","tartinebakery.com","Bakery","Mission","600 Guerrero St, San Francisco, CA 94110",37.7614,-122.4241],
    ["State Bird Provisions","statebirdsf.com","Restaurant","Fillmore","1529 Fillmore St, San Francisco, CA 94115",37.7838,-122.4327],
    ["Nopa","nopasf.com","Restaurant","NoPa","560 Divisadero St, San Francisco, CA 94117",37.775,-122.4375],
    ["Rich Table","richtablesf.com","Restaurant","Hayes Valley","199 Gough St, San Francisco, CA 94102",37.7748,-122.4226],
    ["Che Fico","chefico.com","Restaurant","Divisadero","838 Divisadero St, San Francisco, CA 94117",37.7768,-122.4378],
    ["Foreign Cinema","foreigncinema.com","Restaurant","Mission","2534 Mission St, San Francisco, CA 94110",37.7561,-122.4189],
    ["Californios","californiossf.com","Restaurant","SoMa","355 11th St, San Francisco, CA 94103",37.7715,-122.4133],
    ["Sons &amp; Daughters","sonsanddaughterssf.com","Restaurant","Nob Hill","708 Bush St, San Francisco, CA 94108",37.7901,-122.4085],
    ["Liholiho Yacht Club","lycsf.com","Restaurant","Lower Nob Hill","871 Sutter St, San Francisco, CA 94109",37.7877,-122.4155],
    ["Nari","narisf.com","Restaurant","Japantown","1625 Post St, San Francisco, CA 94115",37.7856,-122.4295],
    ["Kin Khao","kinkhao.com","Restaurant","Union Square","55 Cyril Magnin St, San Francisco, CA 94102",37.7857,-122.409],
    ["Mister Jiu's","misterjius.com","Restaurant","Chinatown","28 Waverly Pl, San Francisco, CA 94108",37.7944,-122.407],
    ["House of Prime Rib","houseofprimerib.net","Restaurant","Van Ness","1906 Van Ness Ave, San Francisco, CA 94109",37.7936,-122.4224],
    ["Flour + Water","flourandwater.com","Restaurant","Mission","2401 Harrison St, San Francisco, CA 94110",37.7586,-122.4124],
    ["Pizzeria Delfina","pizzeriadelfina.com","Restaurant","Mission","3611 18th St, San Francisco, CA 94110",37.7617,-122.4248],
    ["Lazy Bear","lazybearsf.com","Restaurant","Mission","3416 19th St, San Francisco, CA 94110",37.7601,-122.4198],
    ["Acquerello","acquerellosf.com","Restaurant","Polk Gulch","1722 Sacramento St, San Francisco, CA 94109",37.7909,-122.4213],
    ["Quince","quincerestaurant.com","Restaurant","Jackson Square","470 Pacific Ave, San Francisco, CA 94133",37.7973,-122.4034],
    ["Cotogna","cotognasf.com","Restaurant","Jackson Square","490 Pacific Ave, San Francisco, CA 94133",37.7973,-122.4031],
    ["Yank Sing","yanksing.com","Restaurant","SoMa","101 Spear St, San Francisco, CA 94105",37.7918,-122.3938],
    ["Tommaso's","tommasos.com","Restaurant","North Beach","1042 Kearny St, San Francisco, CA 94133",37.7981,-122.4062],
    ["Molinari Delicatessen","molinarisalame.com","Deli &amp; market","North Beach","373 Columbus Ave, San Francisco, CA 94133",37.7986,-122.4075],
    ["b. Patisserie","bpatisserie.com","Bakery","Lower Pac Heights","2821 California St, San Francisco, CA 94115",37.7877,-122.4409],
    ["Craftsman and Wolves","craftsman-wolves.com","Bakery","Mission","746 Valencia St, San Francisco, CA 94110",37.7601,-122.4216],
    ["Bob's Donuts","bobsdonutssf.com","Bakery","Polk Gulch","1621 Polk St, San Francisco, CA 94109",37.7907,-122.4207],
    ["Mitchell's Ice Cream","mitchellsicecream.com","Ice cream","Bernal Heights","688 San Jose Ave, San Francisco, CA 94110",37.742,-122.4234],
    ["Bi-Rite Market","biritemarket.com","Grocery &amp; market","Mission","3639 18th St, San Francisco, CA 94110",37.7616,-122.4254],
    ["Boudin Bakery","boudinbakery.com","Bakery","Fisherman's Wharf","160 Jefferson St, San Francisco, CA 94133",37.808,-122.4157],
    ["Devil's Teeth Baking Company","devilsteethbakingcompany.com","Bakery","Outer Sunset","3876 Noriega St, San Francisco, CA 94122",37.7537,-122.5017],
    ["Andytown Coffee Roasters","andytownsf.com","Coffee","Outer Sunset","3655 Lawton St, San Francisco, CA 94122",37.7561,-122.5024],
    ["Ritual Coffee Roasters","ritualcoffee.com","Coffee","Mission","1026 Valencia St, San Francisco, CA 94110",37.7565,-122.4212],
    ["Sightglass Coffee","sightglasscoffee.com","Coffee","SoMa","270 7th St, San Francisco, CA 94103",37.7767,-122.4085],
    ["Four Barrel Coffee","fourbarrelcoffee.com","Coffee","Mission","375 Valencia St, San Francisco, CA 94103",37.7671,-122.4221],
    ["Philz Coffee","philzcoffee.com","Coffee","Mission","3101 24th St, San Francisco, CA 94110",37.7524,-122.414],
    ["Wrecking Ball Coffee Roasters","wreckingballcoffee.com","Coffee","Cow Hollow","2271 Union St, San Francisco, CA 94123",37.7975,-122.437],
    ["Saint Frank Coffee","saintfrankcoffee.com","Coffee","Russian Hill","2340 Polk St, San Francisco, CA 94109",37.7981,-122.4224],
    ["Réveille Coffee Co.","reveillecoffee.com","Coffee","North Beach","200 Columbus Ave, San Francisco, CA 94133",37.7975,-122.4045],
    ["Anchor Brewing","anchorbrewing.com","Brewery","Potrero Hill","1705 Mariposa St, San Francisco, CA 94107",37.7644,-122.4005],
    ["Cellarmaker Brewing","cellarmakerbrewing.com","Brewery","SoMa","1150 Howard St, San Francisco, CA 94103",37.7767,-122.411],
    ["Fort Point Beer Company","fortpointbeer.com","Brewery","Mission Bay","644 Mission Rock St, San Francisco, CA 94158",37.769,-122.3903],
    ["Barebottle Brewing","barebottle.com","Brewery","Bernal Heights","1525 Cortland Ave, San Francisco, CA 94110",37.7392,-122.4133],
    ["Laughing Monk Brewing","taproom.laughingmonk.com","Brewery","Bayview","1439 Egbert Ave, San Francisco, CA 94124",37.726,-122.395],
    ["Trick Dog","trickdogbar.com","Bar","Mission","3010 20th St, San Francisco, CA 94110",37.7594,-122.4113],
    ["Smuggler's Cove","smugglerscovesf.com","Bar","Hayes Valley","650 Gough St, San Francisco, CA 94102",37.7793,-122.4232],
    ["Comstock Saloon","comstocksaloon.com","Bar","North Beach","155 Columbus Ave, San Francisco, CA 94133",37.7975,-122.4042],
    ["Zeitgeist","zeitgeistsf.com","Bar","Mission","199 Valencia St, San Francisco, CA 94103",37.7699,-122.4222],
    ["ABV","abvsf.com","Bar","Mission","3174 16th St, San Francisco, CA 94103",37.7648,-122.4245]
  ];

  // name, domain, what the business does
  var exampleSites = [
    ["El Fuego","elfuegotinley.jkellysites.com","Mexican restaurant"],
    ["La Bomba","labomba.jkellysites.com","Puerto Rican restaurant"],
    ["Knickerbocker Baking Company","knickerbocker365.jkellysites.com","Bread bakery"],
    ["Aramso Kebab","aramso.no","Food brand"],
    ["Vida Cafe","vidacafe.jkellysites.com","Coffee shop"],
    ["Shagf Cafe Las Vegas","shagfcafejv.jkellysites.com","Specialty cafe"],
    ["Vines Hair Studio","vinesstudio.com","Hair studio"],
    ["The Vault Barbershop","thevaultbarbers.com","Barbershop"],
    ["Essntl Barbershop","essntlbarbershop.com","Barbershop"],
    ["Dmoneychopz","dmoneychopz.com","Private barber"],
    ["Ponch Blendz","ponchblendz.com","Barbershop"],
    ["Ace Barbershop","acehairstudio.jkellysites.com","Barbershop"],
    ["The Mug &amp; Brush Barbershop","mugbrushbarbershop.jkellysites.com","Barbershop"],
    ["Nilou Med Spa","niloumedspa.jkellysites.com","Medical spa"],
    ["Nail Salon","nailsalon.jkellysites.com","Nail salon"],
    ["Shape Chicago","shapechicago.jkellysites.com","Body sculpting"],
    ["Northwood Chiropractic Clinic","northwoodchiroclinic.com","Chiropractic clinic"],
    ["Love Healing You","lovehealingyou.com","Relationship coaching"],
    ["Mentality Life","mentalitylife.com","Sales agency"],
    ["Zig Team","zigteam.com","Industrial company"],
    ["Patty Real Estate","pattyrealtor.jkellysites.com","Real estate"],
    ["The Modern Caddie","themoderncaddie.jkellysites.com","Golf caddie service"],
    ["Rodeo Bounce Entertainment","rodeobounce.com","Party rentals"],
    ["Esizzle Boxing","esizzleboxing.jkellysites.com","Professional boxing"],
    ["NXT Trading","nxttrading.jkellysites.com","Trading education"],
    ["Skyline Equipment Rentals","skyline.jkellysites.com","Equipment rental"],
    ["Crystal Clean Detailing","crystalcleandet.com","Auto detailing"],
    ["J&amp;A Auto Detailing","jaautodetailing.com","Mobile auto detailing"],
    ["Run One Auto Spa","runoneautospa.jkellysites.com","Auto detailing"],
    ["Exclusive Detailing","exclusivedetailing.jkellysites.com","Auto detailing"],
    ["Deluxe Auto Spa","deluxeauto.jkellysites.com","Auto detailing"],
    ["Mr. Bee's Auto Care","mrbeesautocarenj.com","Auto care"],
    ["Prestige Transportation","prestigetransportationent.com","Luxury transportation"],
    ["Leyva Concrete","leyvaconcreteinc.com","Concrete contractor"],
    ["Diaz Concrete &amp; Pumping","diazconcretepumping.com","Concrete contractor"],
    ["Elite Cover Roofing","elitecoverroofing.com","Roofing contractor"],
    ["Summerland Roofing","summerlandroofing.jkellysites.com","Roofing contractor"],
    ["Freedom Roofing KC","freedomroofing.jkellysites.com","Roofing company"],
    ["Cado Construction","cado.jkellysites.com","Construction company"],
    ["G3 Construction Group","g3constructiongroup.jkellysites.com","Design-build contractor"],
    ["Morales and Sons","moralesandsonls.com","Landscaping"],
    ["Enhanced Flooring","enhancedflooring.jkellysites.com","Flooring installation"],
    ["Wavy Resins","wavyresins.jkellysites.com","Epoxy flooring"],
    ["Plumbing Pros","plumbingpros.jkellysites.com","Plumbing services"],
    ["PickALock","pickalock.jkellysites.com","Automotive locksmith"],
    ["Tandy's Window Services","tandys.jkellysites.com","Window cleaning"],
    ["Urbina's Master Sweeping","urbinas.jkellysites.com","Street sweeping"],
    ["Doggie Duty Disposal","doggiedutydisposal.com","Pet waste removal"],
    ["JB's Movers","jbsmovers.jkellysites.com","Moving services"],
    ["Rugged Fresh Laundry","ruggedfreshlaundry.com","Laundry brand"],
    ["Vines33","vines33.com","Hair product brand"],
    ["CE Jewelry","cejewelry.jkellysites.com","Jewelry brand"],
    ["House of Dubai","houseofdubai.jkellysites.com","Cologne &amp; perfumes"],
    ["Phantom Musk","phantommusk.jkellysites.com","Fragrance shop"],
    ["Davranov","davranov.jkellysites.com","Handmade leather goods"],
    ["KTD Supply Co","ktd.jkellysites.com","Sneaker reseller"],
    ["MostKnown SNKRS","mostknownsnkrs.jkellysites.com","Sneaker reseller"],
    ["Apex Peptides","apex.jkellysites.com","Research peptides"],
    ["Midnight Labz Research","midnightlabz.jkellysites.com","Research peptides"],
    ["Phit Pharmx","phitpharmx.com","Research peptides"]
  ];

  var featuredPlace = {
    "elfuegotinley.jkellysites.com": "tinley",
    "knickerbocker365.jkellysites.com": "michigan",
    "aramso.no": "norway",
    "shagfcafejv.jkellysites.com": "lasvegas",
    "thevaultbarbers.com": "visalia",
    "essntlbarbershop.com": "berwyn",
    "dmoneychopz.com": "orangecounty",
    "acehairstudio.jkellysites.com": "elgin",
    "shapechicago.jkellysites.com": "chicago",
    "g3constructiongroup.jkellysites.com": "chicago",
    "rodeobounce.com": "rockford",
    "jbsmovers.jkellysites.com": "rockford",
    "skyline.jkellysites.com": "dallas",
    "crystalcleandet.com": "macomb",
    "mrbeesautocarenj.com": "newjersey",
    "diazconcretepumping.com": "bayarea",
    "elitecoverroofing.com": "southflorida",
    "freedomroofing.jkellysites.com": "kansascity",
    "enhancedflooring.jkellysites.com": "inlandempire",
    "urbinas.jkellysites.com": "sandiego",
    "doggiedutydisposal.com": "eastbay",
    "davranov.jkellysites.com": "brooklyn",
    "ktd.jkellysites.com": "maryland"
  };

  var groups = {
    pathway: {
      badge: 'Built by Pathway',
      title: 'Built by Pathway',
      note: 'Websites, Google profiles and social accounts we built and handed over to the owner. Free for them, and theirs to keep.'
    },
    sf: {
      badge: 'San Francisco',
      title: 'San Francisco businesses we support',
      note: 'Independent local businesses we feature and send customers to. These are not our builds \u2014 we point people to them because they are worth visiting.'
    },
    example: {
      badge: 'Featured build',
      title: 'More small-business sites',
      note: 'Reference builds from the wider small-business web, collected as examples of what a good site looks like. Not built by Pathway.'
    }
  };

  // A stable file-safe name per business, used for its preview image.
  function slug(domain) {
    return domain.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  }

  function placeLabel(key) {
    return PLACES[key] ? PLACES[key][0] : '';
  }

  var directory = []
    .concat(clientItems.map(function (c) {
      var key = clientPlace[c.domain];
      return {
        group: 'pathway', name: c.name, url: c.url, domain: c.domain,
        meta: c.cat + ' \u00b7 ' + c.area, address: c.address,
        lat: c.lat, lng: c.lng, precise: true, place: key,
        image: c.image, description: c.description, metric: c.metric
      };
    }))
    .concat(sfLocal.map(function (row) {
      return {
        group: 'sf', name: row[0], url: 'https://' + row[1], domain: row[1],
        meta: row[2] + ' \u00b7 ' + row[3], address: row[4],
        lat: row[5], lng: row[6], precise: true, place: 'sanfrancisco',
        image: 'assets/img/previews/' + slug(row[1]) + '.jpg'
      };
    }))
    .concat(exampleSites.map(function (row) {
      var key = featuredPlace[row[1]] || null;
      var spot = key ? PLACES[key] : null;
      return {
        group: 'example', name: row[0], url: 'https://' + row[1], domain: row[1],
        meta: row[2] + (spot ? ' \u00b7 ' + spot[0] : ''),
        address: spot ? spot[0] : null,
        lat: spot ? spot[1] : undefined,
        lng: spot ? spot[2] : undefined,
        precise: false,
        place: key,
        image: 'assets/img/previews/' + slug(row[1]) + '.jpg'
      };
    }));

  /**
   * Places that actually have businesses, biggest first, so the selector can
   * show one entry per city rather than a hundred pins in one spot.
   */
  function placesFor(items) {
    var counts = {};
    items.forEach(function (item) {
      if (!item.place) return;
      counts[item.place] = (counts[item.place] || 0) + 1;
    });
    return Object.keys(counts).map(function (key) {
      return {
        key: key,
        label: PLACES[key][0],
        lat: PLACES[key][1],
        lng: PLACES[key][2],
        zoom: PLACES[key][3],
        count: counts[key]
      };
    }).sort(function (a, b) {
      return b.count - a.count || a.label.localeCompare(b.label);
    });
  }

  var api = {
    clients: clientItems,
    sanFrancisco: sfLocal,
    featured: exampleSites,
    directory: directory,
    groups: groups,
    places: PLACES,
    placeLabel: placeLabel,
    placesFor: placesFor,
    slug: slug
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.Pathway = root.Pathway || {}; root.Pathway.data = api; }
})(typeof window !== 'undefined' ? window : globalThis);
