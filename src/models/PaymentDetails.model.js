const mongoose=require('mongoose');

const PaymentDetailsSchema=new mongoose.Schema({
    name:{
        type: String,
    },
    amount:{
        type: Number,
    },
    razorpay_payment_id:{
        type: String,
        default:null
    },
    razorpay_order_id:{
        type: String,
        default:null,
    },
    razorpay_signature:{
        type: String,
        default:null,
    },
    status: {
      type: String,
      enum: ["Initiate", "Pending", "Failed", "Complete"],
      default: "Initiate",
      required: true,
    },
},{timestamps:true});

const PaymentDetails=mongoose.model('PaymentDetails',PaymentDetailsSchema);
module.exports=PaymentDetails;