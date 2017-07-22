// Use axios for requests and set API key for every request
// Set axios default X-Riot-Token header to apikey
const axios = require('axios');
axios.defaults.headers.common['X-Riot-Token'] = require('./config.json').apiKey;


// Get a sumoner by name and returns his ID
// Takes an object with the endpoint to use and the username
module.exports.getSummonerByName = (data) => {
    let promise = new Promise((resolve, reject) => {
        axios.get(`https://${data.endpoint}/lol/summoner/v3/summoners/by-name/${data.username}`)
            .then((user) => {
                resolve({ endpoint: data.endpoint, id: user.data.accountId });
            })
            .catch((error) => {
                reject({ error, msg: 'Unknown Username' });
            });
    });
    return promise;
};


// Get the recent matchs of a summoner by ID
// Takes an object with an endpoint and an id property
// One referring to the endpoint in the post request the other one is the user's id
module.exports.getRecentMatchList = (data) => {
    let promise = new Promise((resolve, reject) => {
        axios.get(`https://${data.endpoint}/lol/match/v3/matchlists/by-account/${data.id}/recent`)
            .then((matchlist) => {
                resolve({ endpoint: data.endpoint, summonerID: data.id, match: matchlist.data.matches[0] });
            })
            .catch((rror) => {
                reject({ rror, message: 'Unknown Username' });
            });
    });
    return promise;
};


// Takes an endpoint, an accountId and a gameID and returns the participantId to unobfuscate the player.
// Also returns more precise match data
module.exports.getGamePartipantId = (data) => {
    let promise = new Promise((resolve, reject) => {
        axios.get(`https://${data.endpoint}/lol/match/v3/matches/${data.match.gameId}?forAccountId=${data.summonerID}`)
            .then((match) => {
                match.data.participantIdentities.forEach((participant) => {
                    if (participant.player) { if (participant.player.accountId == data.summonerID) data.summoner = participant; }
                });
                data.summoner ? resolve({ endpoint: data.endpoint, summoner: data.summoner, match: match.data }) : reject('Summoner not found');
            })
            .catch((error) => {
                reject(error);
            });
    });
    return promise;
};


// Takes an endpoint, a summoner and a gameID and returns the timeline of the match
module.exports.getGameTimeline = (data) => {
    let promise = new Promise((resolve, reject) => {
        axios.get(`https://${data.endpoint}/lol/match/v3/timelines/by-match/${data.match.gameId}`)
            .then((timeline) => {
                // No need to transfer the match data anymore so just fetchs data from the player we want
                // Side note : gameDuration is in seconds whereas timestamps timeline events are in ms
                data.summoner.matchData = data.match.participants[data.summoner.participantId - 1];
                data.summoner.matchData.duration = data.match.gameDuration;
                resolve({ endpoint: data.endpoint, summoner: data.summoner, timeline: timeline.data });
            })
            .catch((error) => {
                reject(error);
            });
    });
    return promise;
};


// Returns champion data, used for movespeed of the champion
// Takes a championID an endpoint
module.exports.getChampionData = (data) => {
    let promise = new Promise((resolve, reject) => {
        axios.get(`https://${data.endpoint}/lol/static-data/v3/champions/${data.summoner.matchData.championId}?locale=en_US&tags=stats`)
            .then((champion) => {
                data.summoner.champion = champion.data;
                resolve({ summoner: data.summoner, timeline: data.timeline });
            })
            .catch((error) => {
                reject({ error, msg: 'Static API Error' });
            });
    });
    return promise;
};


// Takes summoner and timeline
// Fetchs the timeline of the given game to know when boots were bought
module.exports.fetchTimeline = (data) => {
    let events = [];
    let buy = [];
    let promise = new Promise((resolve) => {

        // First gather every events from the timeline and push them into an array
        function fetchEvents() {
            data.timeline.frames.forEach((frame, index) => {
                events.push(frame.events);
                if (index == data.timeline.frames.length - 1) proceedEvents();
            });
        }

        // Recursive function :
        // Then treat event lists one by one and treat every events in those lists to fetch timestamps
        // Where boots are bought.
        function proceedEvents() {
            events.shift();
            if (events[0]) {
                events[0].forEach((event, index) => {
                    if (event) {
                        if (event.type === 'ITEM_PURCHASED' && event.participantId === data.summoner.participantId && Object.keys(require('./constants.js').BOOTS).includes(event.itemId.toString())) {
                            buy.push(event);
                        }
                    }
                    if (index >= events[0].length - 1) proceedEvents(events);
                });
            } else resolve({ summoner: data.summoner, buy });
        }

        fetchEvents();
    });
    return promise;
};


// Takes summoner + game length + buy events
// Returns the distance gained by buying boots depending on the timestamp when boots were bought
// Also uses champion data to calculate using the exact basic movespeed
module.exports.proceedData = (data) => {
    let promise = new Promise((resolve) => {
        // gameDuration is in seconds. Convert it to ms.
        let gameDuration = 1000 * data.summoner.matchData.duration;
        let firstItem = data.buy[0] ? data.buy[0] : { timestamp: gameDuration };

        // Distance travelled without boots.
        let withoutBoots = {
            timestamp: 0,
            itemId: 'champion',
            stats: {
                name: data.summoner.champion.name,
                cost: 0,
                ms: data.summoner.champion.stats.movespeed
            },
            timeSpent: firstItem.timestamp / 1000,
            totalDistanceTravelled: data.summoner.champion.stats.movespeed * (firstItem.timestamp / 1000),
            specificDistanceTravelled: data.summoner.champion.stats.movespeed * (firstItem.timestamp / 1000)
        };

        let stats = {
            totalDistanceTravelled: withoutBoots.totalDistanceTravelled,
            maxMovementSpeed: data.summoner.champion.stats.movespeed,
            travelledWithBoots: 0,
            gameDuration: data.summoner.matchData.duration
        };

        let results = [withoutBoots];

        // If cassiopeia is the last champion played
        if (!data.buy[0]) {
            resolve({ results, stats });
        } else {
            data.buy.forEach((buy, index) => {
                if (index != data.buy.length - 1) {

                    // Useless data
                    delete buy.type;
                    delete buy.participantId;

                    // Store object's stats
                    buy.stats = require('./constants').BOOTS[buy.itemId];
                    buy.stats.totalSpeed = data.summoner.champion.stats.movespeed + require('./constants').BOOTS[buy.itemId].ms;

                    // Substract next boots with actual boots to get the duration of use.
                    // Multiply this by the actual item's ms
                    buy.timeSpent = (data.buy[index + 1].timestamp - buy.timestamp) / 1000;

                    // Distance travelled with the movespeed of the boots
                    buy.specificDistanceTravelled = buy.timeSpent * buy.stats.ms;
                    // Distance travelled with the movespeed of the boots + basic champion ms
                    buy.totalDistanceTravelled = buy.timeSpent * buy.stats.totalSpeed;

                    // Update global stats
                    stats.totalDistanceTravelled += buy.totalDistanceTravelled;
                    buy.stats.totalSpeed > stats.maxMovementSpeed ? stats.maxMovementSpeed = buy.stats.totalSpeed : stats.maxMovementSpeed += 0;
                    stats.TravelledWithBoots += buy.specificDistanceTravelled;

                    results.push(buy);
                } else {

                    // Useless data
                    delete buy.type;
                    delete buy.participantId;

                    // Store object's stats
                    buy.stats = require('./constants').BOOTS[buy.itemId];
                    buy.stats.totalSpeed = data.summoner.champion.stats.movespeed + require('./constants').BOOTS[buy.itemId].ms;

                    // As there are no next boots just substract the total duration of the game with
                    // last buy timestamp
                    buy.timeSpent = (gameDuration - buy.timestamp) / 1000;

                    // Distance travelled with the movespeed of the boots
                    buy.specificDistanceTravelled = buy.timeSpent * buy.stats.ms;
                    // Distance travelled with the movespeed of the boots + basic champion ms
                    buy.totalDistanceTravelled = buy.timeSpent * buy.stats.totalSpeed;

                    // Update global stats
                    stats.totalDistanceTravelled += buy.totalDistanceTravelled;
                    buy.stats.totalSpeed > stats.maxMovementSpeed ? stats.maxMovementSpeed = buy.stats.totalSpeed : stats.maxMovementSpeed += 0;
                    stats.travelledWithBoots += buy.specificDistanceTravelled;

                    results.push(buy);
                    resolve({ results, stats });
                }
            });
        }
    });
    return promise;
};