// When DOM has finished loading
document.addEventListener('DOMContentLoaded', function() {
    // Call the API when the submit button is clicked
    // But first verify that server and summoner name are entered
    document.getElementById('submit').addEventListener('click', function() {
        if (document.getElementById('server').value && document.getElementById('summonerName').value) {
            if (!document.getElementById('error-text').className.includes('hidden')) fadeOut('error-text', true);
            callApi(document.getElementById('server').value, document.getElementById('summonerName').value);
        } else {
            if (document.getElementById('error-text').className.includes('hidden')) fadeIn('error-text');
            document.getElementById('error-text').innerHTML = '<br>Please enter a summoner<br>name and pick your server<br>';
        }
    });

    document.getElementById('reset').addEventListener('click', function() {
        fadeOut('results', true);
        setTimeout(function() { fadeIn('home'); }, 1000);
    });

    // Testing purpose :
    //fadeOut('home', true);
    //setTimeout(() => { fadeIn('results'); }, 1000);
});


// Makes a call to /api/ using fetch
// Sends a server and an username
// Returns an object containing a stats object and an array
function callApi(server, username) {

    // Starts the loading thing
    var start = new Date().getTime();
    loadingStart(start);

    // Set header to application/json
    var headers = new Headers({ 'Content-Type': 'application/json' });

    fetch(`/api/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ server, username })
    }).then(
        function(res) {
            res.json().then(function(data) {

                // No error -> Hide input menu -> display data
                if (data.code === 200) {
                    loadingEnd(new Date().getTime(), start, data);
                }
                // Error -> Display error and wait for a new input
                else {
                    document.getElementById('error-text').innerHTML = '<br>Error ' + data.code.toString() + (data.details ? ':<br>' + data.details + '<br>' : ':<br>Unknown error<br>');
                    fadeIn('error-text');
                    loadingEnd(new Date().getTime(), start, null);
                }

            });
        }).catch(
        function(err) {
            loadingEnd(new Date().getTime(), start);
            console.log(err.message);
        });
}

var loader;

// Starts a timer
// Displayed during API request to have an idea of when it's gonna end
function loadingStart(start) {
    fadeIn('loading');
    console.log('[' + new Date(start) + '] - Request sent');

    var still = 0;
    loader = setInterval(function() {
        still = new Date(new Date().getTime() - start);
        document.getElementById('loader').innerHTML = 'Retrieving data since :<br>' + still.getSeconds() + '.' + still.getMilliseconds().toString().substring(0, 2) + 's';
    }, 10);
}

// Stops loader and hides the home div if told to
// Also logs the time taken for the request to be made
function loadingEnd(end, start, data) {
    console.log('[' + new Date(end) + '] - Response received', '\nIt took : ' + (end - start).toString() + 'ms');
    clearInterval(loader);
    loader = null;
    data ? (fadeOut('home', true), fadeOut('loading', false), setTimeout(function() { fadeIn('results'), display(data, (end - start)); }, 1 * 1000)) : null;
}

// fadeOut
// Used to hide all the inputs
function fadeOut(element, hide) {
    console.log('fadeOut ' + element);
    var actual = 1;
    var loader = setInterval(function() {
        if (actual > 0) {
            actual -= 0.01;
            document.getElementById(element).style = 'opacity:' + actual + ';';
        } else {
            if (hide) document.getElementById(element).classList.add('hidden');
            clearInterval(loader);
            loader = null;
        }
    }, 3);
}

// Used to fadeIn divs
// Staying with CSS to fadeIn litthe things like counter
function fadeIn(element) {
    console.log('fadeIn ' + element);
    document.getElementById(element).style = 'display:block;opacity:0;';
    document.getElementById(element).classList.remove('hidden');

    var actual = 0;
    var loader = setInterval(function() {
        if (actual < 1) {
            actual += 0.01;
            document.getElementById(element).style = 'opacity:' + actual + ';';
        } else {
            clearInterval(loader);
            loader = null;
        }
    }, 3);
}

// Takes an API response and the ping of the request proceeds and displays them.
function display(res, timeTaken) {
    document.getElementById('championName').innerText = res.data.results[0].stats.name;
    document.getElementById('championIcon').src = 'https://ddragon.leagueoflegends.com/cdn/7.14.1/img/champion/' + res.data.results[0].stats.name.replace("'", '').replace(' ', '') + '.png';

    document.getElementById('totalDistanceTravelled').innerText = res.data.stats.totalDistanceTravelled.toFixed(2).toString();
    document.getElementById('totalTeemosTravelled').innerText = (res.data.stats.totalDistanceTravelled / 110).toFixed(2).toString();

    var minutes = new Date(res.data.stats.gameDuration * 1000).getHours() - 1;
    (minutes > 0 && minutes < 3) ? minutes = 60: minutes = 0;
    document.getElementById('gameDurationMinute').innerText = (minutes + new Date(res.data.stats.gameDuration * 1000).getMinutes()).toString();
    document.getElementById('gameDurationSecond').innerText = new Date(res.data.stats.gameDuration * 1000).getSeconds().toString();
    document.getElementById('timeTaken').innerText = new Date(timeTaken).getSeconds() + '.' + new Date(timeTaken).getMilliseconds().toString().substring(0, 2);

    document.getElementById('resultSummonerName').innerText = document.getElementById('summonerName').value + ', ';
    document.getElementById('averageTravelSpeed').innerText = (((res.data.stats.totalDistanceTravelled / 110) / res.data.stats.gameDuration) * 60).toFixed(2).toString();

    document.getElementById('crossedSummonersRiftTotal').innerText = (res.data.stats.totalDistanceTravelled / 19798).toFixed(2).toString();
    document.getElementById('crossedSummonersRiftBoots').innerText = (res.data.stats.travelledWithBoots / 19798).toFixed(2).toString();

    document.getElementById('lastBootsCost').innerText = res.data.results[res.data.results.length - 1].stats.cost.toString();
    document.getElementById('extraUnitsTravelled').innerText = res.data.stats.travelledWithBoots.toString();
    document.getElementById('extraTeemosTravelled').innerText = (res.data.stats.travelledWithBoots / 110).toFixed(2).toString();
    document.getElementById('extraPercentageTravelled').innerText = ((res.data.stats.travelledWithBoots / res.data.stats.totalDistanceTravelled) * 100).toFixed(2).toString();
    document.getElementById('extraFlash').innerText = (res.data.stats.travelledWithBoots / 425).toFixed(2).toString();
}