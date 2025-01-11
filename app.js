const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')
const cors = require('cors')
const user = require('./routes/user')
const category = require('./routes/category')
const post = require('./routes/Post')

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    
}))
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: "50mb", extended: true }));
app.use(cookieParser());

// app.get('/order',(req, res) => {
//     res.send('GUMANA NAA')
// })
app.use('/api/v1/users', user);
app.use('/api/v1/categories', category);
app.use('/api/v1/posts', post);

module.exports = app