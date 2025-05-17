import axios from 'axios';
import express from 'express'
import fixedWindowLimiter from './middleware/fixedWindow.js';

const app = express()
const PORT = 5000;
const currentTime =Date.now()
app.use(fixedWindowLimiter)

let hitCount =1;

app.get("/ping" ,async(req,res) => {
    console.log(`hit Count : ${hitCount}`);
    res.status(200)
        .json({
            "success" : true,
            "timeStamp" : currentTime,
            "Message" : `${hitCount}`
        })
        hitCount += 1;
})

const makeReq = async()=>{
    for(let i =0; i<200 ; i++){
        try {
            const response = await axios.get(`http://localhost:${PORT}/ping` ,{
                headers: {
                    user_id: 'user-23'
                }
            })
            console.log(`Response ${i+1} :` , response.data);
        } catch (error) {
            console.error(`Error making ${i+1} request:` ,error.message)
        }

        await new Promise(resolve => setTimeout(resolve,1000)) // resolve after 1 sec
    }
}

app.listen(PORT, ()=>{
    console.log(`App is listening on PORT: ${PORT}`);
    makeReq();
})
