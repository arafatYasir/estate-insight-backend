const express = require("express");
const cors = require("cors");
const houses = require("./houses.json");

const app = express();
app.use(cors());

const port = process.env.PORT || 5000;

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

    // Conver query params to actual value
    limit = limit ? parseInt(limit) : 200;
    minLat = minLat ? parseFloat(minLat) : -90;
    maxLat = maxLat ? parseFloat(maxLat) : 90;
    minLng = minLng ? parseFloat(minLng) : -180;
    maxLng = maxLng ? parseFloat(maxLng) : 180;
    minPrice = minPrice ? parseFloat(minPrice) : 0;
    maxPrice = maxPrice ? parseFloat(maxPrice) : Infinity;
    beds = beds ? parseInt(beds) : 0;
    baths = baths ? parseInt(baths) : 0;

    const filtered = houses.filter(h => {
        const price = getLatestPrice(h.prices);

        return h.lat >= minLat &&
            h.lat <= maxLat &&
            h.lon >= minLng &&
            h.lon <= maxLng &&
            price >= minPrice &&
            price <= maxPrice &&
            h.beds >= beds &&
            h.baths >= baths &&
            (!listingType || h.listingType === listingType) &&
            (!homeType || h.homeType === homeType);
    });

    

    res.json({
        count: filtered.length,
        data: filtered.slice(0, limit)
    })
})

app.listen(port, () => {
    console.log("The bakcend is running on: ", port);
})