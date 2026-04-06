⸻

🏫 COMPLETE SYSTEM WORKFLOW (End-to-End)

⸻

🔐 1. SYSTEM INITIALIZATION (Setup Phase)

👑 Principal Bootstrapping
	•	System starts with a default Principal account (seeded manually or via DB script)
	•	Principal logs in using institutional email

⸻

👥 2. USER ONBOARDING WORKFLOW

🧑‍💼 Step 1: User Creation

Who can create?
	•	Principal → HOD, Staff
	•	HOD → Staff (within department)

Flow:

Admin → Create User → Assign Role → Assign Department

Backend Actions:
	•	Validate email domain (@college.edu)
	•	Generate invite token
	•	Send email invite (NodeMailer)

⸻

📩 Step 2: Account Activation

User clicks invite link → Sets password → Account activated

System:
	•	Token verification
	•	Password hashing (bcrypt)
	•	Status → ACTIVE

⸻

🔑 Step 3: Login

User logs in → JWT issued → Role stored in token

Middleware:
	•	Auth check (JWT)
	•	Role-based access enforced

⸻

🧭 3. ROLE-BASED SYSTEM ENTRY (Dashboard Routing)

After login:

Role	Redirected To
Principal	Global Dashboard
HOD	Department Dashboard
Staff	Faculty Dashboard
Student	Student Dashboard


⸻

🎓 4. STUDENT WORKFLOW

⸻

📝 Apply Leave

Student → Fill Leave Form → Submit

Input:
	•	Leave type
	•	Dates
	•	Reason
	•	Supporting document (optional)

⸻

Backend Flow:
	1.	Validate:
	•	Leave balance
	•	Date conflicts
	2.	Store request → status = SUBMITTED
	3.	Assign approver → mapped Staff

⸻

🔄 Approval Flow (Student Leave)

Student → Staff → (optional) HOD


⸻

📊 Student Tracking
	•	View leave history
	•	View status:
	•	Pending
	•	Approved
	•	Rejected
	•	View remaining leave balance

⸻

📚 Assignment Workflow

Staff assigns → Student submits → Staff evaluates


⸻

👨‍🏫 5. STAFF WORKFLOW

⸻

👥 Manage Students
	•	View assigned students
	•	View student leave requests

⸻

✅ Approve / Reject Leave

Staff → Review Leave → Approve / Reject

Actions:
	•	Add remarks
	•	Forward to HOD (if needed)

⸻

Backend:
	•	Update leave status
	•	Update leave balance (if approved)
	•	Trigger notification

⸻

📚 Assignment System

Flow:

Create Assignment → Assign to Students → Evaluate


⸻

🧑‍🏫 6. HOD WORKFLOW

⸻

👥 Department Oversight
	•	View all staff & students
	•	Monitor leave trends

⸻

✅ Staff Leave Approval

Staff applies → HOD approves


⸻

🔁 Escalation Handling
	•	If staff delays student leave approval
	•	If special cases arise

⸻

👨‍💼 Staff Management
	•	Add/remove staff
	•	Assign subjects/classes

⸻

👑 7. PRINCIPAL WORKFLOW

⸻

🌍 Global Dashboard
	•	Total users
	•	Leave statistics
	•	Department analytics

⸻

👥 Role Management

Principal → Appoint HOD → Assign departments


⸻

⚖️ Override System
	•	Override any leave decision
	•	Handle disputes

⸻

📊 Reports
	•	Export reports (CSV/PDF)
	•	Monthly analytics

⸻

🔄 8. LEAVE ENGINE (CORE LOGIC)

⸻

📌 Leave Lifecycle

DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED → CLOSED


⸻

⚙️ Smart Processing

✅ Validation:
	•	Leave balance check
	•	Overlapping leave detection

⏱️ Auto Escalation:
	•	If pending > X days → escalate to HOD/Principal

🔁 Auto Approval (optional):
	•	For low-risk leaves

⸻

🔔 9. NOTIFICATION WORKFLOW

⸻

Events Triggering Notifications:
	•	Leave submitted
	•	Leave approved/rejected
	•	Assignment assigned
	•	Deadline reminders

⸻

Channels:
	•	Email (institutional only)
	•	In-app notifications
	•	(Optional) WebSocket real-time alerts

⸻

🗄️ 10. DATA FLOW (SYSTEM LEVEL)

⸻

Example: Student Applies Leave

Frontend (React)
   ↓
API Call (Express)
   ↓
Controller → Service Layer
   ↓
Validation + Business Logic
   ↓
MySQL (store leave)
   ↓
Notification სამსახ
   ↓
Response → UI update


⸻

🛡️ 11. SECURITY FLOW

⸻

At Every Request:

Request → JWT Middleware → Role Middleware → Controller


⸻

Protections:
	•	Email domain restriction
	•	Role-based access
	•	Input validation
	•	SQL injection prevention

⸻

📊 12. ANALYTICS WORKFLOW

⸻

Data Aggregation:
	•	Leaves per department
	•	Approval rates
	•	Student absentee trends

⸻

Used For:
	•	Admin insights
	•	Future AI features

⸻

🚀 13. EDGE CASE HANDLING

⸻

Important Scenarios:

❌ Invalid Email

→ Reject registration

❌ Leave Overlap

→ Block submission

⏱️ No Response

→ Auto escalate

🔁 Role Change

→ Update permissions dynamically

⸻

🧠 FINAL SYSTEM FLOW (BIG PICTURE)

User Created
   ↓
Account Activated
   ↓
Login (JWT)
   ↓
Role-Based Dashboard
   ↓
Actions (Leave / Assignment)
   ↓
Approval Workflow
   ↓
Notifications
   ↓
Analytics & Reports


⸻
