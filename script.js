document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
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

  // Map Initialization: Choropleth (States light up)
  const mapElement = document.getElementById('map');
  if (mapElement && typeof L !== 'undefined') {
    // 1. Initialize Map
    // Center zoomed out to show most of US
    const map = L.map('map', {
      scrollWheelZoom: false,
      zoomControl: false // We recall re-add it or just leave it off for cleaner look
    }).setView([37.8, -96], 4);

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

    // 3. Data: Speaking Event Counts by State
    // "Clean" implies we don't need exact numbers everywhere, but relative intensity
    const stateData = {
      "Texas": 100,         // Home base - Highest
      "New York": 60,       // High
      "California": 45,     // Medium-High
      "Florida": 40,        // Medium
      "Illinois": 30,       // Medium
      "Pennsylvania": 25,   // Low-Medium
      "Georgia": 20,        // Low
      "Ohio": 15,
      "New Jersey": 35,
      "Massachusetts": 25,
      "District of Columbia": 30,
      "Maryland": 20
    };

    // 4. Color Scale Function
    function getColor(d) {
      return d > 80 ? '#b91c1c' : // Brand Red (Highest)
        d > 40 ? '#ea580c' : // Dark Orange
          d > 20 ? '#fb923c' : // Brand Orange
            d > 10 ? '#fdba74' : // Light Orange
              d > 0 ? '#fed7aa' : // Very Light Orange
                'transparent'; // No events
    }

    // 5. Style Function for GeoJSON
    function style(feature) {
      const count = stateData[feature.properties.name] || 0;
      return {
        fillColor: count > 0 ? getColor(count) : 'rgba(255,255,255,0.02)', // Faint white for inactive states
        weight: 1,
        opacity: 1,
        color: 'rgba(148, 163, 184, 0.3)', // Border color
        dashArray: '',
        fillOpacity: count > 0 ? 0.7 : 0.1 // Make active states pop, inactive fade back
      };
    }

    // 6. Interaction Handlers
    function highlightFeature(e) {
      const layer = e.target;
      const count = stateData[layer.feature.properties.name] || 0;

      layer.setStyle({
        weight: 2,
        color: '#fb923c', // Highlight border orange
        dashArray: '',
        fillOpacity: 0.9
      });

      layer.bringToFront();

      // Show Tooltip
      if (count > 0) {
        // Only show tooltip if there's actual data, or show "Coming soon"
        const content = `<b>${layer.feature.properties.name}</b><br/>${count > 80 ? 'Frequent Speaker' : count > 30 ? 'Regular Stops' : 'Past Events'}`;
        layer.bindTooltip(content, {
          className: 'map-tooltip',
          direction: 'top',
          sticky: true,
          opacity: 1
        }).openTooltip();
      } else {
        layer.bindTooltip(layer.feature.properties.name, {
          className: 'map-tooltip',
          direction: 'top',
          sticky: true,
          opacity: 1
        }).openTooltip();
      }
    }

    function resetHighlight(e) {
      geojson.resetStyle(e.target);
      e.target.closeTooltip();
    }

    function zoomToFeature(e) {
      map.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
      });
    }

    // 7. Fetch GeoJSON and Add to Map
    let geojson;

    // We use a reliable CDN for US States GeoJSON (Low resolution is fine for this view)
    fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
      .then(response => response.json())
      .then(data => {
        geojson = L.geoJson(data, {
          style: style,
          onEachFeature: onEachFeature
        }).addTo(map);
      })
      .catch(err => {
        console.error('Error loading GeoJSON:', err);
        // Fallback or error handling if offline
        mapElement.innerHTML = '<div style="color:white; text-align:center; padding-top:2rem;">Map data currently unavailable.</div>';
      });
  }
});
