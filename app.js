const http = require("http");
const dotenv = require("dotenv");
dotenv.config();
const app = require("express")();
const bodyParser = require("body-parser");

const routes = require("./routes");
const auth = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, PATCH, GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', true);
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
    } else {
        next();
    }
});
app.use('/login', auth.authenticate);
app.use(routes);

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Server is running...");
});