# QR-Based Attendance Monitoring System

A comprehensive full-stack web application for automated student attendance monitoring using QR codes, built with React, Node.js, Express, and MySQL.

## 🚀 Features

### Faculty/Admin Features
- **Authentication**: Secure login with JWT tokens
- **Course Management**: Create and manage courses
- **QR Code Generation**: Generate time-limited QR codes (2-minute expiry)
- **Attendance Analytics**: View attendance statistics with charts
- **Reports**: Download attendance reports (CSV/PDF)
- **Dashboard**: Comprehensive analytics dashboard

### Student Features
- **Authentication**: Secure login system
- **QR Code Scanning**: Scan QR codes to mark attendance
- **Attendance Tracking**: View personal attendance percentage
- **Course Statistics**: Subject-wise attendance breakdown
- **Alerts**: Warnings when attendance falls below 75%
- **History**: Complete attendance history

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls
- **Zustand** for state management

### Backend
- **Node.js** with Express
- **MySQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Database Setup
1. Install MySQL and create a database:
```sql
CREATE DATABASE attendance_system;
```

2. Run the schema script:
```bash
mysql -u root -p attendance_system < server/schema.sql
```

### Backend Setup
1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp server/.env.example server/.env
# Edit .env with your database credentials
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup
1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Create .env file
VITE_API_URL=http://localhost:5000/api
```

3. Start the development server:
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance_system
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=5000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📊 Database Schema

### Tables
- **students**: Student information and credentials
- **faculty**: Faculty information and credentials
- **courses**: Course details linked to faculty
- **attendance_sessions**: QR code sessions with expiry
- **attendance_logs**: Individual attendance records

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Faculty Routes
- `POST /api/faculty/course` - Create course
- `GET /api/faculty/courses` - Get faculty courses
- `POST /api/faculty/session` - Start attendance session
- `GET /api/faculty/analytics/:courseId` - Get course analytics
- `GET /api/faculty/attendance/:courseId` - Get attendance logs

### Student Routes
- `POST /api/student/attendance` - Mark attendance via QR
- `GET /api/student/attendance` - Get student attendance history
- `GET /api/student/courses` - Get available courses

## 🎯 Usage Flow

### Faculty Workflow
1. Login to faculty dashboard
2. Create courses
3. Start attendance session (generates QR code)
4. Students scan QR code
5. View real-time attendance analytics
6. Download reports

### Student Workflow
1. Login to student dashboard
2. Scan QR code displayed by faculty
3. View attendance percentage per course
4. Monitor attendance history
5. Receive alerts for low attendance

## 🚀 Deployment

### Frontend (Vercel)
1. Build the project:
```bash
npm run build
```

2. Deploy to Vercel:
```bash
vercel --prod
```

### Backend (Render/Heroku)
1. Set environment variables in hosting platform
2. Deploy using Git integration
3. Ensure database is accessible

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention
- Input validation
- Role-based access control

## 📱 Responsive Design

- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interface
- Progressive Web App ready

## 🎨 UI/UX Features

- Modern glassmorphism design
- Smooth animations and transitions
- Interactive charts and visualizations
- Intuitive navigation
- Real-time updates
- Toast notifications

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For support, email support@attendance-system.com or create an issue on GitHub.