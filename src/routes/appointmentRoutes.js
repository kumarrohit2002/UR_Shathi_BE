const express = require('express');
const {BookAppointment,myBooking,myAppointment}=require('../controllers/appointmentController');
const {middleware} = require('../middleware/middleware');

const router = express.Router();


router.post('/book-appointment',middleware ,BookAppointment);
router.get('/getmy-booking',middleware,myBooking);
router.get('/my-appointment',middleware ,myAppointment);


module.exports = router;
