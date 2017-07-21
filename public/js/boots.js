// When DOM has finished loading
document.addEventListener('DOMContentLoaded', function() {
    // As it seems not working when I try to change display when it's set in the CSS
    document.getElementById('error-text').style = 'display:none;';

    // Call the API when the submit button is clicked
    // But first verify that server and summoner name are entered
    document.getElementById('submit').addEventListener('click', function() {
        document.getElementById('error-text').style = 'display:none;';

        if (document.getElementById('server').value && document.getElementById('summonerName').value) {
            callApi(document.getElementById('server').value, document.getElementById('summonerName').value);
        } else {
            document.getElementById('error-text').style.display = '';
        }
    });
});


// Makes a call to /api/ using fetch
// Sends a server and an username
// Returns an object containing a stats object and an array
function callApi(server, username) {

    // Set header to application/json
    var headers = new Headers({ 'Content-Type': 'application/json' });

    fetch(`/api/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ server, username })
    }).then(
        function(res) {
            res.json().then(function(data) {
                display(data);
            });
        },
        function(err) {
            console.log(err.message);
        });
}


// Takes an API response and displays it
function display(data) {
    console.log(data);
}