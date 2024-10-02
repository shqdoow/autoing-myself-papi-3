import { Page } from 'playwright';
import { Workers } from '../Workers';
import { DashboardData } from '../../interface/DashboardData';
export declare class Search extends Workers {
    private bingHome;
    private searchPageURL;
    doSearch(page: Page, data: DashboardData): Promise<void>;
    private bingSearch;
    private getGoogleTrends;
    private getRelatedTerms;
    private formatDate;
    private randomScroll;
    private clickRandomLink;
    private closeTabs;
    private calculatePoints;
}
//# sourceMappingURL=Search.d.ts.map