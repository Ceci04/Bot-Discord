// Imports
const Discord = require('discord.js');
const cliente = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const ytdl = require('ytdl-core');
// Config
const {
    prefijo,
    token,
    whiteList
} = require('./config.json');

// Playlist de canciones
const listaCanciones = require('./playlist.json').playlist;
const generos = require('./playlist.json').generos;

const ayuda = "``` Comandos 📋\n !play: (URL Youtube) - Nos permite colocar una canción en la cola.\n !skip: - Nos permite saltar la canción actual.\n !stop: - Nos permite parar el bot.\n !rand: - Nos pondrá una de las canciones que se encuentren en la lista.\n !cola: - Nos permite visualizar los diferentes títulos de las canciones que se encuentran en la cola.\n !addList: (En desarrollo) - Nos permite añadir una canción a la lista de canciones.```";

const cola = new Map();

// Estados del bot
cliente.once('ready', () => { console.log('Listo!'); });
cliente.once('reconnecting', () => { console.log('Reconectando!'); });
cliente.once('disconnect', () => { console.log('Desconectado!'); });

// Evento que se ejecuta al recibir un mensaje en el servidor
cliente.on('message', async (msg) => {
    // Check: Si el bot es el autor del mensaje
    if (msg.author.bot) return;
    // Check: Si el mensaje no contiene el prefijo
    let contenido = msg.content;
    if (!contenido.startsWith(prefijo)) return;
    //Check: Si el autor del comando esta en la whiteList
    if (whiteList.includes(msg.author.discriminator)) {

        const colaServidor = cola.get(msg.guild.id);
        // Check: Si el mensaje contiene el prefijo
        if (contenido.startsWith(`${prefijo}play`)) {
            // Check: Si han indicado la url del video
            if (!contenido.includes("http")) {
                msg.channel.send('**Es necesario que introduzcas la URL del video.**');
            } else {
                ejecutar(msg, colaServidor);
                return;
            }
        } else if (contenido.startsWith(`${prefijo}skip`)) {
            skip(msg, colaServidor);
            return;
        } else if (contenido.startsWith(`${prefijo}stop`)) {
            stop(msg, colaServidor);
            return;
        } else if (contenido.startsWith(`${prefijo}rand`)) {
            ejecutar(msg, colaServidor, listaCanciones);
            return;
        } else if (contenido.startsWith(`${prefijo}cola`)) {
            verCola(msg, colaServidor);
            return;
        } else if (contenido.startsWith(`${prefijo}help`)) {
            msg.channel.send(ayuda);
            return;
        } else {
            msg.channel.send('**El comando que has introducido no es válido.\nPara saber que comandos hay pon !help.**');
        }
    } else {
        msg.channel.send('**Este usuario no cuenta con los permisos necesarios! (Pleb ✊🍆💦)**');
    }
});

// Funcion que ejecutara las canciones
async function ejecutar(msg, colaServidor, listaCanciones) {
    let args = null;
    if (listaCanciones) {
        let genero = msg.content.split(" ")[1];
        let n = 0;
        let cancion = "";

        if (genero == undefined) {
            genero = generos[Math.floor(Math.random() * generos.length)];
        }

        switch (genero) {
            case "pop":
                n = Math.floor(Math.random() * listaCanciones.length);
                cancion = `!play ${listaCanciones[0].pop[n].url}`;
                break;
            case "rock":
                n = Math.floor(Math.random() * listaCanciones.length);
                cancion = `!play ${listaCanciones[0].rock[n].url}`;
                break;
        }
        args = cancion.split(" ");
    } else {
        args = msg.content.split(" ");
    }
    // Check: Si el usuario que ha invocado el bot se encuentra en un canal de voz
    const canalVoz = msg.member.voice.channel;
    if (!canalVoz) {
        return msg.channel.send('**¡Necesitas estar en un canal de voz para reproducir música!**');
    }
    // Check: Si el usuario que ha invocado el bot cuenta con los permisos suficientes
    const permisos = canalVoz.permissionsFor(msg.client.user);
    if (!permisos.has('CONNECT') || !permisos.has("SPEAK")) {
        return msg.channel.send('**¡Necesito los permisos de conectar y hablar en este canal de voz!**');
    }

    // Almacenamos la info de la cancion utilizando el modulo ytdl
    const cancionInfo = await ytdl.getInfo(args[1]);
    const cancion = {
        titulo: cancionInfo.videoDetails.title,
        url: cancionInfo.videoDetails.video_url
    };

    if (!colaServidor) {

    } else {
        colaServidor.canciones.push(cancion);
        console.log("Cola actual: " + colaServidor.canciones);
        return msg.channel.send(`**${cancion.titulo}** se ha añadido a la cola!`);
    }

    // Creamos el contrato para la cola
    const colaConstructor = {
        canalTexto: msg.channel,
        canalVoz: canalVoz,
        conexion: null,
        canciones: [],
        volumen: 5,
        reproduciendo: true
    };

    // Seteamos la cola utilizando el contrato
    cola.set(msg.guild.id, colaConstructor);
    // Añadimos la cancion a la cola
    colaConstructor.canciones.push(cancion);

    try {
        // Conexion al canal de voz
        let conexion = await canalVoz.join();
        colaConstructor.conexion = conexion;
        // Llamamos a la funcion para que inicie la reproducción
        play(msg.guild, colaConstructor.canciones[0]);
    } catch (err) {
        console.log(err);
        cola.delete(msg.guild.id);
        return msg.channel.send(err);
    }
}

function play(guild, cancion) {
    const colaServidor = cola.get(guild.id);
    if (!cancion) {
        colaServidor.canalVoz.leave();
        cola.delete(guild.id);
        return;
    }

    const transmision = colaServidor.conexion
        .play(ytdl(cancion.url))
        .on('finish', () => {
            colaServidor.canciones.shift();
            play(guild, colaServidor.canciones[0]);
        })
        .on('error', err => console.error(err));
    // Volumen divido entre 5 sino se escucha mal
    transmision.setVolumeLogarithmic(colaServidor.volumen / 5);
    colaServidor.canalTexto.send(`Reproduciendo: **${cancion.titulo}**`);
}

// Funcion saltar
function skip(msg, colaServidor) {
    // Check: Si el usuario esta en el canal de voz
    if (!msg.member.voice.channel) {
        return msg.channel.send('**¡Necesitas estar en un canal de voz para saltar la cancion!**');
    }
    // Check: Si hay mas canciones en la cola del servidor
    if (!colaServidor) {
        return msg.channel.send('**¡No hay canciones que se puedan saltar!**');
    }
    colaServidor.conexion.player.dispatcher.end();
}

// Funcion parar
function stop(msg, colaServidor) {
    // Check: Si el usuario esta en el canal de voz
    if (!msg.member.voice.channel) {
        return msg.channel.send('**¡Necesitas estar en un canal de voz para parar la cancion!**');
    }
    // Check: Si hay mas canciones en la cola del servidor
    if (!colaServidor) {
        return msg.channel.send('**¡No hay canciones que se puedan parar!**');
    }
    colaServidor.canciones = [];
    colaServidor.conexion.player.dispatcher.end();
}

// Funcion para ver la cola de canciones
function verCola(msg, colaServidor) {
    n = 0;
    if (colaServidor) {
        msg.channel.send(`**Cola de Canciones**\n----------------------\n`);
        while (n < colaServidor.canciones.length) {
            msg.channel.send(`**#${n} - ${colaServidor.canciones[n].titulo}**\n`);
            n++;
        }
        return;
    } else {
        msg.channel.send(`**La cola de canciones está vacia!**`);
    }
}

cliente.login(token);