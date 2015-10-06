Mozilla X-Ray goggles
=====================

This is a client-side (with small server component) application that hosts the Mozilla X-Ray Goggles library. It is dependent on having an [id.wmo] and [publish.wmo] end point to talk to for its user authentication and data publication functionality, respectively. The end point URLs can be set in the `.env` file used.

Getting up and running
----------------------

In your Git directory (or whichever directory you want to place the goggles in), type:

```
$> git clone https://github.com/mozilla/goggles.webmaker.org
$> cd goggles.webmaker.org
$> npm install
$> cp env.dist .env
```

Then any time you wish to (re)compile the library and run the Goggles server, type:
```
$> npm start
```

Environment variables
---------------------

The following environment variables are important to change, if you want to use the goggles in an atypical enviroment (i.e. one where any of the services used or relied upon does not use the default supplied `.env` file)

```
PORT: the port the service will run on, by edef
APP_HOSTNAME: the domain the service will be running on, port included
HACKPUBURL: the domain the service will be running on, port included
ID_WMO_URL: the URL for the id.webmaker.org service, port included
ID_WMO_CLIENT_ID: the client identifier assigned to goggles by thje id.webmaker.org instance pointed to
PUBLISH_WMO_URL: the URL for the publish.webmaker.org service, port included
```
