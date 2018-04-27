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
const ACTION_GET_WEATHER = "getWeather";
const ACTION_IS_RAINING = "isRaining";
const AREA_SINGAPORE = "Singapore";
const DATE_NOW = "now";
const SIMPLE_DATE_NOW = "now";
const SIMPLE_DATE_TODAY = "today";
const SIMPLE_DATE_TOMORROW = "tomorrow";
const SIMPLE_DATE_DAY_AFTER_TOMORROW = "the day after tomorrow";
const SIMPLE_DATE_INVALID = "invalid";
const DEFAULT_FALLBACK_INTENT = "Sorry, I don't know about the weather";
exports.weatherWebhook = (req, res) => {
    let action = req.body.queryResult.action;
    let area = getArea(req);
    let dateObj = getDateObj(req);

    if (action === ACTION_GET_WEATHER) {
        getWeather(res, area, dateObj);
    } else if (action === ACTION_IS_RAINING) {
        isRaining(res, area, dateObj);
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

function getWeather(res, area, dateObj) {
    if (dateObj.simpleDate === SIMPLE_DATE_NOW) {
        getWeatherNow(res, area, dateObj);
    } else if (dateObj.simpleDate === SIMPLE_DATE_TODAY) {
        getWeatherToday(res, area, dateObj);
    } else {
        callWeatherApiFourDays(area, dateObj)
        .then((weather) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': weather }));
        })
        .catch((err) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': err }));
        });
    }
}

function getWeatherNow(res, area, dateObj) {
    if (area !== AREA_SINGAPORE) {
        callWeatherApiTwoHours(area)
        .then((weather) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': weather }));
        })
        .catch((err) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': err }));
        });
    } else {
        getWeatherToday(res, area, dateObj);
    }
}

function getWeatherToday(res, area, dateObj) {
    callWeatherApiTwentyFourHours(area)
    .then((weather) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'fulfillmentText': weather }));
    })
    .catch((err) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'fulfillmentText': err }));
    });
}

function isRaining(res, area, dateObj) {
    //
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
                    weather = "The weather in " + area + " will be " + forecast.forecast.toLowerCase() + ".";
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
