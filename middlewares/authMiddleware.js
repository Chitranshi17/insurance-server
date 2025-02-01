// const jwt = require("jsonwebtoken");

// const authMiddleware = (role) => {
//   return (req, res, next) => {
//     // Check if the Authorization header is present and properly formatted
//     const token = req.header("Authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return res
//         .status(401)
//         .json({ message: "No token, authorization denied" });
//     }

//     try {
//       // Verify the token with JWT_SECRET from environment variables
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       // Check if the decoded role matches the expected role
//       if (decoded.role !== role) {
//         return res.status(403).json({ message: "Access denied" });
//       }

//       // Attach the decoded user to the request object
//       req.user = decoded;

//       // Ensure that we properly call next() for the request to proceed to the route handler
//       next(); // Proceed to the next middleware or route handler
//     } catch (err) {
//       // If the token is invalid or expired, return an error
//       console.error(err); // Log the error for debugging
//       return res.status(401).json({ message: "Token is not valid" });
//     }
//   };
// };

// module.exports = authMiddleware;


////////////////////////////////
// const jwt = require("jsonwebtoken");

// const authMiddleware = (requiredRole) => {
//   return (req, res, next) => {
//     const token = req.header("Authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return res
//         .status(401)
//         .json({ message: "No token, authorization denied" });
//     }

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       // Debugging logs
//       console.log("Decoded Token:", decoded);

//       if (requiredRole && decoded.role !== requiredRole) {
//         return res.status(403).json({
//           message: "Unauthorized. Only Government officials can review policies.",
//         });
//       }

//       req.user = decoded;
//       next();
//     } catch (err) {
//       console.error("JWT Verification Error:", err);
//       return res.status(401).json({ message: "Token is not valid" });
//     }
//   };
// };

// module.exports = authMiddleware;



// const jwt = require("jsonwebtoken");

// const authMiddleware = (requiredRole) => {
//   return (req, res, next) => {
//     const token = req.header("Authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return res
//         .status(401)
//         .json({ message: "No token, authorization denied" });
//     }

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       if (requiredRole && decoded.role !== requiredRole) {
//         return res.status(403).json({
//           message:
//             "Unauthorized. Only Government officials can review policies.",
//         });
//       }

//       req.user = decoded;
//       next();
//     } catch (err) {
//       console.error("JWT Verification Error:", err);
//       return res.status(401).json({ message: "Token is not valid" });
//     }
//   };
// };

// module.exports = authMiddleware;


// const jwt = require("jsonwebtoken");

// const authMiddleware = (roles) => (req, res, next) => {
//   try {
//     const token = req.header("Authorization")?.split(" ")[1];
//     if (!token) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized. No token provided." });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;

//     // If roles is provided, check if the user role matches any of the allowed roles
//     if (roles && !roles.includes(decoded.role)) {
//       return res.status(403).json({
//         message: `Unauthorized. Only ${roles.join(" or ")} can access this.`,
//       });
//     }

//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid or expired token." });
//   }
// };

// module.exports = authMiddleware;



const jwt = require("jsonwebtoken");

const authMiddleware = (roles) => (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // If roles are provided, check if the user role matches any of the allowed roles
    if (roles && !roles.includes(decoded.role)) {
      return res.status(403).json({
        message: `Unauthorized. Only ${roles.join(" or ")} can access this.`,
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;

