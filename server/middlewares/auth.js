import jwt from "jsonwebtoken";

// const userAuth = async (req, res, next) => {
//   const { token } = req.headers;

//   if (!token) {
//     return res.json({
//       success: false,
//       message: "Not authorized. Login again.",
//     });
//   }

//   try {
//     const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

//     if (tokenDecode.id) {
//       req.body.userId = tokenDecode.id;
//     } else {
//       res.json({ success: false, message: "Not authorized. Login again." });
//     }

//     next();
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };

// export default userAuth;

const userAuth = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({
      success: false,
      message: "Not authorized. Login again.",
    });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if (tokenDecode.id) {
      req.userId = tokenDecode.id; // ✅ store on req object instead of req.body
      next();
    } else {
      res.json({ success: false, message: "Not authorized. Login again." });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default userAuth;