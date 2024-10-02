"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Login = void 0;
const readline_1 = __importDefault(require("readline"));
const Load_1 = require("../util/Load");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
class Login {
    constructor(bot) {
        this.clientId = '0000000040170455';
        this.authBaseUrl = 'https://login.live.com/oauth20_authorize.srf';
        this.redirectUrl = 'https://login.live.com/oauth20_desktop.srf';
        this.tokenUrl = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
        this.scope = 'service::prod.rewardsplatform.microsoft.com::MBI_SSL';
        this.bot = bot;
    }
    async login(page, email, password) {
        try {
            // Navigate to the Bing login page
            await page.goto('https://rewards.bing.com/signin');
            const isLoggedIn = await page.waitForSelector('html[data-role-name="RewardsPortal"]', { timeout: 10000 }).then(() => true).catch(() => false);
            if (!isLoggedIn) {
                // Check if account is locked
                const isLocked = await page.waitForSelector('.serviceAbusePageContainer', { state: 'visible', timeout: 1000 }).then(() => true).catch(() => false);
                if (isLocked) {
                    this.bot.log('LOGIN', 'This account has been locked!', 'error');
                    throw new Error('Account has been locked!');
                }
                await this.execLogin(page, email, password);
                this.bot.log('LOGIN', 'Logged into Microsoft successfully');
            }
            else {
                this.bot.log('LOGIN', 'Already logged in');
            }
            // Check if logged in to bing
            await this.checkBingLogin(page);
            // Save session
            await (0, Load_1.saveSessionData)(this.bot.config.sessionPath, page.context(), email, this.bot.isMobile);
            // We're done logging in
            this.bot.log('LOGIN', 'Logged in successfully');
        }
        catch (error) {
            // Throw and don't continue
            throw this.bot.log('LOGIN', 'An error occurred:' + error, 'error');
        }
    }
    async execLogin(page, email, password) {
        try {
            await this.enterEmail(page, email);
            await this.enterPassword(page, password);
            await this.checkLoggedIn(page);
        }
        catch (error) {
            this.bot.log('LOGIN', 'An error occurred: ' + error.message, 'error');
        }
    }
    async enterEmail(page, email) {
        await page.fill('#i0116', email);
        await page.click('#idSIButton9');
        this.bot.log('LOGIN', 'Email entered successfully');
    }
    async enterPassword(page, password) {
        try {
            await page.waitForSelector('#i0118', { state: 'visible', timeout: 2000 });
            await this.bot.utils.wait(2000);
            await page.fill('#i0118', password);
            await page.click('#idSIButton9');
            this.bot.log('LOGIN', 'Password entered successfully');
        }
        catch {
            this.bot.log('LOGIN', 'Password entry failed or 2FA required');
            await this.handle2FA(page);
        }
    }
    async handle2FA(page) {
        try {
            const numberToPress = await this.get2FACode(page);
            if (numberToPress) {
                // Authentictor App verification
                await this.authAppVerification(page, numberToPress);
            }
            else {
                // SMS verification
                await this.authSMSVerification(page);
            }
        }
        catch (error) {
            this.bot.log('LOGIN', `2FA handling failed: ${error.message}`);
        }
    }
    async get2FACode(page) {
        try {
            const element = await page.waitForSelector('#displaySign', { state: 'visible', timeout: 2000 });
            return await element.textContent();
        }
        catch {
            await page.click('button[aria-describedby="confirmSendTitle"]');
            await this.bot.utils.wait(2000);
            const element = await page.waitForSelector('#displaySign', { state: 'visible', timeout: 2000 });
            return await element.textContent();
        }
    }
    async authAppVerification(page, numberToPress) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                this.bot.log('LOGIN', `Press the number ${numberToPress} on your Authenticator app to approve the login`);
                this.bot.log('LOGIN', 'If you press the wrong number or the "DENY" button, try again in 60 seconds');
                await page.waitForSelector('#i0281', { state: 'detached', timeout: 60000 });
                this.bot.log('LOGIN', 'Login successfully approved!');
                break;
            }
            catch {
                this.bot.log('LOGIN', 'The code is expired. Trying to get a new code...');
                await page.click('button[aria-describedby="pushNotificationsTitle errorDescription"]');
                numberToPress = await this.get2FACode(page);
            }
        }
    }
    async authSMSVerification(page) {
        this.bot.log('LOGIN', 'SMS 2FA code required. Waiting for user input...');
        const code = await new Promise((resolve) => {
            rl.question('Enter 2FA code:\n', (input) => {
                rl.close();
                resolve(input);
            });
        });
        await page.fill('input[name="otc"]', code);
        await page.keyboard.press('Enter');
        this.bot.log('LOGIN', '2FA code entered successfully');
    }
    async checkLoggedIn(page) {
        const targetHostname = 'rewards.bing.com';
        const targetPathname = '/';
        // eslint-disable-next-line no-constant-condition
        while (true) {
            await this.bot.browser.utils.tryDismissAllMessages(page);
            const currentURL = new URL(page.url());
            if (currentURL.hostname === targetHostname && currentURL.pathname === targetPathname) {
                break;
            }
        }
        // Wait for login to complete
        await page.waitForSelector('html[data-role-name="RewardsPortal"]', { timeout: 10000 });
        this.bot.log('LOGIN', 'Successfully logged into the rewards portal');
    }
    async checkBingLogin(page) {
        try {
            this.bot.log('LOGIN-BING', 'Verifying Bing login');
            await page.goto('https://www.bing.com/fd/auth/signin?action=interactive&provider=windows_live_id&return_url=https%3A%2F%2Fwww.bing.com%2F');
            const maxIterations = 5;
            for (let iteration = 1; iteration <= maxIterations; iteration++) {
                const currentUrl = new URL(page.url());
                if (currentUrl.hostname === 'www.bing.com' && currentUrl.pathname === '/') {
                    await this.bot.browser.utils.tryDismissBingCookieBanner(page);
                    const loggedIn = await this.checkBingLoginStatus(page);
                    // If mobile browser, skip this step
                    if (loggedIn || this.bot.isMobile) {
                        this.bot.log('LOGIN-BING', 'Bing login verification passed!');
                        break;
                    }
                }
                await this.bot.utils.wait(1000);
            }
        }
        catch (error) {
            this.bot.log('LOGIN-BING', 'An error occurred:' + error, 'error');
        }
    }
    async checkBingLoginStatus(page) {
        try {
            await page.waitForSelector('#id_n', { timeout: 5000 });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getMobileAccessToken(page, email) {
        const authorizeUrl = new URL(this.authBaseUrl);
        authorizeUrl.searchParams.append('response_type', 'code');
        authorizeUrl.searchParams.append('client_id', this.clientId);
        authorizeUrl.searchParams.append('redirect_uri', this.redirectUrl);
        authorizeUrl.searchParams.append('scope', this.scope);
        authorizeUrl.searchParams.append('state', crypto.randomBytes(16).toString('hex'));
        authorizeUrl.searchParams.append('access_type', 'offline_access');
        authorizeUrl.searchParams.append('login_hint', email);
        await page.goto(authorizeUrl.href);
        const currentUrl = new URL(page.url());
        let code;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            this.bot.log('LOGIN-APP', 'Waiting for authorization');
            if (currentUrl.hostname === 'login.live.com' && currentUrl.pathname === '/oauth20_desktop.srf') {
                code = currentUrl.searchParams.get('code');
                break;
            }
        }
        const body = new URLSearchParams();
        body.append('grant_type', 'authorization_code');
        body.append('client_id', this.clientId);
        body.append('code', code);
        body.append('redirect_uri', this.redirectUrl);
        const tokenRequest = {
            url: this.tokenUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: body.toString()
        };
        const tokenResponse = await (0, axios_1.default)(tokenRequest);
        const tokenData = await tokenResponse.data;
        this.bot.log('LOGIN-APP', 'Successfully authorized');
        return tokenData.access_token;
    }
}
exports.Login = Login;
//# sourceMappingURL=Login.js.map