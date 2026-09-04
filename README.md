# path

Pathway — a single-page site for **Pathway**, which builds websites, Google Business
listings and social media accounts for immigrant-owned businesses and hands every
account over to the owner. Free for the first 20 businesses.

Live pages: Home · About · How it works · The businesses · Contact.

## Running it

It is one static file. Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

No build step, no dependencies to install.

## What is in the repo

| File | Purpose |
| --- | --- |
| `index.html` | The whole site — markup, styles and scripts in one file |
| `sunny.png`, `jen.png`, `ben.jpg` | Photos for the three businesses Pathway has built for |
| `favicon.png` | Tab icon |

## How the site is put together

- **Five pages, one document.** Each page is a `<div class="page">`; `showPage()`
  swaps which one is active. The URL carries the page as a fragment
  (`#/portfolio`), so links are shareable and the browser back button works.
- **The directory** on the Portfolio page is built from three arrays in the module
  script near the bottom of `index.html`:
  - `clientItems` — businesses Pathway actually built for. These get photo cards
    and a result line.
  - `sfLocal` — San Francisco businesses Pathway features and sends customers to.
    **Not** Pathway builds.
  - `exampleSites` — reference builds from the wider small-business web, shown as
    examples of good work. **Not** Pathway builds.

  The three groups are rendered under separate headings that say which is which.
  Keep them separate when adding entries — the labelling is the point.
- **Search and filters** match on name, category, neighbourhood and domain.
- **The globe** (three.js, loaded from a CDN) is decorative. It is imported
  dynamically with a timeout, so if the CDN is slow or blocked the globe is hidden
  and the rest of the page still works.
- **Translation** uses Google Translate, loaded with `defer` so a slow response
  cannot stall the rest of the page.

## Adding a business to the directory

Find the right array in `index.html` and add a row:

```js
// sfLocal — name, domain, category, neighbourhood
["Zuni Café", "zunicafe.com", "Restaurant", "Hayes Valley"],
```

The counts on the page (`Showing 111 of 111`, the home-page number strip) are
derived from the arrays, so they update on their own.

## Contact

pathwayforall9@gmail.com · [@pathway_for_all](https://www.instagram.com/pathway_for_all)
