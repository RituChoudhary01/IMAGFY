import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transactionModel from "../models/TransactionModel.js";
import razorpay from 'razorpay'

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userData = {
      name: name,
      email: email,
      password: hashedPassword,
    };
    const newUser = new userModel(userData);
    const user = await newUser.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token: token, user: { name: user.name } });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token: token, user: { name: user.name } });
    } else {
      return res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// const userCredits = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const user = await userModel.findById(userId);
//     res.json({
//       success: true,
//       credits: user.creditBalance,
//       user: {
//         name: user.name,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     res.json({ success: false, message: error.message });
//   }
// };

const userCredits = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId); // ✅ use req.userId
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      credits: user.creditBalance,
      user: {
        name: user.name,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentRazorpay = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.userId;
    console.log(req.userId, planId)

    if (!userId || !planId) {
      return res.json({ success: false, message: "User ID and Plan ID are required" });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let credits, plan, amount;

    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 10;
        break;
      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 50;
        break;
      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 250;
        break;
      default:
        return res.json({ success: false, message: "Plan not found" });
    }

    const transactionData = {
      userId,
      plan,
      amount,
      credits,
      date: Date.now(),
      payment: false
    };

    const newTransaction = await transactionModel.create(transactionData);

    const options = {
      amount: amount * 100, // in paise
      currency: process.env.CURRENCY,
      receipt: newTransaction._id.toString(),
    };

    razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
      }
      res.json({ success: true, order });
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;

    if (!razorpay_order_id) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      const transaction = await transactionModel.findById(orderInfo.receipt);
      if (!transaction) {
        return res.json({ success: false, message: "Transaction not found" });
      }

      if (transaction.payment) {
        return res.json({ success: false, message: "Payment already processed" });
      }

      const userData = await userModel.findById(transaction.userId);
      if (!userData) {
        return res.json({ success: false, message: "User not found" });
      }

      const creditBalance = (userData.creditBalance || 0) + transaction.credits;
      await userModel.findByIdAndUpdate(userData._id, { creditBalance });
      await transactionModel.findByIdAndUpdate(transaction._id, { payment: true });

      res.json({ success: true, message: "Credits Added" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


export { registerUser, loginUser, userCredits,paymentRazorpay, verifyRazorpay };