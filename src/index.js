const data = require("./data.json");

const handler = async event => {
  const {
    zipcode,
    city,
    latitude,
    longitude,
    estimated_population,
    ...additionalFilters
  } = event.queryStringParameters;
  let result = data;
  if (zipcode) {
    result = data.filter(({ zip }) => zip.includes(zipcode));
  }

  if (city) {
    const lowerCaseCity = city.toLowerCase();
    result = result.filter(
      ({ primary_city, acceptable_cities, unacceptable_cities }) => {
        if (primary_city.toLowerCase().includes(lowerCaseCity)) return true;

        if (acceptable_cities) {
          const acceptableCityArr = acceptable_cities.split(", ");
          let index = acceptableCityArr.findIndex(city =>
            city.toLowerCase().includes(lowerCaseCity)
          );
          if (index !== -1) return true;
        }

        if (unacceptable_cities) {
          const unacceptableCityArr = unacceptable_cities.split(", ");

          index = unacceptableCityArr.findIndex(
            city => city.toLowerCase() === lowerCaseCity
          );
          if (index !== -1) return false;
        }

        return false;
      }
    );
  }

  if (latitude && longitude) {
    let min = Infinity;
    const parsedLat = Number(latitude);
    const parsedLng = Number(longitude);
    for (let location of result) {
      const distance =
        Math.pow(parsedLat - Number(location.latitude), 2) +
        Math.pow(parsedLng - Number(location.longitude), 2);
      if (distance < min) min = distance;
    }

    result = result.filter(({ latitude: lat, longitude: lng }) => {
      if (
        Math.pow(parsedLat - Number(lat), 2) +
          Math.pow(parsedLng - Number(lng), 2) ===
        min
      )
        return true;
      return false;
    });
  }

  if (latitude && !longitude) {
    const parsedLat = Number(latitude);
    let min = Infinity;

    for (let location of result) {
      const distance = Math.abs(parsedLat - Number(location.latitude));
      if (distance < min) min = distance;
    }

    result = result.filter(
      ({ latitude: lat }) => Math.abs(parsedLat - Number(lat)) === min
    );
  }

  if (!latitude && longitude) {
    const parsedLng = Number(longitude);
    let min = Infinity;

    for (let location of result) {
      const distance = Math.abs(parsedLng - Number(location.longitude));
      if (distance < min) min = distance;
    }

    result = result.filter(
      ({ longitude: lng }) => Math.abs(parsedLng - Number(lng)) === min
    );
  }

  if (estimated_population && Number(estimated_population)) {
    result = result.filter(
      ({ estimated_population: est }) =>
        Math.abs(Number(est) - Number(estimated_population)) /
          Number(estimated_population) <=
        0.05
    );
  }

  const keys = Object.keys(additionalFilters);
  if (keys.length) {
    keys.forEach(key => {
      result = result.filter(location =>
        location[key]
          .toLowerCase()
          .includes(additionalFilters[key].toLowerCase())
      );
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};

// lambda-like handler function
module.exports = { handler };
