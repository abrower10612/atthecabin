const path = require('path');
require('dotenv').config({path: path.join(__dirname, '.env')});
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const favicon = require('serve-favicon');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI_CABIN;
const csrfProtection = csrf();
const errorController = require('./controllers/error');
const multer = require('multer');
// const cookie = require('cookie-parser');

const app = express();

const corsOptions = {
    origin: process.env.HEROKU_ORIGIN,
    optionSuccessStatus: 200,
    allowedHeaders: 'Content-Type,Authorization',
    methods: 'GET,PUT,POST,PATCH,DELETE'
 };
 app.use(cors(corsOptions));
 
 const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    family: 4
 }

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const fileStorage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null,  'public/images');
   },
   filename: (req, file, cb) => {
      cb(null, file.originalname);
   }
});

const fileFilter = (req, file, cb) => {
   if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
   ) {
      cb(null, true);
   } else {
      cb(null, false);
   }
};

app.use(
   session({ 
       secret: 'my secret', 
       resave: false, 
       saveUninitialized: false,
       store: store,
       isLoggedIn: false
   }))
   .use(favicon(__dirname + '/public/images/favicon.png'))
   .use(express.static(path.join(__dirname, 'public')))
   .set('views', path.join(__dirname, 'views'))
   .set('view engine', 'ejs')
   .use(bodyParser.urlencoded({extended: false})) 
   .use(bodyParser.json())
   .use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))
   .use('/images', express.static(path.join(__dirname, 'images')))
   .use((req, res, next) => {
       res.setHeader('Access-Control-Allow-Origin', process.env.HEROKU_ORIGIN);
       res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
       res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');       
       next();
   })
   .use(csrfProtection)
   .use(flash())
   .use((req, res, next) => {
      res.locals.isAuthenticated = req.session.isLoggedIn;
      res.locals.csrfToken = req.csrfToken();
      next();
   })
   .use('/', routes)
   .use(errorController.get404);

mongoose
   .connect(
       MONGODB_URI,
       options
    )
   .then(result => {
     app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
   })
   .catch(err => {
     console.log(err);
});
   
   