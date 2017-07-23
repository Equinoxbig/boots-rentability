# Boots rentability

Entry to [Riot Games' useless contest](https://boards.euw.leagueoflegends.com/en/c/forum-games-contests-en/sAhc50IX-a-volunteers-contest-the-useless-contest)
Little website built with expressJS to tell you some useless stats about the impact of your boots in your last game.

F.A.Q at the bottom of this document.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

NodeJS 4.X +

## Built With

* [expressJS](https://expressjs.com)

### Installing

First of all clone the repository

```
git clone git@github.com:Equinoxbig/boots-rentability.git
```

Get in the folder and create a `config.json` file with the following structure :
For testing purpose you can use `http://localhost:PORT` as adress.

```json
{
  "apiKey": "ENTER YOUR API KEY HERE",
  "port": 2017,
  "adress":"http://adress.to.your.website:port__above_if_needed"
}
```

If you want to skip the test part don't forget to

```
npm install
```

To run the the app simply use

```
node main.js
```

## Testing your setup

To run the test simply type
```
npm run-script test
```

Then you'll find the website on `localhost:PORT_ENTERED_ABOVE`.

## Author

* **Equinoxbig** - [Twitter](https://twitter.com/Equinoxbig) - *IGN : BOT Equinox*

## License

PLEASE REFER TO THE [LICENSE](LICENSE) FILE.

## F.A.Q

*Where do I report a bug ?*

**- Contact me on twitter @Equinoxbig**


*What does units mean ?*

**- Units is how league of legends represents distance in the game, [110 units are equal to the diameter of one Teemo.](http://na.leagueoflegends.com/en/page/bards-big-birthday-datapalooza)**


*Why is Teemo used as a result ?*

**- [People started using Teemo in League Of Legends calculation a long time ago.](https://www.reddit.com/r/leagueoflegends/comments/17mpbp/teemo_the_system_of_units_si_ravenous_blabbering/)**


*How do you know how much time I crossed the map ?*

**- As in the page where it's said that Teemo is 110 units, the size of the map is given. Then just calculate the length of the
diagonal**


*Are the things shown on your website the exact movements I made during my game ?*

**- Actually no this is just an approximation, I'm using the item shop timeline to retrieve the timestamp where you bought your boots, and multiplying your (champion + boots) movement speed per the duration you wore them. I know this is not 100% accurate but as I learned from this contest 3 days ago this is the only solution I found. I'm looking forward to enhance it.**


*How and where do you find the game data to use ?*

**- [I'm using Riot Games' public API](https://developer.riotgames.com)**