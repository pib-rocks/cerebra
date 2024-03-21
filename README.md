# Cerebra

## Frontend Setup

This repository contains Cerebra, the frontend website to be used with a pib robot.  
It is automatically installed when using our setup script, which can be found at [pib-rocks/pib-backend](https://github.com/pib-rocks/pib-backend/blob/main/setup/setup-pib.sh).

## Development Setup

### Starting the Frontend
(The frontend is developed using Angular)
1. Clone this repository and open the directory in a new terminal window.
2. Run `npm install`.
3. Start the application in development mode with `ng serve`. It will be available on `localhost:4200`.

### Starting the Frontend with a complete mock environment
To have a fully working Cerebra website without having to deploy an actual backend, a mocked version can be launched alongside Cerebra.

1. Clone this repository and open the directory in a new terminal window.
2. Run `npm run cerebra-mock-backend`.
3. It will be available on `localhost:4200`.