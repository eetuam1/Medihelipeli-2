/* LEAFLET */

/* Map setup */

const map = L.map('map', {
  attributionControl: false,
  tap: false,
  minZoom: 4.4 /* min and max zoom degree */,
  maxZoom: 6,
  maxBoundsViscosity: 1,
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

map.setView(
    [68.0, 16.0], // Adjusted the longitude to move the map a bit more to the left
    4,
);

map.setMaxBounds([
  [55.0, -10.0], // Adjusted the latitude and longitude to limit panning further south and to the left
  [75.0, 35.0], // Adjusted the latitude and longitude to limit panning further north and to the right
]);

/* Function to create markers for map */

let markers = [];

async function leafletSetup() {
  try {

    // fetch needed data for map

    const gameData = await getData(airportUrl);
    console.log('All Airport Data:', gameData);

    const playerData = await getData(playerUrl);
    console.log('Player Data:', playerData);

    const distanceData = await getData(distanceUrl);
    console.log('All Distance Data:', distanceData);

    const playerLocation = playerData.find(
        (player) => player.location !== undefined,
    );

    const playerRange = playerData.find(
        (player) => player.range_km !== undefined,
    );

    const helicopterQty = playerData.find(
        (player) => player.patient_qty !== undefined,
    );

    const patientsMap = await getData(apiUrl + 'patientdata');
    let patientListMap = patientsMap.filter(
        (patient) => patient.location !== undefined,
    );

    setInterval(
        updateHtmlLocations(patientListMap, helicopterQty.patient_qty),
        1000,
    );

    const currentPlayerLocation = playerLocation.location;

    // LEAFLET MARKER ICONS

    var icon_inactive = L.icon({
      iconUrl: 'img/icon_inactive.png',
      iconSize: [25, 41],
      iconAnchor: [10, 36],
      popupAnchor: [2, -22],
    });
    var icon_patient = L.icon({
      iconUrl: 'img/icon_patient.png',
      iconSize: [25, 41],
      iconAnchor: [10, 36],
      popupAnchor: [2, -22],
    });
    var icon_home = L.icon({
      iconUrl: 'img/icon_home.png',
      iconSize: [25, 41],
      iconAnchor: [10, 36],
      popupAnchor: [2, -22],
    });
    var icon_player = L.icon({
      iconUrl: 'img/icon_player.png',
      iconSize: [25, 41],
      iconAnchor: [10, 36],
      popupAnchor: [2, -22],
    });

    // Loops through markers to clear map
    for (let i = 0; i < markers.length; i++) {
      map.removeLayer(markers[i]);
    }
    // Empty markers array
    markers.splice(0, markers.length);

    // Loops through all airport to generate markers

    for (let airport of gameData) {
      // Find the corresponding distanceData for the current airport
      const airportDistance = distanceData.find(
          (data) => data.ident === airport.ident,
      );

      if (airport.ident === currentPlayerLocation) {
        // Marker for player current location

        const marker = L.marker([airport.latitude_deg, airport.longitude_deg], {
          icon: icon_player,
          riseOnHover: true,
          zIndexOffset: 300,
        });

        // Add marker to markers array
        markers.push(marker);
        map.addLayer(marker);

      } else if (airport.ident === 'ENTR') { // Marker for home hospital
        if (airportDistance.distance_km > playerRange.range_km) { // If range not enough
          const marker = L.marker([
            airport.latitude_deg,
            airport.longitude_deg,
          ], {icon: icon_home, riseOnHover: true, opacity: 0.5});

          // Add marker to markers array
          markers.push(marker);
          map.addLayer(marker);

          // Create a div to hold the content
          const popupContent = document.createElement('div');

          // Add text content above the button
          const locationName = document.createElement('p');
          locationName.innerHTML = `<span class="popup-header">Home hospital is too far!</span><br>
           <b>Airport:</b> ${airportDistance.municipality}<br>
           <b>(Distance:</b> ${airportDistance.distance_km} km)`;
          popupContent.appendChild(locationName);

          // Bind the popup to the marker with the custom content
          marker.bindPopup(popupContent,
              {closeButton: false},
          );

          // Popup opens when mouse is hovered over marker
          marker.on('mouseover', function(e) {
            marker.openPopup();
            const boxElement = document.getElementById('map-text');
            boxElement.style.display = 'block';
            boxElement.style.zIndex = '10000';
            boxElement.style.left = (e.originalEvent.pageX + -30) + 'px';
            boxElement.style.top = (e.originalEvent.pageY + -30) + 'px';
            setTimeout(function() {
              $('#map-text').fadeOut('fast');
            }, 1000);
          });

          // Popup closes when mouse is moved away
          marker.on('mouseout', function() {
            const boxElement = document.getElementById('map-text');
            boxElement.style.display = 'none';
            boxElement.style.zIndex = '100';
            marker.closePopup();
          });

          // Add marker to markers array
          markers.push(marker);

        } else { // If range is enough
          const marker = L.marker([
            airport.latitude_deg,
            airport.longitude_deg,
          ], {icon: icon_home, riseOnHover: true});

          // Add marker to markers array
          markers.push(marker);
          map.addLayer(marker);

          // Create a div to hold the content
          const popupContent = document.createElement('div');

          // Add text content above the button
          const locationName = document.createElement('p');
          locationName.innerHTML = `<span class="popup-header">Home hospital!</span> <br>
          <b>Airport:</b> ${airportDistance.municipality} <br>
          <b>Distance:</b> ${airportDistance.distance_km} km`;
          popupContent.appendChild(locationName);

          // Add a click event listener to the button
          marker.addEventListener('click', () => {

            // Call the updateAll function with airport details
            updateAll(airport.ident, airportDistance.distance_km);

            // Close the popup after flying
            map.closePopup();

          });

          // Bind the popup to the marker with the custom content
          marker.bindPopup(popupContent,
              {closeButton: false},
          );

          // Popup opens when mouse is hovered over marker
          marker.on('mouseover', function(e) {
            marker.openPopup();
            const boxElement = document.getElementById('map-text');
            boxElement.style.display = 'block';
            boxElement.style.zIndex = '10000';
            boxElement.style.left = (e.originalEvent.pageX + -30) + 'px';
            boxElement.style.top = (e.originalEvent.pageY + -30) + 'px';
            setTimeout(function() {
              $('#map-text').fadeOut('fast');
            }, 1000);
          });

          // Popup closes when mouse is moved away
          marker.on('mouseout', function() {
            const boxElement = document.getElementById('map-text');
            boxElement.style.display = 'none';
            boxElement.style.zIndex = '100';
            marker.closePopup();
          });

          // Add marker to markers array
          markers.push(marker);
        }
      } else if (patientListMap.some( // Markers for patient locations
          patient => patient.location === airport.ident)) {

        // Check if the airport is not the current location
        if (airport.ident !== currentPlayerLocation) {

          if (airportDistance.distance_km > playerRange.range_km) { // if range not enough
            const marker = L.marker([
              airport.latitude_deg,
              airport.longitude_deg,
            ], {icon: icon_patient, riseOnHover: true, opacity: 0.5});

            // Add marker to markers array
            markers.push(marker);
            map.addLayer(marker);

            // Create a div to hold the content
            const popupContent = document.createElement('div');

            // Add text content above the button
            const locationName = document.createElement('p');
            locationName.innerHTML = `<span class="popup-header">Too far!</span> <br>
            <b>Airport:</b> ${airportDistance.municipality} <br>
            <b>Distance:</b> ${airportDistance.distance_km} km`;
            popupContent.appendChild(locationName);

            // Bind the popup to the marker with the custom content
            marker.bindPopup(popupContent);

            // Popup opens when mouse is hovered over marker
            marker.on('mouseover', function() {
              marker.openPopup();
            });

            // Popup closes when mouse is moved away
            marker.on('mouseout', function() {
              marker.closePopup();
            });

            // Add marker to markers array
            markers.push(marker);

          } else { // if range is enough
            const marker = L.marker([
              airport.latitude_deg,
              airport.longitude_deg,
            ], {icon: icon_patient, riseOnHover: true, opacity: 1.0});

            // Add marker to markers array
            markers.push(marker);
            map.addLayer(marker);

            // Create a div to hold the content
            const popupContent = document.createElement('div');

            // Add text content above the button
            const locationName = document.createElement('p');
            locationName.innerHTML = `<span class="popup-header">Patient here!</span><br>
            <b>Airport:</b> ${airportDistance.municipality} <br>
            <b>Distance:</b> ${airportDistance.distance_km} km`;
            popupContent.appendChild(locationName);

            // Add a click event listener to the button
            marker.addEventListener('click', () => {
              // Call the updateAll function with airport details
              updateAll(airport.ident, airportDistance.distance_km);

              // Close the popup after flying
              map.closePopup();
            });


            // Bind the popup to the marker with the custom content
            marker.bindPopup(popupContent,
                {closeButton: false},
            );

            // Popup opens when mouse is hovered over marker
            marker.on('mouseover', function(e) {
              marker.openPopup();
              const boxElement = document.getElementById('map-text');
              boxElement.style.display = 'block';
              boxElement.style.zIndex = '10000';
              boxElement.style.left = (e.originalEvent.pageX + -30) + 'px';
              boxElement.style.top = (e.originalEvent.pageY + -30) + 'px';
              setTimeout(function() {
                $('#map-text').fadeOut('fast');
              }, 1000);
            });

            // Popup closes when mouse is moved away
            marker.on('mouseout', function() {
              const boxElement = document.getElementById('map-text');
              boxElement.style.display = 'none';
              boxElement.style.zIndex = '100';
              marker.closePopup();
            });

            // Add marker to markers array
            markers.push(marker);
          }
        }
      } else if (airportDistance.distance_km > playerRange.range_km) {
        // Other markers that are not within range

        // Check if the airport is not the current location

        if (airport.ident !== currentPlayerLocation) {
          const marker = L.marker(
              [airport.latitude_deg, airport.longitude_deg],
              {icon: icon_inactive, riseOnHover: true, opacity: 0.5},
          );

          // Add marker to markers array
          markers.push(marker);
          map.addLayer(marker);

          // Create a div to hold the content
          const popupContent = document.createElement('div');

          // Add text content above the button
          const locationName = document.createElement('p');
          locationName.innerHTML = `<span class="popup-header">Too far! </span><br>
          <b>Airport:</b> ${airportDistance.municipality} <br>
          <b>Distance:</b> ${airportDistance.distance_km} km`;
          popupContent.appendChild(locationName);

          // Bind the popup to the marker with the custom content
          marker.bindPopup(popupContent,
              {closeButton: false},
          );

          // Popup opens when mouse is hovered over marker
          marker.on('mouseover', function() {
            marker.openPopup();
          });

          // Popup closes when mouse is moved away
          marker.on('mouseout', function() {
            marker.closePopup();
          });

          // Add marker to markers array
          markers.push(marker);
        }
      } else if (airportDistance) {
        // other markers that are within range

        // Check if the airport is not the current location

        if (airport.ident !== currentPlayerLocation) {
          const marker = L.marker(
              [airport.latitude_deg, airport.longitude_deg],
              {icon: icon_inactive, riseOnHover: true, opacity: 1.0},
          );

          // Add marker to markers array
          markers.push(marker);
          map.addLayer(marker);

          // Create a div to hold the content
          const popupContent = document.createElement('div');

          // Add text content above the button
          const locationName = document.createElement('p');
          locationName.innerHTML = `<b>Airport:</b> ${airportDistance.municipality} <br>
          <b>Distance:</b> ${airportDistance.distance_km} km`;
          popupContent.appendChild(locationName);

          // Add a click event listener to the button
          marker.addEventListener('click', () => {
            // Call the updateAll function with airport details
            updateAll(airport.ident, airportDistance.distance_km);

            // Close the popup after flying
            map.closePopup();
          });

          // Bind the popup to the marker with the custom content
          marker.bindPopup(popupContent,
              {closeButton: false},
          );

          // Popup opens when mouse is hovered over marker
          marker.on('mouseover', function(e) {
            marker.openPopup();
            const boxElement = document.getElementById('map-text');
            boxElement.style.display = 'block';
            boxElement.style.zIndex = '10000';
            boxElement.style.left = (e.originalEvent.pageX + -30) + 'px';
            boxElement.style.top = (e.originalEvent.pageY + -30) + 'px';
            setTimeout(function() {
              $('#map-text').fadeOut('fast');
            }, 1000);
          });

          // Popup closes when mouse is moved away
          marker.on('mouseout', function() {
            const boxElement = document.getElementById('map-text');
            boxElement.style.display = 'none';
            boxElement.style.zIndex = '100';
            marker.closePopup();
          });

          // Add marker to markers array
          markers.push(marker);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

// MAP IMAGE OVERLAY

var bounds = [
  [41, -10.0],
  [75.0, 45],
];

var fantasyMap = L.imageOverlay("img/norway4.jpg", bounds).addTo(map);