import { Page } from 'playwright';
import { MicrosoftRewardsBot } from '../index';
export default class BrowserUtil {
    private bot;
    constructor(bot: MicrosoftRewardsBot);
    tryDismissAllMessages(page: Page): Promise<boolean>;
    tryDismissCookieBanner(page: Page): Promise<void>;
    tryDismissBingCookieBanner(page: Page): Promise<void>;
    getLatestTab(page: Page): Promise<Page>;
    getTabs(page: Page): Promise<{
        homeTab: Page;
        workerTab: Page;
    }>;
}
//# sourceMappingURL=BrowserUtil.d.ts.map