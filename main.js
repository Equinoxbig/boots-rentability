// Module request
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');

// Constants and request handler
const constants = require('./constants.js');
const utils = require('./utils.js');
const port = require('./config.json').port;

const app = express();

// Little cache system I made to avoid requests spam
let cache = new Map();

// Easy json parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic security advices from expressJS
app.disable('x-powered-by');
app.use(helmet());

// Page rendering
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/public'));

// Routes
app
    .get('/', (req, res) => {
        // Render page
        res.status(200).render('index');
    })
    .get('/share', (req, res) => {
        if (!cache.has(req.originalUrl)) {
            if (req.query.gameId && req.query.summonerID && req.query.server) {
                let endpoint = constants.ENDPOINTS[req.query.server.toUpperCase()];

                if (endpoint) {
                    utils.getGamePartipantId({ endpoint, gameId: req.query.gameId, summonerID: req.query.summonerID }).then(utils.getGameTimeline)
                        .then(utils.getChampionData)
                        .then(utils.fetchTimeline)
                        .then(utils.proceedData)
                        .then(data => {
                            cache.set(req.originalUrl, { data, timestamp: new Date().getTime() });
                            let template = utils.renderServerSide(data);
                            res.status(200).render('share', { template });
                        })
                        .catch((e) => {
                            console.error(e);
                            res.redirect('/');
                        });
                } else {
                    res.redirect('/');
                }
            } else {
                res.redirect('/');
            }
        } else {
            let template = utils.renderServerSide(cache.get(req.originalUrl).data);
            res.status(200).render('share', { template });
        }
    })
    .post('/api/', (req, res) => {
        if (req.body.server && req.body.username) {
            if (!cache.has(req.body.username.toLowerCase())) {
                let endpoint = constants.ENDPOINTS[req.body.server.toUpperCase()];

                if (endpoint) {
                    utils.getSummonerByName({ username: req.body.username, endpoint })
                        .then(utils.getRecentMatchList)
                        .then(utils.getGamePartipantId)
                        .then(utils.getGameTimeline)
                        .then(utils.getChampionData)
                        .then(utils.fetchTimeline)
                        .then(utils.proceedData)
                        .then(data => {
                            cache.set(req.body.username.toLowerCase(), { data, timestamp: new Date().getTime() });
                            cache.set(`/share?gameId=${data.gameInformation.gameId}&summonerID=${data.gameInformation.summonerID}&server=${data.gameInformation.endpoint}`, { data, timestamp: new Date().getTime() });
                            res.status(200).json({ data, code: 200, message: 'Success' });
                        }).catch((e) => { handleError(req, res, e); });
                } else {
                    // Shouldn't happen but just in case the server is not a valid server.
                    res.status(400).json({
                        code: 400,
                        message: 'Bad request',
                        defatils: 'Unknown server'
                    });
                }
            } else {
                res.status(200).json({ data: cache.get(req.body.username.toLowerCase()).data, code: 200, message: 'Success' });
            }
        } else {
            // If username or server is null return 400 Bad request
            res.status(400).json({
                code: 400,
                message: 'Bad request',
                details: 'Insufficient parameters'
            });
        }
    });

app.listen(port);

function handleError(req, res, e) {
    console.error(e);
    res.status(500).json({
        code: 500,
        message: 'Internal Server Error',
        details: e.msg
    });
}

// Little cache clearer
setInterval(() => {
    console.log('Clearing cache!');

    cache.forEach((entry, key) => {
        if (!((entry.timestamp + (60 * 10 * 1000)) > new Date().getTime())) {
            cache.delete(key);
        }
    });
}, 60 * 12 * 1000);