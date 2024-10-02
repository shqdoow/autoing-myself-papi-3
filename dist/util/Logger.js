"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
const Webhook_1 = require("./Webhook");
function log(title, message, type) {
    const currentTime = new Date().toLocaleString();
    let str = '';
    switch (type) {
        case 'warn':
            str = `[${currentTime}] [PID: ${process.pid}] [WARN] [${title}] ${message}`;
            console.warn(str);
            break;
        case 'error':
            str = `[${currentTime}] [PID: ${process.pid}] [ERROR] [${title}] ${message}`;
            console.error(str);
            break;
        default:
            str = `[${currentTime}] [PID: ${process.pid}] [LOG] [${title}] ${message}`;
            console.log(str);
            break;
    }
    if (str)
        (0, Webhook_1.Webhook)(str);
}
//# sourceMappingURL=Logger.js.map