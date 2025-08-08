import userModel from "../models/userModel.js";
import FormData from "form-data";
import axios from "axios";

const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.userId; // ✅ coming from auth middleware

    console.log(" Prompt:", prompt);
    console.log(" User ID:", userId);

    // ✅ Find user
    const user = await userModel.findById(userId);
    console.log(" User:", user);

    if (!user || !prompt) {
      return res.status(400).json({ success: false, message: "Missing details." });
    }

    // ✅ Credit balance check
    if (user.creditBalance <= 0) {
      return res.status(403).json({
        success: false,
        message: "No credit balance",
        creditBalance: user.creditBalance,
      });
    }

    // ✅ Ensure prompt is long enough for ClipDrop
    const safePrompt =
      prompt.trim().length < 10
        ? "A hyper-realistic digital painting of children playing in a sunny park with trees and flowers, 8k resolution"
        : prompt;

    // ✅ Build form data
    const formData = new FormData();
    formData.append("prompt", safePrompt);

    // ✅ API request
    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API,
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer",
      }
    );

    // ✅ Convert to base64
    const base64Image = Buffer.from(data, "binary").toString("base64");
    const resultImage = `data:image/png;base64,${base64Image}`;

    // ✅ Deduct credit
    await userModel.findByIdAndUpdate(user._id, {
      creditBalance: user.creditBalance - 1,
    });

    // ✅ Send response
    res.json({
      success: true,
      message: "Image generated",
      creditBalance: user.creditBalance - 1,
      resultImage,
    });
  } catch (error) {
    console.error(" ClipDrop error status:", error.response?.status);
    console.error(" ClipDrop error details:", error.response?.data?.toString());

    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.toString() ||
        "Failed to generate image. Please try again.",
    });
  }
};

export default generateImage;
