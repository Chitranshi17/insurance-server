const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Customer = require("../models/customerModel");
const Surveyor = require("../models/surveyorModel");
const Government = require("../models/governmentModel");

const registerUser = async (req, res, role) => {
  const { name, email, password } = req.body;

  // Ensure all required fields are provided
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  // Select the correct model based on role
  const Model =
    role === "customer"
      ? Customer
      : role === "surveyor"
      ? Surveyor
      : Government;

  try {
    const existingUser = await Model.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await Model.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res, role) => {
  const { email, password } = req.body;

  // Ensure email and password are provided
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Select the correct model based on role
  const Model =
    role === "customer"
      ? Customer
      : role === "surveyor"
      ? Surveyor
      : Government;

  try {
    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate a JWT token that includes the user ID and role
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
      expiresIn: "1d", // Token expiration time of 1 day
    });

    // Send JWT token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    // Send a response back with customer details and token
    res.status(200).json({
      message: "Login successful",
      token,
      customer: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registerUser, loginUser };
