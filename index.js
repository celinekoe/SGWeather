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

const INTENT_GET_WEATHER = "GetWeather";
const INTENT_IS_RAINING = "IsRaining";
const INTENT_WEATHER_CONTEXT = "WeatherContext";
const INTENT_RAINING_CONTEXT = "RainingContext";

const AREA_SINGAPORE = "Singapore";

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

const EVENT_RAIN = "rain";
const EVENT_SHOWER = "shower";


const DEFAULT_FALLBACK_INTENT = "Sorry, I don't know about the weather";
exports.weatherWebhook = (req, res) => {    
    let area = getArea(req);
    let dateObj = getDateObj(req);
    let intent = req.body.queryResult.intent.displayName;
    let sessionId = req.body.session.split("/").pop();

    if (intent === INTENT_GET_WEATHER || intent === INTENT_WEATHER_CONTEXT) {
        getWeather(res, area, dateObj, sessionId);
    } else if (intent === INTENT_IS_RAINING || intent === INTENT_RAINING_CONTEXT) {
        getIsRaining(res, area, dateObj, sessionId);
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'fulfillmentText': DEFAULT_FALLBACK_INTENT }));
    }
};

function getArea(req) {
    let area;
    if (req.body.queryResult.parameters["area"]) {
        area = req.body.queryResult.parameters["area"];
    } else {
        area = AREA_SINGAPORE;
    }
    return area;
}

function getDateObj(req) {
    let date;
    let simpleDate;
    let dateObj;
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
        "name": "projects/sgweather-8b165/agent/sessions/" + sessionId + "/contexts/weather",
        lifespanCount,
        "parameters": {},
    };
}

function getRainingContext(sessionId, lifespanCount) {
    return {
        "name": "projects/sgweather-8b165/agent/sessions/" + sessionId + "/contexts/raining",
        lifespanCount,
        "parameters": {},
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