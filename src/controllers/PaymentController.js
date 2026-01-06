const Razorpay = require("razorpay");
const crypto = require("crypto");
const PaymentDetails = require("../models/PaymentDetails.model");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

exports.payment_checkout = async (req, res) => {
  try {
    const { name, amount } = req.body;

    if (!name || !amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "Valid name and amount are required",
      });
    }

    const numAmount = Number(amount);

    const order = await razorpay.orders.create({
      amount: numAmount * 100, // paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    await PaymentDetails.create({
      name,
      amount: numAmount,
      razorpay_order_id: order.id,
      status: "Pending",
    });

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({
      success: false,
      message: "Payment checkout failed",
    });
  }
};



exports.payment_verification = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      await PaymentDetails.findOneAndUpdate(
        { razorpay_order_id },
        { status: "Failed" }
      );

      return res.redirect(`${process.env.frontend_user_url}/failed`);
    }

    await PaymentDetails.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: "Complete",
      }
    );

    res.redirect(
      `${process.env.frontend_user_url}/success?payment_id=${razorpay_payment_id}`
    );
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
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