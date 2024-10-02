"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAgent = getUserAgent;
exports.getChromeVersion = getChromeVersion;
exports.getEdgeVersions = getEdgeVersions;
exports.getSystemComponents = getSystemComponents;
exports.getAppComponents = getAppComponents;
const axios_1 = __importDefault(require("axios"));
const Logger_1 = require("./Logger");
async function getUserAgent(mobile) {
    const system = getSystemComponents(mobile);
    const app = await getAppComponents(mobile);
    const uaTemplate = mobile ?
        `Mozilla/5.0 (${system}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${app.chrome_reduced_version} Mobile Safari/537.36 EdgA/${app.edge_version}` :
        `Mozilla/5.0 (${system}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${app.chrome_reduced_version} Safari/537.36 Edg/${app.edge_version}`;
    const platformVersion = `${mobile ? Math.floor(Math.random() * 5) + 9 : Math.floor(Math.random() * 15) + 1}.0.0`;
    const uaMetadata = {
        mobile,
        platform: mobile ? 'Android' : 'Windows',
        fullVersionList: [
            { brand: 'Not/A)Brand', version: '99.0.0.0' },
            { brand: 'Microsoft Edge', version: app['edge_version'] },
            { brand: 'Chromium', version: app['chrome_version'] }
        ],
        brands: [
            { brand: 'Not/A)Brand', version: '99' },
            { brand: 'Microsoft Edge', version: app['edge_major_version'] },
            { brand: 'Chromium', version: app['chrome_major_version'] }
        ],
        platformVersion,
        architecture: mobile ? '' : 'x86',
        bitness: mobile ? '' : '64',
        model: ''
    };
    return { userAgent: uaTemplate, userAgentMetadata: uaMetadata };
}
async function getChromeVersion() {
    try {
        const request = {
            url: 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const response = await (0, axios_1.default)(request);
        const data = response.data;
        return data.channels.Stable.version;
    }
    catch (error) {
        throw (0, Logger_1.log)('USERAGENT-CHROME-VERSION', 'An error occurred:' + error, 'error');
    }
}
async function getEdgeVersions() {
    try {
        const request = {
            url: 'https://edgeupdates.microsoft.com/api/products',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const response = await (0, axios_1.default)(request);
        const data = response.data;
        const stable = data.find(x => x.Product == 'Stable');
        return {
            android: stable.Releases.find(x => x.Platform == 'Android')?.ProductVersion,
            windows: stable.Releases.find(x => (x.Platform == 'Windows' && x.Architecture == 'x64'))?.ProductVersion
        };
    }
    catch (error) {
        throw (0, Logger_1.log)('USERAGENT-EDGE-VERSION', 'An error occurred:' + error, 'error');
    }
}
function getSystemComponents(mobile) {
    const osId = mobile ? 'Linux' : 'Windows NT 10.0';
    const uaPlatform = mobile ? `Android 1${Math.floor(Math.random() * 5)}` : 'Win64; x64';
    if (mobile) {
        return `${uaPlatform}; ${osId}; K`;
    }
    return `${uaPlatform}; ${osId}`;
}
async function getAppComponents(mobile) {
    const versions = await getEdgeVersions();
    const edgeVersion = mobile ? versions.android : versions.windows;
    const edgeMajorVersion = edgeVersion?.split('.')[0];
    const chromeVersion = await getChromeVersion();
    const chromeMajorVersion = chromeVersion?.split('.')[0];
    const chromeReducedVersion = `${chromeMajorVersion}.0.0.0`;
    return {
        edge_version: edgeVersion,
        edge_major_version: edgeMajorVersion,
        chrome_version: chromeVersion,
        chrome_major_version: chromeMajorVersion,
        chrome_reduced_version: chromeReducedVersion
    };
}
//# sourceMappingURL=UserAgent.js.map