const jwt = require("jsonwebtoken");

const auth = (req, res, next) =>{

    const token = req.headers.authorization;

    if(!token){
        return res.json({message: "access denied"});
}
try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);

     req.user = verified;

     next();
}

catch(error){
    return res.json({message: "invalid token"});

}


};

module.exports = auth;