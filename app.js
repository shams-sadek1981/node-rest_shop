const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const productRoutes = require('./api/routes/products');
const orderRoutes = require('./api/routes/orders');
const userRoutes = require('./api/routes/user');
const routes = require('./api/routes');

// mongoose.connect('mongodb://shamssadek:' + process.env.MONGO_ATLAS_PW +'@projectmanager-shard-00-00-29oqc.mongodb.net:27017,projectmanager-shard-00-01-29oqc.mongodb.net:27017,projectmanager-shard-00-02-29oqc.mongodb.net:27017/test?ssl=true&replicaSet=ProjectManager-shard-0&authSource=admin&retryWrites=true', {
mongoose.connect(process.env.DATABASE , {
    // useMongoClient: true
    useNewUrlParser: true
    // promiseLibrary: global.Promise
});

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use( (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    if(req.method == 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }

    next();
})

//-- declare routes
app.use('/', routes);

// Error Handling
app.use( (req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
})

app.use( (err, req, res, next) => {
    res.status(err.status || 500 );
    res.json({
        error: {
            message: err.message
        }
    })
})

module.exports = app;