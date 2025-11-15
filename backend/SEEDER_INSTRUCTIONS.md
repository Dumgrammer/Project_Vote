# Database Seeder Instructions

## How to Run the Seeder

The seeder will populate your database with sample data including elections, candidates, voters, and votes.

### Option 1: Command Line (Recommended)

```bash
cd backend
php utils/Seeder.php
```

### Option 2: Via Browser

Navigate to: `http://localhost/Project_Vote/backend/utils/Seeder.php`

## What Gets Seeded

### 1. **Admin Account**
- Email: `admin@pollify.com`
- Password: `admin123`
- Full permissions

### 2. **Positions** (by type)
**School Positions:**
- President, Vice President, Secretary, Treasurer, Auditor, Public Relations Officer
- Board Member (allows multiple votes)
- Department Representative (allows multiple votes)

**Corporate Positions:**
- CEO, COO, CFO, CTO, HR Director, Marketing Director
- Board of Directors (allows multiple votes)
- Department Head (allows multiple votes)

**Barangay Positions:**
- Barangay Captain, Barangay Secretary, Barangay Treasurer
- Sangguniang Barangay Member (allows multiple votes)
- SK Chairman, SK Secretary, SK Treasurer

### 3. **Political Parties**
- Liberal Party (LP)
- Democratic Party (DP)
- Green Party (GP)
- Reform Party (RP)
- Independent (IND) - already exists

### 4. **Elections** (5 elections)
- **Student Council Election 2024** (School - Ended - 30 days ago)
- **Mid-Year Leadership Election** (School - Ongoing - ends in 14 days)
- **Campus Organization Election 2025** (School - Upcoming - starts in 10 days)
- **Corporate Board Election 2024** (Corporate - Ongoing - ends in 15 days)
- **Barangay Election 2024** (Barangay - Upcoming - starts in 5 days)

### 5. **Voters** (30 voters)
All with password: `password123`

**School Type (20 verified + 3 unverified):**
- juan.delacruz@email.com (Verified - male)
- maria.garcia@email.com (Verified - female)
- pedro.reyes@email.com (Verified - male)
- ... and 17 more school voters

**Corporate Type (5 verified + 1 unverified):**
- francisco.chavez@email.com (Verified - male)
- gabriela.ramos@email.com (Verified - female)
- ... and 3 more corporate voters

**Barangay Type (5 verified + 1 unverified):**
- isabella.herrera@email.com (Verified - female)
- sebastian.cervantes@email.com (Verified - male)
- ... and 3 more barangay voters

### 6. **Candidates**
Multiple candidates for each election with positions matching their election type:
- **School Elections:** President, Vice President, Secretary, Treasurer
- **Corporate Election:** CEO, CFO, CTO, HR Director
- **Barangay Election:** Barangay Captain, Barangay Secretary, Barangay Treasurer, SK Chairman

### 7. **Votes**
Random votes from all verified voters for the ended election (Student Council Election 2024)

## Testing the Results

After seeding:

1. **Login as admin**: Use `admin@pollify.com` / `admin123`
   - View all elections, positions, parties, voters, and candidates
   - Create new positions, elections, and candidates
   - Test the "Add New Position" button when creating candidates

2. **Login as voter**: Use any verified voter email + `password123`
   - **School voters** can only see school elections
   - **Corporate voters** can only see corporate elections
   - **Barangay voters** can only see barangay elections
   - View Elections: Go to Voter Home
   - View Results: Click "View Results" on the ended election
   - See vote counts: View the detailed results with percentages and winner badges

3. **Test Position System**:
   - Create candidates and see positions filtered by election type
   - Use "Add New Position" button to create positions on the fly
   - Notice positions that allow multiple votes are marked

## Re-running the Seeder

The seeder checks for existing data:
- Admin: Skips if admin@pollify.com exists
- Positions: Skips if position name + type combination exists
- Parties: Skips if party code exists
- Elections: Always creates new ones
- Voters: Skips if email exists
- Candidates: Always creates new ones for new elections
- Votes: Creates for the first (oldest) election

To completely reseed:
1. Truncate all tables or drop the database
2. Run the seeder again

## Troubleshooting

If you get errors:
- Make sure your database is connected
- Check that all tables exist (run migrations first if needed)
- Verify PHP CLI is available (`php -v`)
- Check file permissions on the seeder file

