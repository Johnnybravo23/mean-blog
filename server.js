const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');


// connecting the users file
const authentication = require('./routes/authentication');

const app = express();

// Adding Body Parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// DB Config
const db = require('./config/keys').mongoURI;

// Connecting to mongoDB through mongoose
mongoose
    .connect(db)
    .then(() => console.log('MongoDB Connected!'))
    .catch(err => console.log(err));

app.use(express.static(__dirname + '/client/dist/client'));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + 'client/dist/client/index.html'));
});

// passport middleware
app.use(passport.initialize());

// passport config
require('./config/passport')(passport);

// Use Routes, initializing the connection
app.use('/authentication', authentication);


const port = process.env.PORT || 8080;

app.listen(port, () => console.log(`Server running on port ${port}`));