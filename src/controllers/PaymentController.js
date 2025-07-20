const Razorpay = require('razorpay');
const crypto = require('crypto');
const PaymentDatails=require('../models/PaymentDetails.model');
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECTERT_KEY,
});



exports.payment_checkout = async (req, res) => {
    try {
        const { name, amount } = req.body;

        if (!name || !amount) {
            return res.status(400).json({
                success: false,
                message: 'All fields are Required!!'
            });
        }
        
        const num = parseInt(amount, 10);

        const order = await razorpay.orders.create({
            amount: Number(num * 100), // amount in paisa
            currency: "INR",
        });

        await PaymentDatails.create({
            name: name,
            amount: num,
            order_id: order.id
        });

        res.status(200).json({ order: order });
    } catch (error) {
        console.error("Error in checkout routes:", error);  // Log full error object
        res.status(500).json({
            success: false,
            message: `Error in checkout routes: ${error.message || error}` // Extract the error message
        });
    }
};


exports.payment_verification=async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const body_data = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECTERT_KEY)
            .update(body_data)
            .digest('hex');

        const isValid = expectedSignature === razorpay_signature;

        if (isValid) {
            // update in DB
            await PaymentDatails.findOneAndUpdate(
                { order_id: razorpay_order_id },
                {
                    $set: {
                        razorpay_payment_id: razorpay_payment_id,
                        razorpay_order_id: razorpay_order_id,
                        razorpay_signature: razorpay_signature,
                    }
                }
            );

            res.redirect(`${process.env.frontend_user_url}/success?payment_id=${razorpay_payment_id}`);
        } else {
            res.redirect(`${process.env.frontend_user_url}/failed`);
        }

    } catch (error) {
        console.log(`Error in payment verification, Error: ${error}`);
        res.json({
            success: false,
            message: `Error in payment verification, Error: ${error.message}`
        });
    }
};



//frontend Code

// const CheckoutHandler=async({name,amount})=>{
//     const {data:{order}}=await axios.post("http://localhost:5000/api/payment/checkout",{name,amount});
//     // console.log({order});
//     // console.log(name+" "+amount);
//     const options = {
//         key: 'rzp_test_TgbjbhWB0DWlDI', // Replace with your Razorpay key_id
//         amount: order.amount, // Amount is in currency subunits. Default currency is INR.
//         currency: order.currency,
//         name: 'Rohit Kumar',
//         description: 'Test Transaction',
//         order_id: order.id, // This is the order_id created in the backend
//         callback_url: 'http://localhost:5000/api/payment/payment-verification', //success URL
//         prefill: {  //jopayment kar raha hai uska details
//           name: 'Gaurav Kumar', 
//           email: 'gaurav.kumar@example.com',
//           contact: '9999999999'
//         },
//         theme: {
//           color: '#F37254' //you can change theme
//         },
//       };

//       const rzp = new window.Razorpay(options);
//       rzp.open(options);
// }