# path

The website for **Pathway**, which builds websites, Google Business listings and
social media accounts for immigrant-owned businesses and hands every account
over to the owner. Free for the first 20 businesses.

Five pages: Home, About, How it works, Businesses, Contact.

## Running it

It is a static site with no build step and no dependencies.

```
npx serve .
```

Then open the address it prints. You can also open `index.html` directly — the
scripts are plain classic scripts rather than ES modules precisely so that
double-clicking the file still works.

## Layout

```
index.html                     markup only
assets/
  css/
    tokens.css                 colours, type scale, spacing, radii
    base.css                   reset and base typography
    layout.css                 header, nav, sections, footer
    components.css             buttons, cards, directory, map, FAQ
    pages.css                  loading screen, hero, scroll reveal
  js/
    data/businesses.js         every business, and the places they sit in
    ui/preloader.js            loading screen
    ui/reveal.js               reveal on scroll
    ui/nav.js                  header and mobile menu
    ui/faq.js                  disclosure rows
    ui/router.js               #/page routing
    ui/translate.js            language menu over Google Translate
    features/directory.js      search, filters, business cards
    features/map.js            the map and its place selector
    main.js                    boots the modules
  img/
    clients/                   photos of the sites Pathway built
    previews/                  captured homepage previews
tools/
  capture-previews.js          regenerates the preview images
  smoke-test.js                drives the real page and checks it works
```

Scripts attach themselves to a single `window.Pathway` namespace and are loaded
with `defer`, so load order is the order in `index.html`. `main.js` starts each
module inside a try/catch: one broken feature cannot take the page down.

## The data

`assets/js/data/businesses.js` holds three groups, kept apart deliberately:

| Group | What it is |
| --- | --- |
| `clientItems` | Businesses Pathway built for. Ours to claim. |
| `sfLocal` | San Francisco businesses we feature and send customers to. **Not our builds.** |
| `exampleSites` | Reference builds from the wider small-business web. **Not ours either.** |

The page prints a heading and a badge for each group saying which is which.
Keep new entries in the right group; the labelling depends on it.

The file works in both the browser and Node, so the tools can read the same
data the page does.

### Adding a business

```js
// sfLocal — name, domain, category, neighbourhood, address, lat, lng
["Zuni Café", "zunicafe.com", "Restaurant", "Hayes Valley",
 "1658 Market St, San Francisco, CA 94102", 37.7726, -122.4219],
```

Counts on the page are derived from the arrays, so they update themselves. Run
`node tools/capture-previews.js` afterwards to grab a preview image for it.

## The map

The map groups businesses by **place** rather than dropping a hundred pins in
one spot. It opens on the United States, and each place is a chip carrying a
notification-style count (capped at `99+`). Choosing a place moves the map and
filters the list; there is also a text box for typing any city or address.

The directory's search box drives the map too, so the place counts always match
the list below.

Locations are honest about their precision. San Francisco entries carry a street
address and exact coordinates. Entries elsewhere carry only the place their
source states, so they sit at the centre of that place and are labelled
approximate. Businesses with no stated location are left off the map and appear
in the list only — the map footer says how many that is.

### With and without an API key

**No key (the default).** The map is Google's keyless embed. It needs no setup
and no billing account.

**With a key.** Paste a
[Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/get-api-key)
key into the meta tag in `index.html`:

```html
<meta name="google-maps-key" content="YOUR_KEY_HERE">
```

The page then loads the full JavaScript API and pins each business in the chosen
place, dark-styled to match the site. If the key is wrong or the API fails to
load, it falls back to the embed. A key is billable; restrict it to your domain
in the Google Cloud console.

## Preview images

Every card shows a real screenshot of that business's homepage.

```
node tools/capture-previews.js            capture anything missing
node tools/capture-previews.js --force    recapture everything
```

It drives headless Chrome, writes 640x400 JPEGs to `assets/img/previews/`, and
skips sites that time out or refuse to load. A missing preview is harmless: the
card falls back to the site's initials. Set `CHROME_PATH` if Chrome is not at
the default Windows location.

## Tests

```
node tools/smoke-test.js
```

Drives the real page in headless Chrome and checks what a visitor actually does:
navigating, searching, filtering, choosing and typing a place, selecting a
business, opening the FAQ, the back button, and that nothing overflows
horizontally. Exits non-zero on failure.

## Contact

pathwayforall9@gmail.com · [@pathway_for_all](https://www.instagram.com/pathway_for_all)
