# Setup Guide for Law Firm Management

This document provides the complete setup instructions for the Law Firm Management application.

## Prerequisites
- Ensure you have the following installed:
  - [Node.js](https://nodejs.org/) (version X.X.X)
  - [MongoDB](https://www.mongodb.com/) (version X.X.X)
  - [npm](https://www.npmjs.com/) (version X.X.X)
  
## Clone the Repository
1. Open your terminal or command prompt.
2. Clone the repository:
   ```bash
   git clone https://github.com/ossamaamr/law-firm-management.git
   ```
3. Change into the project directory:
   ```bash
   cd law-firm-management
   ```

## Install Dependencies
Run the following command to install the required dependencies:
```bash
npm install
```

## Configure Environment Variables
1. Create a `.env` file in the root of the project.
2. Add the following configuration (modify as required):
   ```text
   PORT=3000
   DB_URI=mongodb://localhost:27017/law_firm_db
   SECRET_KEY=your_secret_key
   ```

## Start the Application
To start the application, run:
```bash
npm start
```

## Access the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

## Running Tests
To run the tests, use:
```bash
npm test
```

## Contributing
If you'd like to contribute, please fork the repository and submit a pull request with your changes.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.