# 🐛 Leave Management System - Bug Analysis Report

## Critical Bugs Found

### 🔴 **AUTHENTICATION BUGS**

#### 1. **Missing Input Validation in Login** ⚠️ CRITICAL
**File:** `backend/src/routes/auth.ts`
**Severity:** CRITICAL
**Issue:** No input validation for email and password fields
```typescript
// Current code (BUGGY)
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;  // ❌ NO VALIDATION
  
  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
```

**Problem:**
- Empty/null email and password are not validated
- Attacker can send `{"email": null, "password": null}` and bypass checks
- No regex validation for email format
- SQL injection possible through invalid input

**Impact:** Security vulnerability, potential code crashes

---

#### 2. **JWT_SECRET Hardcoded & Fallback Issue** ⚠️ CRITICAL
**File:** `backend/src/routes/auth.ts` & `backend/src/middlewares/authMiddleware.ts`
**Severity:** CRITICAL
**Issue:** JWT_SECRET duplicated and has weak fallback in two files
```typescript
// auth.ts (Line 14)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// authMiddleware.ts (Line 3)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
```

**Problems:**
1. Same secret defined in multiple places → harder to maintain
2. Weak fallback secret `'fallback-secret-for-dev'` is hardcoded
3. If `.env` is misconfigured, falls back to predictable default
4. In production, fallback should NOT exist

**Impact:** Tokens can potentially be forged if env var is missing

---

#### 3. **No Token Expiration Check on Frontend** ⚠️ HIGH
**File:** `frontend/src/context/AuthContext.tsx`
**Severity:** HIGH
**Issue:** Token expiration is not verified before using it
```typescript
// Current code (BUGGY)
useEffect(() => {
  const savedUser = localStorage.getItem('lms_user');
  const savedToken = localStorage.getItem('lms_token');
  if (savedUser && savedToken) {
    setUser(JSON.parse(savedUser));      // ❌ No expiry check
    setToken(savedToken);                // ❌ Uses expired token
  }
}, []);
```

**Problem:**
- Expired tokens are silently used
- User sees authenticated UI but API calls fail with 401
- No validation that token is still valid

**Impact:** Stale auth state, confusing user experience

---

#### 4. **Weak Error Handling - Information Disclosure** ⚠️ HIGH
**File:** `backend/src/routes/auth.ts` (Line 44)
**Severity:** HIGH
**Issue:** Returning raw error messages to client
```typescript
catch (error) {
  res.status(500).json({ message: 'Login error', error: String(error) });  // ❌ Exposes stack trace
}
```

**Problem:**
- Stack traces and internal errors are exposed to client
- Attackers can see database errors, file paths, etc.

**Impact:** Information disclosure vulnerability

---

#### 5. **No CSRF Attack Protection** ⚠️ MEDIUM
**File:** `backend/src/index.ts`
**Severity:** MEDIUM
**Issue:** No CSRF middleware or token validation
```typescript
app.use(cors());  // ❌ Wide open CORS without credentials handling
app.use(express.json());  // ❌ No rate limiting
```

**Problem:**
- No CSRF tokens
- GET requests could modify state if someone clicks malicious links
- No Origin validation

---

### 🟠 **DATA VALIDATION BUGS**

#### 6. **No Validation in Create Leave Request** ⚠️ HIGH
**File:** `backend/src/controllers/LeaveController.ts` (Line 13)
**Severity:** HIGH
**Issue:** No data validation before creating leave request
```typescript
export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
  const { type, startDate, endDate, reason } = req.body;  // ❌ NO VALIDATION
  
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      type,
      startDate: new Date(startDate),  // ❌ Invalid date crashes here
      endDate: new Date(endDate),
      reason,
      userId,
      status: LeaveStatus.SUBMITTED,
    },
  });
```

**Problems:**
1. No validation that startDate < endDate
2. No validation for past dates
3. Invalid date strings cause crashes (not caught)
4. Empty reason not validated
5. No check for leave balance before approving
6. Leave type not validated against enum

**Impact:** Invalid data in database, server crashes

---

#### 7. **Date Parsing Can Fail Silently** ⚠️ MEDIUM
**File:** `backend/src/controllers/AssignmentController.ts` (Line 50)
**Severity:** MEDIUM
**Issue:** `new Date(dueDate)` can create Invalid Date objects
```typescript
const assignment = await prisma.assignment.create({
  data: {
    title,
    description,
    dueDate: new Date(dueDate),  // ❌ "invalid-date" -> Invalid Date object
    creatorId,
  },
});
```

**Problem:**
- Invalid date strings aren't caught
- `new Date("abc")` returns `Invalid Date` object
- Prisma might store `null` or throw error later

**Impact:** Invalid data in database

---

#### 8. **No Input Sanitization** ⚠️ MEDIUM
**File:** All controllers
**Severity:** MEDIUM
**Issue:** No sanitization of text inputs
```typescript
const { type, startDate, endDate, reason } = req.body;
// reason could be: "<script>alert('xss')</script>"
```

**Problem:**
- If data is displayed without escaping, XSS is possible
- HTML tags/scripts could be stored and executed

---

### 🟡 **LOGIC BUGS**

#### 9. **Leave Status Update Doesn't Check Authorization** ⚠️ HIGH
**File:** `backend/src/routes/leaveRoutes.ts`
**Severity:** HIGH
**Issue:** Anyone with staff role can approve any leave

```typescript
router.put('/:id/status', authorize(['STAFF', 'HOD', 'PRINCIPAL']), updateLeaveStatus);
```

**Problem:**
- No check if staff member is responsible for that student
- Staff can approve leaves they shouldn't have access to
- No audit trail of who approved what

**Impact:** Unauthorized leave approvals

---

#### 10. **getAllLeaveRequests Returns Other User's Data** ⚠️ HIGH
**File:** `backend/src/controllers/LeaveController.ts` (Line 123)
**Severity:** HIGH
**Issue:** Staff can see all leave requests except their own
```typescript
const leaves = await prisma.leaveRequest.findMany({
  where: {
    userId: { not: userId },  // ❌ Shows everyone except requester!
  },
  include: { user: { select: { name: true, email: true, role: true } } },
  orderBy: { createdAt: 'desc' },
});
```

**Problem:**
- A staff member can see ALL other students' leave requests
- No department-level filtering
- Staff from CSE dept can see ECE dept student requests
- Violates privacy

**Impact:** Data Privacy Violation (GDPR)

---

#### 11. **Assignment Submission Doesn't Validate Assignment Ownership** ⚠️ MEDIUM
**File:** `backend/src/controllers/AssignmentController.ts` (Line 70)
**Severity:** MEDIUM
**Issue:** No check if student can submit this assignment
```typescript
const submission = await prisma.assignmentSubmission.upsert({
  where: {
    assignmentId_studentId: {
      assignmentId: parseInt(assignmentId),  // ❌ No check if student is assigned
      studentId: studentId
    }
  },
```

**Problem:**
- Student can submit to any assignment ID
- No verification that assignment was distributed to this student
- Anyone can assign any studentId

**Impact:** Data integrity issue

---

#### 12. **Attendance Mark Calculation Always Uses Fixed Days** ⚠️ MEDIUM
**File:** `backend/src/controllers/LeaveController.ts` (Line 60)
**Severity:** MEDIUM
**Issue:** Hardcoded working days (120) doesn't account for semesters/terms
```typescript
const totalWorkingDays = 120; // ❌ Hardcoded, not dynamic
const approvedLeaveDays = casualUsed + sickUsed + specialUsed;  // ❌ Counts total leaves, not days!
```

**Problem:**
1. Different semesters have different working days
2. `casualUsed` is COUNT of requests, not actual days
3. A 5-day leave counts as 1 in the count
4. Attendance calculation is mathematically wrong

**Example:**
- 1 casual leave of 5 days approved = `casualUsed = 1` (should be 5 days)
- Attendance calculation: `daysPresent = 120 - 1 = 119 days` ❌ WRONG!

---

#### 13. **Role Middleware Not Used Consistently** ⚠️ MEDIUM
**File:** `backend/src/routes/leaveRoutes.ts`
**Severity:** MEDIUM
**Issue:** Some endpoints missing authorization
```typescript
router.post('/', createLeaveRequest);  // ❌ No role check - PRINCIPAL can also create leaves!
router.get('/history', getMyLeaveHistory);  // ❌ Not restricted
```

**Problem:**
- Principal/HOD/Staff can create leave requests like students
- Should be restricted to STUDENT role
- No role-based endpoint segregation

---

### 🟢 **FRONTEND BUGS**

#### 14. **Token Interceptor Doesn't Handle 401 Globally** ⚠️ MEDIUM
**File:** `frontend/src/services/api.ts` (Line 28)
**Severity:** MEDIUM
**Issue:** Hard redirect on 401 - no graceful degradation
```typescript
if (error.response?.status === 401) {
  localStorage.removeItem('lms_token');
  localStorage.removeItem('lms_user');
  window.location.href = '/login';  // ❌ Hard redirect, no warning
}
```

**Problem:**
- User loses their current work without warning
- No toast notification before redirect
- No chance to save intermediate state

---

#### 15. **No Data Validation in Profile Update** ⚠️ MEDIUM
**File:** `frontend/src/pages/ProfilePage.tsx`
**Severity:** MEDIUM
**Issue:** No client-side validation before sending
```typescript
const handleSave = async () => {
  try {
    const response = await api.put('/auth/me', editForm);  // ❌ No validation
```

**Problem:**
- Empty/invalid phone numbers accepted
- No email format validation
- Invalid characters in batch/rollNumber

---

#### 16. **Leave History Search/Filter Not Implemented** ⚠️ LOW
**File:** `frontend/src/pages/LeaveHistoryPage.tsx` (Line 59)
**Severity:** LOW
**Issue:** Filter and search UI exists but doesn't work
```typescript
<input 
  type="text" 
  placeholder="Search by ID, type or status..."
  className="..."
  // ❌ No onChange handler, input is not functional
/>
```

---

#### 17. **Missing null Checks in Display** ⚠️ LOW
**File:** `frontend/src/pages/ApproveLeavesPage.tsx` (Line 65)
**Severity:** LOW
**Issue:** Can crash if user data is missing
```typescript
<h4 className="font-bold text-gray-900">{req.user.name}</h4>  // ❌ Could be undefined
```

---

### 🟣 **ENVIRONMENT & CONFIGURATION BUGS**

#### 18. **Missing .env File in Frontend** ⚠️ MEDIUM
**File:** `frontend/` (root)
**Severity:** MEDIUM
**Issue:** No `.env` file defined for frontend
```typescript
// frontend/src/services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',  // ❌ Fallback to localhost
});
```

**Problem:**
- Production deployment will use localhost
- No way to configure API URL for different environments
- Frontend doesn't know actual backend URL in production

---

#### 19. **Prisma Not Handling Connection Errors** ⚠️ HIGH
**File:** `backend/` (general)
**Severity:** HIGH
**Issue:** Multiple Prisma instances created per request
```typescript
// In multiple controller files
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
});
```

**Problem:**
1. Creating new connection per request (memory leak)
2. Should be singleton pattern
3. Only one instance should exist per app
4. Multiple instances = connection pool exhaustion

**Impact:** Application crashes under load

---

#### 20. **No Error Boundary in Frontend** ⚠️ LOW
**File:** `frontend/src/`
**Severity:** LOW
**Issue:** No error boundary component
**Problem:**
- Unhandled errors crash entire app
- User sees blank screen

---

## Summary Table

| # | Bug | Severity | Type | Status |
|---|-----|----------|------|--------|
| 1 | No input validation in login | 🔴 CRITICAL | Security | ❌ NOT FIXED |
| 2 | JWT_SECRET hardcoded & fallback | 🔴 CRITICAL | Security | ❌ NOT FIXED |
| 3 | No token expiration check | 🟠 HIGH | Auth | ❌ NOT FIXED |
| 4 | Error info disclosure | 🟠 HIGH | Security | ❌ NOT FIXED |
| 5 | No CSRF protection | 🟠 MEDIUM | Security | ❌ NOT FIXED |
| 6 | No validation in leave creation | 🟠 HIGH | Data | ❌ NOT FIXED |
| 7 | Date parsing fails silently | 🟡 MEDIUM | Data | ❌ NOT FIXED |
| 8 | No input sanitization | 🟡 MEDIUM | Security | ❌ NOT FIXED |
| 9 | Leave approval unauthorized | 🟠 HIGH | Logic | ❌ NOT FIXED |
| 10 | Privacy: getAllLeaveRequests | 🟠 HIGH | Logic | ❌ NOT FIXED |
| 11 | Assignment submission validation | 🟡 MEDIUM | Logic | ❌ NOT FIXED |
| 12 | Attendance calculation wrong | 🟡 MEDIUM | Logic | ❌ NOT FIXED |
| 13 | Role checks inconsistent | 🟡 MEDIUM | Logic | ❌ NOT FIXED |
| 14 | 401 hard redirect | 🟡 MEDIUM | UX | ❌ NOT FIXED |
| 15 | No profile validation | 🟡 MEDIUM | Data | ❌ NOT FIXED |
| 16 | Search/filter not working | 🟢 LOW | UX | ❌ NOT FIXED |
| 17 | Missing null checks | 🟢 LOW | Crash | ❌ NOT FIXED |
| 18 | Frontend .env missing | 🟡 MEDIUM | Deploy | ❌ NOT FIXED |
| 19 | Prisma connection leak | 🟠 HIGH | Infra | ❌ NOT FIXED |
| 20 | No error boundary | 🟢 LOW | UX | ❌ NOT FIXED |

---

## Most Critical Issues (Fix These First)

1. **Input Validation** - Breaks app and allows attacks
2. **Prisma Connection** - Causes crashes under load
3. **JWT Secret** - Security vulnerability
4. **Leave Approval Auth** - Unauthorized access
5. **Privacy Leak** - GDPR violation
6. **Date Parsing** - Corrupts data
7. **Error Handling** - Exposes secrets

