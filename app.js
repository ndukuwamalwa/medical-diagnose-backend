const http = require("http");
const cluster = require('cluster');
const cpus = require('os').cpus().length;
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

if (cluster.isMaster) {
    //Fork workers
    for (let i = 0; i < cpus; i++) {
        cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    const server = http.createServer(app);
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log("Server is running...");
    });
}