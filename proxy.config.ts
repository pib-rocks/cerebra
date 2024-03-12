const config = require("./src/app/gloabal-conf.json");

const proxyConfig = {
    "/api/*": {
        target: config.protocoll + config.ip + config.portTarget,
        secure: config.secure,
        changeOrigin: config.changeOrigin,
        pathRewrite: config.pathRewrite,
        logLevel: config.logLevel,
    },
};

module.exports = proxyConfig;
