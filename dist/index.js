"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicrosoftRewardsBot = void 0;
const cluster_1 = __importDefault(require("cluster"));
const Browser_1 = __importDefault(require("./browser/Browser"));
const BrowserFunc_1 = __importDefault(require("./browser/BrowserFunc"));
const BrowserUtil_1 = __importDefault(require("./browser/BrowserUtil"));
const Logger_1 = require("./util/Logger");
const Utils_1 = __importDefault(require("./util/Utils"));
const Load_1 = require("./util/Load");
const Login_1 = require("./functions/Login");
const Workers_1 = require("./functions/Workers");
const Activities_1 = __importDefault(require("./functions/Activities"));
// Main bot class
class MicrosoftRewardsBot {
    constructor() {
        this.activities = new Activities_1.default(this);
        this.isMobile = false;
        this.collectedPoints = 0;
        this.browserFactory = new Browser_1.default(this);
        this.login = new Login_1.Login(this);
        this.accessToken = '';
        this.log = Logger_1.log;
        this.accounts = [];
        this.utils = new Utils_1.default();
        this.workers = new Workers_1.Workers(this);
        this.browser = {
            func: new BrowserFunc_1.default(this),
            utils: new BrowserUtil_1.default(this)
        };
        this.config = (0, Load_1.loadConfig)();
        this.activeWorkers = this.config.clusters;
    }
    async initialize() {
        this.accounts = (0, Load_1.loadAccounts)();
    }
    async run() {
        (0, Logger_1.log)('MAIN', `Bot started with ${this.config.clusters} clusters`);
        // Only cluster when there's more than 1 cluster demanded
        if (this.config.clusters > 1) {
            if (cluster_1.default.isPrimary) {
                this.runMaster();
            }
            else {
                this.runWorker();
            }
        }
        else {
            this.runTasks(this.accounts);
        }
    }
    runMaster() {
        (0, Logger_1.log)('MAIN-PRIMARY', 'Primary process started');
        const accountChunks = this.utils.chunkArray(this.accounts, this.config.clusters);
        for (let i = 0; i < accountChunks.length; i++) {
            const worker = cluster_1.default.fork();
            const chunk = accountChunks[i];
            worker.send({ chunk });
        }
        cluster_1.default.on('exit', (worker, code) => {
            this.activeWorkers -= 1;
            (0, Logger_1.log)('MAIN-WORKER', `Worker ${worker.process.pid} destroyed | Code: ${code} | Active workers: ${this.activeWorkers}`, 'warn');
            // Check if all workers have exited
            if (this.activeWorkers === 0) {
                (0, Logger_1.log)('MAIN-WORKER', 'All workers destroyed. Exiting main process!', 'warn');
                process.exit(0);
            }
        });
    }
    runWorker() {
        (0, Logger_1.log)('MAIN-WORKER', `Worker ${process.pid} spawned`);
        // Receive the chunk of accounts from the master
        process.on('message', async ({ chunk }) => {
            await this.runTasks(chunk);
        });
    }
    async runTasks(accounts) {
        for (const account of accounts) {
            (0, Logger_1.log)('MAIN-WORKER', `Started tasks for account ${account.email}`);
            // Desktop Searches, DailySet and More Promotions
            await this.Desktop(account);
            // If runOnZeroPoints is false and 0 points to earn, stop and try the next account
            if (!this.config.runOnZeroPoints && this.collectedPoints === 0) {
                continue;
            }
            // Mobile Searches
            await this.Mobile(account);
            (0, Logger_1.log)('MAIN-WORKER', `Completed tasks for account ${account.email}`);
        }
        (0, Logger_1.log)('MAIN-PRIMARY', 'Completed tasks for ALL accounts');
        (0, Logger_1.log)('MAIN-PRIMARY', 'All workers destroyed!');
        process.exit(0);
    }
    // Desktop
    async Desktop(account) {
        this.isMobile = false;
        const browser = await this.browserFactory.createBrowser(account.proxy, account.email);
        this.homePage = await browser.newPage();
        (0, Logger_1.log)('MAIN', 'Starting DESKTOP browser');
        // Login into MS Rewards, then go to rewards homepage
        await this.login.login(this.homePage, account.email, account.password);
        this.accessToken = await this.login.getMobileAccessToken(this.homePage, account.email);
        await this.browser.func.goHome(this.homePage);
        const data = await this.browser.func.getDashboardData();
        (0, Logger_1.log)('MAIN-POINTS', `Current point count: ${data.userStatus.availablePoints}`);
        const browserEnarablePoints = await this.browser.func.getBrowserEarnablePoints();
        const appEarnablePoints = await this.browser.func.getAppEarnablePoints(this.accessToken);
        const earnablePoints = browserEnarablePoints + appEarnablePoints;
        this.collectedPoints = earnablePoints;
        (0, Logger_1.log)('MAIN-POINTS', `You can earn ${earnablePoints} points today (Browser: ${browserEnarablePoints} points, App: ${appEarnablePoints} points)`);
        // If runOnZeroPoints is false and 0 points to earn, don't continue
        if (!this.config.runOnZeroPoints && this.collectedPoints === 0) {
            (0, Logger_1.log)('MAIN', 'No points to earn and "runOnZeroPoints" is set to "false", stopping!');
            // Close desktop browser
            return await this.closeBrowser(browser, account.email);
        }
        // Open a new tab to where the tasks are going to be completed
        const workerPage = await browser.newPage();
        // Go to homepage on worker page
        await this.browser.func.goHome(workerPage);
        // Complete daily set
        if (this.config.workers.doDailySet) {
            await this.workers.doDailySet(workerPage, data);
        }
        // Complete more promotions
        if (this.config.workers.doMorePromotions) {
            await this.workers.doMorePromotions(workerPage, data);
        }
        // Complete punch cards
        if (this.config.workers.doPunchCards) {
            await this.workers.doPunchCard(workerPage, data);
        }
        // Do desktop searches
        if (this.config.workers.doDesktopSearch) {
            await this.activities.doSearch(workerPage, data);
        }
        // Save cookies
        await (0, Load_1.saveSessionData)(this.config.sessionPath, browser, account.email, this.isMobile);
        // Close desktop browser
        await this.closeBrowser(browser, account.email);
        return;
    }
    // Mobile
    async Mobile(account) {
        this.isMobile = true;
        const browser = await this.browserFactory.createBrowser(account.proxy, account.email);
        this.homePage = await browser.newPage();
        (0, Logger_1.log)('MAIN', 'Starting MOBILE browser');
        // Login into MS Rewards, then go to rewards homepage
        await this.login.login(this.homePage, account.email, account.password);
        await this.browser.func.goHome(this.homePage);
        const data = await this.browser.func.getDashboardData();
        // Do daily check in
        if (this.config.workers.doDailyCheckIn) {
            await this.activities.doDailyCheckIn(this.accessToken, data);
        }
        // Do read to earn
        if (this.config.workers.doReadToEarn) {
            await this.activities.doReadToEarn(this.accessToken, data);
        }
        // If no mobile searches data found, stop (Does not exist on new accounts)
        if (data.userStatus.counters.mobileSearch) {
            // Open a new tab to where the tasks are going to be completed
            const workerPage = await browser.newPage();
            // Go to homepage on worker page
            await this.browser.func.goHome(workerPage);
            // Do mobile searches
            if (this.config.workers.doMobileSearch) {
                await this.activities.doSearch(workerPage, data);
                // Fetch current search points
                const mobileSearchPoints = (await this.browser.func.getSearchPoints()).mobileSearch?.[0];
                // If the remaining mobile points does not equal 0, restart and assume the generated UA is invalid
                // Retry until all points are gathered when (retryMobileSearch is enabled)
                if (this.config.searchSettings.retryMobileSearch && mobileSearchPoints && ((mobileSearchPoints.pointProgressMax - mobileSearchPoints.pointProgress) > 0)) {
                    (0, Logger_1.log)('MAIN', 'Unable to complete mobile searches, bad User-Agent? Retrying...');
                    // Close mobile browser
                    await this.closeBrowser(browser, account.email);
                    // Retry
                    await this.Mobile(account);
                }
            }
        }
        else {
            (0, Logger_1.log)('MAIN', 'No mobile searches found!');
        }
        // Fetch new points
        const earnablePoints = await this.browser.func.getBrowserEarnablePoints() + await this.browser.func.getAppEarnablePoints(this.accessToken);
        // If the new earnable is 0, means we got all the points, else retract
        this.collectedPoints = earnablePoints === 0 ? this.collectedPoints : (this.collectedPoints - earnablePoints);
        (0, Logger_1.log)('MAIN-POINTS', `The script collected ${this.collectedPoints} points today`);
        // Close mobile browser
        await this.closeBrowser(browser, account.email);
        return;
    }
    async closeBrowser(browser, email) {
        // Save cookies
        await (0, Load_1.saveSessionData)(this.config.sessionPath, browser, email, this.isMobile);
        // Close browser
        await browser.close();
    }
}
exports.MicrosoftRewardsBot = MicrosoftRewardsBot;
const bot = new MicrosoftRewardsBot();
// Initialize accounts first and then start the bot
bot.initialize().then(() => {
    bot.run();
});
//# sourceMappingURL=index.js.map