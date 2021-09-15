# Bot-Discord

Bot que te permitirá realizar acciones como poner música, saltar la canción o pararla dentro de tu servidor de discord.

## Comenzando 🚀

Para poner en marcha el bot en tu equipo local y realizar pruebas o utilizarlo en tu servidor de discord necesitarás instalar estas dependencias antes de ejecutarlo por primera vez.

`npm install discord.js@^12.5.3 ffmpeg fluent-ffmpeg ffmpeg-static @discordjs/opus ytdl-core --save`

Además de estas dependencias tendrás que tener en tu servidor una versión de **NodeJS**.

### Pre-requisitos 📋

Es necesario crear un fichero llamado **config.json** en la raíz junto al resto de ficheros, donde colocaremos el **TOKEN** y el **PREFIJO** de la siguiente forma:

`
{
    "token" : "TOKEN",
    "prefijo" : "!"
}
`

Sustituimos el **TOKEN** por el que encontraremos en el apartado de **BOT** en la página de **Discord Developer Portal**

## Construido con 🛠️

Antes de nada recordar que este bot está creado utilizando:

* [NodeJS](https://nodejs.org/en/)
* [DiscordJS](https://discord.js.org/#/)
* [FFMPEG](https://www.ffmpeg.org/)
* [YTDL](https://github.com/fent/node-ytdl-core)

## Despliegue 📦

Para arrancar el bot lo unico que tendremos que hacer es abrir un termianl, ubicarnos en la carpeta donde tengamos el bot y ejecutar el siguiente comando:

`node app.js`

Os recomiendo que si vais a estar desarrollando nuevas funcionalidades os instaléis **NODEMON**, este recurso os permitirá reiniciar el bot cada vez que guardéis de forma automática.

* [NODEMON](https://www.npmjs.com/package/nodemon)

En caso de que lo utilicéis, el comando sería el siguiente:

`npx nodemon app.js`
