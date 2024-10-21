import { Router } from 'express';
import { addExpense, getUserExpenses, getOverallExpenses, downloadBalanceSheet } from '../controllers/expense.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router();

router.route("/add-expense").post(verifyJWT, addExpense);
router.route("/user-expense").get(verifyJWT, getUserExpenses);
router.route("/overall-expense").get(verifyJWT, getOverallExpenses);
router.route("/download-balance-sheet").get(verifyJWT, downloadBalanceSheet);

export default router;