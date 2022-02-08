const API_KEY = "485457b16ea720946a69d07e8c2f4e73";

let currentCity,
    inputCity,
    availableCityData;

let isLoadingWeather = false;
let isFirstViewSet = true;

const loading_page = document.querySelector(".loading");
const content_wrapper = document.querySelector(".content-wrapper");
const first_view = document.querySelector(".first-view");

const input = document.getElementById("input");
const autocomplete = document.getElementById("autocomplete");
const searchBtn = document.getElementById("search-btn");


// Get and display autocomplete on input event
input.addEventListener("input", basicDebounce(getAutocomplete));
// Use delegation to select items in autocomplete
autocomplete.addEventListener("click", function(event) {
    let li = event.target.closest('li');
    if (!li) return;
    const index = li.dataset.index;

    if (availableCityData) {
      registerInput(availableCityData[index]);
    }
  });


// Get autocomplete on input focus
input.onfocus = e => getAutocomplete();

// Hide autocmplete on blur
input.onblur = e => hideAutocomplete();

// Listen for keyup
input.addEventListener("keyup", function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.key === "Enter") {
    // Cancel the default action
    event.preventDefault();
    // Trigger the button element with a click
    searchBtn.click();
  }
});

// Do not refresh the page 
document.querySelector(".form").addEventListener("submit", (e) => e.preventDefault());


// Function changes class of body based on weather conditions and temperature
function setBodyClass(weatherState, temperature = null) {
  document.body.classList.remove("sunny", "clear", "rain", "fog");

  weatherState = weatherState.toLowerCase();
  let className;

  switch (weatherState) {
    case "clouds":
    case "clear" : 
      className = "clear";
      break;
    case "fog"  :
    case "mist" :
    case "smoke":
    case "haze" :
      className = "fog";
      break;
    case "rain" :
    case "thunderstorm":
      className = "rain";
      break;
    
    default: className = "clear";
  }

  if (className === "clear" && temperature >= 30) {
    className = "sunny";
  }

  document.body.classList.add(className);
}


// Function shows autocomplete
function showAutocomplete() {
  autocomplete.classList.remove("hidden");
  autocomplete.classList.add("visible");
  autocomplete.style.visibility = "visible";
}
// Function hides autocomplete
function hideAutocomplete() {
  autocomplete.classList.remove("visible");
  autocomplete.classList.add("hidden");
}

// Function shows loading view
function showLoadiong() {
  loading_page.style.display = "block";
}
// Function hides loading view
function hideLoading() {
  loading_page.style.display = "none";
}

// Declare a variable for a controller
let prevController;
// Function gets and then displays autocomplete
function getAutocomplete() {
  // Get input value directly
  let str = input.value;
  if (str.length === 0) {
    hideAutocomplete();
    return;
  }
  if (!navigator.onLine) {
    alertInput("You are offline");
    return;
  }

  // API 
  const autocomplete_API = `http://autocomplete.travelpayouts.com/places2?term=${str}&locale=en&types[]=city`;

  // Register abort controller to cancel fetch, when it is called twice 
  // Cancel previous controller
  if (prevController) prevController.abort();
  const controller = new AbortController();
  prevController = controller;

  fetch(autocomplete_API, { signal: controller.signal })
    .then(response => response.json())
    .then(data => {
      // Hide autocomplete in case there are no suggestions
      // Or in case we are already downloading data
      if (data.length === 0 || isLoadingWeather) {
        hideAutocomplete();
        return;
      }

      // Just hide it in case of errors returned
      if (data["error"]) {
        hideAutocomplete();
        // alertInput("Invalid input");
        return;
      }
      displayAutocomplete(data);
    })
    .catch( e => console.log("Network error"))
}


function displayAutocomplete(data) {
  autocomplete.innerHTML = "";
  for (let i = 0; i < data.length; i++){
    autocomplete.insertAdjacentHTML("beforeend",
                `<li class="list-item" data-index="${i}" tabindex="${i}">${data[i].name}, ${data[i].country_name}</li>`);
  }
  showAutocomplete();
  // Remember data of current autocomplete results
  availableCityData = data;
}


// Register selected City
function registerInput(data) {
  // Set inputCity to object with city parameters
  inputCity = {
    name: data.name,
    lat: data.coordinates.lat,
    lon: data.coordinates.lon,
    country: data.country_code,
  };
  input.value = data.name;
  input.focus();
}


// Display alert on input errors
function alertInput(str) {
  autocomplete.innerHTML = `<li class="alert">${str}</li>`;
  showAutocomplete();
}

// Display alert
function alertBody(str) {
  let alert = document.querySelector(".alert-body");

  // In case user clicks button again while animation is playing
  // Restart animation by replacing that element
  if (alert.classList.contains("animate-alert")) {
    let newone = alert.cloneNode(true);
    alert.parentNode.replaceChild(newone, alert);
    alert = newone;
  }

  alert.innerHTML = str;
  alert.classList.add("animate-alert");
  setTimeout( () => alert.classList.remove("animate-alert"), 3000);
}
 

// Function Debounce
function basicDebounce(proceed, delay = 400, target) {
  let timeoutId = null;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(proceed.bind(target ?? this), delay, ...args);
  };
}


// =======Get Weather================


// Get all nodes that are needed to display weather
const location = document.querySelector(".location_text");
const date_today = document.querySelector(".date-today");

const weather_img = document.querySelector(".weather_state");
const temperature = document.querySelector(".temperature");
const weather_title= document.querySelector(".weather_text");
const min_max_temp = document.querySelector(".min-max-temp");
const feels_like = document.querySelector(".feels-like");

const humidity = document.getElementById("humidity");
const pressure = document.getElementById("pressure");
const windSpeed = document.getElementById("wind-speed");

const week = document.querySelector(".weekly");


// Handle click on search button
searchBtn.addEventListener("click", () => {
  hideAutocomplete();

  if (input.value.length === 0) {
    alertBody("Type the city name");
    return;
  }
  if (!navigator.onLine) {
    alertBody("You are offline");
    return;
  }

  // Disable button while data is being loaded, and show loading view
  startLoadingView();

  if (inputCity) {
    getWeatherData();
    return;
  }
  // In case we don't already have data, search for it directly and then get weather
  searchCity();
});


// Functions show and hide loading view when data being loaded
function startLoadingView() {
  searchBtn.disabled = true;
  showLoadiong();
  isLoadingWeather = true;

  if (isFirstViewSet) {
    first_view.style.display = "none";
    content_wrapper.style.visibility = "visible";
    isFirstViewSet = false;
  }
}
function finishLoadingView() {
  searchBtn.disabled = false;
  hideLoading();
  isLoadingWeather = false;
}


function getWeatherData() {
  // Get city coordinates
  let lat = inputCity.lat;
  let lon = inputCity.lon;
  const Weather_API = 
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly,alerts&appid=${API_KEY}`;

  fetch(Weather_API)
    .then(response => response.json())
    .then(weather => {
      // Display it as soon as we get
      displayWeatherData(weather);
    })  
    .catch(e => alertInput("Network error"))
}

function displayWeatherData(weather) {

  // Get current and daily info in different variables
  const current = weather.current;
  const daily_info = weather.daily;

  // Get current date 
  const cityCurrentDate = getCityDate(current.dt, weather.timezone_offset);

  let weatherMainDescription = current.weather[0].main;
  let currentTemp = Math.round(current.temp);


  // Update all nodes
  location.innerHTML = `${inputCity.name}, ${inputCity.country}`;
  date_today.innerHTML = getFormatDate(cityCurrentDate);

  weather_img.src = `http://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;

  temperature.innerHTML = `${currentTemp}&#176`;
  weather_title.innerHTML = `${weatherMainDescription}`;

  min_max_temp.innerHTML = `${daily_info[0].temp.max.toFixed(1)}&#176 / ${daily_info[0].temp.min.toFixed(1)}&#176`;
  feels_like. innerHTML = `Feels like ${current.feels_like.toFixed(1)}&#176`;

  humidity.innerHTML = `${current.humidity}<span class="extra_info_units">%</span>`;
  pressure.innerHTML = `${current.pressure}<span class="extra_info_units">hPa</span>`;
  windSpeed.innerHTML = `${current.wind_speed.toFixed(1)}<span class="extra_info_units">m/sec</span>`;


  week.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    // Get date for requested day
    let cityDate = getCityDate(daily_info[i].dt, weather.timezone_offset)

    let week_day = i > 0 ? getWeekDay(cityDate) : "Today";

    if (i > 0) {
      week.insertAdjacentHTML("beforeend", 
        `<div class="decoration_line"></div>`
      );
    } 

    week.insertAdjacentHTML("beforeend", 
      `<div class="day_card">
        <h2>${week_day}</h2>
        <p class="date_weekly">${getFormatDate(cityDate, true)}</p>
        <img src="http://openweathermap.org/img/wn/${daily_info[i].weather[0].icon}@2x.png" alt="">
        <p class="temp_weekly">${Math.round(daily_info[i].temp.max)}&#176/${Math.round(daily_info[i].temp.min)}&#176</p>
      </div>`
    );
  }

  // Set body class
  setBodyClass(weatherMainDescription, currentTemp);

  // Reset input parameters
  input.value = "";
  inputCity = null;

  // Set button back to enabled and remove the loading view 
  finishLoadingView();
}

// Serches city and gets weather data
function searchCity() {
  // Get city name form input
  const cityName = input.value;
  // A parameter for the API, how many cities to recieve
  const limit = 1;

  const Geo_API = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=${limit}&appid=${API_KEY}`;

  fetch(Geo_API)
    .then(response => response.json())
    .then(city => {

      if (city.length < 1) {
        alertBody("Couldn't find this city");
        // Set button back to enabled and remove the loading view 
        finishLoadingView();
        return;
      }
      // Get the city from the first parameter in the array
      inputCity = city[0];
      // Get weather
      getWeatherData();
    })
    .catch( e => alertBody("Network error"));
}


// Gets the city time and date
function getCityDate(dt, offset) {
  // Return in UTC, so that we don't calculate locally
  return new Date( new Date ((dt + offset) * 1000).toUTCString());
}

// Returns Date and time in the right format
function getFormatDate(date, short = false) {

  const monthList= ["January","February","March","April","May","June","July",
    "August","September","October","November","December"];

  const date_day = date.getUTCDate();
  const month_index = date.getUTCMonth();

  const month_number = (month_index + 1) < 10 ? `0${month_index + 1}` : `${month_index + 1}`;

  if (short) {
    return `${date_day}.${month_number}`;
  }

  return `${getWeekDay(date)} ${date_day} ${monthList[month_index]} ${toPeriodFormat(date)}`;
}

// Returns day of the week
function getWeekDay(date) {
  const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return week[date.getUTCDay()];
}

// Returns time in period format
function toPeriodFormat(date) {
  let hours = date.getUTCHours(),
  minutes = date.getUTCMinutes(),
  ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  minutes = minutes < 10 ? `0${minutes}` : minutes;
  let strTime = `${hours} : ${minutes} ${ampm}`;

  return strTime;
}


// Hide loading view when js file loaded;
hideLoading();