const express = require("express");
const cors = require("cors");
const houses = require("./houses.json");

const app = express();
app.use(cors());

const port = process.env.PORT || 5000;

// Pre-compute latest prices once at startup
const housesWithLatestPrice = houses.map(house => {
    return {
        ...house,
        latestPrice: getLatestPrice(house.prices)
    };
});

function getLatestPrice(prices) {
    let latest = prices[0];

    for (let p of prices) {
        const [dateStr] = p.split(" | ");
        const date = new Date(dateStr.split('/').reverse().join('-')); // dd/mm/yyyy to yyyy-mm-dd
        const latestDate = new Date(latest.split('|')[0].split('/').reverse().join('-'));
        if (date > latestDate) latest = p;
    }
    return parseFloat(latest.split('|')[1].trim());
}

// Get zoom-based limit
function getZoomBasedLimit(zoomLevel) {
    if(!zoomLevel) return null;
    
    const zoom = parseInt(zoomLevel);

    if(zoom <= 6) {
        return 200;
    }
    else if(zoom <= 8) {
        return 400;
    }
    else if(zoom <= 10) {
        return null;
    }
    else if(zoom <= 12) {
        return 900;
    }
    else return null;
}

app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.get("/api/houses", (req, res) => {
    let {
        minLat, maxLat, minLng, maxLng,
        listingType, minPrice, maxPrice, homeType, beds, baths, limit, zoomLevel
    } = req.query;

    // Convert query params to actual values
    limit = parseInt(limit);
    if (isNaN(limit) || limit <= 0) {
        limit = null;
    }

    minLat = minLat ? parseFloat(minLat) : -90;
    maxLat = maxLat ? parseFloat(maxLat) : 90;
    minLng = minLng ? parseFloat(minLng) : -180;
    maxLng = maxLng ? parseFloat(maxLng) : 180;
    minPrice = minPrice ? parseFloat(minPrice) : 0;
    maxPrice = maxPrice ? parseFloat(maxPrice) : Infinity;
    beds = beds ? parseInt(beds) : 0;
    baths = baths ? parseInt(baths) : 0;

    // Filtering Houses
    let filtered = housesWithLatestPrice.filter(h => {
        // Geographic filter first (most selective, fastest)
        if (h.lat < minLat || h.lat > maxLat || h.lon < minLng || h.lon > maxLng) {
            return false;
        }

        // Price filter (using pre-computed price)
        if (h.latestPrice < minPrice || h.latestPrice > maxPrice) {
            return false;
        }

        // Other filters
        if (h.beds < beds || h.baths < baths) {
            return false;
        }

        // String comparisons last (potentially expensive)
        if (listingType && h.listingType !== listingType) {
            return false;
        }

        if (homeType && h.homeType !== homeType) {
            return false;
        }

        return true;
    });

    const zoomLimit = getZoomBasedLimit(zoomLevel);

    if(zoomLimit) {
        filtered.sort((a, b) => b.latestPrice - a.latestPrice);

        filtered = filtered.slice(0, zoomLimit);

        console.log(`Zoom Level: ${zoomLevel}, Applied Limit: ${zoomLimit}, Results: ${filtered.length}`)
    }

    const result = limit ? filtered.slice(0, limit) : filtered;

    res.json({
        count: result.length,
        totalMatches: filtered.length,
        zoomLevel: zoomLevel || null,
        appliedZoomLimit: zoomLimit,
        data: result
    });
})

app.listen(port, () => {
    console.log("The backend is running on: ", port);
})