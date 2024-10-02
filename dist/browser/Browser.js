"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = __importDefault(require("playwright"));
const fingerprint_injector_1 = require("fingerprint-injector");
const fingerprint_generator_1 = require("fingerprint-generator");
const Load_1 = require("../util/Load");
/* Test Stuff
https://abrahamjuliot.github.io/creepjs/
https://botcheck.luminati.io/
http://f.vision/
https://pixelscan.net/
*/
class Browser {
    constructor(bot) {
        this.bot = bot;
    }
    async createBrowser(proxy, email) {
        const browser = await playwright_1.default.chromium.launch({
            //channel: 'msedge', // Uses Edge instead of chrome
            headless: this.bot.config.headless,
            ...(proxy.url && { proxy: { username: proxy.username, password: proxy.password, server: `${proxy.url}:${proxy.port}` } }),
            args: [
                '--no-sandbox',
                '--mute-audio',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
                '--ignore-ssl-errors'
            ]
        });
        const sessionData = await (0, Load_1.loadSessionData)(this.bot.config.sessionPath, email, this.bot.isMobile, this.bot.config.saveFingerprint);
        const fingerpint = sessionData.fingerprint ? sessionData.fingerprint : this.generateFingerprint();
        const context = await (0, fingerprint_injector_1.newInjectedContext)(browser, { fingerprint: fingerpint });
        // Set timeout to preferred amount
        context.setDefaultTimeout(this.bot.config?.globalTimeout ?? 30000);
        await context.addCookies(sessionData.cookies);
        if (this.bot.config.saveFingerprint) {
            await (0, Load_1.saveFingerprintData)(this.bot.config.sessionPath, email, this.bot.isMobile, fingerpint);
        }
        this.bot.log('BROWSER', `Created browser with User-Agent: "${fingerpint.fingerprint.navigator.userAgent}"`);
        return context;
    }
    generateFingerprint() {
        const fingerPrintData = new fingerprint_generator_1.FingerprintGenerator().getFingerprint({
            devices: this.bot.isMobile ? ['mobile'] : ['desktop'],
            operatingSystems: this.bot.isMobile ? ['android'] : ['windows'],
            browserListQuery: 'last 2 edge version'
        });
        return fingerPrintData;
    }
}
exports.default = Browser;
//# sourceMappingURL=Browser.js.map