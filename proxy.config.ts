const config = require("./src/app/global-conf.json");

const proxyConfig = {
    "/api": {
        target: config.protocol + config.ip + ":" + config.portTarget,
        secure: config.secure,
        changeOrigin: config.changeOrigin,
        pathRewrite: config.pathRewrite,
        logLevel: config.logLevel,
    },
};

module.exports = proxyConfig;
