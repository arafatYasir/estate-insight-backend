const express = require("express");
const cors = require("cors");
const houses = require("./houses.json");

const app = express();
app.use(cors());

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.get("/api/houses", (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 200;

    const startIdx = (page - 1) * limit;
    const endIdx = page * limit;

    const result = houses.slice(startIdx, endIdx);

    res.json({
        page,
        totalPages: Math.ceil(houses.length / limit),
        data: result
    });

})

app.listen(port, () => {
    console.log("The bakcend is running on: ", port);
})