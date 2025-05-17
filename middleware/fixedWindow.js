import dotenv from 'dotenv'
import { createClient } from "redis";
dotenv.config();

const redisUrl = process.env.REDIS_URL;

const redisClient = createClient({ url : redisUrl})
redisClient.on('error' , (error) => console.log("Redis Error," ,error))
await redisClient.connect();

const RATE_TIME_LIMIT =60 * 1000; //1 min
const LIMIT = 10; //10 req allowed in 1 min for each user

const fixedWindowLimiter = async(req,res,next) =>{
    const userId = req.headers["user_id"]
    const currentTime = Date.now()

    if(!userId){
        return res.status(400).json({success: false , message: "Missing User_id"})
    }

    const redisKey = `rate_limit:${userId}`;
    const result = await redisClient.hGetAll(redisKey);

    //if no existing req from user, create an instance for that user
    if(Object.keys(result).length === 0){
        await redisClient.hSet(redisKey ,{
            "createdAt" : Date.now(),
            "count" : 1
        });

        //set expiry for that window
        await redisClient.pExpire(redisKey, RATE_TIME_LIMIT);
        return next();
    }

    //cal time difference 
    const diff = currentTime - parseInt(result["createdAt"])

    if(diff> RATE_TIME_LIMIT){

        //reset window 
        await redisClient.hSet(redisKey ,{
            "createdAt" : Date.now(),
            "count" :1
        })
        await redisClient.pExpire(redisKey, RATE_TIME_LIMIT);
        return next()
    }

    if(parseInt(result["count"]) >= LIMIT){
        return res.status(429)
        .json({
            "success" : false,
            "timeStamp" : currentTime,
            "Message" : "User Limit reached"
        })
    }else{
        await redisClient.hSet(redisKey, {
            "count" : parseInt(result["count"]) +1
        })

        return next();
    }
}

export default fixedWindowLimiter;