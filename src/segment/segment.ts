import { AnalyticsBrowser } from "@segment/analytics-next";

const analytics = new AnalyticsBrowser()
if(process.env.REACT_APP_SEGMENT_WRITE_KEY) {
    analytics.load({
        writeKey: process.env.REACT_APP_SEGMENT_WRITE_KEY,
    });
}

export default analytics;