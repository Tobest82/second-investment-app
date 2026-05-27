const express = require("express");
const router = express.Router();

const {registerUser, userLogin, getUserData, deposit, withdraw, getTransactions, forgotPassword, resetPassword} = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");





router.post("/register", registerUser);
router.post("/login", userLogin);
router.get("/dashboard", auth, (req, res) =>{
    res.json({
        message: "welcome to your dashboard",
        user: req.user
    });
}) ;
router.get("/me", auth, getUserData); 
router.post("/deposit", auth, deposit);
router.post("/withdraw", auth, withdraw);
router.get("/transactions", auth, getTransactions);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword", resetPassword);


module.exports = router;