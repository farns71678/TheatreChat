# TheatreChat
A WIP web application that allows an audience to chat during a theatre performance and purchase ways to mess with the cast. 

## Dendencies
This app requires **Node JS** and **npm**.

## Installation
A `.env` file must be added with `ADMIN_PASS` and `MODERATOR_PASS`. Additionally a `PORT` variable can be added with the port the server should run on. The default is `3000`. 

```bash
# .env
ADMIN_PASS=adminPassword
MODERATOR_PASS=moderatorPassword
```

To install required `npm` packages run:

```
npm install
```

## Running

To run, Node JS must be installed and run:

```
npm run test
```

or

```
node --env-file=.env index.js
```

in the project directory