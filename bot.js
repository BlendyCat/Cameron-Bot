const discordIO = require('discord.io');
const auth = require('./auth.json');
const readline = require('readline');
const mysql = require('mysql');

// this is the config for the MySQL connection
const config = {
    host: "localhost",
    user: "root",
    password: "root",
    database: "discord"
};

// create a connection variable
let conn = mysql.createConnection(config);

// connect to the database
conn.connect((err) => { /* callback method */
    if(err) throw err;
    console.log("Connected to MySQL!");
});

/**
 * Bot Section
 */

// Initialize readline module (used to read from the console)
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// initialize bot
const bot = new discordIO.Client({
    token: auth.token,
    autorun: true
});

// this event is called when the bot connects to discord
bot.on('ready', (event)=> {
    console.info("Logged in as: " + bot.username + ' - (' + bot.id + ')');
});

// this is called when a user sends a message in the discord
bot.on('message', ((user, userID, channelID, message, event) => {
    // If the user is cameron and the message is not blank (which means the content-type is an image) AND the message isn't a call
    // to this bot
    if(userID === "315308102628933634" && message !== "" && !message.toLowerCase().includes("cameron")) {
        // This will add the message to the table `messages`. This is considered a "prepared statement"
        // which means that the value will be inserted into the ?
        let sql = "INSERT INTO `messages`(`message`) VALUES(?);";
        // replace any unknown letters with :joy: emoji
        let txt = message.replace(/[^a-zA-z0-9!@#$%^&*()_+\-={}\[\]\\|~,./<>?;':" ]/g, ":joy:");
        // Run the SQL query with the message as the value (replaces the '?' in the query)
        conn.query(sql, txt, (err, result) => {
            if (err) throw err;
            // log the message to the console in quotes
            console.log(`"${txt}"`);
        });
    }
    // this will check if a message includes "cameron" ignoring case and the user is NOT this bot
    if(message.toLowerCase().includes("cameron") && userID !== "719073414349979691") {
        // This essentially pulls 1 random message from the `messages` table
        let sql = "SELECT `message` FROM `messages` ORDER BY RAND() LIMIT 1;";
        // Call the query
        conn.query(sql, (err, results)=>{
            if(err) throw err;
            // send the message to the channel where the message was sent
            // with 3 laughing crying emojis appended to the end
            bot.sendMessage({
                to: channelID,
                message: results[0].message + ":joy::joy::joy:"
            });
        });
    }
}));

// This is called when a line of text is entered in console and enter is hit
rl.on('line', input => {
    // Check if the first character is '!' which will be a command
    if(input.substring(0, 1) === '!') {
        // This will separate the message minus the '!' into arguments
        let args = input.substring(1).split(' ');
        // The first argument is the command name
        let cmd = args[0].toLowerCase();

        // Set the arguments equal to the argument array minus the command
        args = args.splice(1);

        // check what the command is
        switch(cmd) {
            // if the command is 'save'
            case 'save':
                // pull all messages from cameron from the channel and upload to the database
                bot.getMessages({
                    channelID: args[0],
                    limit: 1000,
                    after: 0
                }, (err, messages)=> {
                    if(err) throw err;
                    // loop through all messages
                    for (let i = 0; i < messages.length; i++) {
                        let message = messages[i];
                        // if message author is cameron
                        if (message.author.id === '315308102628933634' && message.content !== '') {
                            let sql = "INSERT INTO `messages`(`message`) VALUES(?);";
                            let txt = message.content.replace(/[^a-zA-z1-9!@#$%^&*()_+\-={}\[\]\\|~,./<>?;':" ]/g, ":joy:");
                            conn.query(sql, txt, (err, result) => {
                                if (err) throw err;
                                console.log(`"${txt}"`);
                            });
                        }
                    }
                });
                break;
        }
    // if the input is not a command, send it to the #general channel
    } else {
        bot.sendMessage({
            to: "719108435064520744",
            message: input
        });
    }
});

// This is called when the bot disconnects. It just reconnects it
bot.on('disconnect', ()=> {
    bot.connect();
});

// When the MySQL connection disconnects, recreate the connection
conn.on('disconnect', ()=> {
    console.log("Lost connection to MySQL!");
    conn.destroy();
    conn = mysql.createConnection(config);
    conn.connect((err)=> {
        if(err) throw err;
        console.log("Reconnected to MySQL!");
    })
});