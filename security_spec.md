# Firestore Security Specification: BU CA Equipment Help & Class Check-In

This specification outlines the attribute-based access control (ABAC) invariants, security postures, and threat modeling for our collections: `users`, `tickets`, `attendance`, and `classes`.

---

## 1. Data Invariants

1. **Student Ticket Isolation**: A student can only create and read their own support tickets. They are strictly locked out of other students' tickets.
2. **Admin/Omniscient Power**: The supervisor (`pongsakorn.c@bu.ac.th`) is verified as an Admin and has reading/replying credentials to all tickets.
3. **Verified Email Constraint**: Only verified emails (`email_verified == true`) are permitted to submit tickets or execute class sign-ins.
4. **Domain Filtering**: Students are restricted by default to the `@bumail.net` or `@bu.ac.th` email domain.
5. **Score & Attendance Integrity**: Students cannot edit their own attendance marks, statuses (`on_time`, `late`), or award levels. Only the Admin can mutate these records.
6. **No Self-Appointment**: Students cannot write records into the `/admins/` resource list or flag their own profile role as `admin`.

---

## 2. The "Dirty Dozen" Threat Payloads

The rules are designed to block the following 12 malicious operations:

1. **Self-Promotion Exploit**: A user attempts to create a profile inside `/users/{uid}` with `{ "role": "admin" }` to bypass interface rules.
2. **Teacher Identity Spoof**: A student attempts to write `/admins/stu123` with `{ "email": "pongsakorn.c@bu.ac.th" }` to spoof credentials.
3. **Ticket Siphoning**: Student B attempts to query `/tickets` without a filter, trying to pull Student A's ticket data.
4. **Foreign Ticket Mutation**: Student B attempts to edit Student A's pending ticket using their own auth credentials.
5. **Ghost Field Poisoning**: A user attempts to update their own ticket with `{ "ghostField": "bad_inject" }` or `{ "isVerified": true }` to crash or poison systems.
6. **Self-Signed Score Boosting**: A student attempts to check in to a class and awards themselves `+100` points instead of the standard class points weight.
7. **Post-Answer Mutability Breach**: A student attempts to alter their question description after the Admin has already supplied an official answer.
8. **Anomalous ID Injection**: A student injects a 2MB hex string as an ID (`/tickets/LONG_HEX_ID...`) to cause Denial of Wallet (DoW) index bloating.
9. **Blanket Query Scraping**: A client-side script submits a blank query targeting `/attendance` seeking logs for other students.
10. **Device Registry Spoofing**: A student alters their device metadata field to match the Admin's device context.
11. **Check-In Fraud (Terminal Lock)**: A student attempts to modify their attendance timestamp or change their state from `late` to `on_time` retrospectively.
12. **Anonymous Access Breach**: A user without Google authentication attempts to write support tickets.

---

## 3. Test Runner Design (`firestore.rules.test.ts`)

A mock test suite verifying the strict denial of these payloads:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Mock variables for test verification
const adminAuth = { uid: 'teacher_001', email: 'pongsakorn.c@bu.ac.th', email_verified: true };
const studentAuth = { uid: 'student_101', email: 'somchai.s@bumail.net', email_verified: true };
const maliciousAuth = { uid: 'attacker_666', email: 'hacker@gmail.com', email_verified: true };

describe('BU CA Equipment Help Security Rules', () => {
  it('prevents student from reading admin credentials folder', async () => {
    // Assert student query to /admins fails
  });
  
  it('prevents malicious third party email from creating a ticket', async () => {
    // Assert user without bumail.net or bu.ac.th fails
  });
  
  it('allows students to submit legitimate help requests', async () => {
    // Assert somchai.s can create /tickets/somchai_t1
  });

  it('prohibits students from altering attendance logs', async () => {
    // Assert editing check-in score fails for students
  });
});
```
