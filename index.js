const express = require('express');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.render('public');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});


app.get('/upload', (req, res) => {
    res.render('upload');
});

app.get('/private', (req, res) => {
    res.render('private');
});


app.get('/public', (req, res) => {
    res.render('public');
});


app.post('/upload', upload.single('imageUpload'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.render('image', { imageUrl: `/uploads/${req.file.filename}` });
});

const secretKey = 'mysecretkey';

const users = [];

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const user = users.find(user => user.email === req.body.email);

    if (!user) {
        return res.status(401).send('Invalid email or password');
    }

    bcrypt.compare(req.body.password, user.password, (err, result) => {
        if (err) {
            return res.status(500).send('Internal server error');
        }

        if (!result) {
            return res.status(401).send('Invalid email or password');
        }

        const token = jwt.sign({ email: user.email }, secretKey);
        res.cookie('token', token);

        res.redirect('/');
    });
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
            return res.status(500).send('Internal server error');
        }

        const user = {
            email: req.body.email,
            password: hash
        };

        users.push(user);

        res.redirect('/login');
    });
});

function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).send('Access denied');
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).send('Access denied');
        }

        res.locals.email = decoded.email;

        next();
    });
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));