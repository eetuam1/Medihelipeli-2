"use strict";

// global variables

const apiUrl = "http://127.0.0.1:5000/";
const airportUrl = "http://127.0.0.1:5000/airportdata";
const playerUrl = "http://127.0.0.1:5000/playerdata";
const distanceUrl = "http://127.0.0.1:5000/distances";

let patientList;

// UPDATES PLAYER NAME TO DB AND RESETS DB
async function gameSetup() {
  let playerName = document.getElementById("player-name").value;
  try {
    const gameData = await getData(apiUrl + "newgame?player=" + playerName);
    console.log(gameData);
  } catch (error) {
    console.log(error);
  }
  patientRandomizer();
  updateAll("ENTR", 0);
}

// FORM FOR THE PLAYER NAME
function playerNameGame() {
  document.getElementById("player-box").style.display = "block";
  document
    .getElementById("player-form")
    .addEventListener("submit", function (player) {
      playAudio();

      player.preventDefault();
      let playerName = document.getElementById("player-name").value;
      document.getElementById("player-box").style.display = "none";

      gameSetup();

      // Update the screen-name element with the entered name
      const screenNameElement = document.getElementById("screen-name");
      screenNameElement.textContent = `Hello, ${playerName}!`;

      // You can also clear the input field if needed
      document.getElementById("player-name").value = "";

      dialoguePopup();
    });
}

document.addEventListener("DOMContentLoaded", playerNameGame);

// FUNCTION TO FETCH DATA FROM API
async function getData(apiUrl) {
  //url on perusarvo tiedon hakemiselle myöhemmin
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error("Wrong server input");
  const data = await response.json();
  return data;
}

//RANDOMIZES PATIENT LOCATIONS
async function patientRandomizer() {
  try {
    const patientLocations = await getData(
      apiUrl + "randomizepatientlocations"
    );
  } catch (error) {
    console.log(error);
  }
}

// UPDATE THE RANGE
async function updateRangeInfo() {
  try {
    const playerData = await getData(playerUrl);

    // Find the first item with a valid range_km property
    const playerWithRange = playerData.find(
      (player) => player.range_km !== undefined
    );

    if (playerWithRange) {
      const playerRange = playerWithRange.range_km;

      // Update the range-info element
      const rangeInfoElement = document.getElementById("range-info");
      rangeInfoElement.textContent = `Your range: ${playerRange} km`;
      return playerRange;
    } else {
      console.error("No player data with a valid range_km property found.");
    }
  } catch (error) {
    console.error("Error fetching airport data:", error);
  }
}

// Call the function to update range-info when the page loads
document.addEventListener("DOMContentLoaded", updateRangeInfo);

// FUNCTION AT HOME HOSPITAL

async function homehospital() {
  // increases range if player returns 3 patients
  // increases patientgoal if player returns 3 patients
  const playerData = await getData(playerUrl);
  const homeData = playerData.find(
    (player) => player.patient_qty !== undefined
  );
  console.log(homeData.patient_qty);

  const updatePlayer = await getData(
    apiUrl + "updatehome?pqty=" + homeData.patient_qty
  );
}

async function rescued() {
  try {
    const rescuedUpdate = await getData(apiUrl + "rescued");
  } catch (error) {
    console.log(error);
  }
}

// UPDATE THE CURRENT LOCATION
async function updateCurrentLocation() {
  try {
    const playerData = await getData(playerUrl);

    // Find the first item with a valid location property
    const playerWithLocation = playerData.find(
      (player) => player.location !== undefined
    );

    const municipalityData = await getData(apiUrl + "wikipediaapi");

    const currentMunicipality = municipalityData[0].municipality;
    console.log(currentMunicipality);

    if (playerWithLocation) {
      const currentPlayerLocation = playerWithLocation.location;

      // Update the current-location element
      const currentLocationElement =
        document.getElementById("current-location");
      currentLocationElement.textContent = `Your current location: ${currentMunicipality}`;
    } else {
      console.error(
        "No player data with a valid current location property found."
      );
    }
  } catch (error) {
    console.error("Error fetching player data:", error);
  }
}

// Call the function to update current-location when the page loads
document.addEventListener("DOMContentLoaded", updateCurrentLocation);

//
// UPDATE THE PATIENT GOAL
async function updatePatientGoal() {
  try {
    const playerData = await getData(playerUrl);

    // Find the first item with a valid patient_goal property
    const playerWithPatients = playerData.find(
      (player) => player.patient_goal !== undefined
    );

    const playerRange = playerData[0].range_km;

    if (playerWithPatients) {
      const currentPatientGoal = playerWithPatients.patient_goal;

      // Update the patient-goal element
      const patientGoalElement = document.getElementById("patient-goal");
      patientGoalElement.textContent = `Antidote Carriers saved: ${currentPatientGoal}/12`;

      if (currentPatientGoal === 12) {
        console.log(`You're a winner!`);
        gameOverPopup(`You are winner!<br>Range left ${playerRange}km`, true);
      }
    } else {
      console.error(
        "No player data with a valid Antidote Carrier goal property found."
      );
    }
  } catch (error) {
    console.error("Error fetching player data:", error);
  }
}

// Call the function to update patient-goal when the page loads
document.addEventListener("DOMContentLoaded", updatePatientGoal);

//
// UPDATE THE PATIENT QUANTITY
async function updatePatientQuantity() {
  try {
    const playerData = await getData(playerUrl);

    // Find the first item with a valid patient_qty property
    const playerWithPatients = playerData.find(
      (player) => player.patient_qty !== undefined
    );

    if (playerWithPatients) {
      const currentPatientQuantity = playerWithPatients.patient_qty;

      console.log(currentPatientQuantity);

      // Update the patient-quantity element
      const patientQuantityElement =
        document.getElementById("patient-quantity");
      patientQuantityElement.textContent = `Antidote Carriers in your helicopter: ${currentPatientQuantity}`;
    } else {
      console.error(
        "No player data with a valid Antidote Carrier quantity property found."
      );
    }
  } catch (error) {
    console.error("Error fetching player data:", error);
  }
}

// Call the function to update patient-quantity when the page loads
document.addEventListener("DOMContentLoaded", updatePatientQuantity);

// UPDATES (at the moment) ALL AIRPORTS TO BOTTOM-BOX
async function updateAvailableAirports() {
  try {
    // Fetch player data
    const playerData = await getData(playerUrl);
    const playerRange = playerData[0].range_km;

    // Fetch airport data
    const airportData = await getData(distanceUrl);

    // Filter airports based on player's range
    const airportsWithinRange = airportData.filter(
      (airport) => airport.distance_km <= playerRange
    );

    // Clear existing content
    const airportsContainer = document.getElementById("range-and-airports");
    airportsContainer.innerHTML = "";

    // Checks if there is any airport within range
    // If no, game is lost

    if (airportsWithinRange.length === 1) {
      gameOverPopup("Game lost, no airports within range", false);
    }

    // Loop through each airport within range and create a list item with a link
    airportsWithinRange.forEach((airport) => {
      if (airport.distance_km !== 0) {
        const airportListItem = document.createElement("li");
        const airportButton = document.createElement("button");

        // Set the link text to the airport name and distance
        airportButton.innerHTML = `${airport.municipality}<br>(Distance: ${airport.distance_km} km)`;
        airportButton.id = airport.ident;

        airportButton.addEventListener("click", () =>
          updateAll(airport.ident, airport.distance_km)
        );

        // Append the link to the list item, and the list item to the container
        airportListItem.appendChild(airportButton);
        airportsContainer.appendChild(airportListItem);
      }
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

updateAvailableAirports();

// function to change location

async function flyTo(ident, distance_km) {
  try {
    const playerData = await getData(playerUrl);

    // Find the first item with a valid range_km property
    const playerRange = playerData.find(
      (player) => player.range_km !== undefined
    );

    const playerCurrentRange = playerRange.range_km;

    const range_km = playerCurrentRange - distance_km;

    // fetches curret patient goal info

    // fetches patient info
    const newPatientData = await getData(apiUrl + "patientdata");
    patientList = newPatientData.filter(
      (patient) => patient.location !== undefined
    );

    const newLocation = await getData(
      apiUrl + "updateplayer?location=" + ident + "&range_km=" + range_km
    );

    // Find the first item with a valid patient quantity property
    const currentQtyData = playerData.find(
      (player) => player.patient_qty !== undefined
    );
    const currentQty = currentQtyData.patient_qty;

    // checks if any patient is in the same location as player
    if (patientList.some((patient) => patient.location === ident)) {
      // checks if any space left in the helicopter
      // if true, patient is rescued and db is updated
      if (currentQty < 3) {
        rescued();
      }
    }

    // update player location and range
  } catch (error) {
    console.log(error);
  }
  // reduces player range
}

// function to update current patient locations to html

function updateHtmlLocations(patientList, quantity) {
  // inserts patient info into html p-element
  let patientHtml = document.getElementById("patient-locations");

  if (quantity < 3) {
    if (patientList.length === 3) {
      patientHtml.textContent = `Antidote Carriers are located at ${patientList[0].municipality}, 
    ${patientList[1].municipality} and ${patientList[2].municipality}`;
    } else if (patientList.length === 2) {
      patientHtml.textContent = `Antidote Carriers are located at ${patientList[0].municipality}
          and ${patientList[1].municipality}`;
    } else if (patientList.length === 1) {
      patientHtml.textContent = `Antidote Carrier is located at ${patientList[0].municipality}`;
    } else {
      patientHtml.textContent = `No more Antidote Carriers to be saved!`;
    }
  } else if (quantity >= 3) {
    patientHtml.textContent = `Helicopter is full and you have to return to Trondheim!`;
  }
}

// function to update everything - basically the game loop
function updateAll(ident, distance_km) {
  flyTo(ident, distance_km);
  if (ident === "ENTR") {
    homehospital();
  }
  updateCurrentLocation();
  updateAvailableAirports();
  updatePatientGoal();
  updatePatientQuantity();
  updateRangeInfo();
  leafletSetup();
}

//----------------------------------------------- OTHER STUFF ---------------------------------------------
//----------------------------------------------- OTHER STUFF ---------------------------------------------
//----------------------------------------------- OTHER STUFF ---------------------------------------------
//----------------------------------------------- OTHER STUFF ---------------------------------------------
//

/* calls function to setup map */
leafletSetup();

// OPEN INFORMATION POPUP
// popup form off auto names popping
document.getElementById("player-name").setAttribute("autocomplete", "off");

// to close the info popup
function closePopup() {
  document.getElementById("infoPopUp").style.display = "none";
}

// INFO POP UP

function openPopUp() {
  let x = document.getElementById("infoPopUp");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

// to show content on popup
function showContent(contentType) {
  // Hide all content elements
  document.querySelectorAll(".popup-content").forEach(function (element) {
    element.classList.remove("active");
  });

  // Show the selected content
  document.getElementById(contentType + "Content").classList.add("active");
}

// GAME OVER POPUP

function gameOverPopup(message, isWin) {
  // Create a game over popup container
  const gameOverContainer = document.createElement("div");
  gameOverContainer.classList.add("game-over-container");

  // Create game over popup content
  const gameOverContent = document.createElement("div");
  gameOverContent.classList.add("game-over-content");

  // Set background image based on game result

  if (isWin) {
    gameOverContent.style.backgroundImage = 'url("img/winner-norway.png")';
  } else {
    gameOverContent.style.backgroundImage = 'url("img/heli2.jpg")';

    const glitchGif = document.createElement("img");
    glitchGif.src = "img/glitch.gif";

    gameOverContent.appendChild(glitchGif);
  }

  const gameoverOverlay = document.createElement("div");
  gameoverOverlay.id = "dialogue-overlay";

  // Add content to game over popup
  const gameOverText = document.createElement("p");
  gameOverText.innerHTML = message;
  gameOverContent.appendChild(gameOverText);

  // Create "Play Again" button
  const playAgainButton = document.createElement("button");
  playAgainButton.textContent = "Play Again";
  playAgainButton.classList.add("play-again-button");
  playAgainButton.onclick = reloadPage;

  // Add "Play Again" button to game over popup content
  gameOverContent.appendChild(playAgainButton);

  // Add game over popup content to the container
  gameOverContainer.appendChild(gameOverContent);

  // Append the game over popup container to the body
  gameoverOverlay.appendChild(gameOverContainer);

  // Append the game over popup container to the body
  document.body.appendChild(gameoverOverlay);

  // Append the game over popup container to the body
  // document.body.appendChild(gameOverContainer);

  // Show the game over popup
  setTimeout(function () {
    $("#dialogue-overlay").fadeIn("fast");
  }, 400);
  gameOverContainer.style.display = "block";

  // Function to reload the page
  function reloadPage() {
    location.reload();
    gameSetup();
  }
}

// API FOR LOCATION WIKIPEDIA

async function wikipediaApiCallback(data) {
  console.log(data);

  // Extracting relevant information
  const page = data && data.parse && data.parse.pageid ? data.parse : null;
  if (page) {
    const cityName = page.title;
    const cityText = page.text && page.text["*"];

    // Extracting the image URL from the page content
    const imageMatch = cityText.match(/<img.*?src=['"](.*?)['"]/);
    const cityImage = imageMatch ? imageMatch[1] : null;

    // Update the HTML elements with the extracted information
    document.getElementById("city-name").innerHTML = cityName;
    document.getElementById("city-picture").src = cityImage;
  } else {
    console.error("Error retrieving data from Wikipedia API");
  }
}

// fetches data for wikipedia api
async function getMunicipalityData() {
  try {
    const municipalityData = await getData(apiUrl + "wikipediaapi");

    const currentMunicipality = municipalityData[0].municipality;
    console.log(currentMunicipality);

    // Create a script tag for the initial API request
    const script = document.createElement("script");
    script.src = `https://en.wikipedia.org/w/api.php?action=parse&page=${currentMunicipality}&format=json&callback=wikipediaApiCallback`;
    document.head.appendChild(script);
  } catch (error) {
    console.log(error);
  }
}

const infoWikipediaContainer = document.getElementById("info-wikipedia");
infoWikipediaContainer.addEventListener("click", getMunicipalityData);

// rainfall animation
function createRaindrop() {
  const raindrop = document.createElement("div");

  raindrop.className = "raindrop";
  raindrop.style.left = `${Math.random() * 100}%`;
  document.querySelector(".rainfall").appendChild(raindrop);

  raindrop.style.animationDuration = `${Math.random() * 2 + 1}s`;
}

function startRainfall() {
  setInterval(createRaindrop, 300); // Adjust the interval as needed for a slower rainfall
}

document.addEventListener("DOMContentLoaded", startRainfall);

// FUNCTION TO PLAY SOUND
const mainmenuSound = document.getElementById("mainmenu-sound");

function playAudio() {
  mainmenuSound.muted = true; // Mute the audio initially
  mainmenuSound.loop = true; // Set the loop property to true
  mainmenuSound
    .play()
    .then(function () {
      mainmenuSound.muted = false; // Unmute once playback has started
    })
    .catch(function (error) {
      console.error("Error playing audio:", error);
    });
}

function pauseAudio() {
  mainmenuSound.pause();
}
