const express = require("express");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const exiftool = require("exiftool-vendored").exiftool;
const { v4: uuidv4 } = require("uuid");
const ExifImage = require('exif').ExifImage;

const app = express();

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    var splitData = file.originalname.split(".");
    var extension = splitData[splitData.length - 1];

    cb(null, uuidv4() + `.${extension}`);
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.render("public");
});

app.get("/upload", (req, res) => {
  res.render("upload");
});

app.get("/upload2", (req, res) => {
  res.render("upload2");
});

// app.get("/private", (req, res) => {
//   res.render("private");
// });

app.get("/public", (req, res) => {
  res.render("public");
});

app.get("/public2", (req, res) => {
    res.render("public2");
  });

app.post("/upload", upload.single("imageUpload"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.redirect("upload");
});

function getWritableTags(imagePath, callback) {
    try {
      new ExifImage({ image: imagePath }, (error, exifData) => {
        if (error) {
          callback(error);
        } else {
        //     console.log(exifData);
        //   const writableTags = Object.keys(exifData.image).filter((tag) => {
        //     console.log(tag);
        //     return exifData.image[tag].writable;
        //   });
          callback(null, writableTags);
        }
      });
    } catch (error) {
      callback(error);
    }
  }
  

app.post(
  "/upload2",
  upload.single("imageUpload"),
  async (req, res, next) => {
    var file = req.file;
    var filePath = `${file.path}`;
    var rewriteFile = `${file.destination}rewrite_${file.filename}`;

    // await exiftool.rewriteAllTags(filePath, rewriteFile);

    var exifData = await exiftool.read(filePath);
    // var exifData =  exiftool.readTags(filePath).then((tags)=>{
    //     console.log(tags);
    // });

    // getWritableTags(filePath, (tags) =>{
    //     console.log(tags);
    // })

    for (const tag in exifData) {
        if (exifData.hasOwnProperty(tag)) {
          const value = exifData[tag];
          if (typeof value === 'string') {
            exifData[tag] = encodeURIComponent(value);
          }
        }
      }

      await exiftool.write(filePath, exifData);
    // console.log(exifData);
    // await exiftool.write(filePath, { FileName: 'rewrite_e3024758-e787-465a-b86e-63b47d5764a8.png'});
    // fs.unlinkSync(rewriteFile);

    next();
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    res.redirect("upload");
  }
);

app.get("/images", (req, res) => {
  fs.readdir("./public/uploads", (err, files) => {
    var images = [];

    files.forEach((file) => {
      if (file.endsWith("png") || file.endsWith("jpg")) images.push(file);
    });

    res.json(images);
  });
});

// const secretKey = "mysecretkey";

// const users = [];

// app.get("/login", (req, res) => {
//   res.render("login");
// });

// app.post("/login", (req, res) => {
//   const user = users.find((user) => user.email === req.body.email);

//   if (!user) {
//     return res.status(401).send("Invalid email or password");
//   }

//   bcrypt.compare(req.body.password, user.password, (err, result) => {
//     if (err) {
//       return res.status(500).send("Internal server error");
//     }

//     if (!result) {
//       return res.status(401).send("Invalid email or password");
//     }

//     const token = jwt.sign({ email: user.email }, secretKey);
//     res.cookie("token", token);

//     res.redirect("/");
//   });
// });

// app.post("/logout", (req, res)=>{
//     res.cookie("token", "");
//     res.redirect("/login");
// })

// app.get("/register", (req, res) => {
//   res.render("register");
// });

// app.post("/register", (req, res) => {
//   bcrypt.hash(req.body.password, 10, (err, hash) => {
//     if (err) {
//       return res.status(500).send("Internal server error");
//     }

//     const user = {
//       email: req.body.email,
//       password: hash,
//     };

//     for (let index = 0; index < users.length; index++) {
//       const element = users[index];
//       if (element.email == user.email)
//         return res.json({ message: "Exist Email!" });
//     }

//     users.push(user);

//     res.redirect("/login");
//   });
// });

// function authenticateToken(req, res, next) {
//   const token = req.cookies.token;

//   if (!token) {
//     return res.status(401).send("Access denied");
//   }

//   jwt.verify(token, secretKey, (err, decoded) => {
//     if (err) {
//       return res.status(401).send("Access denied");
//     }

//     res.locals.email = decoded.email;

//     next();
//   });
// }

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
