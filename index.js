// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';
const rp = require('request-promise');
const functions = require('firebase-functions');
const DialogflowApp = require('actions-on-google').DialogflowApp;

const INTENT_GET_WEATHER = "GetWeather";
const INTENT_IS_RAINING = "IsRaining";
const INTENT_WEATHER_CONTEXT = "WeatherContext";
const INTENT_RAINING_CONTEXT = "RainingContext";
const INTENT_REQUEST_LOCATION = "RequestLocation";

const AREA_SINGAPORE = "Singapore";
const AREAS = [
    {
        "name": "Ang Mo Kio",
        "coordinates": {
            "latitude": 1.375,
            "longitude": 103.839
        }
    },
    {
        "name": "Bedok",
        "coordinates": {
            "latitude": 1.321,
            "longitude": 103.924
        }
    },
    {
        "name": "Bishan",
        "coordinates": {
            "latitude": 1.350772,
            "longitude": 103.839
        }
    },
    {
        "name": "Boon Lay",
        "coordinates": {
            "latitude": 1.304,
            "longitude": 103.701
        }
    },
    {
        "name": "Bukit Batok",
        "coordinates": {
            "latitude": 1.353,
            "longitude": 103.754
        }
    },
    {
        "name": "Bukit Merah",
        "coordinates": {
            "latitude": 1.277,
            "longitude": 103.819
        }
    },
    {
        "name": "Bukit Panjang",
        "coordinates": {
            "latitude": 1.362,
            "longitude": 103.77195
        }
    },
    {
        "name": "Bukit Timah",
        "coordinates": {
            "latitude": 1.325,
            "longitude": 103.791
        }
    },
    {
        "name": "Central Water Catchment",
        "coordinates": {
            "latitude": 1.38,
            "longitude": 103.805
        }
    },
    {
        "name": "Changi",
        "coordinates": {
            "latitude": 1.357,
            "longitude": 103.987
        }
    },
    {
        "name": "Choa Chu Kang",
        "coordinates": {
            "latitude": 1.377,
            "longitude": 103.745
        }
    },
    {
        "name": "Clementi",
        "coordinates": {
            "latitude": 1.315,
            "longitude": 103.76
        }
    },
    {
        "name": "City",
        "coordinates": {
            "latitude": 1.292,
            "longitude": 103.844
        }
    },
    {
        "name": "Geylang",
        "coordinates": {
            "latitude": 1.318,
            "longitude": 103.884
        }
    },
    {
        "name": "Hougang",
        "coordinates": {
            "latitude": 1.361218,
            "longitude": 103.886
        }
    },
    {
        "name": "Jalan Bahar",
        "coordinates": {
            "latitude": 1.347,
            "longitude": 103.67
        }
    },
    {
        "name": "Jurong East",
        "coordinates": {
            "latitude": 1.326,
            "longitude": 103.737
        }
    },
    {
        "name": "Jurong Island",
        "coordinates": {
            "latitude": 1.266,
            "longitude": 103.699
        }
    },
    {
        "name": "Jurong West",
        "coordinates": {
            "latitude": 1.34039,
            "longitude": 103.705
        }
    },
    {
        "name": "Kallang",
        "coordinates": {
            "latitude": 1.312,
            "longitude": 103.862
        }
    },
    {
        "name": "Lim Chu Kang",
        "coordinates": {
            "latitude": 1.423,
            "longitude": 103.717332
        }
    },
    {
        "name": "Mandai",
        "coordinates": {
            "latitude": 1.419,
            "longitude": 103.812
        }
    },
    {
        "name": "Marine Parade",
        "coordinates": {
            "latitude": 1.297,
            "longitude": 103.891
        }
    },
    {
        "name": "Novena",
        "coordinates": {
            "latitude": 1.327,
            "longitude": 103.826
        }
    },
    {
        "name": "Pasir Ris",
        "coordinates": {
            "latitude": 1.37,
            "longitude": 103.948
        }
    },
    {
        "name": "Paya Lebar",
        "coordinates": {
            "latitude": 1.358,
            "longitude": 103.914
        }
    },
    {
        "name": "Pioneer",
        "coordinates": {
            "latitude": 1.315,
            "longitude": 103.675
        }
    },
    {
        "name": "Pulau Tekong",
        "coordinates": {
            "latitude": 1.403,
            "longitude": 104.053
        }
    },
    {
        "name": "Pulau Ubin",
        "coordinates": {
            "latitude": 1.404,
            "longitude": 103.96
        }
    },
    {
        "name": "Punggol",
        "coordinates": {
            "latitude": 1.401,
            "longitude": 103.904
        }
    },
    {
        "name": "Queenstown",
        "coordinates": {
            "latitude": 1.291,
            "longitude": 103.78576
        }
    },
    {
        "name": "Seletar",
        "coordinates": {
            "latitude": 1.404,
            "longitude": 103.869
        }
    },
    {
        "name": "Sembawang",
        "coordinates": {
            "latitude": 1.445,
            "longitude": 103.818495
        }
    },
    {
        "name": "Sengkang",
        "coordinates": {
            "latitude": 1.384,
            "longitude": 103.891443
        }
    },
    {
        "name": "Sentosa",
        "coordinates": {
            "latitude": 1.243,
            "longitude": 103.832
        }
    },
    {
        "name": "Serangoon",
        "coordinates": {
            "latitude": 1.357,
            "longitude": 103.865
        }
    },
    {
        "name": "Southern Islands",
        "coordinates": {
            "latitude": 1.208,
            "longitude": 103.842
        }
    },
    {
        "name": "Sungei Kadut",
        "coordinates": {
            "latitude": 1.413,
            "longitude": 103.756
        }
    },
    {
        "name": "Tampines",
        "coordinates": {
            "latitude": 1.345,
            "longitude": 103.944
        }
    },
    {
        "name": "Tanglin",
        "coordinates": {
            "latitude": 1.308,
            "longitude": 103.813
        }
    },
    {
        "name": "Tengah",
        "coordinates": {
            "latitude": 1.374,
            "longitude": 103.715
        }
    },
    {
        "name": "Toa Payoh",
        "coordinates": {
            "latitude": 1.334304,
            "longitude": 103.856327
        }
    },
    {
        "name": "Tuas",
        "coordinates": {
            "latitude": 1.294947,
            "longitude": 103.635
        }
    },
    {
        "name": "Western Islands",
        "coordinates": {
            "latitude": 1.205926,
            "longitude": 103.746
        }
    },
    {
        "name": "Western Water Catchment",
        "coordinates": {
            "latitude": 1.405,
            "longitude": 103.689
        }
    },
    {
        "name": "Woodlands",
        "coordinates": {
            "latitude": 1.432,
            "longitude": 103.786528
        }
    },
    {
        "name": "Yishun",
        "coordinates": {
            "latitude": 1.418,
            "longitude": 103.839
        }
    }
];

const DATE_NOW = "now";
const SIMPLE_DATE_NOW = "now";
const SIMPLE_DATE_TODAY = "today";
const SIMPLE_DATE_TOMORROW = "tomorrow";
const SIMPLE_DATE_DAY_AFTER_TOMORROW = "the day after tomorrow";
const SIMPLE_DATES = [ 
    SIMPLE_DATE_NOW, 
    SIMPLE_DATE_TODAY, 
    SIMPLE_DATE_TOMORROW, 
    SIMPLE_DATE_DAY_AFTER_TOMORROW
];
const SIMPLE_DATE_INVALID = "invalid";

const CONTEXT_WEATHER = "weather";
const CONTEXT_RAINING = "raining"

const EVENT_RAIN = "rain";
const EVENT_SHOWER = "shower";


const DEFAULT_FALLBACK_INTENT = "Sorry, I don't know about the weather";
exports.weatherWebhook = (req, res) => {
    let area = getArea(req);
    let dateObj = getDateObj(req);
    let intent = getIntent(req);
    console.log("printing intent..." + intent);
    let sessionId = req.body.session.split("/").pop();

    if (intent === INTENT_GET_WEATHER || intent === INTENT_WEATHER_CONTEXT) {
        getWeather(res, area, dateObj, sessionId);
    } else if (intent === INTENT_IS_RAINING || intent === INTENT_RAINING_CONTEXT) {
        getIsRaining(res, area, dateObj, sessionId);
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'fulfillmentText': DEFAULT_FALLBACK_INTENT }));
    }
}

function getIntent(req) {
    let intent = req.body.queryResult.intent.displayName;
    if (intent === INTENT_REQUEST_LOCATION) {
        intent = getOriginalIntent(req);
    }
    return intent;
}

function getOriginalIntent(req) {
    let outputContexts = req.body.queryResult.outputContexts;

    let simpleOutputContexts = outputContexts
    .map(outputContext => {
        return outputContext.name.split("/").pop();
    });

    console.log("printing simpleOutputContexts...");
    console.log(simpleOutputContexts);

    let originalIntent;
    for (let i = 0; i < simpleOutputContexts.length; i++) {
        if (simpleOutputContexts[i] === CONTEXT_WEATHER) {
            originalIntent = INTENT_GET_WEATHER;
            break;
        } else if (simpleOutputContexts[i] === CONTEXT_RAINING) {
            originalIntent = INTENT_IS_RAINING;
            break;
        }
    }

    return originalIntent;
}

function getArea(req) {
    let intent = req.body.queryResult.intent.displayName;
    let area;
    if (intent !== INTENT_REQUEST_LOCATION) {
        if (req.body.queryResult.parameters["area"]) {
            area = req.body.queryResult.parameters["area"];
        } else {
            area = AREA_SINGAPORE;
        }    
    } else {
        let coordinates = req.body.originalDetectIntentRequest.payload.device.location.coordinates;
        area = getClosestArea(coordinates);
    }
    return area;
}

function getClosestArea(coordinates) {
    let lat = coordinates.latitude;
    let long = coordinates.longitude;
    let closestArea = AREAS[0];
    let latDiff = AREAS[0].coordinates.latitude - lat;
    let longDiff = AREAS[0].coordinates.longitude - long;
    let closestDistance = Math.pow(latDiff, 2) + Math.pow(longDiff, 2);
    for (let i = 1; i < AREAS.length; i++) {
        let tempLatDiff = AREAS[i].coordinates.latitude - lat;
        let tempLongDiff = AREAS[i].coordinates.longitude - long;
        let tempClosestDistance = Math.pow(tempLatDiff, 2) + Math.pow(tempLongDiff, 2);
        if (tempClosestDistance < closestDistance) {
            closestArea = AREAS[i];
            closestDistance = tempClosestDistance;
        }
    }
    return closestArea.name;
}

function getDateObj(req) {
    let intent = req.body.queryResult.intent.displayName;
    let date;
    let simpleDate;
    let dateObj;
    if (intent !== INTENT_REQUEST_LOCATION) {
        if (req.body.queryResult.parameters["date"]) {
            date = req.body.queryResult.parameters["date"];
            date = getFormattedDate(date);
            simpleDate = getSimpleDate(date);
            dateObj = {
                date,
                simpleDate,
            }
        } else {
            date = DATE_NOW;
            simpleDate = SIMPLE_DATE_NOW;
            dateObj = {
                date,
                simpleDate,
            }
        }  
    } else {
        date = DATE_NOW;
        simpleDate = SIMPLE_DATE_NOW;
        dateObj = {
            date,
            simpleDate,
        }
    }
    return dateObj;
}

function getFormattedDate(date) {
    let formattedDate = date.split("T")[0];
    return formattedDate;
}

function getSimpleDate(date) {
    let now = new Date();
    let compareDate = new Date(date);
    let timeDiffInMs = compareDate.getTime() - now.getTime();
    let diffDays = Math.ceil(timeDiffInMs / (1000 * 3600 * 24));
    let simpleDate;
    if (diffDays === 0) {
        simpleDate = SIMPLE_DATE_TODAY;
    } else if (diffDays === 1) {
        simpleDate = SIMPLE_DATE_TOMORROW;
    } else if (diffDays === 2) {
        simpleDate = SIMPLE_DATE_DAY_AFTER_TOMORROW;
    } else {
        simpleDate = SIMPLE_DATE_INVALID;
    }
    return simpleDate;
}

function getWeather(res, area, dateObj, sessionId) {
    if (dateObj.simpleDate === SIMPLE_DATE_NOW) {
        if (area !== AREA_SINGAPORE) {
            getWeatherNow(area)
            .then((weather) => {
                let response = getWeatherResponse(weather, SIMPLE_DATE_NOW, sessionId);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(response));
            })
            .catch((err) => {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ 'fulfillmentText': err }));
            });
        } else {
            let response = getWeatherLocationResponse(sessionId);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response));
        }
    } else if (dateObj.simpleDate === SIMPLE_DATE_TODAY) {
        getWeatherToday(area)
        .then((weather) => {
            let response = getWeatherResponse(weather, SIMPLE_DATE_TODAY, sessionId);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response));
        })
        .catch((err) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': err }));
        });
    } else {
        callWeatherApiFourDays(area, dateObj)
        .then((weather) => {
            let response = getWeatherResponse(weather, dateObj.simpleDate, sessionId);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response));
        })
        .catch((err) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': err }));
        });
    }
}

function getWeatherNow(area) {
    if (area !== AREA_SINGAPORE) {
        return callWeatherApiTwoHours(area);
    } else {
        return getWeatherToday(area);
    }
}

function getWeatherToday(area) {
    return callWeatherApiTwentyFourHours(area);
}

function getWeatherResponse(weather, simpleDate, sessionId) {
    let simpleResponse = getWeatherSimpleResponse(weather);
    let suggestions = getWeatherSuggestions(simpleDate);
    let outputContexts = getWeatherOutputContexts(sessionId);
    return {
        "fulfillmentText": weather,
        "payload": {
            "google": {
                "richResponse": {
                    "items": [
                        {
                            simpleResponse,
                        },
                    ],
                    suggestions,
                }
            }
        },
        outputContexts,
    };
}

function getWeatherSimpleResponse(weather) {
    return {
        "textToSpeech": weather,
        "displayText": weather,
    };
}

function getWeatherSuggestions(currentSimpleDate) {
    let suggestions = SIMPLE_DATES
    .filter(simpleDate => {
        return simpleDate !== currentSimpleDate;
    })
    .map(simpleDate => {
        return {
            "title": simpleDate,
        };
    });
    suggestions.push({"title": "rain"});
    return suggestions;
}

function getWeatherOutputContexts(sessionId) {
    let weatherContext = getWeatherContext(sessionId, 5);
    let rainingContext = getRainingContext(sessionId, 0);
    return [weatherContext, rainingContext];
}

function getWeatherContext(sessionId, lifespanCount) {
    return {
        "name": "projects/sgweather-8b165/agent/sessions/" + sessionId + "/contexts/" + CONTEXT_WEATHER,
        lifespanCount,
        "parameters": {},
    };
}

function getRainingContext(sessionId, lifespanCount) {
    return {
        "name": "projects/sgweather-8b165/agent/sessions/" + sessionId + "/contexts/" + CONTEXT_RAINING,
        lifespanCount,
        "parameters": {},
    };
}

function getWeatherLocationResponse(sessionId) {
    let outputContexts = getWeatherOutputContexts(sessionId);
    return {
        "fulfillmentText": "requesting location permission",
        "payload": {
            "google": {
                "expectUserResponse": true,
                "systemIntent": {
                    "intent": "actions.intent.PERMISSION",
                    "data": {
                        "@type": "type.googleapis.com/google.actions.v2.PermissionValueSpec",
                        "optContext": "To provide an accurate experience, ",
                        "permissions": ["DEVICE_PRECISE_LOCATION"]
                    },
                },
            },
        },
        outputContexts,
    };
}

function callWeatherApiTwoHours (area) {
    return new Promise((resolve, reject) => {
        let options = {
            uri: "https://api.data.gov.sg/v1/environment/2-hour-weather-forecast",
            headers: {
                'User-Agent': 'Request-Promise',
            },
            json: true,
        };
        rp(options)
        .then(function (response) {
            let forecasts = response.items[0].forecasts;
            let weather = "No weather found for " + area + ".";
            for (let i = 0; i < forecasts.length; i ++) {
                let forecast = forecasts[i];
                if (forecast.area.toLowerCase() === area.toLowerCase()) {
                    weather = "The weather in " + area + " is " + forecast.forecast.toLowerCase() + ".";
                    resolve(weather);
                } else if (i < forecasts.length) {
                    // do nothing
                } else {
                    resolve(weather);
                }
            }
        })
        .catch(function (err) {
            reject(err);
        });
    });
}

function callWeatherApiTwentyFourHours(area) {
    return new Promise((resolve, reject) => {
        let options = {
            uri: "https://api.data.gov.sg/v1/environment/24-hour-weather-forecast",
            headers: {
                'User-Agent': 'Request-Promise',
            },
            json: true,
        };
        rp(options)
        .then(function (response) {
            let forecast = response.items[0].general.forecast;
            let weather = "The weather in " + area + " for today will be " + forecast.toLowerCase() + ".";
            resolve(weather);
        })
        .catch(function (err) {
            reject(err);
        });
    });
}

function callWeatherApiFourDays (area, dateObj) {
    return new Promise((resolve, reject) => {
        let date = dateObj.date;
        let simpleDate = dateObj.simpleDate;
        let options = {
            uri: "https://api.data.gov.sg/v1/environment/4-day-weather-forecast",
            headers: {
                'User-Agent': 'Request-Promise',
            },
            json: true,
        };
        rp(options)
        .then(function (response) {
            let forecasts = response.items[0].forecasts;
            let weather = "No weather found for " + date + ".";
            for (let i = 0; i < forecasts.length; i ++) {
                let forecast = forecasts[i];
                if (forecast.date === date) {
                    if (simpleDate !== SIMPLE_DATE_INVALID) {
                        weather = "The weather in " + area + " for " + simpleDate + " will be " + forecast.forecast.toLowerCase();
                        resolve(weather);
                    } else {
                        weather = "The weather in " + area + " on " + date + " will be " + forecast.forecast.toLowerCase();
                        resolve(weather);
                    }
                } else if (i < forecasts.length) {
                    // do nothing
                } else {
                    resolve(weather);
                }
            }
        })
        .catch(function (err) {
            reject(err);
        });
    });
}

function getIsRaining(res, area, dateObj, sessionId) {
    if (dateObj.simpleDate === SIMPLE_DATE_NOW) {
        if (area !== AREA_SINGAPORE) {
            getWeatherNow(area)
            .then((weather) => {
                return getIsRainingNow(area, weather);
            })
            .then((isRainingString) => {
                let response = getIsRainingResponse(isRainingString, SIMPLE_DATE_NOW, sessionId);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(response));
            })
            .catch((err) => {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ 'fulfillmentText': err }));
            });
        } else {
            let response = getIsRainingLocationResponse(sessionId);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response));
        }
    } else if (dateObj.simpleDate === SIMPLE_DATE_TODAY) {
        getWeatherToday(area)
        .then((weather) => {
            return getIsRainingToday(area, weather);
        })
        .then((isRainingString) => {
            let response = getIsRainingResponse(isRainingString, SIMPLE_DATE_TODAY, sessionId);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response));
        })
        .catch((err) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': err }));
        });
    } else {
        callWeatherApiFourDays(area, dateObj)
        .then((weather) => {
            return getIsRainingFourDays(area, dateObj, weather);
        })
        .then((isRainingString) => {
            let response = getIsRainingResponse(isRainingString, dateObj.simpleDate, sessionId);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response));
        })
        .catch((err) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': err }));
        });
    }
}

function getIsRainingNow(area, weather) {
    if (area !== AREA_SINGAPORE) {
        return getIsRainingNowPromise(area, weather);
    } else {   
        return getIsRainingToday(area, weather);
    }
}

function getIsRainingNowPromise(area, weather) {
    return new Promise((resolve) => {
        let isRainingBool = weather.includes(EVENT_RAIN) || weather.includes(EVENT_SHOWER);
        let isRainingString;
        if (!isRainingBool) {
            isRainingString = "It is not raining in " + area + ".";
        } else {
            isRainingString = "It is raining in " + area + ".";
        }
        resolve(isRainingString);
    });
}

function getIsRainingToday(area, weather) {
    return new Promise((resolve) => {
        let isRainingBool = weather.includes(EVENT_RAIN) || weather.includes(EVENT_SHOWER);
        let isRainingString;
        if (!isRainingBool) {
            isRainingString = "It will not be raining in " + area + " today.";
        } else {
            isRainingString = "It will be raining in " + area + " today.";
        }
        resolve(isRainingString);
    });
}

function getIsRainingFourDays(area, dateObj, weather) {
    return new Promise((resolve) => {
        let simpleDate = dateObj.simpleDate;
        let isRainingBool = weather.includes(EVENT_RAIN) || weather.includes(EVENT_SHOWER);
        let isRainingString;
        if (!isRainingBool) {
            isRainingString = "It will not be raining in " + area + " " + simpleDate + ".";
        } else {
            isRainingString = "It will be raining in " + area + " " + simpleDate + ".";
        }
        resolve(isRainingString);
    });
}

function getIsRainingResponse(isRainingString, simpleDate, sessionId) {
    let simpleResponse = getIsRainingSimpleResponse(isRainingString);
    let suggestions = getIsRainingSuggestions(simpleDate);
    let outputContexts = getIsRainingOutputContexts(sessionId);
    return {
        "fulfillmentText": isRainingString,
        "payload": {
            "google": {
                "richResponse": {
                    "items": [
                        {
                            simpleResponse,
                        },
                    ],
                    suggestions,
                }
            }
        },
        outputContexts,
    };
}

function getIsRainingSimpleResponse(isRainingString) {
    return {
        "textToSpeech": isRainingString,
        "displayText": isRainingString,
    };
}

function getIsRainingSuggestions(currentSimpleDate) {
    let suggestions = SIMPLE_DATES
    .filter(simpleDate => {
        return simpleDate !== currentSimpleDate;
    })
    .map(simpleDate => {
        return {
            "title": simpleDate,
        };
    });
    suggestions.push({"title": "weather"});
    return suggestions;
}

function getIsRainingOutputContexts(sessionId) {
    let weatherContext = getWeatherContext(sessionId, 0);
    let rainingContext = getRainingContext(sessionId, 5);
    return [weatherContext, rainingContext];
}

function getIsRainingLocationResponse(sessionId) {
    let outputContexts = getIsRainingOutputContexts(sessionId);
    return {
        "fulfillmentText": "requesting location permission",
        "payload": {
            "google": {
                "expectUserResponse": true,
                "systemIntent": {
                    "intent": "actions.intent.PERMISSION",
                    "data": {
                        "@type": "type.googleapis.com/google.actions.v2.PermissionValueSpec",
                        "optContext": "To provide an accurate experience, ",
                        "permissions": ["DEVICE_PRECISE_LOCATION"]
                    },
                },
            },
        },
        outputContexts,
    };
}
