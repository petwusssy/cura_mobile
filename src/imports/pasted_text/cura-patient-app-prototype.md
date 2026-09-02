Create a professional, production-ready **mobile app prototype** for **CURA — University Clinic Patient App**, built with **React Native + Expo**.

CURA is a modern digital health companion for university clinic patients. The experience should feel **professional, trustworthy, calm, accessible, and premium**, similar to a polished healthcare app. Prioritize excellent **UX/UI, clear navigation, accessibility, visual hierarchy, micro-interactions, and mobile-first design**.

## DESIGN DIRECTION

Use a clean medical-tech aesthetic:

* Primary: deep navy / medical blue
* Secondary: white and soft blue-gray
* Accent: subtle cyan/teal
* Status colors: green = safe/success, amber = warning, red = urgent
* Rounded cards, soft shadows, clean spacing
* Modern typography such as Inter or SF-style sans-serif
* Avoid excessive glassmorphism, gradients, or visual clutter
* Use consistent icons and meaningful illustrations
* Include polished loading, empty, success, error, and confirmation states
* Add subtle animations and transitions where appropriate
* Make every screen feel intentionally designed, not like a generic template

## ONBOARDING & ACCOUNT SETUP

The registration experience must be **professional and page-by-page**, not one long form.

Flow:

1. Welcome / CURA introduction
2. Create account
3. Email verification
4. Personal information
5. Patient category selection:

   * Student
   * Employee
   * Outsider
6. Conditional academic information for students:

   * Course
   * Year Level
   * Department
   * Grade Level
7. Contact information
8. Emergency contact
9. Guardian information when applicable
10. Profile personalization

### PROFILE PERSONALIZATION

Before completing setup, let the user personalize their profile:

* Choose a **CURA mascot/avatar/icon**
* Allow selecting from several professional healthcare-themed mascots
* Include an option to upload/select a personal profile image
* Show a live preview of the selected avatar
* Let the user choose a preferred display name
* Make this step visually engaging but still professional

Finish with a **Profile Complete** success screen and transition to the dashboard.

## AUTHENTICATION

Include:

* Login
* Register
* Forgot Password
* Email Verification
* Secure logout
* Session/loading states
* Clear validation and helpful error messages

## MAIN APP NAVIGATION

Use a polished bottom tab navigation:

1. Home
2. Health History
3. Medications
4. Documents
5. Profile

Include notifications accessible from the Home header.

## HOME DASHBOARD

Create a personalized patient dashboard showing:

* Greeting with user's name and avatar/mascot
* Today's clinic-related information
* Current medication reminder when applicable
* Active clinic bed/rest timer when applicable
* Recent consultation
* Quick actions:

  * View Health History
  * Medications
  * Medical Certificates
  * Prescriptions
* Notifications / important clinic updates

The dashboard should prioritize important information instead of showing everything at once.

## HEALTH HISTORY

Create a consultation history experience.

Patient can view:

* Past visits
* Consultation date
* Time In / Time Out
* Chief complaint
* Vitals:

  * Height
  * Weight
  * Temperature
  * Blood Pressure
  * Heart Rate
  * O2 Saturation
* Nurse Notes
* Doctor's Notes
* Recommendations
* Follow-up date

Use a timeline/card layout. Tapping a consultation opens a detailed medical record screen.

## MEDICATIONS

Create a medication management screen using treatment data.

Show:

* Medicine name
* Dose/instructions
* Time given
* Next dose
* Medication status

Allow medication reminders using Expo notifications. Include clear reminder states such as **Upcoming, Due Now, Taken, Missed**.

## CLINIC BED / REST TIMER

When a patient is assigned a clinic bed:

* Show bed status
* Allotted rest time
* Remaining minutes
* Visual countdown
* Notification when the allotted time is nearly finished
* Completion state when time expires

Make this feature highly visible only when an active bed assignment exists.

## DOCUMENTS

Create a digital documents section.

### Prescriptions

Patients can:

* View prescription image
* Open it in a full-screen viewer
* Zoom image
* See prescription date and consultation information

### Medical Certificates

Patients can:

* View issued medical certificates
* See purpose
* Diagnosis
* Recommendations
* Issuing doctor
* Date issued

**Medical certificates are view-only and must NOT provide a download button.**

## HOSPITAL TRANSFERS

Include a Hospital Transfer Records section showing:

* Receiving hospital
* Transfer date/time
* Transport mode
* Reason for transfer
* Transfer status

Use a clear emergency/medical record design.

## PROFILE & SETTINGS

Include:

* Profile information
* Avatar/mascot customization
* Personal information
* Academic information
* Emergency contact
* Guardian information
* Notification preferences
* Account settings
* Privacy
* Logout

## UX REQUIREMENTS

Design realistic user flows, not just static screens. Include:

* First-time user onboarding
* Returning user experience
* Form validation
* Confirmation dialogs
* Skeleton/loading states
* Empty states
* Error states
* Success feedback
* Pull-to-refresh
* Smooth screen transitions
* Accessible touch targets
* Clear back navigation
* Consistent spacing and components

Use **mock data** for the prototype, but structure the app so the screens and services can later connect to the existing CURA backend/API.

The final result should look like a **real university clinic healthcare application ready for development**, with a polished patient experience from registration → profile setup → dashboard → health records → medications → documents → profile.
