# Cerebra

## Frontend Setup

This repository contains Cerebra, the frontend website to be used with a pib robot.  
It is automatically installed when using our setup script, which can be found at [pib-rocks/pib-backend](https://github.com/pib-rocks/pib-backend/blob/main/setup/setup-pib.sh).

## Development Setup

### Starting the Frontend

(The frontend is developed using Angular)

1. Clone this repository including submodules and open the directory in a new terminal window. <br/>`git clone --recurse-submodules -j8 https://github.com/pib-rocks/cerebra.git`
2. Run `npm install`.<br/>(Potentially after installing NodeJS first: <br/>`wget -qO nodesource_setup.sh https://deb.nodesource.com/setup_22.x && sudo -E bash nodesource_setup.sh`)
3. Start the application in development mode with `ng serve`. It will be available on `localhost:4200`.<br/>(Potentially after installing Angular CLI first: `npm i -g @angular/cli`)

### Starting the Frontend with a complete mock environment

To have a fully working Cerebra website without having to deploy an actual backend, a mocked version can be launched alongside Cerebra.

1. Clone this repository and open the directory in a new terminal window.
2. Run `npm run cerebra-mock-backend`.
3. It will be available on `localhost:4200`.
