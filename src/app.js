import  express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"


const app = express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json());

app.use(cookieParser());




//import routes
import userRoutes from "./routes/user.routes.js";
import expenseRoutes from "./routes/expense.routes.js";

//http://localhost:8000/api/v1/user/register
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/expense", expenseRoutes);


export { app };