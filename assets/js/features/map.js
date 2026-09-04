/**
 * The map, organised by place.
 *
 * Businesses are grouped into the city or region they belong to rather than
 * being scattered as individual pins, so somewhere like San Francisco reads as
 * one entry with a count instead of fifty overlapping markers. The map opens
 * on the United States; choosing a place, or typing one, moves it.
 *
 * Two modes, chosen automatically:
 *
 *   No API key   Google's keyless embed. Needs no setup and no billing
 *                account, so it is the default.
 *   With a key   The full Maps JavaScript API, styled to match the site, with
 *                a pin per business in the chosen place. Set the key in the
 *                <meta name="google-maps-key"> tag in index.html.
 *
 * If the keyed map fails for any reason it falls back to the embed.
 */
(function (root) {
    'use strict';

    var US = { key: 'us', label: 'United States', lat: 39.8283, lng: -98.5795, zoom: 4 };
    var BADGE_MAX = 99;
    var PLACES_SHOWN = 8;   // the rest sit behind a "more" toggle

    var DARK = [
        { elementType: 'geometry', stylers: [{ color: '#12151a' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#12151a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8b95a3' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1b2028' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6a7483' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#272d38' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b0d11' }] },
        { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#272d38' }] }
    ];

    var data = null;
    var plain = null;

    var located = [];        // everything with a location, before filtering
    var pool = [];           // what the directory search left us
    var inPlace = [];        // what is in the chosen place
    var places = [];

    var place = 'us';        // 'us', a place key, or 'typed'
    var placesExpanded = false;
    var typedLabel = '';
    var selected = null;

    var mode = 'embed';
    var embedKey = null;
    var gmap = null;
    var ginfo = null;
    var markers = {};

    var els = {};

    /* ---------- URLs ---------- */

    function businessQuery(item) {
        return plain(item.name) + ', ' + (item.address || 'United States');
    }

    function searchUrl(text) {
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(text);
    }

    function embedUrl(query, zoom) {
        return 'https://www.google.com/maps?q=' + encodeURIComponent(query) +
            '&z=' + zoom + '&hl=en&output=embed';
    }

    /**
     * Assigning src on a live iframe pushes a browser history entry, which
     * would leave the back button stepping through map moves. Replacing the
     * element makes each move an initial load instead.
     */
    function setEmbed(key, query, zoom, title) {
        if (!els.stage || mode !== 'embed') return;
        if (key === embedKey) return;
        embedKey = key;

        var frame = document.createElement('iframe');
        frame.id = 'map-frame';
        frame.title = title || 'Map';
        frame.loading = 'lazy';
        frame.referrerPolicy = 'no-referrer-when-downgrade';
        frame.src = embedUrl(query, zoom);
        els.stage.replaceChildren(frame);
    }

    /* ---------- Place selector ---------- */

    function currentPlace() {
        if (place === 'us') return US;
        if (place === 'typed') return null;
        for (var i = 0; i < places.length; i++) {
            if (places[i].key === place) return places[i];
        }
        return US;
    }

    function badgeText(count) {
        return count > BADGE_MAX ? BADGE_MAX + '+' : String(count);
    }

    function renderPlaces() {
        if (!els.places) return;
        els.places.textContent = '';

        var all = [{
            key: 'us', label: US.label, count: pool.length
        }].concat(places);

        // Two dozen chips is a wall. Show the busiest places and keep the rest
        // one click away, expanding automatically if the chosen place is in
        // the hidden tail.
        var hiddenCount = Math.max(all.length - PLACES_SHOWN, 0);
        var chosenIsHidden = all.slice(PLACES_SHOWN).some(function (entry) {
            return entry.key === place;
        });
        var showAll = placesExpanded || chosenIsHidden || !hiddenCount;
        var shown = showAll ? all : all.slice(0, PLACES_SHOWN);

        shown.forEach(function (entry) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'place';
            button.setAttribute('data-place', entry.key);
            button.setAttribute('aria-pressed', entry.key === place ? 'true' : 'false');
            button.innerHTML = '<span class="place-name"></span>' +
                '<span class="place-badge">' + badgeText(entry.count) + '</span>';
            button.querySelector('.place-name').textContent = entry.label;
            button.setAttribute('aria-label', entry.label + ', ' + entry.count +
                (entry.count === 1 ? ' business' : ' businesses'));
            button.addEventListener('click', function () { choose(entry.key); });
            els.places.appendChild(button);
        });

        if (hiddenCount && !chosenIsHidden) {
            var toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'place place--more';
            toggle.setAttribute('aria-expanded', placesExpanded ? 'true' : 'false');
            toggle.textContent = placesExpanded ? 'Show fewer' : hiddenCount + ' more places';
            toggle.addEventListener('click', function () {
                placesExpanded = !placesExpanded;
                renderPlaces();
            });
            els.places.appendChild(toggle);
        }
    }

    /* ---------- Business list ---------- */

    function renderList() {
        if (!els.list) return;
        els.list.textContent = '';

        if (!inPlace.length) {
            var empty = document.createElement('p');
            empty.className = 'map-empty';
            empty.textContent = place === 'typed'
                ? 'No businesses on file in ' + typedLabel + ' yet.'
                : 'No businesses match that search here.';
            els.list.appendChild(empty);
            return;
        }

        inPlace.forEach(function (item) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'map-item';
            button.setAttribute('data-domain', item.domain);
            button.setAttribute('aria-current', item.domain === selected ? 'true' : 'false');
            button.innerHTML = '<b></b><span></span>';
            button.querySelector('b').textContent = plain(item.name);
            button.querySelector('span').textContent = plain(item.meta) +
                (item.precise ? '' : ' · approximate');
            button.addEventListener('click', function () { selectBusiness(item); });
            els.list.appendChild(button);
        });
    }

    /* ---------- Moving the map ---------- */

    function showPlace() {
        var spot = currentPlace();

        if (mode === 'google' && gmap) {
            var wanted = {};
            inPlace.forEach(function (item) { wanted[item.domain] = true; });
            Object.keys(markers).forEach(function (domain) {
                markers[domain].setMap(wanted[domain] ? gmap : null);
            });
            if (ginfo) ginfo.close();

            if (spot) {
                gmap.setCenter({ lat: spot.lat, lng: spot.lng });
                gmap.setZoom(spot.zoom);
            }
            return;
        }

        if (place === 'typed') {
            setEmbed('typed:' + typedLabel, typedLabel, 11, 'Map of ' + typedLabel);
        } else if (spot) {
            setEmbed('place:' + spot.key, spot.label, spot.zoom, 'Map of ' + spot.label);
        }
    }

    function updateNote() {
        if (!els.note) return;
        var spot = currentPlace();
        var name = place === 'typed' ? typedLabel : (spot ? spot.label : US.label);
        var count = inPlace.length;

        els.note.textContent = count
            ? count + (count === 1 ? ' business' : ' businesses') + ' in ' + name
            : 'No businesses on file in ' + name;

        if (els.open) {
            els.open.href = searchUrl(name);
            els.open.textContent = 'Open ' + name + ' in Google Maps';
        }
    }

    function choose(key) {
        place = key;
        typedLabel = '';
        selected = null;
        if (els.input) els.input.value = '';
        refreshPlaceView();
    }

    function chooseTyped(text) {
        var wanted = text.trim();
        if (!wanted) return;

        // Typing the name of a place we know about selects it properly, so the
        // list filters as well as the map moving.
        var match = places.filter(function (entry) {
            return entry.label.toLowerCase().indexOf(wanted.toLowerCase()) !== -1 ||
                wanted.toLowerCase().indexOf(entry.label.split(',')[0].toLowerCase()) !== -1;
        })[0];

        if (match) {
            place = match.key;
            typedLabel = '';
        } else {
            place = 'typed';
            typedLabel = wanted;
        }
        selected = null;
        refreshPlaceView();
    }

    function refreshPlaceView() {
        inPlace = place === 'us' ? pool
            : place === 'typed' ? []
            : pool.filter(function (item) { return item.place === place; });

        if (els.places) {
            els.places.querySelectorAll('.place').forEach(function (button) {
                button.setAttribute('aria-pressed',
                    button.getAttribute('data-place') === place ? 'true' : 'false');
            });
        }

        renderList();
        showPlace();
        updateNote();
    }

    function selectBusiness(item, fromMarker) {
        selected = item.domain;

        if (els.list) {
            els.list.querySelectorAll('.map-item').forEach(function (button) {
                button.setAttribute('aria-current',
                    button.getAttribute('data-domain') === item.domain ? 'true' : 'false');
            });
        }

        if (els.open) {
            els.open.href = searchUrl(businessQuery(item));
            els.open.textContent = 'Open ' + plain(item.name) + ' in Google Maps';
        }

        if (mode === 'google' && gmap) {
            var marker = markers[item.domain];
            if (marker) {
                gmap.panTo(marker.getPosition());
                if (gmap.getZoom() < 14) gmap.setZoom(14);
                ginfo.setContent(infoHtml(item));
                ginfo.open(gmap, marker);
            }
        } else if (!fromMarker) {
            setEmbed('biz:' + item.domain, businessQuery(item), item.precise ? 16 : 12,
                'Map showing ' + plain(item.name));
        }

        if (fromMarker) return;

        // On a phone the map sits above the list, so bring the map into view
        // rather than nudging the row the reader just tapped.
        if (root.matchMedia('(max-width: 760px)').matches) {
            if (els.stage) els.stage.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } else if (els.list) {
            var active = els.list.querySelector('.map-item[aria-current="true"]');
            if (active) active.scrollIntoView({ block: 'nearest' });
        }
    }

    function infoHtml(item) {
        return '<div class="map-info"><b>' + item.name + '</b>' +
            '<span>' + item.meta + '</span>' +
            (item.precise ? '' : '<span>Approximate: city level</span>') +
            '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer">Website</a>' +
            '<a href="' + searchUrl(businessQuery(item)) + '" target="_blank" rel="noopener noreferrer">Directions</a></div>';
    }

    /**
     * Called by the directory whenever its search or filters change, so the
     * map and the place counts always match the list below.
     */
    function update(found) {
        if (!data) return;
        pool = (found || located).filter(function (item) { return typeof item.lat === 'number'; });
        places = data.placesFor(pool);

        // A place that no longer has anything in it falls back to the country.
        if (place !== 'us' && place !== 'typed') {
            var stillThere = places.some(function (entry) { return entry.key === place; });
            if (!stillThere) place = 'us';
        }

        renderPlaces();
        refreshPlaceView();

        if (els.total) {
            els.total.textContent = pool.length + ' of ' + data.directory.length +
                ' businesses have a location on file. The rest are listed below.';
        }
    }

    /* ---------- Keyed mode ---------- */

    function loadMapsApi(key) {
        return new Promise(function (resolve, reject) {
            var timer = setTimeout(function () { reject(new Error('timed out')); }, 8000);
            root.__pathwayMapsReady = function () { clearTimeout(timer); resolve(); };
            var script = document.createElement('script');
            script.async = true;
            script.src = 'https://maps.googleapis.com/maps/api/js?key=' +
                encodeURIComponent(key) + '&callback=__pathwayMapsReady';
            script.onerror = function () { clearTimeout(timer); reject(new Error('failed to load')); };
            document.head.appendChild(script);
        });
    }

    function startKeyed(key) {
        return loadMapsApi(key).then(function () {
            var canvas = document.createElement('div');
            canvas.className = 'map-canvas';
            els.stage.replaceChildren(canvas);

            gmap = new google.maps.Map(canvas, {
                center: { lat: US.lat, lng: US.lng },
                zoom: US.zoom,
                styles: DARK,
                mapTypeControl: false,
                streetViewControl: false
            });
            ginfo = new google.maps.InfoWindow();

            located.forEach(function (item) {
                var marker = new google.maps.Marker({
                    position: { lat: item.lat, lng: item.lng },
                    map: null,
                    title: plain(item.name),
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: item.group === 'pathway' ? 8 : 6,
                        fillColor: item.group === 'pathway' ? '#eec26a' : '#d7a441',
                        fillOpacity: 1,
                        strokeColor: '#12151a',
                        strokeWeight: 2
                    }
                });
                marker.addListener('click', function () { selectBusiness(item, true); });
                markers[item.domain] = marker;
            });

            mode = 'google';
            refreshPlaceView();
        });
    }

    /* ---------- Setup ---------- */

    function init() {
        data = root.Pathway.data;
        plain = root.Pathway.directory.plain;

        els = {
            stage: document.getElementById('map-stage'),
            list: document.getElementById('map-list'),
            note: document.getElementById('map-note'),
            open: document.getElementById('map-open'),
            places: document.getElementById('map-places'),
            input: document.getElementById('map-place-input'),
            form: document.getElementById('map-place-form'),
            total: document.getElementById('map-total')
        };
        if (!els.stage) return;

        located = data.directory.filter(function (item) { return typeof item.lat === 'number'; });
        pool = located;

        if (els.form) {
            els.form.addEventListener('submit', function (event) {
                event.preventDefault();
                chooseTyped(els.input ? els.input.value : '');
            });
        }

        setEmbed('place:us', US.label, US.zoom, 'Map of the United States');
        update(located);

        var meta = document.querySelector('meta[name="google-maps-key"]');
        var key = meta ? (meta.getAttribute('content') || '').trim() : '';
        if (key) {
            startKeyed(key).catch(function (err) {
                if (root.console) console.warn('Keyed map unavailable, using the embed:', err.message);
                mode = 'embed';
                embedKey = null;
                refreshPlaceView();
            });
        }
    }

    root.Pathway = root.Pathway || {};
    root.Pathway.map = { init: init, update: update };
})(window);
