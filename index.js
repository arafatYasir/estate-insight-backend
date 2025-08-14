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

app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.get("/api/houses", (req, res) => {
    let {
        minLat, maxLat, minLng, maxLng,
        listingType, minPrice, maxPrice, homeType, beds, baths, limit
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

    // Optimized filtering: check geographical bounds first (fastest filter)
    const filtered = housesWithLatestPrice.filter(h => {
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

    const result = limit ? filtered.slice(0, limit) : filtered;

    res.json({
        count: result.length,
        totalMatches: filtered.length, // Total matches before limit
        data: result
    });
})

app.listen(port, () => {
    console.log("The backend is running on: ", port);
})