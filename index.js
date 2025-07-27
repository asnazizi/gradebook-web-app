const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

// Initialize express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static files (CSS, JS) and views (Pug templates)
app.use('/static', express.static(path.join(__dirname, 'static')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb/Gradebook';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('MongoDB connection error:', error));

// Define User and Courseinfo models
const userSchema = new mongoose.Schema({
  email: String,
  secret: { type: String, default: null },
  timestamp: { type: String, default: null },
  uid: String
});

const User = mongoose.model('User', userSchema);

const courseInfoSchema = new mongoose.Schema({
  uid: Number,
  course: String,
  assign: String, 
  score: String
}, {collection: 'courseinfo'});

const courseInfo = mongoose.model('courseinfo', courseInfoSchema);

// Session Management
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: parseInt(process.env.SESSION_TIMEOUT_SECONDS || '300') * 1000 
  }  
}));

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// email
const transporter = nodemailer.createTransport({ 
    host: process.env.EMAIL_HOST || "testmail.cs.hku.hk",
    port: parseInt(process.env.EMAIL_PORT || '25'),
    secure: false
});

// Authentication Token
function generateToken(userId) {
  const secret = crypto.randomBytes(8).toString('base64');
  const tokenData = {uid: userId, secret: secret};
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  return [token, secret];
}

// Routes

app.get('/login', async (req, res) => {
  const token = req.query.token;
  if (token) {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      
      /*
      // debugging
      console.log('decoded.uid');
      console.log(decoded.uid);
      console.log('decoded.secret is');
      console.log(decoded.secret);
      */
      
      const user = await User.findOne({secret: decoded.secret});
      //console.log("found user");
      //console.log(user);

      if (!user){
        return res.render('login', {message: 'Fail to authenticate - incorrect secret!', messageDisplay: 'block', });
      } 
      
      const timestamp = parseInt(user.timestamp, 10); 
      const date = new Date(timestamp);
      const timeElapsed = (new Date() - date) / 1000;

      /*
      // debugging
      console.log('Time elapsed', timeElapsed);
      console.log('Date:', date);
      console.log('user.timestamp:', user.timestamp);
      */
     
      if (user.uid !== decoded.uid) {
        return res.render('login', {message: 'Unknown user - cannot identify the student.', messageDisplay: 'block', });
      } else if (timeElapsed > 60){
        res.render('login', {message: 'Fail to authenticate - OTP expired!', messageDisplay: 'block', });
      }

      //setore session info
      req.session.user = { uid: Number(user.uid), email: user.email, secret: decoded.secret, timestamp: timestamp };

      // allow user to enter courseinfo page
      res.redirect('/courseinfo/mylist');
      // delete secret and timestamp
      const filter = {secret: decoded.secret};
      const update = {secret: 'Null', timestamp: 'Null'};
      doc = await User.findOneAndUpdate(filter, update);
    } catch (err){
      res.render('login', {message: 'Fail to authenticate - Invalid token!', messageDisplay: 'block', });
    }
  } else {
    res.render('login', {message: '', messageDisplay: 'none', });
  }

});

// initiate the passwordless login
app.post('/login', async (req, res) => {
  const { email } = req.body;

  // check email address before sending to db
  if (!email || !email.match(/@cs.hku.hk$|@connect.hku.hk$/)) {
    return res.render('login', { message: 'Please enter a valid HKU or Connect email address.', messageDisplay: 'block',  });
  }

  try {
    const user = await User.findOne({email: email });
    
    if (!user) {
      return res.render('login', { message: `Unknown user - we don't have the record for ${email} in the system.`, messageDisplay: 'block',  });
    }

    // Generate a one-time token (using crypto)
    generated = generateToken(user.uid);
    token = generated[0];
    secret = generated[1];
    timestamp = Date.now(); 
    
    const filter = {email: email};
    const update = {secret: secret, timestamp: timestamp};
    doc = await User.findOneAndUpdate(filter, update);

    /*
    // debugging
    newuser = await User.findOne({email: email });
    console.log("new user");
    console.log(newuser);
    */
    logonlink = "http://localhost:8080/login?token="+token;
    const message = {
      from: "sender@connect.hku.hk",
      to: email,
      subject: 'Your Authentication Token',
      html: `<p>You can log on to the system via the following link: </p><p><a href=${logonlink}>${logonlink}</a></p><p>This token will expire in 60 seconds.</p>`,
    };

    await transporter.sendMail(message);
    console.log('Authentication token sent!');
    res.render('login', {
      message: 'Please check your email to get the URL to access the course info page',
      messageDisplay: 'block', 
      messageBackgroundColor: '#af8bc2' 
    });
    //res.render('login', {message: 'Please check your email to get the URL to access the course info page'});
  } catch (err) {
    console.log(err);
  }
});

// Render my list page using Pug
app.get('/courseinfo/mylist', async (req, res) => {
  
  // Session Control
  if (!req.session.user) {
    return res.redirect('/login');
  }
    

  // Get courses from the database based on the user's UID
  try {
    
  
    sessionuid = Number(req.session.user.uid);
    
    const courses = await courseInfo.find({ uid: sessionuid});
    // session expired?
    const timeElapsed = (new Date() - new Date(req.session.user.timestamp)) / 1000;
    if (timeElapsed > 300) {
      req.session.destroy();
      return res.render('/login', {message: 'Session expired. Please login again.', messageDisplay: 'block'});
  
    }
    
    //const courses = await courseInfo.find({ uid: 102});
    /*
    // debugging
    if (sessionuid==101) {
      console.log("session.uid==101? true");
    }
    else {
      console.log("session.uid==101? false");
      console.log("Session.uid", req.session.user.uid);
      console.log("Sessionuid", sessionuid);
    }
     */ 
    // debugging
    //debug = await courseInfo.find({ uid: { $type: "number" } })
    //console.log("number fields: ", debug);
    //console.log('courses found for uid: ', courses);

    
    // Extract unique courses
    const uniqueCoursesSet = new Set(courses.map(course => course.course));
    const uniqueCoursesArray = Array.from(uniqueCoursesSet);
    uniqueCoursesArray.sort();
    //console.log('uniqueCourseArray', uniqueCoursesArray);
    res.render('mylist', { courses: uniqueCoursesArray });
  } catch (err) {
    console.error(err);
    res.render('login', { message: '' });
  }
}); 

app.get('/courseinfo/getscore', async(req, res) => {
  // Retrieve and display score for the specific course
  // If no gradebook give 'You do not have the gradebook available for the course: ${course}'
  
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const timeElapsed = (new Date() - new Date(req.session.user.timestamp)) / 1000;

  if (timeElapsed > 300) {
    req.session.destroy();
    return res.render('login', { message: 'Session expired. Please login again.', messageDisplay: 'block',  });
  }
   

  const course = req.query.course;  
  const sessionUid = Number(req.session.user.uid); 

  try {
    // Query course records based on the user id and the course
    const courseRecords = await courseInfo.find({ uid: sessionUid, course: course });
    //const courseRecords = await courseInfo.find({ uid: 102, course: course });

    //courseRecords = NaN;
    if (courseRecords.length === 0 || !courseRecords || courseRecords === NaN) {

      return res.render('getscore', {
        course: course,
        message: `You do not have the gradebook available for the course: ${course}`,
        messageDisplay: 'block'
      });
    }


    const scores = courseRecords.map(record => ({
      item: record.assign,
      score: parseFloat(record.score)
    }));

    const totalScore = scores.reduce((sum, record) => sum + record.score, 0);
    scores.push({
      item: '',
      score: `Total ${totalScore}`
    });

    res.render('getscore', {
      course: course,
      scores: scores
    });

  } catch (err) {
    console.error(err);
    res.render('getscore', { message: 'Error fetching course details.' });
  }
});
