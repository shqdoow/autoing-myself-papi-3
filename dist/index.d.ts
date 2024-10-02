import { Page } from 'playwright';
import BrowserFunc from './browser/BrowserFunc';
import BrowserUtil from './browser/BrowserUtil';
import { log } from './util/Logger';
import Util from './util/Utils';
import Activities from './functions/Activities';
import { Account } from './interface/Account';
export declare class MicrosoftRewardsBot {
    log: typeof log;
    config: import("./interface/Config").Config;
    utils: Util;
    activities: Activities;
    browser: {
        func: BrowserFunc;
        utils: BrowserUtil;
    };
    isMobile: boolean;
    homePage: Page;
    private collectedPoints;
    private activeWorkers;
    private browserFactory;
    private accounts;
    private workers;
    private login;
    private accessToken;
    constructor();
    initialize(): Promise<void>;
    run(): Promise<void>;
    private runMaster;
    private runWorker;
    private runTasks;
    Desktop(account: Account): Promise<void>;
    Mobile(account: Account): Promise<void>;
    private closeBrowser;
}
//# sourceMappingURL=index.d.ts.map