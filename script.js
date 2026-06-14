document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ===========================================================================
  // YouTube subscriber count — updates automatically.
  // To turn this on: paste your free YouTube Data API key between the quotes
  // below (replace the PASTE_... text). Nothing else needs to change.
  // If the key is missing or the request fails, the page simply keeps showing
  // the number that's already in index.html — so it can never look broken.
  // ===========================================================================
  const YOUTUBE_API_KEY = 'PASTE_YOUR_YOUTUBE_API_KEY_HERE';
  const YOUTUBE_HANDLE = 'SamSalz39'; // from youtube.com/@SamSalz39

  function formatFollowerCount(value) {
    const n = Number(value);
    if (!isFinite(n)) return null;
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  // Adds up every platform's follower number and shows the combined total.
  // Each social card carries a data-count (its raw number); this sums them,
  // so the "Total Followers" figure is always correct — including after the
  // YouTube number updates itself live.
  function recalcTotalFollowers() {
    const totalEl = document.getElementById('total-followers');
    if (!totalEl) return;
    let total = 0;
    document.querySelectorAll('.social-card[data-count]').forEach(card => {
      const n = Number(card.getAttribute('data-count'));
      if (isFinite(n)) total += n;
    });
    const formatted = formatFollowerCount(total);
    if (formatted) totalEl.textContent = formatted;
  }

  recalcTotalFollowers();

  const ytCountEl = document.getElementById('youtube-count');
  if (
    ytCountEl &&
    YOUTUBE_API_KEY &&
    YOUTUBE_API_KEY !== 'PASTE_YOUR_YOUTUBE_API_KEY_HERE'
  ) {
    const ytUrl =
      'https://www.googleapis.com/youtube/v3/channels' +
      '?part=statistics&forHandle=' +
      encodeURIComponent(YOUTUBE_HANDLE) +
      '&key=' +
      encodeURIComponent(YOUTUBE_API_KEY);

    fetch(ytUrl)
      .then(response => response.json())
      .then(data => {
        const stats =
          data && data.items && data.items[0] && data.items[0].statistics;
        const formatted = stats && formatFollowerCount(stats.subscriberCount);
        if (formatted) {
          ytCountEl.textContent = formatted + ' Subscribers';
          const ytCard = ytCountEl.closest('.social-card');
          if (ytCard) ytCard.setAttribute('data-count', stats.subscriberCount);
          recalcTotalFollowers();
        }
      })
      .catch(err => {
        console.error('Could not load YouTube subscriber count:', err);
        // Leaves the existing number in place.
      });
  }

  // Scroll reveal animations
  const revealElements = document.querySelectorAll('[data-reveal]');
  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealElements.forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  // Impact-stats counters — tick up from 0 when scrolled into view.
  const statValues = document.querySelectorAll('.stat-value[data-target]');
  if (statValues.length > 0) {
    const reduceMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const runCount = el => {
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      const suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) {
        el.textContent = target.toLocaleString('en-US') + suffix;
        return;
      }
      const duration = 1600;
      const startTime = performance.now();
      const step = now => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const value = Math.round(target * eased);
        el.textContent = value.toLocaleString('en-US') + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      const statObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              runCount(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      statValues.forEach(el => statObserver.observe(el));
    } else {
      statValues.forEach(el => {
        const target = parseInt(el.getAttribute('data-target'), 10) || 0;
        el.textContent =
          target.toLocaleString('en-US') + (el.getAttribute('data-suffix') || '');
      });
    }
  }

  // Photo carousel — one photo at a time, click through with arrows or dots.
  const carousel = document.getElementById('photo-carousel');
  if (carousel) {
    const dotsWrap = carousel.querySelector('.carousel-dots');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');

    // Keep the first slide (tefillin) first; shuffle the rest on each load.
    const rest = Array.from(carousel.querySelectorAll('.carousel-slide')).slice(1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    rest.forEach(slide => prevBtn.parentNode.insertBefore(slide, prevBtn));

    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    let index = 0;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Show photo ' + (i + 1) + ' of ' + slides.length);
      dot.addEventListener('click', () => show(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle('active', n === index));
      dots.forEach((d, n) => d.classList.toggle('active', n === index));
    }

    if (prevBtn) prevBtn.addEventListener('click', () => show(index - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => show(index + 1));
    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  // Map Initialization: Choropleth (States light up)
  const mapElement = document.getElementById('map');
  if (mapElement && typeof L !== 'undefined') {
    // 1. Initialize Map
    // Center zoomed out to show most of US
    const map = L.map('map', {
      scrollWheelZoom: false,
      zoomControl: false // We recall re-add it or just leave it off for cleaner look
    });
    // Frame all of North America so the US states, Canadian provinces and
    // Mexico are all visible at once.
    map.fitBounds([[14, -125], [56, -58]]);

    // Re-add zoom control in a better position if desire, or leave distinct. 
    // Let's add it bottom-right for "clean"
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // 2. Base Layer
    // Using a very dark/simple background so the states pop
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // 3. Data: speaking engagements per region (US states + Canadian provinces).
    // Tallied from Sam's speaking-engagements record. Canada's provinces are
    // colored individually; Mexico is colored as a whole country below.
    const regionData = {
      // United States
      "New York": 11,
      "California": 8,
      "Texas": 7,
      "Pennsylvania": 5,
      "Georgia": 3,
      "New Jersey": 3,
      "Colorado": 2,
      "Arizona": 2,
      "Florida": 1,
      "Maryland": 1,
      "Louisiana": 1,
      "Connecticut": 1,
      "North Carolina": 1,
      "Nevada": 1,
      "New Hampshire": 1,
      "Kansas": 1,
      "Wisconsin": 1,
      "Ohio": 1,
      "District of Columbia": 1,
      // Canada (provinces)
      "Ontario": 2,           // Toronto + Kingston
      "Quebec": 1,            // Montreal
      "British Columbia": 1   // Vancouver
    };

    // Mexico is colored as one whole country (the Mexico City engagement).
    const MEXICO_COUNT = 1;

    // 4. Color Scale Function
    function getColor(d) {
      return d >= 10 ? '#b91c1c' : // Brand Red (10+ engagements)
        d >= 6 ? '#ea580c' : // Dark Orange (6-9)
          d >= 3 ? '#fb923c' : // Brand Orange (3-5)
            d >= 2 ? '#fdba74' : // Light Orange (2)
              d >= 1 ? '#fed7aa' : // Very Light Orange (1)
                'transparent'; // No events
    }

    // 5. Style for a given engagement count
    function styleForCount(count) {
      return {
        fillColor: count > 0 ? getColor(count) : 'rgba(255,255,255,0.02)', // Faint for inactive regions
        weight: 1,
        opacity: 1,
        color: 'rgba(148, 163, 184, 0.3)', // Border color
        dashArray: '',
        fillOpacity: count > 0 ? 0.7 : 0.1 // Active regions pop, inactive fade back
      };
    }

    // 6. Add a colored region layer from a GeoJSON URL.
    //    getCount(feature) -> number of engagements for that shape
    //    getLabel(feature) -> name shown in the hover tooltip
    function addChoroplethLayer(url, getCount, getLabel) {
      return fetch(url)
        .then(response => response.json())
        .then(data => {
          L.geoJson(data, {
            style: feature => styleForCount(getCount(feature)),
            onEachFeature: (feature, layer) => {
              const count = getCount(feature);
              const name = getLabel(feature);
              layer.on({
                mouseover: e => {
                  e.target.setStyle({ weight: 2, color: '#fb923c', dashArray: '', fillOpacity: 0.9 });
                  e.target.bringToFront();
                  const content = count > 0
                    ? `<b>${name}</b><br/>${count} speaking engagement${count === 1 ? '' : 's'}`
                    : `${name}`;
                  e.target.bindTooltip(content, {
                    className: 'map-tooltip',
                    direction: 'top',
                    sticky: true,
                    opacity: 1
                  }).openTooltip();
                },
                mouseout: e => {
                  e.target.setStyle(styleForCount(count));
                  e.target.closeTooltip();
                },
                click: e => map.fitBounds(e.target.getBounds())
              });
            }
          }).addTo(map);
        })
        .catch(err => console.error('Could not load map layer:', url, err));
    }

    // 7. Load the three region layers (US states, Canadian provinces, Mexico).
    const byName = feature => regionData[feature.properties.name] || 0;
    const nameOf = feature => feature.properties.name;

    // United States — state shapes
    addChoroplethLayer(
      'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json',
      byName,
      nameOf
    );
    // Canada — province shapes
    addChoroplethLayer(
      'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/canada.geojson',
      byName,
      nameOf
    );
    // Mexico — colored as one whole country
    addChoroplethLayer(
      'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/mexico.geojson',
      () => MEXICO_COUNT,
      () => 'Mexico'
    );
  }
});
