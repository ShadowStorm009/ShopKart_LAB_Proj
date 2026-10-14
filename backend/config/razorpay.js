import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_TlKLl5a62W2IgV",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "cxKQ93uAJ4cQVmPcXBd8uoxc",
});

export default razorpay;
