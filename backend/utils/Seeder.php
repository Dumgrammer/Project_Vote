<?php
require_once('./config/pollify.php');
require_once('./utils/utils.php');

class Seeder extends GlobalUtil {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function seed() {
        try {
            echo "Starting database seeding...\n\n";

            // 1. Seed Admin
            $this->seedAdmin();

            // 2. Seed Parties
            $this->seedParties();

            // 3. Seed Elections
            $this->seedElections();

            // 4. Seed Voters
            $this->seedVoters();

            // 5. Seed Candidates
            $this->seedCandidates();

            // 6. Seed Votes
            $this->seedVotes();

            echo "\n✅ Database seeding completed successfully!\n";

        } catch (\Exception $e) {
            echo "\n❌ Error during seeding: " . $e->getMessage() . "\n";
        }
    }

    private function seedAdmin() {
        echo "Seeding Admin...\n";
        
        // Check if any admin exists and show details
        $stmt = $this->pdo->query("SELECT id, email FROM admin LIMIT 1");
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            echo "  - Admin account already exists: ID={$admin['id']}, Email={$admin['email']}\n";
            echo "  - Skipping admin creation.\n";
            return;
        }

        try {
            $sql = "INSERT INTO admin (email, password, fname, mname, lname, rules) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'admin@pollify.com',
                password_hash('admin123', PASSWORD_DEFAULT),
                'System',
                '',
                'Administrator',
                json_encode([
                    'create_election' => true,
                    'create_candidates' => true,
                    'read_voters' => true,
                    'create_voters' => true,
                    'update_voters' => true,
                    'delete_voters' => true,
                    'verify_voters' => true
                ])
            ]);
            
            echo "  ✓ Admin created (admin@pollify.com / admin123)\n";
        } catch (\Exception $e) {
            echo "  ⚠ Could not create admin: " . $e->getMessage() . "\n";
            echo "  - Please use your existing admin account.\n";
        }
    }

    private function seedParties() {
        echo "Seeding Parties...\n";
        
        // Get admin ID
        $adminStmt = $this->pdo->query("SELECT id FROM admin ORDER BY id ASC LIMIT 1");
        $adminId = $adminStmt->fetchColumn();
        
        if ($adminId === false || $adminId === null) {
            echo "  ⚠ No admin found, skipping parties.\n";
            echo "  - Please create an admin account first.\n";
            return;
        }
        
        echo "  - Using admin ID: {$adminId}\n";
        
        $parties = [
            ['Liberal Party', 'LP', 'Liberal political party'],
            ['Democratic Party', 'DP', 'Democratic political values'],
            ['Green Party', 'GP', 'Environmental focus'],
            ['Reform Party', 'RP', 'Political reforms'],
        ];

        foreach ($parties as $party) {
            // Check if party exists
            $stmt = $this->pdo->prepare("SELECT id FROM parties WHERE party_code = ?");
            $stmt->execute([$party[1]]);
            
            if (!$stmt->fetch()) {
                $sql = "INSERT INTO parties (party_name, party_code, description, created_by) 
                        VALUES (?, ?, ?, ?)";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$party[0], $party[1], $party[2], $adminId]);
                echo "  ✓ Party created: {$party[0]}\n";
            }
        }
    }

    private function seedElections() {
        echo "Seeding Elections...\n";
        
        // Get admin ID
        $adminStmt = $this->pdo->query("SELECT id FROM admin ORDER BY id ASC LIMIT 1");
        $adminId = $adminStmt->fetchColumn();
        
        if ($adminId === false || $adminId === null) {
            echo "  ⚠ No admin found, skipping elections.\n";
            return;
        }
        
        echo "  - Using admin ID: {$adminId}\n";
        
        $elections = [
            [
                'title' => 'Student Council Election 2024 - ENDED',
                'description' => 'The annual student council leadership election has concluded. View the results to see who won!',
                'start' => date('Y-m-d H:i:s', strtotime('-30 days')),
                'end' => date('Y-m-d H:i:s', strtotime('-5 days')),
            ],
            [
                'title' => 'Mid-Year Leadership Election - ONGOING',
                'description' => 'Vote now for your leaders! Election is currently in progress for the second semester leadership positions.',
                'start' => date('Y-m-d H:i:s', strtotime('-3 days')),
                'end' => date('Y-m-d H:i:s', strtotime('+14 days')),
            ],
            [
                'title' => 'Campus Organization Election 2025 - UPCOMING',
                'description' => 'Upcoming election for campus organization officers. Stay tuned for the start date!',
                'start' => date('Y-m-d H:i:s', strtotime('+10 days')),
                'end' => date('Y-m-d H:i:s', strtotime('+25 days')),
            ],
        ];

        foreach ($elections as $election) {
            $sql = "INSERT INTO elections (election_title, description, start_date, end_date, created_by) 
                    VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $election['title'],
                $election['description'],
                $election['start'],
                $election['end'],
                $adminId
            ]);
            echo "  ✓ Election created: {$election['title']}\n";
        }
    }

    private function seedVoters() {
        echo "Seeding Voters...\n";
        
        // Get admin ID
        $adminStmt = $this->pdo->query("SELECT id FROM admin ORDER BY id ASC LIMIT 1");
        $adminId = $adminStmt->fetchColumn();
        
        if ($adminId === false || $adminId === null) {
            echo "  ⚠ No admin found, skipping voters.\n";
            return;
        }
        
        echo "  - Using admin ID: {$adminId}\n";
        
        $voters = [
            // Verified voters (30 voters)
            ['Juan', 'Miguel', 'Dela Cruz', 'juan.delacruz@email.com', '09123456789', true],
            ['Maria', 'Santos', 'Garcia', 'maria.garcia@email.com', '09234567890', true],
            ['Pedro', 'Ramos', 'Reyes', 'pedro.reyes@email.com', '09345678901', true],
            ['Ana', 'Lopez', 'Torres', 'ana.torres@email.com', '09456789012', true],
            ['Carlos', 'Fernando', 'Martinez', 'carlos.martinez@email.com', '09567890123', true],
            ['Sofia', 'Isabel', 'Hernandez', 'sofia.hernandez@email.com', '09678901234', true],
            ['Miguel', 'Angel', 'Lopez', 'miguel.lopez@email.com', '09789012345', true],
            ['Carmen', 'Rosa', 'Gonzalez', 'carmen.gonzalez@email.com', '09890123456', true],
            ['Luis', 'Alberto', 'Fernandez', 'luis.fernandez@email.com', '09901234567', true],
            ['Isabel', 'Maria', 'Rodriguez', 'isabel.rodriguez@email.com', '09012345678', true],
            ['Ricardo', 'Cruz', 'Salazar', 'ricardo.salazar@email.com', '09123456799', true],
            ['Elena', 'Diaz', 'Vargas', 'elena.vargas@email.com', '09123456800', true],
            ['Fernando', 'Ramirez', 'Moreno', 'fernando.moreno@email.com', '09123456801', true],
            ['Patricia', 'Jimenez', 'Romero', 'patricia.romero@email.com', '09123456802', true],
            ['Roberto', 'Sanchez', 'Dominguez', 'roberto.dominguez@email.com', '09123456803', true],
            ['Angela', 'Perez', 'Gutierrez', 'angela.gutierrez@email.com', '09123456804', true],
            ['Daniel', 'Gomez', 'Ortiz', 'daniel.ortiz@email.com', '09123456805', true],
            ['Laura', 'Torres', 'Silva', 'laura.silva@email.com', '09123456806', true],
            ['Jorge', 'Hernandez', 'Medina', 'jorge.medina@email.com', '09123456807', true],
            ['Monica', 'Ruiz', 'Aguilar', 'monica.aguilar@email.com', '09123456808', true],
            ['Francisco', 'Morales', 'Chavez', 'francisco.chavez@email.com', '09123456809', true],
            ['Gabriela', 'Castillo', 'Ramos', 'gabriela.ramos@email.com', '09123456810', true],
            ['Alejandro', 'Ortega', 'Guerrero', 'alejandro.guerrero@email.com', '09123456811', true],
            ['Valentina', 'Rojas', 'Nunez', 'valentina.nunez@email.com', '09123456812', true],
            ['Diego', 'Vega', 'Soto', 'diego.soto@email.com', '09123456813', true],
            ['Isabella', 'Molina', 'Herrera', 'isabella.herrera@email.com', '09123456814', true],
            ['Sebastian', 'Campos', 'Cervantes', 'sebastian.cervantes@email.com', '09123456815', true],
            ['Camila', 'Mendez', 'Alvarez', 'camila.alvarez@email.com', '09123456816', true],
            ['Mateo', 'Espinoza', 'Fuentes', 'mateo.fuentes@email.com', '09123456817', true],
            ['Luciana', 'Paredes', 'Pena', 'luciana.pena@email.com', '09123456818', true],
            
            // Unverified voters (5 voters)
            ['Antonio', 'Santos', 'Rios', 'antonio.rios@email.com', '09123456819', false],
            ['Rosa', 'Lopez', 'Blanco', 'rosa.blanco@email.com', '09123456820', false],
            ['Enrique', 'Martinez', 'Vidal', 'enrique.vidal@email.com', '09123456821', false],
            ['Clara', 'Garcia', 'Roman', 'clara.roman@email.com', '09123456822', false],
            ['Emilio', 'Fernandez', 'Luna', 'emilio.luna@email.com', '09123456823', false],
        ];

        foreach ($voters as $index => $voter) {
            $votersId = 'VOTER-' . str_pad($index + 1, 6, '0', STR_PAD_LEFT);
            
            // Check if voter exists
            $stmt = $this->pdo->prepare("SELECT id FROM voters WHERE email = ?");
            $stmt->execute([$voter[3]]);
            
            if (!$stmt->fetch()) {
                $sql = "INSERT INTO voters (voters_id, fname, mname, lname, email, contact_number, password, is_verified, date_verified, created_by) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    $votersId,
                    $voter[0],
                    $voter[1],
                    $voter[2],
                    $voter[3],
                    $voter[4],
                    password_hash('password123', PASSWORD_DEFAULT),
                    $voter[5] ? 1 : 0,
                    $voter[5] ? date('Y-m-d H:i:s') : null,
                    $adminId
                ]);
                echo "  ✓ Voter created: {$voter[0]} {$voter[2]} ({$voter[3]} / password123)\n";
            }
        }
    }

    private function seedCandidates() {
        echo "Seeding Candidates...\n";
        
        // Get admin ID
        $adminStmt = $this->pdo->query("SELECT id FROM admin ORDER BY id ASC LIMIT 1");
        $adminId = $adminStmt->fetchColumn();
        
        if ($adminId === false || $adminId === null) {
            echo "  ⚠ No admin found, skipping candidates.\n";
            return;
        }
        
        echo "  - Using admin ID: {$adminId}\n";
        
        // Get election IDs
        $stmt = $this->pdo->query("SELECT id FROM elections ORDER BY id LIMIT 3");
        $elections = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($elections) < 1) {
            echo "  - No elections found, skipping candidates.\n";
            return;
        }

        // Get party IDs (party_code => id mapping)
        $stmt = $this->pdo->query("SELECT party_code, id FROM parties");
        $parties = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $candidates = [
            // Election 1 (Ended)
            [
                'election' => 0,
                'fname' => 'Roberto',
                'lname' => 'Santos',
                'party' => 'LP',
                'position' => 'President',
                'bio' => 'Experienced leader with a vision for positive change.'
            ],
            [
                'election' => 0,
                'fname' => 'Elena',
                'lname' => 'Cruz',
                'party' => 'DP',
                'position' => 'President',
                'bio' => 'Passionate advocate for student rights and welfare.'
            ],
            [
                'election' => 0,
                'fname' => 'Marco',
                'lname' => 'Villanueva',
                'party' => 'LP',
                'position' => 'Vice President',
                'bio' => 'Dedicated to improving campus facilities.'
            ],
            [
                'election' => 0,
                'fname' => 'Diana',
                'lname' => 'Ramos',
                'party' => 'DP',
                'position' => 'Vice President',
                'bio' => 'Committed to academic excellence.'
            ],
            [
                'election' => 0,
                'fname' => 'Antonio',
                'lname' => 'Gomez',
                'party' => 'GP',
                'position' => 'Secretary',
                'bio' => 'Organized and detail-oriented administrator.'
            ],
            [
                'election' => 0,
                'fname' => 'Patricia',
                'lname' => 'Morales',
                'party' => 'LP',
                'position' => 'Treasurer',
                'bio' => 'Financial expert with integrity.'
            ],
            [
                'election' => 0,
                'fname' => 'Jose',
                'lname' => 'Reyes',
                'party' => 'DP',
                'position' => 'Treasurer',
                'bio' => 'Accountant with transparent financial practices.'
            ],
            [
                'election' => 0,
                'fname' => 'Angelica',
                'lname' => 'Torres',
                'party' => 'GP',
                'position' => 'Secretary',
                'bio' => 'Meticulous record keeper and communicator.'
            ],
            
            // Election 2 (Ongoing)
            [
                'election' => 1,
                'fname' => 'Francisco',
                'lname' => 'Rivera',
                'party' => 'RP',
                'position' => 'President',
                'bio' => 'Reformist leader for modern governance.'
            ],
            [
                'election' => 1,
                'fname' => 'Valentina',
                'lname' => 'Diaz',
                'party' => 'LP',
                'position' => 'President',
                'bio' => 'Progressive thinker with fresh ideas.'
            ],
            [
                'election' => 1,
                'fname' => 'Gabriel',
                'lname' => 'Flores',
                'party' => 'DP',
                'position' => 'Vice President',
                'bio' => 'Experienced organizer and team builder.'
            ],
            [
                'election' => 1,
                'fname' => 'Isabella',
                'lname' => 'Santos',
                'party' => 'GP',
                'position' => 'Vice President',
                'bio' => 'Environmental advocate for sustainable campus.'
            ],
            [
                'election' => 1,
                'fname' => 'Rafael',
                'lname' => 'Mendoza',
                'party' => 'RP',
                'position' => 'Secretary',
                'bio' => 'Efficient communicator and record keeper.'
            ],
            [
                'election' => 1,
                'fname' => 'Beatriz',
                'lname' => 'Perez',
                'party' => 'LP',
                'position' => 'Secretary',
                'bio' => 'Detail-oriented administrator and planner.'
            ],
            [
                'election' => 1,
                'fname' => 'Andres',
                'lname' => 'Valdez',
                'party' => 'DP',
                'position' => 'Treasurer',
                'bio' => 'Finance major with budget management skills.'
            ],
            [
                'election' => 1,
                'fname' => 'Cristina',
                'lname' => 'Mendez',
                'party' => 'GP',
                'position' => 'Treasurer',
                'bio' => 'Eco-conscious financial planner.'
            ],
            
            // Election 3 (Upcoming)
            [
                'election' => 2,
                'fname' => 'Sophia',
                'lname' => 'Navarro',
                'party' => 'LP',
                'position' => 'President',
                'bio' => 'Visionary leader focused on student welfare.'
            ],
            [
                'election' => 2,
                'fname' => 'Daniel',
                'lname' => 'Castillo',
                'party' => 'DP',
                'position' => 'President',
                'bio' => 'Advocate for academic excellence and innovation.'
            ],
            [
                'election' => 2,
                'fname' => 'Camila',
                'lname' => 'Ortiz',
                'party' => 'GP',
                'position' => 'Vice President',
                'bio' => 'Green advocate for campus sustainability.'
            ],
            [
                'election' => 2,
                'fname' => 'Miguel',
                'lname' => 'Santiago',
                'party' => 'RP',
                'position' => 'Vice President',
                'bio' => 'Reform-minded leader for organizational change.'
            ],
            [
                'election' => 2,
                'fname' => 'Teresa',
                'lname' => 'Luna',
                'party' => 'LP',
                'position' => 'Secretary',
                'bio' => 'Organized planner and effective communicator.'
            ],
            [
                'election' => 2,
                'fname' => 'Pablo',
                'lname' => 'Guerrero',
                'party' => 'DP',
                'position' => 'Treasurer',
                'bio' => 'Business student with financial acumen.'
            ],
        ];

        foreach ($candidates as $candidate) {
            if (!isset($elections[$candidate['election']])) continue;
            
            $partyId = $parties[$candidate['party']] ?? null;
            if (!$partyId) continue;

            // Check if candidate already exists
            $checkStmt = $this->pdo->prepare("
                SELECT COUNT(*) FROM candidates 
                WHERE election_id = ? AND fname = ? AND lname = ? AND position = ?
            ");
            $checkStmt->execute([
                $elections[$candidate['election']],
                $candidate['fname'],
                $candidate['lname'],
                $candidate['position']
            ]);
            
            if ($checkStmt->fetchColumn() > 0) {
                continue; // Skip duplicate
            }

            $sql = "INSERT INTO candidates (election_id, fname, lname, party_id, position, bio, created_by) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $elections[$candidate['election']],
                $candidate['fname'],
                $candidate['lname'],
                $partyId,
                $candidate['position'],
                $candidate['bio'],
                $adminId
            ]);
            echo "  ✓ Candidate created: {$candidate['fname']} {$candidate['lname']} - {$candidate['position']}\n";
        }
    }

    private function seedVotes() {
        echo "Seeding Votes for ended election...\n";
        
        // Get first (ended) election
        $stmt = $this->pdo->query("SELECT id FROM elections ORDER BY id LIMIT 1");
        $electionId = $stmt->fetchColumn();
        
        if ($electionId === false || $electionId === null) {
            echo "  - No elections found, skipping votes.\n";
            return;
        }
        
        echo "  - Using election ID: {$electionId}\n";

        // Check if votes already exist for this election
        $checkStmt = $this->pdo->prepare("SELECT COUNT(*) FROM candidacy_votes WHERE election_id = ?");
        $checkStmt->execute([$electionId]);
        $existingVotes = $checkStmt->fetchColumn();
        
        if ($existingVotes > 0) {
            echo "  - {$existingVotes} votes already exist. Clearing them for fresh seed...\n";
            $deleteStmt = $this->pdo->prepare("DELETE FROM candidacy_votes WHERE election_id = ?");
            $deleteStmt->execute([$electionId]);
            echo "  - Old votes cleared.\n";
        }

        // Get candidates for this election grouped by position
        $stmt = $this->pdo->prepare("
            SELECT id, position 
            FROM candidates 
            WHERE election_id = ? AND is_archived = 0
            ORDER BY position, id
        ");
        $stmt->execute([$electionId]);
        $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($candidates) === 0) {
            echo "  - No candidates found for election, skipping votes.\n";
            return;
        }
        
        // Group by position
        $candidatesByPosition = [];
        foreach ($candidates as $candidate) {
            $candidatesByPosition[$candidate['position']][] = $candidate['id'];
        }

        // Get verified voters
        $stmt = $this->pdo->query("SELECT id FROM voters WHERE is_verified = 1 AND is_archived = 0");
        $voters = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($voters) === 0) {
            echo "  - No verified voters found, skipping votes.\n";
            return;
        }

        // Create votes for each voter
        $voteCount = 0;
        foreach ($voters as $voterId) {
            $votes = [];
            
            // Vote for one candidate per position
            foreach ($candidatesByPosition as $position => $candidateIds) {
                // Randomly select a candidate for this position
                $selectedCandidateId = $candidateIds[array_rand($candidateIds)];
                $votes[] = [
                    'position' => $position,
                    'candidate_id' => $selectedCandidateId
                ];
            }

            try {
                // Insert vote record
                $sql = "INSERT INTO candidacy_votes (voter_id, election_id, candidates_voted) 
                        VALUES (?, ?, ?)";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    $voterId,
                    $electionId,
                    json_encode($votes)
                ]);
                $voteCount++;
            } catch (\Exception $e) {
                // Skip if vote already exists for this voter/election
                continue;
            }
        }

        echo "  ✓ Created votes for {$voteCount} voters\n";
    }
}

// Run seeder if called directly
if (php_sapi_name() === 'cli') {
    $con = new DatabaseAccess();
    $pdo = $con->connect();
    
    $seeder = new Seeder($pdo);
    $seeder->seed();
}
?>

