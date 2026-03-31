- 📥 Export Event Data (CSV)
- ⚡ Dynamic Frontend using Fetch API

---

## 🛠️ Technology Stack

**Frontend**
- HTML5  
- CSS3  
- JavaScript (ES6)

**Backend**
- Core PHP  

**Database**
- SQLite  

---

## 📁 Project Structure


CampusHub/
├── backend/
│ ├── api/
│ │ ├── admin/
│ │ ├── auth/
│ │ └── events/
│ └── config.php
├── database/
│ ├── campushub.sqlite
│ └── schema.sql
└── frontend/
├── css/
├── js/
└── *.html


---

## ⚙️ Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/gauravkumar1710/CampusHub-College-Event-System.git
cd campushub
2. Setup Server
Install XAMPP (or any PHP server)
Move project folder to:
htdocs/
Start Apache server
3. Database Setup
Ensure SQLite is enabled in PHP
Import or run schema.sql if required
4. Run the Application

Open your browser and go to:

http://localhost/campushub/frontend/index.html
👤 User Roles
Role	Description
Student	Browse and register for events
Organizer	Create and manage events
Admin	View system statistics
📡 API Endpoints
Endpoint	Method	Description
/auth/login.php	POST	User login
/auth/register.php	POST	User registration
/events/list.php	GET	Fetch all events
/events/create.php	POST	Create new event
/events/register_event.php	POST	Register for event
