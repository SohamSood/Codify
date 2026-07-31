const express = require('express');
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const executeRoutes = require("./routes/executeRoutes");
app.use('/api',executeRoutes);
app.get("/",(req,res) => {
    res.json({
        message: "Backend Running Successfully"
   }); 
});
app.listen(PORT,()=> {
    console.log("Server is running");
});