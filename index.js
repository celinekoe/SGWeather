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
exports.weatherWebhook = (req, res) => {

    let area = "";
    if (req.body.queryResult.parameters["area"]) {
        area = req.body.queryResult.parameters["area"];
    } else {
        area = "no area";
    }

    let date;
    let simpleDate;
    if (req.body.queryResult.parameters["date"]) {
        date = req.body.queryResult.parameters["date"];
        date = getFormattedDate(date);
        simpleDate = getSimpleDate(date);
    } else {
        date = "now";
        simpleDate = "now";
    }

    // no date, no area - need to handle
    // date, no area - ok
    // no date, area - ok
    // date, area - area is ignored
    if (simpleDate === "now") {
        callWeatherApiTwoHours(area)
        .then((weather) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': weather }));
        })
        .catch((err) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': err }));
        });
    } else if (simpleDate === "today") {
        // if has date, ignore area parameter
        callWeatherApiTwentyFourHours()
        .then((weather) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': weather }));
        })
        .catch((err) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': err }));
        });
    } else {
        // if has date, ignore area parameter
        callWeatherApiFourDays(date, simpleDate)
        .then((weather) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': weather }));
        })
        .catch((err) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'fulfillmentText': err }));
        });
    }
};

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
        simpleDate = "today";
    } else if (diffDays === 1) {
        simpleDate = "tomorrow";
    } else if (diffDays === 2) {
        simpleDate = "the day after tomorrow";
    } else {
        simpleDate = "invalid";
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

function callWeatherApiTwentyFourHours() {
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
            let weather = "The weather today will be " + forecast.toLowerCase() + ".";
            resolve(weather);
        })
        .catch(function (err) {
            reject(err);
        });
    });
}

function callWeatherApiFourDays (date, simpleDate) {
    return new Promise((resolve, reject) => {
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
                    if (simpleDate !== "invalid") {
                        weather = "The weather for " + simpleDate + " will be " + forecast.forecast.toLowerCase();
                        resolve(weather);
                    } else {
                        weather = "The weather on " + date + " will be " + forecast.forecast.toLowerCase();
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
