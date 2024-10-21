
## Steps for Project Setup

This repository follows best coding practices and has a well-structured folder system. To set it up, follow the steps below:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aashish70/Daily-Expenses-Sharing-Application.git


2- **Navigate to the project directory:**
  ```bash
   cd Daily-Expenses-Sharing-Application

```

3- **Install the required packages:**
```bash
npm install

```
4- **Start the application:**
```bash
npm run dev

```
**Environment Variables**
You need to set up environment variables for the project to work correctly. Use the example.env file as a template.
Example .env File

```bash

PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.n8mzx.mongodb.net
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY=10d


```
# API EndPoint

http://localhost:8000/api/v1/

User Endpoints:
1. Create user. ---- POST http://localhost:8000/api/v1/user/register
2. Login user. ---- POST http://localhost:8000/api/v1/user/login
3. Logout user. ---- POST http://localhost:8000/api/v1/user/logout
4. Retrieve user details. ---- GET http://localhost:8000/api/v1/user/:userId     (Here userId is MongoDB ObjectID)
 
 
 Expense Endpoints:
1. Add expense.  ---- POST  http://localhost:8000/api/v1/expense/add-expense
2. Retrieve individual user expenses.  ---- GET   http://localhost:8000/api/v1/expense/user-expense
3. Retrieve overall expenses. ---- GET   http://localhost:8000/api/v1/expense/overall-expense
4. Download balance sheet. ----GET   http://localhost:8000/api/v1/download-balance-sheet
