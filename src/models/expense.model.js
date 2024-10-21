import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
    {
        description:{
            type: String,
            required: true
        },

        amount:{
            type: Number,
            required: true
        },

        splitMethod:{
            type: String,
            enum: ['equal', 'exact', 'percentage'],
            required: true
        },

        participants: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                amount: {
                    type: Number,
                },

                percentage: {
                    type: Number,
                }
            },
        ],

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

export const Expense = mongoose.model('Expense', expenseSchema);