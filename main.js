// Module request
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');

// Configuration and own files
const constants = require('./constants.js');
const utils = require('./utils.js');

const app = express();

// Easy json parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic security advices from expressJS
app.disable('x-powered-by');
app.use(helmet());

// Routes
app
    .get('/', (req, res) => {
        // Render page
        res.status(200).json({
            message: 'OK',
            code: 200
        });
    })
    .post('/api/', (req, res) => {
        if (req.body.server && req.body.username) {
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
                        res.status(200).json(data);
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
            // If username or server is null return 400 Bad request
            res.status(400).json({
                code: 400,
                message: 'Bad request',
                details: 'Insufficient parameters'
            });
        }
    });

app.listen(1918);

function handleError(req, res, e) {
    console.error(e);
    res.status(500).json({
        code: 500,
        message: 'Internal Server Error',
        details: e.msg
    });
}

// For API testing purpose :
// my id : 33429226
// my accountId: 36975066