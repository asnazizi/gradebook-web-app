# Gradebook Web Application

A secure web application for accessing student gradebooks with email-based authentication and session management.

## Features

- **Email Authentication**: Passwordless login using HKU email addresses (@cs.hku.hk or @connect.hku.hk)
- **One-Time Tokens**: Secure authentication with time-limited tokens (60 seconds)
- **Session Management**: Secure session handling with 5-minute timeout
- **Course Management**: View enrolled courses and access gradebooks
- **Score Tracking**: View individual assignment scores and total scores

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Template Engine**: Pug
- **Email Service**: Nodemailer
- **Authentication**: Custom token-based system with crypto
- **Session Management**: Express-session

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Access to HKU email server (testmail.cs.hku.hk)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gradebook-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration.

4. Start MongoDB service on your system

5. Run the application:
   ```bash
   npm start
   ```

The server will start on `http://localhost:8080` (or the port specified in your environment).

## Environment Variables

- `PORT`: Server port (default: 8080)
- `MONGODB_URI`: MongoDB connection string (default: mongodb://mongodb/Gradebook)
- `SESSION_SECRET`: Secret key for session management
- `EMAIL_HOST`: SMTP server host (default: testmail.cs.hku.hk)
- `EMAIL_PORT`: SMTP server port (default: 25)

## Database Schema

### Users Collection
```javascript
{
  email: String,        // HKU email address
  secret: String,       // Temporary authentication secret
  timestamp: String,    // Token creation timestamp
  uid: String          // Unique user identifier
}
```

### CourseInfo Collection
```javascript
{
  uid: Number,         // User identifier
  course: String,      // Course code
  assign: String,      // Assignment name
  score: String        // Assignment score
}
```

## API Endpoints

- `GET /login` - Login page and token verification
- `POST /login` - Initiate email authentication
- `GET /courseinfo/mylist` - View enrolled courses (requires authentication)
- `GET /courseinfo/getscore` - View course gradebook (requires authentication)

## Security Features

- Token expiration (60 seconds for authentication)
- Session timeout (5 minutes)
- Email domain validation (HKU domains only)
- Secure session configuration
- Input validation and error handling

## Project Structure

```
├── index.js              # Main application file
├── package.json          # Dependencies and scripts
├── static/
│   └── styles.css        # CSS styles
├── views/
│   ├── login.pug         # Login page template
│   ├── mylist.pug        # Course list template
│   └── getscore.pug      # Gradebook template
└── README.md             # Project documentation
```

## Usage

1. Visit `http://localhost:8080/login`
2. Enter your HKU email address (@cs.hku.hk or @connect.hku.hk)
3. Check your email for the authentication link
4. Click the link to access your gradebooks
5. View your enrolled courses and scores

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Author

Created as part of COMP3322 coursework.
