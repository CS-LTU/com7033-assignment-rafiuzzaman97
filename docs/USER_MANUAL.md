# StrokeCare Portal - User Manual

**Version:** 1.0.0  
**Last Updated:** December 5, 2025  
**Application:** StrokeCare Healthcare Management System

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [User Roles](#3-user-roles)
4. [Patient Guide](#4-patient-guide)
5. [Doctor Guide](#5-doctor-guide)
6. [Administrator Guide](#6-administrator-guide)
7. [Common Features](#7-common-features)
8. [Troubleshooting](#8-troubleshooting)
9. [FAQ](#9-faq)
10. [Support](#10-support)

---

## 1. Introduction

### 1.1 About StrokeCare Portal

StrokeCare Portal is a comprehensive healthcare management system designed to help patients and healthcare providers manage stroke risk assessment and patient care coordination. The system provides:

- **Secure Patient Registration** - Self-service patient onboarding
- **Risk Assessment** - Automated stroke risk calculation
- **Appointment Management** - Book and manage doctor appointments
- **Health Monitoring** - Track medical history and health metrics
- **Role-Based Access** - Separate interfaces for patients, doctors, and administrators

### 1.2 System Requirements

**For Users (Patients/Doctors/Admins):**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Screen resolution: 1024x768 or higher
- JavaScript enabled

**Supported Browsers:**
- Google Chrome (version 90+)
- Mozilla Firefox (version 88+)
- Safari (version 14+)
- Microsoft Edge (version 90+)

### 1.3 Security & Privacy

StrokeCare Portal implements industry-standard security measures:
- ✅ Encrypted password storage (bcrypt hashing)
- ✅ Secure JWT token authentication
- ✅ Role-based access control
- ✅ Comprehensive security logging
- ✅ Input validation and sanitization
- ✅ Secure session management

**Privacy Notice:** All patient data is handled in compliance with healthcare data protection standards.

---

## 2. Getting Started

### 2.1 Accessing the System

1. Open your web browser
2. Navigate to: `http://localhost:5173` (or your deployment URL)
3. You will see the login page

### 2.2 First Time Users (Patients)

If you're a new patient:

1. Click **"Register as Patient"** button on the login page
2. Complete the registration form (see Section 4.2)
3. After successful registration, you'll be logged in automatically
4. Complete your health profile

### 2.3 Existing Users

If you already have an account:

1. Enter your **username**
2. Enter your **password**
3. Click **"Sign In"**
4. You'll be redirected to your dashboard based on your role

### 2.4 Forgot Password

If you forgot your password:

1. Click **"Forgot Password?"** link on login page
2. Enter your registered email address
3. Click **"Send Reset Link"**
4. Check your email for password reset instructions
5. Follow the link and create a new password

---

## 3. User Roles

### 3.1 Patient Role

**Access Level:** Limited (Own data only)

**Capabilities:**
- View personal health dashboard
- Manage personal profile
- Book appointments with doctors
- View medical history
- Download health reports (PDF)
- Update contact information

**Cannot:**
- View other patients' data
- Access administrative functions
- Modify risk calculations

### 3.2 Doctor Role

**Access Level:** Medium (Assigned patients)

**Capabilities:**
- View assigned patients list
- Access patient medical records
- Update patient health information
- View risk assessments
- Manage appointments
- Generate patient reports
- View analytics dashboard

**Cannot:**
- Delete patient records
- Access administrative functions
- View security logs
- Manage user accounts

### 3.3 Administrator Role

**Access Level:** Full (All system functions)

**Capabilities:**
- All doctor capabilities
- User management (create/deactivate users)
- System statistics monitoring
- Security log access
- Patient deletion (if required)
- System configuration
- View all appointments

---

## 4. Patient Guide

### 4.1 Patient Dashboard Overview

After logging in, you'll see your personal dashboard with:

**Health Summary Card:**
- Current stroke risk level (Low/Medium/High)
- Risk percentage
- Color-coded indicator (Green/Yellow/Red)

**Quick Stats:**
- Total appointments booked
- Upcoming appointments
- Last health update date

**Recent Appointments:**
- List of your scheduled appointments
- Status indicators (Scheduled/Completed/Cancelled)

**Action Buttons:**
- Book New Appointment
- Update Profile
- Download Health Report

### 4.2 Patient Registration (New Users)

**Step 1: Personal Information**

1. **Username** (required)
   - 3-30 characters
   - Letters, numbers, underscores only
   - Must be unique
   - Example: `john_smith123`

2. **Email Address** (required)
   - Valid email format
   - Will be used for password reset
   - Example: `john.smith@email.com`

3. **Password** (required)
   - Minimum 8 characters
   - Must include uppercase, lowercase, number
   - Example: `SecurePass123`

4. **First Name** (required)
   - Your given name
   - Example: `John`

5. **Last Name** (required)
   - Your family name
   - Example: `Smith`

6. **Phone Number** (optional)
   - Include country code
   - Example: `+1 555-0123`

**Step 2: Health Information**

1. **Gender** (required)
   - Select: Male / Female / Other

2. **Age** (required)
   - Your current age in years
   - Must be 18-120

3. **Hypertension** (required)
   - Select: Yes / No
   - High blood pressure diagnosis

4. **Heart Disease** (required)
   - Select: Yes / No
   - Any heart condition diagnosis

5. **Ever Married** (required)
   - Select: Yes / No
   - Marital status

6. **Work Type** (required)
   - Select from: Private, Self-employed, Government, Children, Never worked

7. **Residence Type** (required)
   - Select: Urban / Rural

8. **Average Glucose Level** (required)
   - Enter in mg/dL
   - Normal range: 70-140 mg/dL
   - Example: `95.5`

9. **BMI (Body Mass Index)** (required)
   - Enter your BMI value
   - Normal range: 18.5-24.9
   - Example: `22.5`
   - *Calculate: weight(kg) / height(m)²*

10. **Smoking Status** (required)
    - Select from: Never smoked, Formerly smoked, Currently smokes

**Step 3: Terms & Privacy**

1. Read the Privacy Policy
2. Check "I agree to the Privacy Policy and Terms of Service"
3. Click **"Register"**

**After Registration:**
- You'll be automatically logged in
- Redirected to your patient dashboard
- Can immediately book appointments

### 4.3 Booking an Appointment

**Step 1: Navigate to Appointments**
1. Click **"Book Appointment"** button on dashboard
2. Or use the navigation menu: Appointments → New Appointment

**Step 2: Select Doctor**
1. Choose a doctor from dropdown menu
2. View doctor's specialization
3. Example: "Dr. John Smith - Neurology"

**Step 3: Choose Date & Time**
1. **Appointment Date:**
   - Click on date field
   - Select future date (cannot be in the past)
   - Format: MM/DD/YYYY

2. **Appointment Time:**
   - Select from available time slots
   - Format: HH:MM AM/PM
   - Example: `10:30 AM`

**Step 4: Provide Details**
1. **Reason for Visit** (required)
   - Brief description of your concern
   - Example: "Follow-up consultation for blood pressure"
   - Maximum 500 characters

2. **Urgency Level** (required)
   - Select: Low / Medium / High
   - **Low:** Routine checkup
   - **Medium:** Concern requiring attention
   - **High:** Urgent medical issue

**Step 5: Confirm Booking**
1. Review all information
2. Click **"Book Appointment"**
3. You'll see a confirmation message
4. Appointment appears in your dashboard

### 4.4 Managing Appointments

**View Appointments:**
1. Go to "My Appointments" section
2. See list of all your appointments
3. Status indicators:
   - 🟢 **Scheduled** - Confirmed appointment
   - 🔵 **Completed** - Past appointment
   - 🔴 **Cancelled** - Cancelled appointment

**Cancel an Appointment:**
1. Find the appointment in your list
2. Click **"Cancel"** button
3. Confirm cancellation in popup
4. Status changes to "Cancelled"

**Reschedule an Appointment:**
1. Cancel the existing appointment
2. Book a new appointment with desired date/time

### 4.5 Viewing Health Information

**Access Your Health Profile:**
1. Click on your name/profile icon
2. Select **"My Profile"** or **"Health Information"**

**What You'll See:**
- Personal details (name, age, gender)
- Contact information
- Current health metrics:
  - Blood pressure status
  - Heart disease status
  - Glucose level
  - BMI
  - Smoking status
- **Stroke Risk Assessment:**
  - Risk percentage (0-100%)
  - Risk level (Low/Medium/High)
  - Color-coded indicator
  - Last calculated date

**Understanding Risk Levels:**
- 🟢 **Low Risk (0-24%):** Continue healthy lifestyle
- 🟡 **Medium Risk (25-49%):** Monitor health, consult doctor
- 🔴 **High Risk (50-100%):** Immediate medical attention needed

### 4.6 Updating Your Profile

**Edit Personal Information:**
1. Go to your profile page
2. Click **"Edit Profile"** button
3. Update allowed fields:
   - Phone number
   - Email address
   - Contact preferences

**Update Health Metrics:**
1. Navigate to **"Update Health Info"**
2. Enter new values for:
   - Glucose level
   - BMI
   - Smoking status
3. Click **"Save Changes"**
4. Risk assessment automatically recalculates

**Note:** Some fields (username, age, gender) cannot be changed after registration. Contact admin if correction needed.

### 4.7 Downloading Health Report

**Generate PDF Report:**
1. From your dashboard, click **"Download Health Report"**
2. PDF generates automatically
3. Contains:
   - Personal information
   - Current health metrics
   - Risk assessment details
   - Recent appointments
   - Medical history summary
4. Save or print the PDF

**When to Use:**
- Sharing information with other doctors
- Personal health records
- Insurance purposes
- Travel requirements

### 4.8 Patient Best Practices

✅ **Do's:**
- Keep your health information up-to-date
- Book appointments in advance
- Attend scheduled appointments
- Review your risk assessment regularly
- Update contact information if changed
- Download reports before appointments

❌ **Don'ts:**
- Share your password with others
- Leave your account logged in on shared devices
- Ignore high-risk warnings
- Miss appointments without cancelling
- Enter false health information

---

## 5. Doctor Guide

### 5.1 Doctor Dashboard Overview

Your doctor dashboard provides comprehensive patient management tools:

**Statistics Panel:**
- Total assigned patients
- Patients by risk level (High/Medium/Low)
- Upcoming appointments count
- Recent activity summary

**Patients List:**
- Searchable patient table
- Risk level indicators
- Quick action buttons
- Pagination (10 patients per page)

**Filters & Search:**
- Filter by risk level
- Search by name or ID
- Sort by various columns

### 5.2 Viewing Patient List

**Access Patient List:**
1. Main dashboard shows all assigned patients
2. Or navigate: Patients → All Patients

**Patient Table Columns:**
- Patient ID
- Full Name
- Age
- Gender
- Risk Level (with color coding)
- Last Update Date
- Actions

**Understanding Risk Indicators:**
- 🔴 **High Risk** - Red badge, immediate attention
- 🟡 **Medium Risk** - Yellow badge, monitoring required
- 🟢 **Low Risk** - Green badge, routine care

**Sorting Patients:**
1. Click column headers to sort
2. Available sorts:
   - Name (A-Z)
   - Age (youngest/oldest)
   - Risk Level (high to low)
   - Last Update (recent first)

**Searching Patients:**
1. Use search bar at top of table
2. Search by:
   - Patient name
   - Patient ID
   - Age
3. Results filter in real-time

### 5.3 Viewing Patient Details

**Access Patient Record:**
1. Find patient in list
2. Click **"View"** button or patient name
3. Full patient profile opens

**Patient Detail Sections:**

**A. Personal Information**
- Full name
- Date of birth / Age
- Gender
- Contact information (email, phone)
- Address (if provided)
- Marital status

**B. Medical Information**
- Hypertension status
- Heart disease status
- Work type
- Residence type
- Smoking status

**C. Current Health Metrics**
- Average glucose level (mg/dL)
- BMI (Body Mass Index)
- Last recorded date

**D. Stroke Risk Assessment**
- Current risk percentage
- Risk level classification
- Risk calculation date
- Historical risk trend (if available)

**E. Medical History**
- Previous diagnoses
- Treatment history
- Medications
- Allergies
- Past procedures

**F. Appointment History**
- Past appointments
- Upcoming appointments
- Cancelled appointments
- Appointment notes

### 5.4 Updating Patient Information

**Edit Patient Record:**
1. Open patient detail page
2. Click **"Edit"** button
3. Update form opens

**Editable Fields:**
- Contact information
- Health metrics (glucose, BMI)
- Medical conditions (hypertension, heart disease)
- Smoking status
- Medical history notes

**Update Process:**
1. Modify necessary fields
2. Ensure all required fields are filled
3. Validate data (warnings for unusual values)
4. Click **"Save Changes"**
5. Confirmation message appears
6. Risk score automatically recalculates

**Important Notes:**
- Cannot change: Patient ID, username, registration date
- Age updates automatically based on date of birth
- Risk assessment updates immediately after save
- All changes are logged in security system

### 5.5 Managing Appointments

**View All Appointments:**
1. Navigate: Appointments → All Appointments
2. See appointments for all your patients

**Appointment Filters:**
- By date range
- By patient name
- By status (scheduled/completed/cancelled)
- By urgency level

**Appointment Actions:**

**A. View Appointment Details:**
- Click on appointment
- See patient info, reason, urgency
- View appointment history

**B. Mark as Completed:**
1. Find scheduled appointment
2. Click **"Mark Complete"**
3. Add optional notes
4. Appointment moves to completed status

**C. Cancel Appointment:**
1. Find appointment
2. Click **"Cancel"**
3. Provide cancellation reason
4. Confirm cancellation
5. Patient receives notification (if enabled)

**D. Add Appointment Notes:**
1. Open completed appointment
2. Click **"Add Notes"**
3. Enter consultation summary
4. Save notes
5. Notes visible in patient history

### 5.6 Analytics & Reports

**Access Analytics:**
1. Navigate: Dashboard → Analytics
2. View various statistics

**Available Analytics:**

**A. Patient Risk Distribution**
- Pie chart of patients by risk level
- Total counts per category
- Percentage breakdown

**B. Age Demographics**
- Age group distribution
- Average patient age
- Age range of high-risk patients

**C. Health Condition Prevalence**
- Percentage with hypertension
- Percentage with heart disease
- Smoking status breakdown
- BMI distribution

**D. Appointment Statistics**
- Total appointments
- Completion rate
- Cancellation rate
- Average appointments per patient

**E. Trends Over Time**
- Risk level changes
- New patient registrations
- Appointment volume trends

**Export Reports:**
1. Click **"Export"** button
2. Choose format (PDF/CSV)
3. Select date range
4. Download report

### 5.7 Doctor Best Practices

✅ **Recommended Actions:**
- Review high-risk patients daily
- Keep patient records updated
- Document appointment outcomes
- Respond to urgent appointments promptly
- Regular data validation
- Monitor risk trends

⚠️ **Important Reminders:**
- Verify patient identity before viewing records
- Log out when leaving workstation
- Never share login credentials
- Report system issues immediately
- Maintain patient confidentiality

---

## 6. Administrator Guide

### 6.1 Admin Dashboard Overview

Administrator dashboard provides complete system oversight:

**System Statistics:**
- Total users (patients, doctors, admins)
- Active vs inactive accounts
- Total appointments
- System health indicators

**User Management Panel:**
- Create new users
- Activate/deactivate accounts
- View user activity

**Security Monitoring:**
- Recent login attempts
- Failed authentication logs
- Security event timeline
- Suspicious activity alerts

**Quick Actions:**
- Add new doctor
- Add new admin
- View all patients
- System reports

### 6.2 User Management

**View All Users:**
1. Navigate: Admin → Users → All Users
2. Table shows all system users

**User Table Columns:**
- User ID
- Username
- Full Name
- Email
- Role (Patient/Doctor/Admin)
- Status (Active/Inactive)
- Last Login
- Created Date
- Actions

**Filter Users:**
- By role
- By status
- By registration date
- Search by name/username/email

### 6.3 Creating New Users

**Create New Doctor:**

1. Navigate: Admin → Users → Add Doctor
2. Fill required fields:
   - Username (unique)
   - Email address
   - Password (temporary)
   - First name
   - Last name
   - **Specialization** (e.g., "Neurology", "Cardiology")
   - **License Number** (medical license)
   - Phone number
   - Status (Active/Inactive)
3. Click **"Create Doctor Account"**
4. Doctor receives credentials (if email enabled)
5. Doctor can change password on first login

**Create New Administrator:**

1. Navigate: Admin → Users → Add Admin
2. Fill required fields:
   - Username (unique)
   - Email address
   - Password (temporary)
   - First name
   - Last name
   - Phone number
   - Status (Active)
3. Click **"Create Admin Account"**
4. New admin credentials sent

**Important:**
- Use strong temporary passwords
- Mark account as "Active" for immediate access
- Verify email before creating account
- Document admin account creation

### 6.4 Managing Existing Users

**Deactivate User Account:**
1. Find user in list
2. Click **"Deactivate"** button
3. Confirm action
4. User cannot log in (data retained)

**Reactivate User Account:**
1. Find deactivated user
2. Click **"Activate"** button
3. User can log in again

**Delete User Account:**
1. Find user in list
2. Click **"Delete"** button
3. **Warning:** This permanently deletes:
   - User account
   - Associated patient records (if patient)
   - Appointment history
4. Confirm with password
5. Data cannot be recovered

**Reset User Password:**
1. Find user in list
2. Click **"Reset Password"**
3. Generate temporary password
4. Send to user's email
5. User must change on next login

**Edit User Details:**
1. Click **"Edit"** next to user
2. Update allowed fields:
   - Email
   - Phone number
   - Name (if correction needed)
   - Role (carefully!)
   - Specialization (doctors)
3. Save changes

### 6.5 Security Monitoring

**Access Security Logs:**
1. Navigate: Admin → Security → Logs
2. View comprehensive security events

**Security Event Types:**

**A. Authentication Events**
- Successful logins
- Failed login attempts
- Password changes
- Password reset requests
- Account lockouts

**B. Data Access Events**
- Patient record views
- Patient record updates
- User account changes
- Appointment access

**C. User Management Events**
- User creation
- User deletion
- Role changes
- Account activation/deactivation

**D. System Events**
- System errors
- Database issues
- Configuration changes

**Log Details:**
- Timestamp (exact time)
- Event type
- Username
- IP address
- Action performed
- Result (success/failure)
- Additional details

**Filter Logs:**
- By date range
- By event type
- By username
- By IP address
- By result (success/failure only)

**Suspicious Activity Indicators:**
- 🔴 **Multiple failed logins** (5+ in 10 minutes)
- 🔴 **Login from new location**
- 🔴 **Unusual access patterns**
- 🔴 **Mass data access**
- 🔴 **After-hours activity**

**Respond to Security Events:**
1. Investigate suspicious activity
2. Contact user if necessary
3. Deactivate compromised accounts
4. Force password reset
5. Document incident

### 6.6 System Reports & Analytics

**Generate System Report:**
1. Navigate: Admin → Reports
2. Select report type
3. Choose date range
4. Click **"Generate"**

**Available Reports:**

**A. User Activity Report**
- Login frequency
- Last login dates
- Active vs inactive users
- User role distribution

**B. Patient Statistics**
- Total patients
- Risk level distribution
- Demographics breakdown
- New registrations

**C. Appointment Report**
- Total appointments
- By status (scheduled/completed/cancelled)
- By doctor
- By time period
- Cancellation reasons

**D. Security Audit Report**
- All security events
- Failed authentication attempts
- Data access summary
- System changes

**E. System Health Report**
- Database performance
- User load
- Error logs
- System uptime

**Export Options:**
- PDF (formatted report)
- CSV (data export)
- Excel (with charts)
- JSON (raw data)

### 6.7 System Configuration

**Access Settings:**
1. Navigate: Admin → System → Settings

**Configurable Options:**

**A. Security Settings**
- Password requirements (length, complexity)
- Session timeout duration
- Failed login threshold
- Account lockout duration
- Two-factor authentication (if enabled)

**B. Email Settings**
- SMTP configuration
- Email templates
- Notification preferences
- Automatic emails (appointments, password resets)

**C. Database Settings**
- Switch between SQLite and MongoDB
- Database backup schedule
- Data retention policies

**D. System Preferences**
- Date format
- Time zone
- Default language
- Pagination size

**E. Risk Calculation Settings**
- Risk threshold values
- Calculation algorithm parameters

### 6.8 Administrator Best Practices

✅ **Security Best Practices:**
- Review security logs daily
- Monitor failed login attempts
- Regularly audit user accounts
- Remove inactive accounts
- Use strong admin passwords
- Enable two-factor authentication
- Limit admin account creation
- Document all administrative actions

✅ **User Management:**
- Verify identity before account creation
- Use role of least privilege
- Regular access reviews
- Prompt deactivation of departed staff
- Maintain user directory documentation

✅ **System Maintenance:**
- Regular database backups
- Monitor system performance
- Review error logs weekly
- Update documentation
- Test disaster recovery procedures

⚠️ **Critical Warnings:**
- Never share admin credentials
- Don't delete users without backup
- Verify before making role changes
- Document major configuration changes
- Test changes in non-production first (if available)

---

## 7. Common Features

### 7.1 Navigation Menu

**Menu Structure:**

**Patient View:**
- Dashboard (home icon)
- My Profile
- Book Appointment
- My Appointments
- Health Information
- Logout

**Doctor View:**
- Dashboard
- Patients
- Appointments
- Analytics
- My Profile
- Logout

**Admin View:**
- Dashboard
- Users
- Patients
- Appointments
- Security Logs
- Reports
- System Settings
- Logout

**Using Navigation:**
1. Click menu icon (hamburger) on mobile
2. Desktop: Menu always visible on left
3. Click any menu item to navigate
4. Active page highlighted

### 7.2 Profile Management

**Access Your Profile:**
1. Click profile icon (top right)
2. Select **"My Profile"**

**Profile Sections:**

**Personal Information:**
- Name
- Username
- Email address
- Phone number
- Role

**Account Settings:**
- Change password
- Update email
- Notification preferences

**Change Password:**
1. Click **"Change Password"**
2. Enter current password
3. Enter new password
4. Confirm new password
5. Password requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character (recommended)
6. Click **"Update Password"**
7. Log out and log back in with new password

**Update Email:**
1. Click **"Edit Profile"**
2. Enter new email address
3. Verify email format
4. Click **"Save"**
5. Verification email sent (if enabled)
6. Confirm new email

### 7.3 Dark Mode / Light Mode

**Toggle Theme:**
1. Look for sun/moon icon (top right)
2. Click to switch between:
   - 🌙 **Dark Mode** - Dark background, light text
   - ☀️ **Light Mode** - Light background, dark text
3. Preference saved automatically
4. Applies across all pages

**Benefits:**
- **Dark Mode:** Reduces eye strain, better for night use
- **Light Mode:** Better readability in bright environments

### 7.4 Search Functionality

**Available in:**
- Patient lists (doctors/admins)
- Appointment lists
- User management (admins)

**How to Search:**
1. Locate search bar (usually top of table)
2. Type search term
3. Results filter in real-time
4. Clear search to show all results

**Search Tips:**
- Search is case-insensitive
- Partial matches work
- Search multiple fields simultaneously
- Use filters for better results

### 7.5 Pagination

**Navigate Large Lists:**
1. Data shown in pages (usually 10 items)
2. Pagination controls at bottom of table:
   - ⟨⟨ First page
   - ⟨ Previous page
   - Page numbers (1, 2, 3...)
   - ⟩ Next page
   - ⟩⟩ Last page
3. Current page highlighted
4. Shows: "Showing 1-10 of 45"

**Change Items Per Page:**
1. Select from dropdown
2. Options: 10, 25, 50, 100
3. Page reloads with new count

### 7.6 Notifications

**Types of Notifications:**
- ✅ Success (green) - Action completed
- ⚠️ Warning (yellow) - Attention needed
- ❌ Error (red) - Action failed
- ℹ️ Info (blue) - General information

**Notification Behavior:**
- Appears at top-right of screen
- Auto-dismisses after 5 seconds
- Click X to dismiss manually
- Multiple notifications stack

**Common Notifications:**
- "Login successful"
- "Profile updated"
- "Appointment booked"
- "Invalid input, please check"
- "Session expired, please login again"

### 7.7 Session Management

**Session Duration:**
- Standard session: 24 hours
- Session extends with activity
- Warning before expiration (if enabled)

**Session Expiration:**
1. After 24 hours of inactivity
2. You'll see "Session expired" message
3. Redirected to login page
4. Log in again to continue

**Stay Secure:**
- Always logout when finished
- Don't leave session open on shared computers
- Close browser on public computers
- Session ends when browser closes (recommended setting)

### 7.8 Responsive Design

**Mobile Devices:**
- Optimized for phones and tablets
- Touch-friendly buttons
- Simplified navigation
- Swipe gestures supported
- Forms adapted for mobile input

**Screen Sizes:**
- Desktop (1920x1080+): Full features
- Laptop (1366x768+): Full features
- Tablet (768x1024): Adapted layout
- Mobile (360x640+): Mobile-optimized

**Mobile Tips:**
- Use landscape mode for tables
- Tap menu icon for navigation
- Swipe to close modals
- Long-press for additional options

---

## 8. Troubleshooting

### 8.1 Login Issues

**Problem: "Invalid username or password"**

**Solutions:**
1. Verify username spelling (case-sensitive)
2. Check if Caps Lock is on
3. Use "Forgot Password" if password forgotten
4. Ensure account is active (contact admin)
5. Clear browser cache and cookies
6. Try different browser

**Problem: "Account is locked"**

**Cause:** Too many failed login attempts (5+)

**Solutions:**
1. Wait 30 minutes for auto-unlock
2. Contact administrator for immediate unlock
3. Use "Forgot Password" to reset

**Problem: Session expired immediately**

**Solutions:**
1. Enable cookies in browser
2. Check if JavaScript is enabled
3. Update browser to latest version
4. Disable browser extensions temporarily
5. Try incognito/private mode

### 8.2 Appointment Booking Issues

**Problem: "No doctors available in dropdown"**

**Solutions:**
1. Refresh the page (F5)
2. Log out and log back in
3. Check if doctors are active (admin)
4. Contact administrator

**Problem: "Cannot select past date"**

**Expected:** System only allows future dates

**Solution:** Select today's date or later

**Problem: "Appointment time already taken"**

**Solutions:**
1. Choose different time slot
2. Select different date
3. Choose different doctor
4. Contact clinic for assistance

**Problem: Form won't submit**

**Solutions:**
1. Check all required fields (marked with *)
2. Ensure date is in future
3. Verify time slot is selected
4. Check internet connection
5. Look for red error messages under fields

### 8.3 Profile & Data Issues

**Problem: Cannot update health information**

**Solutions:**
1. Ensure all fields have valid values:
   - Age: 18-120
   - Glucose: 0-300 mg/dL
   - BMI: 10-60
2. Check for error messages
3. Try refreshing page
4. Log out and back in

**Problem: Risk level not updating**

**Solutions:**
1. Save all health data changes
2. Refresh page after saving
3. Log out and back in
4. Contact doctor or admin

**Problem: PDF download not working**

**Solutions:**
1. Check if pop-ups are blocked
2. Allow pop-ups for this site
3. Try different browser
4. Check download folder
5. Ensure sufficient storage space

### 8.4 Display & Interface Issues

**Problem: Page layout looks broken**

**Solutions:**
1. Clear browser cache:
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E
2. Hard refresh: Ctrl+F5 (Cmd+Shift+R on Mac)
3. Update browser to latest version
4. Try different browser
5. Check screen resolution (minimum 1024x768)

**Problem: Dark mode not working**

**Solutions:**
1. Click theme toggle multiple times
2. Clear browser local storage
3. Check browser JavaScript console for errors
4. Try different browser

**Problem: Menu not appearing (mobile)**

**Solutions:**
1. Tap hamburger menu icon (≡)
2. Rotate device to landscape
3. Refresh page
4. Clear browser cache

### 8.5 Performance Issues

**Problem: Pages loading slowly**

**Solutions:**
1. Check internet connection speed
2. Close other browser tabs
3. Clear browser cache
4. Disable browser extensions
5. Check if server is overloaded (contact admin)

**Problem: Actions taking long time**

**Solutions:**
1. Wait for current action to complete
2. Don't click buttons multiple times
3. Check network connection
4. Refresh page if stuck over 30 seconds

**Problem: Charts/graphs not displaying**

**Solutions:**
1. Enable JavaScript
2. Update browser
3. Clear cache
4. Check console for errors (F12)

### 8.6 Error Messages

**"Network Error" or "Cannot connect"**

**Causes:**
- Internet connection lost
- Server is down
- Firewall blocking connection

**Solutions:**
1. Check internet connection
2. Try accessing other websites
3. Restart router
4. Contact IT support
5. Try again in few minutes

**"Permission Denied"**

**Causes:**
- Trying to access unauthorized page
- Role doesn't have required permissions
- Session expired

**Solutions:**
1. Log out and log back in
2. Contact administrator for access
3. Verify you're using correct account type

**"Invalid Data" or "Validation Error"**

**Causes:**
- Required fields empty
- Data in wrong format
- Values out of valid range

**Solutions:**
1. Check error messages under each field
2. Ensure all required fields filled
3. Verify data formats (email, phone, dates)
4. Check value ranges (age, glucose, BMI)

**"Database Error"**

**Causes:**
- Server issue
- Database connection problem
- Data corruption

**Solutions:**
1. Refresh page
2. Try again in few minutes
3. Contact administrator immediately
4. Don't attempt action repeatedly

### 8.7 Browser-Specific Issues

**Internet Explorer:**
⚠️ **Not Supported** - Please use modern browser

**Chrome:**
- Clear cache: chrome://settings/clearBrowserData
- Disable extensions: chrome://extensions
- Reset settings: chrome://settings/reset

**Firefox:**
- Clear cache: about:preferences#privacy
- Safe mode: Help → Restart with Add-ons Disabled

**Safari:**
- Clear cache: Preferences → Privacy → Manage Website Data
- Disable extensions: Preferences → Extensions

**Edge:**
- Clear cache: edge://settings/clearBrowserData
- Reset: edge://settings/reset

### 8.8 When to Contact Support

**Contact Administrator if:**
- Cannot login after multiple attempts
- Account needs to be unlocked
- Need role/permission changes
- Data appears incorrect
- Suspect security issue
- System error persists

**Contact Doctor if (Patients):**
- Questions about health data
- Risk level concerns
- Appointment conflicts
- Medical information corrections

**Provide When Reporting Issue:**
1. Your username (not password!)
2. Page where error occurred
3. What you were trying to do
4. Exact error message
5. Browser and version
6. Screenshot (if possible)
7. Time/date of issue

---

## 9. FAQ (Frequently Asked Questions)

### 9.1 General Questions

**Q: Is my data secure?**

A: Yes. StrokeCare Portal implements multiple security measures:
- Encrypted password storage (bcrypt hashing)
- Secure JWT token authentication
- Role-based access control
- Security logging of all actions
- Input validation and sanitization
- Secure database storage

**Q: Can I access the system from my phone?**

A: Yes. The system is fully responsive and works on:
- Smartphones (iPhone, Android)
- Tablets (iPad, Android tablets)
- Desktop computers
- Laptops

**Q: How long does my session last?**

A: Your session remains active for 24 hours or until you logout. Session extends automatically as you use the system.

**Q: Can I have multiple accounts?**

A: No. Each user should have only one account. Multiple accounts may result in account suspension.

**Q: What browsers are supported?**

A: Modern browsers including:
- Google Chrome (version 90+)
- Mozilla Firefox (version 88+)
- Safari (version 14+)
- Microsoft Edge (version 90+)

Internet Explorer is not supported.

### 9.2 Patient Questions

**Q: How accurate is the stroke risk assessment?**

A: The risk assessment uses clinically validated algorithms based on multiple health factors. However, it's a screening tool, not a diagnosis. Always consult healthcare professionals for medical advice.

**Q: Can I change my age after registration?**

A: No. Age cannot be changed after registration. Contact administrator if there's an error.

**Q: How often should I update my health information?**

A: Update your health metrics (glucose, BMI, etc.) whenever they change significantly, or at least:
- Every 3 months for low-risk patients
- Monthly for medium-risk patients
- Weekly or as directed for high-risk patients

**Q: Can I book multiple appointments at once?**

A: No. Book one appointment at a time. You can book another after the first is confirmed.

**Q: How do I cancel an appointment?**

A: Go to "My Appointments," find the appointment, and click "Cancel." It's recommended to cancel at least 24 hours in advance.

**Q: What does my risk level mean?**

A:
- **Low (0-24%):** Continue healthy lifestyle, routine checkups
- **Medium (25-49%):** Monitor health closely, regular doctor visits
- **High (50-100%):** Seek immediate medical consultation

**Q: Can I see other patients' information?**

A: No. You can only view your own health information. This protects everyone's privacy.

**Q: My risk level seems wrong. What should I do?**

A: First, verify all your health information is accurate. If still concerned, contact your doctor for a review.

### 9.3 Doctor Questions

**Q: How many patients can I have?**

A: No fixed limit. You can manage as many patients as assigned by administration.

**Q: Can I delete patient records?**

A: No. Only administrators can delete patient records. Doctors can update information but not delete.

**Q: How do I see only high-risk patients?**

A: Use the risk level filter on the patients page. Select "High Risk" from the dropdown.

**Q: Can I assign patients to other doctors?**

A: No. Patient assignment is managed by administrators.

**Q: What if patient data seems incorrect?**

A: You can update patient health information. If core data (name, age) is wrong, contact administrator.

**Q: Can I export patient data?**

A: Yes. Use the "Export" function to download patient data in CSV or PDF format.

**Q: How are patients assigned to me?**

A: Patients can be:
- Self-registered (distributed automatically)
- Assigned by administrators
- Transferred from other doctors

### 9.4 Administrator Questions

**Q: Can deleted users be recovered?**

A: No. User deletion is permanent and cannot be undone. Always backup before deleting.

**Q: How often should I review security logs?**

A: Daily review recommended, especially:
- Failed login attempts
- Unusual access patterns
- After-hours activity

**Q: Can I change user roles?**

A: Yes, but carefully. Changing roles affects permissions and access. Document all role changes.

**Q: How do I backup the database?**

A: Database backups are automatic (if configured). Manual backup options available in System Settings.

**Q: What should I do about failed login attempts?**

A:
- 1-2 attempts: Normal (user error)
- 3-5 attempts: Monitor
- 5+ attempts: Investigate, possibly lock account
- Multiple accounts: Possible attack, investigate source IP

**Q: Can I bulk import users?**

A: Not through UI. Contact system administrator for bulk import scripts.

**Q: How do I generate system reports?**

A: Navigate to Admin → Reports, select report type, choose date range, and click "Generate."

### 9.5 Technical Questions

**Q: What is JWT authentication?**

A: JSON Web Token (JWT) is a secure method of authentication where a token is issued upon login and verified for each request. It's more secure than traditional session cookies.

**Q: Why are there two databases (SQLite and MongoDB)?**

A: Different databases serve different purposes:
- **SQLite:** Structured data (users, appointments) requiring ACID transactions
- **MongoDB:** Flexible patient records that may evolve over time

**Q: What happens if I lose internet connection?**

A: Current page data remains visible, but you cannot:
- Save changes
- Navigate to new pages
- Load new data

Reconnect to continue using the system.

**Q: Is two-factor authentication available?**

A: Currently not implemented. May be added in future versions.

**Q: Can I use the system offline?**

A: No. StrokeCare Portal requires internet connection to function.

**Q: What encryption is used for passwords?**

A: Passwords are hashed using bcrypt with cost factor 12, making them extremely secure.

**Q: How is HIPAA compliance ensured?**

A: System implements:
- Encrypted data storage
- Access control and authentication
- Security logging and audit trails
- Role-based permissions
- Secure data transmission (HTTPS recommended)

**Q: Can I integrate with other healthcare systems?**

A: Not currently supported. Contact development team for custom integrations.

---

## 10. Support

### 10.1 Getting Help

**Available Support Channels:**

**1. In-App Help:**
- Click "Help" icon (❓) on any page
- Context-sensitive help available
- Tooltips on hover

**2. Administrator Contact:**
- For account issues
- For access problems
- For system errors
- Response time: Same day (business hours)

**3. Technical Support:**
- Email: support@strokecare.example.com
- Response time: 24-48 hours

**4. Documentation:**
- This user manual
- API reference (developers)
- Architecture documentation

### 10.2 Reporting Issues

**Before Reporting:**
1. Check this manual's Troubleshooting section
2. Try basic fixes (clear cache, different browser)
3. Note exact error message
4. Try to reproduce the issue

**What to Include in Report:**

**Required Information:**
- Your username (never include password!)
- Your role (Patient/Doctor/Admin)
- Date and time of issue
- Page/feature where issue occurred
- What you were trying to do
- Exact error message

**Helpful Information:**
- Browser name and version
- Operating system
- Screenshot of error
- Steps to reproduce
- Whether issue is consistent or intermittent

**Example Report:**
```
Username: john_smith
Role: Patient
Date/Time: December 5, 2025, 2:30 PM
Issue: Cannot book appointment
Page: Appointments → New Appointment
Error: "No doctors available in dropdown"
Browser: Chrome 120.0
OS: Windows 11
Screenshot: Attached
Steps: 1) Logged in, 2) Clicked "Book Appointment", 
       3) Doctor dropdown is empty
Tried: Refreshing page, logging out/in
```

### 10.3 Feature Requests

Have an idea to improve StrokeCare Portal?

**Submit Feature Request:**
1. Describe the feature clearly
2. Explain the benefit
3. Provide use case examples
4. Indicate priority (nice-to-have vs critical)

**Feature Request Process:**
1. Submitted to development team
2. Reviewed for feasibility
3. Prioritized in roadmap
4. Development scheduled
5. Requestor notified of implementation

### 10.4 Training Resources

**Available Training:**

**1. Video Tutorials:**
- Patient registration walkthrough
- Booking appointments
- Doctor dashboard overview
- Admin user management
- Security monitoring

**2. Quick Start Guides:**
- Patient quick start (2 pages)
- Doctor quick start (3 pages)
- Admin quick start (5 pages)

**3. Webinars:**
- Monthly webinars for new users
- Advanced feature training
- Q&A sessions

**4. Practice Environment:**
- Sandbox system for testing
- Sample data included
- No impact on production data
- Request access from administrator

### 10.5 System Maintenance

**Scheduled Maintenance:**
- Typically: Sundays, 2:00 AM - 6:00 AM
- Notification sent 48 hours in advance
- System unavailable during maintenance
- All data preserved

**During Maintenance:**
- Login disabled
- Maintenance message displayed
- No data loss
- System restored after completion

**Emergency Maintenance:**
- Performed for critical issues
- May occur with short notice
- Duration: Usually < 2 hours

### 10.6 Staying Updated

**Release Notes:**
- Available in Help → What's New
- Lists new features
- Documents bug fixes
- Includes upgrade instructions

**Notification of Updates:**
- Email to all users (if enabled)
- In-app notification banner
- Dashboard announcement

**Version Information:**
- Current version: 1.0.0
- View: Help → About
- Shows: Version, build date, changelog

### 10.7 Privacy & Data Rights

**Your Rights:**
- Access your personal data
- Request data correction
- Request data deletion (right to be forgotten)
- Export your data (data portability)
- Opt-out of communications

**Data Retention:**
- Active accounts: Indefinite
- Inactive accounts: Reviewed annually
- Deleted accounts: 30-day recovery period, then permanent

**To Exercise Rights:**
1. Contact administrator
2. Submit written request
3. Verification required
4. Response within 30 days

### 10.8 Security Concerns

**Report Security Issues:**
- **Urgent:** Call administrator immediately
- **Email:** security@strokecare.example.com
- **Don't:** Post publicly or discuss with others

**What to Report:**
- Suspected account compromise
- Unusual system behavior
- Potential vulnerabilities
- Phishing attempts
- Data breaches

**After Reporting:**
1. Don't attempt further access
2. Change password immediately
3. Log out from all devices
4. Wait for administrator guidance

---

## Appendix A: Glossary

**Administrator:** User with full system access, responsible for user management and system configuration.

**Appointment:** Scheduled meeting between patient and doctor.

**Authentication:** Process of verifying user identity (login).

**Authorization:** Process of determining what authenticated user can access.

**BMI (Body Mass Index):** Measure of body fat based on height and weight. Formula: weight(kg) / height(m)².

**Dashboard:** Main page showing overview and quick access to features.

**Doctor:** Medical professional user who can view and manage patient records.

**Glucose Level:** Amount of sugar in blood, measured in mg/dL. Normal fasting: 70-100 mg/dL.

**High Risk:** Stroke risk level of 50% or higher, requires immediate medical attention.

**Hypertension:** High blood pressure condition, significant stroke risk factor.

**JWT (JSON Web Token):** Secure method of authentication using cryptographically signed tokens.

**Low Risk:** Stroke risk level below 25%, indicating good health status.

**Medium Risk:** Stroke risk level between 25-49%, requires monitoring.

**Patient:** Person receiving medical care, registered in the system.

**Risk Assessment:** Calculation of stroke probability based on health factors.

**Role:** User type determining access permissions (Patient, Doctor, Admin).

**Security Log:** Record of system events for auditing and security monitoring.

**Session:** Period during which user remains logged in.

**Stroke:** Medical emergency caused by interrupted blood flow to brain.

---

## Appendix B: Keyboard Shortcuts

**General Navigation:**
- `Alt + H` - Go to Home/Dashboard
- `Alt + P` - Go to Profile
- `Alt + L` - Logout
- `Esc` - Close modal/dialog
- `Tab` - Navigate between form fields
- `Enter` - Submit form (when in input)

**Table Navigation:**
- `→` - Next page
- `←` - Previous page
- `Home` - First page
- `End` - Last page

**Search:**
- `Ctrl + F` - Focus search box (if available)
- `Esc` - Clear search

**Accessibility:**
- `Tab` - Navigate forward
- `Shift + Tab` - Navigate backward
- `Enter` / `Space` - Activate button
- `Arrow Keys` - Navigate dropdowns

---

## Appendix C: Contact Information

**Technical Support:**
- Email: support@strokecare.example.com
- Response Time: 24-48 hours

**Administrator:**
- Contact through system messaging
- Or institutional contact method

**Emergency (Security Issues):**
- Email: security@strokecare.example.com
- Phone: Available through your institution

**GitHub Repository:**
- [CS-LTU/com7033-assignment-rafiuzzaman97](https://github.com/CS-LTU/com7033-assignment-rafiuzzaman97)

---

## Document Information

**Document Version:** 1.0.0  
**Last Updated:** December 5, 2025  
**Applies to System Version:** 1.0.0  
**Author:** StrokeCare Development Team  
**Status:** Final

---

**End of User Manual**
