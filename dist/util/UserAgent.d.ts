export declare function getUserAgent(mobile: boolean): Promise<{
    userAgent: string;
    userAgentMetadata: {
        mobile: boolean;
        platform: string;
        fullVersionList: {
            brand: string;
            version: string;
        }[];
        brands: {
            brand: string;
            version: string;
        }[];
        platformVersion: string;
        architecture: string;
        bitness: string;
        model: string;
    };
}>;
export declare function getChromeVersion(): Promise<string>;
export declare function getEdgeVersions(): Promise<{
    android: string | undefined;
    windows: string | undefined;
}>;
export declare function getSystemComponents(mobile: boolean): string;
export declare function getAppComponents(mobile: boolean): Promise<{
    edge_version: string;
    edge_major_version: string;
    chrome_version: string;
    chrome_major_version: string;
    chrome_reduced_version: string;
}>;
//# sourceMappingURL=UserAgent.d.ts.map