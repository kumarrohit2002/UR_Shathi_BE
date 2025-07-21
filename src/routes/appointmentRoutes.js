const express = require('express');
const {BookAppointment,myBooking,myAppointment,paymentSlip,slotIsAvailable}=require('../controllers/appointmentController');
const {middleware} = require('../middleware/middleware');

const router = express.Router();


router.post('/book-appointment',middleware ,BookAppointment);
router.get('/getmy-booking',middleware,myBooking);
router.get('/my-appointment',middleware ,myAppointment);
router.get('/payment-slip/:razorpay_payment_id',paymentSlip);
router.post('/is-slot-available',slotIsAvailable);


module.exports = router;
