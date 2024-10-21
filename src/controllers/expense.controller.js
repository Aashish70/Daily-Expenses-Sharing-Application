import { Expense } from '../models/expense.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Add an expense
const addExpense = asyncHandler(async (req, res) => {
    const { description, amount, splitMethod, participants } = req.body;
    const createdBy = req.user._id;

    if (!description || !amount || !splitMethod || !participants || participants.length === 0) {
        throw new ApiError(400, 'All fields are required');
    }

    // Check for valid splitMethod
    if (!['equal', 'exact', 'percentage'].includes(splitMethod)) {
        throw new ApiError(400, 'Invalid split method');
    }

    let updatedParticipants;

    // Handle different split methods
    if (splitMethod === 'equal') {
        const equalAmount = amount / participants.length;
        updatedParticipants = participants.map(participant => ({
            user: participant.user,
            amount: equalAmount,
        }));
    } else if (splitMethod === 'exact') {
        let totalExactAmount = participants.reduce((acc, participant) => acc + (participant.amount || 0), 0);
        if (totalExactAmount !== amount) {
            throw new ApiError(400, 'The total of exact amounts must equal the total amount');
        }
        updatedParticipants = participants.map(participant => ({
            user: participant.user,
            amount: participant.amount, // Exact amounts are provided by the user
        }));
    } else if (splitMethod === 'percentage') {
        let totalPercentage = participants.reduce((acc, participant) => acc + (participant.percentage || 0), 0);
        if (totalPercentage !== 100) {
            throw new ApiError(400, 'The percentages must add up to 100');
        }
        updatedParticipants = participants.map(participant => ({
            user: participant.user,
            amount: (participant.percentage / 100) * amount, // Calculate amount based on percentage
        }));
    }

    // Create the expense
    const expense = await Expense.create({
        description,
        amount,
        splitMethod,
        participants: updatedParticipants,
        createdBy,
    });

    return res.status(201).json(new ApiResponse(201, expense, 'Expense added successfully'));
});


// Get user expenses (expenses the user created or is a participant in)
const getUserExpenses = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user._id; // Replace with actual req.user._id if dynamic

    try {
        // Fetch expenses where the user is a participant or the creator
        const userExpenses = await Expense.find({
            $or: [
                { 'participants.user': loggedInUserId }, 
                { createdBy: loggedInUserId }
            ]
        })
        .populate('createdBy', 'name email')
        .populate('participants.user', 'name email');

        // Respond with the retrieved data
        res.status(200).json({
            statusCode: 200,
            data: userExpenses,
            message: "Overall expenses retrieved successfully",
            success: true
        });

    } catch (error) {
        // Handle errors
        res.status(500).json({
            statusCode: 500,
            message: "An error occurred while fetching expenses",
            success: false
        });
    }
});


// Get overall expenses (get all expenses in the system or for a group of users)
const getOverallExpenses = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({})
        .populate('createdBy', 'name email')
        .populate('participants.user', 'name email');

    return res.status(200).json(new ApiResponse(200, expenses, 'Overall expenses retrieved successfully'));
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Download balance sheet in PDF format
const downloadBalanceSheet = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find all expenses for the user (both created and participated in)
    const userExpenses = await Expense.find({
        $or: [
            { 'participants.user': userId },
            { createdBy: userId }
        ]
    }).populate('createdBy', 'name email').populate('participants.user', 'name email');

    // Calculate the balance for each participant in the expenses
    let balance = {};
    userExpenses.forEach((expense) => {
        expense.participants.forEach((participant) => {
            if (!balance[participant.user._id]) {
                balance[participant.user._id] = 0;
            }

            if (expense.createdBy.toString() === userId.toString()) {
                balance[participant.user._id] -= participant.amount || (expense.amount / expense.participants.length);
            } else if (participant.user._id.toString() === userId.toString()) {
                balance[expense.createdBy] += participant.amount || (expense.amount / expense.participants.length);
            }
        });
    });

    // Create PDF document for balance sheet
    const doc = new PDFDocument();
    
    const filePath = path.join(__dirname, 'balance-sheet.pdf');

    // Pipe the document to a file
    doc.pipe(fs.createWriteStream(filePath));

    // Add content to the PDF
    doc.fontSize(18).text('Balance Sheet', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`User: ${req.user.name}`);
    doc.moveDown();

    doc.fontSize(14).text('Balances:', { underline: true });
    Object.keys(balance).forEach(userId => {
        doc.fontSize(12).text(`User ID: ${userId} - Balance: ${balance[userId]}`);
    });

    doc.end(); // Finish the PDF

    // Send PDF for download
    res.download(filePath, 'balance-sheet.pdf', (err) => {
        if (err) {
            throw new ApiError(500, 'Error downloading balance sheet', err);
        }
        fs.unlinkSync(filePath); // Remove the file after download
    });
});

export {
    addExpense,
    getUserExpenses,
    getOverallExpenses,
    downloadBalanceSheet
};
