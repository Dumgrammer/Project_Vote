<?php

require_once __DIR__ . '/../utils/utils.php';
require_once __DIR__ . '/../utils/FileUpload.php';

class VoterController extends GlobalUtil {
    private $pdo;
    private $fileUpload;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->fileUpload = new FileUpload('./uploads/voters/');
        
        // Ensure voters table and candidacy_votes table exist
        $this->createVotersTable($pdo);
        $this->createCandidacyVotesTable($pdo);
    }

    // Create a new voter
    public function createVoter($data, $files) {
        try {
            // For public registration, authentication is not required
            $isAdminCreate = $this->isAuthenticated();

            // Validate required fields
            if (empty($data['fname']) || empty($data['lname']) || empty($data['email'])) {
                return $this->sendErrorResponse("First name, last name, and email are required", 400);
            }

            // Validate password (required for public registration)
            if (!$isAdminCreate && empty($data['password'])) {
                return $this->sendErrorResponse("Password is required", 400);
            }

            // Check if email already exists
            $checkEmail = $this->pdo->prepare("SELECT id FROM voters WHERE email = ?");
            $checkEmail->execute([$data['email']]);
            if ($checkEmail->fetch()) {
                return $this->sendErrorResponse("Email already registered", 400);
            }

            // Auto-generate voter ID
            $voters_id = $this->generateVoterId();

            // Handle image upload
            $imagePath = null;
            if (isset($files['v_image']) && isset($files['v_image']['tmp_name']) && !empty($files['v_image']['tmp_name'])) {
                $uploadResult = $this->fileUpload->upload($files['v_image']);
                if ($uploadResult['success']) {
                    $imagePath = $uploadResult['filename'];
                } else {
                    return $this->sendErrorResponse($uploadResult['message'], 400);
                }
            }

            // Hash password (use default 'Pollify123' if admin doesn't provide one)
            $password = !empty($data['password']) ? $data['password'] : 'Pollify123';
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Insert voter
            $sql = "INSERT INTO voters (voters_id, v_image, fname, mname, lname, email, contact_number, password, is_verified, is_archived, created_by) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $voters_id,
                $imagePath,
                $data['fname'],
                $data['mname'] ?? '',
                $data['lname'],
                $data['email'],
                $data['contact_number'] ?? null,
                $hashedPassword,
                isset($data['is_verified']) ? filter_var($data['is_verified'], FILTER_VALIDATE_BOOLEAN) : false,
                isset($data['is_archived']) ? filter_var($data['is_archived'], FILTER_VALIDATE_BOOLEAN) : false,
                $isAdminCreate ? $_SESSION['user_id'] : null
            ]);

            $voterId = $this->pdo->lastInsertId();

            // If verified, update date_verified
            if (isset($data['is_verified']) && filter_var($data['is_verified'], FILTER_VALIDATE_BOOLEAN)) {
                $updateStmt = $this->pdo->prepare("UPDATE voters SET date_verified = NOW() WHERE id = ?");
                $updateStmt->execute([$voterId]);
            }

            return $this->sendResponse([
                'id' => $voterId,
                'voters_id' => $voters_id,
                'message' => 'Voter registered successfully'
            ], 201);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to create voter: " . $e->getMessage(), 500);
        }
    }

    // Generate unique voter ID
    private function generateVoterId() {
        $year = date('Y');
        $prefix = 'V' . $year;
        
        // Get the last voter ID for this year
        $stmt = $this->pdo->prepare("SELECT voters_id FROM voters WHERE voters_id LIKE ? ORDER BY voters_id DESC LIMIT 1");
        $stmt->execute([$prefix . '%']);
        $lastVoter = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($lastVoter) {
            // Extract the number part and increment
            $lastNumber = (int) substr($lastVoter['voters_id'], strlen($prefix));
            $newNumber = $lastNumber + 1;
        } else {
            // First voter of the year
            $newNumber = 1;
        }
        
        // Format: V2025-00001
        return $prefix . '-' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }

    // Get all voters
    public function getAllVoters($includeArchived = false) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized", 401);
            }

            $sql = "SELECT 
                        v.*,
                        CONCAT(v.fname, ' ', IFNULL(CONCAT(v.mname, ' '), ''), v.lname) as full_name,
                        CONCAT(a.fname, ' ', IFNULL(CONCAT(a.mname, ' '), ''), a.lname) as creator_name,
                        a.email as creator_email
                    FROM voters v
                    LEFT JOIN admin a ON v.created_by = a.id";
            
            if (!$includeArchived) {
                $sql .= " WHERE v.is_archived = FALSE";
            }
            
            $sql .= " ORDER BY v.date_registered DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $voters = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Add image URLs and convert booleans
            foreach ($voters as &$voter) {
                $voter['v_image_url'] = $voter['v_image'] ? $this->fileUpload->getFileUrl($voter['v_image']) : null;
                $voter['is_verified'] = (bool)$voter['is_verified'];
                $voter['is_archived'] = (bool)$voter['is_archived'];
            }

            return $this->sendResponse($voters, 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to get voters: " . $e->getMessage(), 500);
        }
    }

    // Get voter by ID
    public function getVoterById($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized", 401);
            }

            $sql = "SELECT 
                        v.*,
                        CONCAT(v.fname, ' ', IFNULL(CONCAT(v.mname, ' '), ''), v.lname) as full_name,
                        CONCAT(a.fname, ' ', IFNULL(CONCAT(a.mname, ' '), ''), a.lname) as creator_name,
                        a.email as creator_email
                    FROM voters v
                    LEFT JOIN admin a ON v.created_by = a.id
                    WHERE v.id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$id]);
            $voter = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$voter) {
                return $this->sendErrorResponse("Voter not found", 404);
            }

            // Add image URL and convert booleans
            $voter['v_image_url'] = $voter['v_image'] ? $this->fileUpload->getFileUrl($voter['v_image']) : null;
            $voter['is_verified'] = (bool)$voter['is_verified'];
            $voter['is_archived'] = (bool)$voter['is_archived'];

            return $this->sendResponse($voter, 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to get voter: " . $e->getMessage(), 500);
        }
    }

    // Update voter
    public function updateVoter($id, $data, $files) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized", 401);
            }

            // Check if voter exists
            $checkStmt = $this->pdo->prepare("SELECT v_image FROM voters WHERE id = ?");
            $checkStmt->execute([$id]);
            $existingVoter = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$existingVoter) {
                return $this->sendErrorResponse("Voter not found", 404);
            }

            // Note: voters_id cannot be changed once created

            // Handle image upload
            $imagePath = $existingVoter['v_image'];
            if (isset($files['v_image']) && isset($files['v_image']['tmp_name']) && !empty($files['v_image']['tmp_name'])) {
                // Delete old image
                if ($imagePath) {
                    $this->fileUpload->delete($imagePath);
                }
                // Upload new image
                $uploadResult = $this->fileUpload->upload($files['v_image']);
                if ($uploadResult['success']) {
                    $imagePath = $uploadResult['filename'];
                } else {
                    return $this->sendErrorResponse($uploadResult['message'], 400);
                }
            }

            // Check if is_verified is being set to true and date_verified is null
            $updateDateVerified = false;
            if (isset($data['is_verified'])) {
                $isVerified = filter_var($data['is_verified'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                // Check various representations of "true"
                if ($isVerified === true || $data['is_verified'] === 'true' || $data['is_verified'] === '1' || $data['is_verified'] === 1) {
                    $checkVerifiedStmt = $this->pdo->prepare("SELECT date_verified, is_verified FROM voters WHERE id = ?");
                    $checkVerifiedStmt->execute([$id]);
                    $voterData = $checkVerifiedStmt->fetch(PDO::FETCH_ASSOC);
                    // Only update date_verified if transitioning from unverified to verified
                    if ($voterData && !$voterData['is_verified'] && empty($voterData['date_verified'])) {
                        $updateDateVerified = true;
                    }
                }
            }

            // Build update query
            $fields = [];
            $values = [];

            // voters_id is not updatable
            if (isset($data['fname'])) {
                $fields[] = "fname = ?";
                $values[] = $data['fname'];
            }
            if (isset($data['mname'])) {
                $fields[] = "mname = ?";
                $values[] = $data['mname'];
            }
            if (isset($data['lname'])) {
                $fields[] = "lname = ?";
                $values[] = $data['lname'];
            }
            if (isset($data['email'])) {
                $fields[] = "email = ?";
                $values[] = $data['email'];
            }
            if (isset($data['contact_number'])) {
                $fields[] = "contact_number = ?";
                $values[] = $data['contact_number'];
            }
            // Only update password if provided and not empty (leave blank to keep current)
            if (isset($data['password']) && !empty(trim($data['password']))) {
                $fields[] = "password = ?";
                $values[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            if (isset($data['is_verified'])) {
                $isVerified = filter_var($data['is_verified'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                $fields[] = "is_verified = ?";
                $values[] = ($isVerified === true) ? 1 : 0;
            }
            if (isset($data['is_archived'])) {
                $isArchived = filter_var($data['is_archived'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                $fields[] = "is_archived = ?";
                $values[] = ($isArchived === true) ? 1 : 0;
            }
            if ($imagePath !== $existingVoter['v_image']) {
                $fields[] = "v_image = ?";
                $values[] = $imagePath;
            }
            if ($updateDateVerified) {
                $fields[] = "date_verified = NOW()";
            }

            if (empty($fields)) {
                return $this->sendErrorResponse("No fields to update", 400);
            }

            $values[] = $id;
            $sql = "UPDATE voters SET " . implode(", ", $fields) . " WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($values);

            return $this->sendResponse(['message' => 'Voter updated successfully'], 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to update voter: " . $e->getMessage(), 500);
        }
    }

    // Archive voter
    public function archiveVoter($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized", 401);
            }

            $stmt = $this->pdo->prepare("UPDATE voters SET is_archived = TRUE WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                return $this->sendErrorResponse("Voter not found", 404);
            }

            return $this->sendResponse(['message' => 'Voter archived successfully'], 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to archive voter: " . $e->getMessage(), 500);
        }
    }

    // Delete voter
    public function deleteVoter($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized", 401);
            }

            // Get voter image before deleting
            $stmt = $this->pdo->prepare("SELECT v_image FROM voters WHERE id = ?");
            $stmt->execute([$id]);
            $voter = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$voter) {
                return $this->sendErrorResponse("Voter not found", 404);
            }

            // Delete voter
            $deleteStmt = $this->pdo->prepare("DELETE FROM voters WHERE id = ?");
            $deleteStmt->execute([$id]);

            // Delete image file
            if ($voter['v_image']) {
                $this->fileUpload->delete($voter['v_image']);
            }

            return $this->sendResponse(['message' => 'Voter deleted successfully'], 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to delete voter: " . $e->getMessage(), 500);
        }
    }

    // Search voters by name or voter ID (public endpoint)
    public function searchVoters($searchTerm) {
        try {
            // No authentication required for public search
            
            $sql = "SELECT 
                        v.voters_id,
                        CONCAT(v.fname, ' ', IFNULL(CONCAT(v.mname, ' '), ''), v.lname) as full_name,
                        v.is_verified
                    FROM voters v
                    WHERE v.is_archived = FALSE 
                    AND (v.voters_id LIKE ? OR 
                         CONCAT(v.fname, ' ', IFNULL(CONCAT(v.mname, ' '), ''), v.lname) LIKE ?)
                    LIMIT 50";
            
            $searchPattern = '%' . $searchTerm . '%';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$searchPattern, $searchPattern]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $this->sendResponse($results, 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to search voters: " . $e->getMessage(), 500);
        }
    }

    // Cast votes for an election
    public function castVotes($electionId, $votes) {
        try {
            // Log for debugging
            error_log("Cast votes called for election: " . $electionId);
            error_log("Votes data: " . print_r($votes, true));
            
            // Check if voter is authenticated (voter session)
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if (!isset($_SESSION['voter_logged_in']) || $_SESSION['voter_logged_in'] !== true) {
                error_log("Voter not logged in");
                return $this->sendErrorResponse("Unauthorized: Voter must be logged in", 401);
            }

            $voterId = $_SESSION['voter_id'];
            error_log("Voter ID: " . $voterId);

            // Verify voter exists and is verified
            $voterStmt = $this->pdo->prepare("SELECT is_verified, is_archived FROM voters WHERE id = ?");
            $voterStmt->execute([$voterId]);
            $voter = $voterStmt->fetch(PDO::FETCH_ASSOC);

            if (!$voter) {
                error_log("Voter not found in database");
                return $this->sendErrorResponse("Voter not found", 404);
            }

            error_log("Voter verified status: " . ($voter['is_verified'] ? 'true' : 'false'));

            if (!$voter['is_verified']) {
                return $this->sendErrorResponse("Only verified voters can vote", 403);
            }

            if ($voter['is_archived']) {
                return $this->sendErrorResponse("Archived voters cannot vote", 403);
            }

            // Check if election exists and is ongoing
            $electionStmt = $this->pdo->prepare("SELECT start_date, end_date FROM elections WHERE id = ? AND is_archived = FALSE");
            $electionStmt->execute([$electionId]);
            $election = $electionStmt->fetch(PDO::FETCH_ASSOC);

            if (!$election) {
                error_log("Election not found: " . $electionId);
                return $this->sendErrorResponse("Election not found", 404);
            }

            $now = new DateTime();
            $startDate = new DateTime($election['start_date']);
            $endDate = new DateTime($election['end_date']);

            error_log("Election dates - Start: " . $startDate->format('Y-m-d H:i:s') . ", End: " . $endDate->format('Y-m-d H:i:s') . ", Now: " . $now->format('Y-m-d H:i:s'));

            if ($now < $startDate) {
                return $this->sendErrorResponse("Election has not started yet", 400);
            }

            if ($now > $endDate) {
                return $this->sendErrorResponse("Election has ended", 400);
            }

            // Validate votes array
            if (empty($votes) || !is_array($votes)) {
                error_log("Invalid votes data - empty or not array");
                return $this->sendErrorResponse("Invalid votes data", 400);
            }

            // Begin transaction
            $this->pdo->beginTransaction();

            // Validate all candidates before saving
            $validatedVotes = [];
            foreach ($votes as $vote) {
                if (!isset($vote['candidate_id']) || !isset($vote['position'])) {
                    $this->pdo->rollBack();
                    error_log("Invalid vote format - missing candidate_id or position");
                    return $this->sendErrorResponse("Invalid vote format", 400);
                }

                $candidateId = $vote['candidate_id'];
                $position = $vote['position'];

                // Verify candidate exists and belongs to this election
                $candidateStmt = $this->pdo->prepare("SELECT id, position FROM candidates WHERE id = ? AND election_id = ? AND is_archived = FALSE");
                $candidateStmt->execute([$candidateId, $electionId]);
                $candidate = $candidateStmt->fetch(PDO::FETCH_ASSOC);

                if (!$candidate) {
                    $this->pdo->rollBack();
                    error_log("Invalid candidate: " . $candidateId);
                    return $this->sendErrorResponse("Invalid candidate", 400);
                }

                if ($candidate['position'] !== $position) {
                    $this->pdo->rollBack();
                    error_log("Position mismatch - expected: " . $candidate['position'] . ", got: " . $position);
                    return $this->sendErrorResponse("Candidate position mismatch", 400);
                }

                $validatedVotes[] = [
                    'candidate_id' => $candidateId,
                    'position' => $position
                ];
            }

            // Convert votes array to JSON
            $votesJson = json_encode($validatedVotes);
            error_log("Validated votes JSON: " . $votesJson);

            // Insert or update votes (one row per voter per election)
            $voteStmt = $this->pdo->prepare("
                INSERT INTO candidacy_votes (voter_id, election_id, candidates_voted, date_voted) 
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                    candidates_voted = VALUES(candidates_voted),
                    date_updated = NOW()
            ");
            $result = $voteStmt->execute([$voterId, $electionId, $votesJson]);
            
            error_log("Vote insert/update result: " . ($result ? 'success' : 'failed'));
            error_log("Rows affected: " . $voteStmt->rowCount());

            $this->pdo->commit();

            return $this->sendResponse([
                'message' => 'Votes cast successfully',
                'votes_count' => count($validatedVotes),
                'voter_id' => $voterId,
                'election_id' => $electionId
            ], 200);

        } catch (\Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("Exception in castVotes: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return $this->sendErrorResponse("Failed to cast votes: " . $e->getMessage(), 500);
        }
    }

    // Get voter's votes for a specific election
    public function getVoterVotes($electionId) {
        try {
            // Check if voter is authenticated
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if (!isset($_SESSION['voter_logged_in']) || $_SESSION['voter_logged_in'] !== true) {
                return $this->sendErrorResponse("Unauthorized: Voter must be logged in", 401);
            }

            $voterId = $_SESSION['voter_id'];

            // Get the vote record for this voter and election
            $sql = "SELECT 
                        cv.id,
                        cv.candidates_voted,
                        cv.date_voted,
                        cv.date_updated
                    FROM candidacy_votes cv
                    WHERE cv.voter_id = ? AND cv.election_id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$voterId, $electionId]);
            $voteRecord = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$voteRecord) {
                return $this->sendResponse([
                    'has_voted' => false,
                    'votes' => []
                ], 200);
            }

            // Decode the JSON array of votes
            $candidatesVoted = json_decode($voteRecord['candidates_voted'], true);
            
            // Fetch candidate details for each vote
            $detailedVotes = [];
            foreach ($candidatesVoted as $vote) {
                $candidateStmt = $this->pdo->prepare("
                    SELECT 
                        c.id,
                        CONCAT(c.fname, ' ', IFNULL(CONCAT(c.mname, ' '), ''), c.lname) as candidate_name,
                        c.position,
                        p.party_name,
                        p.party_code
                    FROM candidates c
                    LEFT JOIN parties p ON c.party_id = p.id
                    WHERE c.id = ?
                ");
                $candidateStmt->execute([$vote['candidate_id']]);
                $candidate = $candidateStmt->fetch(PDO::FETCH_ASSOC);

                if ($candidate) {
                    $detailedVotes[] = [
                        'candidate_id' => $vote['candidate_id'],
                        'position' => $vote['position'],
                        'candidate_name' => $candidate['candidate_name'],
                        'party_name' => $candidate['party_name'],
                        'party_code' => $candidate['party_code'],
                        'date_voted' => $voteRecord['date_voted']
                    ];
                }
            }

            return $this->sendResponse([
                'has_voted' => true,
                'votes' => $detailedVotes,
                'date_voted' => $voteRecord['date_voted'],
                'date_updated' => $voteRecord['date_updated']
            ], 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to get voter votes: " . $e->getMessage(), 500);
        }
    }
}

?>

