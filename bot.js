const Discord = require('discord.js');
const fs = require('fs');
const net = require('net');

const client = new Discord.Client();
let config = {};

client.once('ready', () => {
    console.log('✓ Bot is ready!');
    loadConfig();
    checkConnections();
    setInterval(checkConnections, config.interval);
});

function loadConfig() {
    config = require('./config.json');
}

function checkConnections() {
    config.servers.forEach(server => {
        const [ip, port] = server.address.split(':');
        const socket = new net.Socket();

        socket.setTimeout(5000);

        socket.on('connect', () => {
            console.log(`✓ ${server.alias} (${server.address}) is ON.`);
            if (!server.online) {
                server.online = true;
                updateData();
                sendWebhook(server.alias, true);
            }
            socket.destroy();
        });

        socket.on('timeout', () => {
            console.log(`✘ ${server.alias} (${server.address}) connection attempt timed out.`);
            if (server.online) {
                server.online = false;
                updateData();
                sendWebhook(server.alias, false);
            }
            socket.destroy();
        });

        socket.on('error', (err) => {
            console.error(`✘ Error while pinging ${server.alias} (${server.address}): ${err}`);
            if (server.online) {
                server.online = false;
                updateData();
                sendWebhook(server.alias, false);
            }
            socket.destroy();
        });

        socket.connect(port, ip);
    });
}

function updateData() {
    fs.writeFile('./config.json', JSON.stringify(config, null, 2), err => {
        if (err) {
            console.error('✘ Error updating config:', err);
        }
    });
}

function sendWebhook(alias, online) {
    const server = config.servers.find(server => server.alias === alias);
    const embed = new Discord.MessageEmbed()
        .setColor(online ? '#00ff00' : '#ff0000')
        .setTitle(online ? `${server.alias} is now online` : `${server.alias} is now offline`)
//        .addField('IP', server.address)
    
    const webhookClient = new Discord.WebhookClient(config.webhook.id, config.webhook.token);
    webhookClient.send(server.ping, embed)
        //.then(() => console.log('Webhook message sent.'))
        .catch(error => console.error('Error sending webhook:', error));
}

const { token } = require('./config.json');
client.login(token);
