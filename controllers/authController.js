const bcrypt = require("bcrypt");
const supabase = require("../supabase");
const jwt= require("jsonwebtoken");
const nodemailer= require("nodemailer");


// email transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
})





const registerUser= async(req, res) =>{

    const {name, email, password} = req.body;

    // validations

    // check if input feilds are empty
    if(!name || !email || !password){
        return res.json({message: "input all feilds"}
        )};

   // check if email is valid
    if(!email.includes("@") || !email.includes(".")){
        return res.json({message: "invalid email"}
        )};

        // check if password reach the minimuim length
    if(password.length < 6){
        return res.json({message: "password must be at least 6 characters"}
        )};

        // check if user already exists
    const {data: existUser, error: existUserError} = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

    if(existUser.length > 0){
        return res.json({
            message: "email already exist"
        });
    }

    if(existUserError){
        return res.json({
            message: "Database error"
        });
    }

// hash password
const hashedpassword = await bcrypt.hash(password, 10);

// save user
const {data, error} = await supabase
.from("users")
.insert([{name, email, password: hashedpassword}])
.select("id, name, email, balance");

if(error){
    console.log(error);
    
    return res.json({message: "registration failed"}
)};

 res.json({message: "user registered successfully", data}
);
}

// userLogin
const userLogin= async(req, res) =>{
    const{email, password} = req.body;

    // check if input feilds are empty
    if (!email || !password) {
    return res.json({
        message: "Email and password required"
    });
}

    const{data, error} = await supabase
    .from("users")
    .select("*")
    .eq("email", email)

    // check error
    if(error){
       return res.json({message: "Database error!"});
    }
    
    // check if user exist
    if(data.length=== 0){
      return  res.json({message: "user not found"});
    }
    const user = data[0];

    const ismatch = await bcrypt.compare(password, user.password);

    if(!ismatch){
       return res.json({message: "invalid password"});
    }
    const token = jwt.sign({
        email: user.email,
        id: user.id
    }, process.env.JWT_SECRET);

    res.json({
        message: "login successful",
        token: token});
};

const getUserData = async(req, res) =>{
    const email = req.user.email;

    // find user in database
    const {data, error} = await supabase
    .from("users")
    .select("name, email, balance")
    .eq("email", email);

    if(error){
        return res.json({message: "database error"});
    }

    if(!data || data.length === 0){
        return res.json({message: "user not found"});
    }

    const user = data[0];

    return res.json({
        name: user.name,
        email: user.email,
        balance: user.balance || 0
    });

};


const deposit = async(req, res) =>{
    const {amount} = req.body;
    const email = req.user.email

// check empty
if (!amount) {
    return res.json({
        message: "Amount is required"
    });
}

// check number
if (isNaN(amount)) {
    return res.json({
        message: "Amount must be a number"
    });
}

// check positive
if (Number(amount) <= 0) {
    return res.json({
        message: "Amount must be greater than 0"
    });
}

    const {data, error} = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

    if(error){
        return res.json({
            message: "database error"
        });
    }

    if(!data || data.length === 0){
        return res.json ({
            message: "user does not exist"
        });
    }

    const user = data[0];

    const newBalance = Number(amount) + Number(user.balance);

    const {error: updateError} = await supabase
    .from("users")
    .update({
        balance: newBalance
    })
    .eq("email", email)

    if(updateError){
        return res.json({
            message: "deposit failed"
        });
    }

    await supabase
    .from("transactions")
    .insert([
        {
        email: email,
        type: "deposit",
        amount: amount
    }
]);

        return res.json({
        message: "Deposit successful",
        balance: newBalance
    });

    

}

const withdraw = async (req, res) =>{
    const {amount} = req.body;
    const email = req.user.email;


// empty
if (!amount) {
    return res.json({
        message: "Amount is required"
    });
}

// number check
if (isNaN(amount)) {
    return res.json({
        message: "Amount must be a number"
    });
}

// positive check
if (Number(amount) <= 0) {
    return res.json({
        message: "Amount must be greater than 0"
    });
}

    const{data, error} = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

    if(error){
        return res.json({
            message: "Database Error"
        });
    }

    if(!data || data.length === 0){
        return res.json({
            message: "User not found"
        });
    }

    const user = data[0];

    const currentBalance = Number(user.balance);
    const withdrawAmount = Number(amount);

    if(withdrawAmount > currentBalance){
        return res.json({
            message: "Insufficient fund"
        });
    }

    const newBalance = currentBalance - withdrawAmount;

    const {error: updateError} = await supabase
    .from("users")
    .update({
        balance: newBalance
    })
    .eq("email", email);

    if(updateError){
        return res.json({
            message: "Withdrawal failed"
        });
    }


        const {error: transError} = await supabase
    .from("transactions")
    .insert([
        {
        email: email,
        type: "withdraw",
        amount: amount
    }
]);

if(transError){
    console.log("Transaction error:", transError);
}

    res.json({
            message: "Withdrawal successful",
            balance: newBalance 
        });

    



};


const getTransactions = async(req, res) =>{
    const email = req.user.email;

    const {data, error} = await supabase

    .from("transactions")
    .select("*")
    .eq("email", email)
    .order("created_at", {ascending: false});

    if(error){
        return res.json({
            message: "failed to fetch transaction"
        })
    }

    res.json(data);

}


const forgotPassword = async (req, res)=>{
    const {email} = req.body;

    if(!email){
        return res.json({
            message: "email is required"
        });
    }

    const {data, error} = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

    if(!data || data.length === 0){
        return res.json({
            message: "user not found"
        });

    }
    //    create a token
    const token =Math.random().toString(36).substring(2);

    // set expiry (10 minutes)
    const expiry = new Date (Date.now() + 10 * 60 * 1000);

    const {error: updateError} = await supabase
    .from("users")
    .update({
        reset_token: token,
        reset_token_expiry: expiry
    })
    .eq("email", email);

    if(updateError){
        console.log("Update error:", updateError);
        return res.json({
            message: "Failed to save reset token"
        });
        
    }

    try {

    const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset",
        html: `
        <h2>Password Reset</h2>
        <h3>${token}</h3>
        `
    });

    console.log(info);

    return res.json({
        message: "Email sent successfully"
    });

} catch(error) {

    console.log("EMAIL ERROR:");
    console.log(error);

    return res.json({
        message: "Email failed"
    });
}
    
}

const resetPassword = async(req, res) =>{
    const {token, newPassword} = req.body;

    if(!token || !newPassword){
        return res.json({
            message: "All feilds are required"
        });
    }

    const{data, error} = await supabase
    .from("users")
    .select("*")
    .eq("reset_token", token);

    if (error) {
    return res.json({
        message: "Database error"
    });
}

    if(!data || data.length === 0){
        return res.json({
            message: "Invalid token"
        });
    }

    const user = data[0];

    // check if token has expired
    if(new Date() > new Date (user.reset_token_expiry)){
        return res.json({
            message: "token has expired"
        });
    }

    const hashedpassword = await bcrypt.hash(newPassword, 10);

    await supabase
    .from("users")
    .update({
        password: hashedpassword,
        reset_token: null,
        reset_token_expiry: null

    })
    .eq("reset_token", token)

    res.json({
        message: "Password reset succesfully"
    });

}



// export module
module.exports = {
 registerUser,
    userLogin,
    getUserData,
    deposit,
    withdraw,
    getTransactions,
    forgotPassword,
    resetPassword
};

