const UserModel = require("../Models/User");

const addExpenses = async (req, res) => {
    try {
        const { text, amount, category } = req.body;
        const { _id } = req.user;

        if (!text || amount === undefined) {
            return res.status(400).json({
                message: "Please provide both description and amount",
                success: false
            });
        }

        // Convert amount to number if it's a string
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

        // Determine if it's income or expense based on amount
        const type = numAmount >= 0 ? 'income' : 'expense';

        // Use provided category or default based on type
        const transactionCategory = category || (type === 'income' ? 'Other Income' : 'Other Expense');

        const user = await UserModel.findById(_id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        user.expenses.push({
            text,
            amount: numAmount,
            type,
            category: transactionCategory
        });

        await user.save();

        res.status(201).json({
            message: "Transaction added successfully",
            success: true,
            expense: user.expenses[user.expenses.length - 1]
        });
    } catch (err) {
        console.error("Error in addExpenses:", err);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: err.message
        });
    }
}

const fetchExpenses = async (req, res) => {
    try {
        const { _id } = req.user;
        const user = await UserModel.findById(_id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Calculate total income, expense and balance
        let income = 0;
        let expense = 0;

        user.expenses.forEach(item => {
            if (item.amount >= 0) {
                income += item.amount;
            } else {
                expense += Math.abs(item.amount);
            }
        });

        const balance = income - expense;

        res.status(200).json({
            success: true,
            expenses: user.expenses,
            balance,
            income,
            expense
        });
    } catch (err) {
        console.error("Error in fetchExpenses:", err);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: err.message
        });
    }
}

const deleteExpenses = async (req, res) => {
    try {
        const { expenseId } = req.params;
        const { _id } = req.user;

        const user = await UserModel.findById(_id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Find the expense index
        const expenseIndex = user.expenses.findIndex(
            expense => expense._id.toString() === expenseId
        );

        if (expenseIndex === -1) {
            return res.status(404).json({
                message: "Transaction not found",
                success: false
            });
        }

        // Remove the expense
        user.expenses.splice(expenseIndex, 1);
        await user.save();

        res.status(200).json({
            message: "Transaction deleted successfully",
            success: true
        });
    } catch (err) {
        console.error("Error in deleteExpenses:", err);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: err.message
        });
    }
}

module.exports = {
    addExpenses,
    fetchExpenses,
    deleteExpenses
}