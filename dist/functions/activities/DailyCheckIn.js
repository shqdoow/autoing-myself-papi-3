"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyCheckIn = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const Workers_1 = require("../Workers");
class DailyCheckIn extends Workers_1.Workers {
    async doDailyCheckIn(accessToken, data) {
        this.bot.log('DAILY-CHECK-IN', 'Starting Daily Check In');
        try {
            let geoLocale = data.userProfile.attributes.country;
            geoLocale = (this.bot.config.searchSettings.useGeoLocaleQueries && geoLocale.length === 2) ? geoLocale.toLowerCase() : 'us';
            const jsonData = {
                amount: 1,
                country: geoLocale,
                id: (0, crypto_1.randomBytes)(64).toString('hex'),
                type: 101,
                attributes: {
                    offerid: 'Gamification_Sapphire_DailyCheckIn'
                }
            };
            const claimRequest = {
                url: 'https://prod.rewardsplatform.microsoft.com/dapi/me/activities',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Rewards-Country': geoLocale,
                    'X-Rewards-Language': 'en'
                },
                data: JSON.stringify(jsonData)
            };
            const claimResponse = await (0, axios_1.default)(claimRequest);
            const claimedPoint = parseInt((await claimResponse.data).response.activity.p);
            this.bot.log('DAILY-CHECK-IN', claimedPoint > 0 ? `Claimed ${claimedPoint} points` : 'Already claimed today');
        }
        catch (error) {
            this.bot.log('DAILY-CHECK-IN', 'An error occurred:' + error, 'error');
        }
    }
}
exports.DailyCheckIn = DailyCheckIn;
//# sourceMappingURL=DailyCheckIn.js.map