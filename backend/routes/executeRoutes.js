const express = require('express');
const router = express.Router();
router.get("/",(req,res)  => {
   res.json({
        message: "Backend Running Successfully"
   }); 
});
router.post("/execute",(req,res) => {
    try {
        const {code , language}  = req.body;
        console.log("code", code);
        console.log("language",language);
        res.json({
            message: "Server is executing succesfully",
            code : code
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
});
module.exports = router;