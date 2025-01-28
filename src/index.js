const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');

require('dotenv').config();
const PORT=process.env.PORT || 4000;
app.use(express.json());
const cors = require('cors');
app.use(cookieParser());


app.use(cors({
    origin: [process.env.frontend_user_url, process.env.frontend_mentor_url],
    credentials: true, // This allows cookies to be sent
    optionsSuccessStatus: 200 // For older browsers compatibility
}));
app.use(express.urlencoded({ extended: true }));

const db=require("./config/database");

//cloudinary se connection
const cloudinary=require('./config/cloudinary');
cloudinary.cloudinaryConnect();

// this is for fileUpload
const fileupload=require('express-fileupload');
app.use(fileupload({
    useTempFiles:true,
    tempFileDir:'/tmp/'
}));

//for video call and chat 
// const http = require('http');
// const { Server } = require('socket.io');
// const socketSetup = require('./services/socket');

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: '*',
//   },
// });

// socketSetup(io);



// // route import and mount
const AllRoutes=require('./routes/AllRoutes');
app.use('/api/v1',AllRoutes);
const mentorRoutes=require('./routes/mentorRoutes');
app.use('/api',mentorRoutes);


//activation server
app.listen(PORT,async()=>{
    await db();  // database connection
    console.log(`listening on port no : http://localhost:${PORT}`);
});

app.get('/',(req,res)=>{
    res.send(`<h1>This is HomePage yaar</h1>`);
})