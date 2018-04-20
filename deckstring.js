const Discord = require("discord.js");
const parser = require("deckstrings");
const got = require("got");
const curveGen = require("hs-mana-curve");

const API = "https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json";

const bot = new Discord.Client();

function getCost(rarity) {
    var total;
    switch(rarity) {
        case "COMMON": total = 40; break;
        case "RARE": total = 100; break;
        case "EPIC": total = 400; break;
        case "LEGENDARY": total = 1600; break;
        default: total = 0;
    }
    return total;
}

bot.on("ready", () => {
    bot.user.setGame("//invite");
});
bot.on("guildCreate", guild => {
    guild.owner.send("Thanks for installing HS Deck Bot!");
    guild.owner.send("To use this bot simply send a Hearthstone deckstring in a text channel.");
    guild.owner.send("Developed by Juan de Urtubey.");
});
bot.on("message", msg => {
    if(msg.channel.type != "text" || msg.author.bot) return;
    let observable = " " + msg.content + " ";
    if(msg.content == "//invite") {
        msg.channel.send("https://discordapp.com/api/oauth2/authorize?client_id=434924610795077633&permissions=11264&scope=bot");
        return;
    }
    if(!observable.match(/\sAAE[BC]A.*?\s/g)) return;
    let deckCode = observable.match(/\sAAE[BC]A.*?\s/g)[0].trim();
    console.log(parser.decode(deckCode));
    got(API).then(resp => {
        let json = JSON.parse(resp.body);
        let deck = parser.decode(deckCode);
        let cards = deck.cards;
        let readableCards = [];
        let heroes = deck.heroes;
        let format = deck.format;
        let curve = [0, 0, 0, 0, 0, 0, 0, 0];
        cards.forEach(item => {
            let match;
            let cost;
            let mana;
            for(let i = 0; i < json.length; i++) {
                if(json[i].dbfId == item[0]) {
                    match = json[i].name;
                    cost = getCost(json[i].rarity);
                    mana = json[i].cost;
                    break;
                }
            }
            readableCards.push([match, item[1], cost*item[1], mana]);
            if(mana < 8) curve[mana] += item[1];
            else curve[7] += item[1];
        });
        let hero;
        for(let i = 0; i < json.length; i++) {
            if(json[i].dbfId == heroes[0]) {
                hero = json[i].cardClass;
                break;
            }
        }
        let cardsText = "```Perl\n";
        let totalCost = 0;
        readableCards.forEach(c => {
            cardsText += c[1] + "x " + c[0] + "\n";
            totalCost += c[2];
        });
        cardsText += "```" + `\`\`\`${deckCode}\`\`\``;
        let curveDisplay = "```";
        curveDisplay += curveGen(curve, 8, "compressed", true);
        curveDisplay += "```";
        let deckDisplay = new Discord.RichEmbed()
            .setTitle(hero + " Deck")
            .setDescription(cardsText.replace(/\'/g, ""))
            .addField("Mana Curve", curveDisplay)
            .setFooter(totalCost + " dust");
        msg.channel.send({embed: deckDisplay});
        if(msg.deletable) msg.delete();
    });
});

bot.login("/*no*/");
