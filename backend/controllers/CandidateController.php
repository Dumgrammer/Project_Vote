<?php
require_once('./utils/utils.php');
require_once('./utils/FileUpload.php');

class CandidateController extends GlobalUtil {
    private $pdo;
    private $fileUpload;

    public function __construct($dbAccess) {
        $this->pdo = $dbAccess->connect();
        $this->fileUpload = new FileUpload('./uploads/candidates/');
        
        // Ensure positions table exists first (foreign key dependency)
        $this->createPositionsTable($this->pdo);
        // Ensure parties table exists first (foreign key dependency)
        $this->createPartiesTable($this->pdo);
        // Then ensure candidates table exists
        $this->createCandidatesTable($this->pdo);
    }

    // Create a new candidate
    public function createCandidate($election_id, $fname, $mname, $lname, $party_id, $position_id, $bio, $photoFile = null) {
        try {
            // Validate required fields
            if (empty($election_id) || empty($fname) || empty($lname) || empty($party_id) || empty($position_id)) {
                return $this->sendErrorResponse("Election ID, first name, last name, party, and position are required", 400);
            }

            // Verify election exists
            $electionCheck = $this->pdo->prepare("SELECT id, election_type FROM elections WHERE id = :id");
            $electionCheck->execute(['id' => $election_id]);
            $election = $electionCheck->fetch(PDO::FETCH_ASSOC);
            if (!$election) {
                return $this->sendErrorResponse("Election not found", 404);
            }

            // Verify party exists
            $partyCheck = $this->pdo->prepare("SELECT id FROM parties WHERE id = :id");
            $partyCheck->execute(['id' => $party_id]);
            if (!$partyCheck->fetch()) {
                return $this->sendErrorResponse("Party not found", 404);
            }

            // Verify position exists and matches election type
            $positionCheck = $this->pdo->prepare("SELECT id, name, type FROM positions WHERE id = :id AND is_archived = FALSE");
            $positionCheck->execute(['id' => $position_id]);
            $position = $positionCheck->fetch(PDO::FETCH_ASSOC);
            if (!$position) {
                return $this->sendErrorResponse("Position not found", 404);
            }
            if (strtolower($position['type']) !== strtolower($election['election_type'])) {
                return $this->sendErrorResponse("Position type does not match election type", 400);
            }

            // Handle photo upload
            $photo = null;
            if ($photoFile && isset($photoFile['tmp_name']) && !empty($photoFile['tmp_name'])) {
                $uploadResult = $this->fileUpload->upload($photoFile);
                if (!$uploadResult['success']) {
                    return $this->sendErrorResponse($uploadResult['message'], 400);
                }
                $photo = $uploadResult['filename'];
            }

            $created_by = $_SESSION['user_id'] ?? 1; // Default to admin ID 1 if no session
            $positionName = $position['name']; // Store position name for backward compatibility

            $sql = "INSERT INTO candidates (election_id, fname, mname, lname, party_id, position_id, position, bio, photo, created_by) 
                    VALUES (:election_id, :fname, :mname, :lname, :party_id, :position_id, :position, :bio, :photo, :created_by)";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':election_id', $election_id);
            $stmt->bindParam(':fname', $fname);
            $stmt->bindParam(':mname', $mname);
            $stmt->bindParam(':lname', $lname);
            $stmt->bindParam(':party_id', $party_id);
            $stmt->bindParam(':position_id', $position_id);
            $stmt->bindParam(':position', $positionName);
            $stmt->bindParam(':bio', $bio);
            $stmt->bindParam(':photo', $photo);
            $stmt->bindParam(':created_by', $created_by);
            
            if ($stmt->execute()) {
                $candidateId = $this->pdo->lastInsertId();
                
                // Fetch the created candidate
                $candidate = $this->getCandidateById($candidateId);
                
                return $this->sendResponse([
                    'message' => 'Candidate created successfully',
                    'candidate' => $candidate['data']
                ], 201);
            } else {
                return $this->sendErrorResponse("Failed to create candidate", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error creating candidate: " . $e->getMessage(), 500);
        }
    }

    // Get all candidates for an election
    public function getCandidatesByElection($election_id, $includeArchived = false) {
        try {
            $sql = "SELECT c.*, 
                           p.party_name,
                           p.party_code,
                           pos.name as position_name,
                           pos.allows_multiple_votes,
                           CONCAT(a.fname, ' ', a.lname) as creator_name,
                           a.email as creator_email,
                           CONCAT(c.fname, ' ', IFNULL(CONCAT(c.mname, ' '), ''), c.lname) as full_name
                    FROM candidates c
                    LEFT JOIN parties p ON c.party_id = p.id
                    LEFT JOIN positions pos ON c.position_id = pos.id
                    LEFT JOIN admin a ON c.created_by = a.id
                    WHERE c.election_id = :election_id";
            
            if (!$includeArchived) {
                $sql .= " AND c.is_archived = FALSE";
            }
            
            $sql .= " ORDER BY c.created DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['election_id' => $election_id]);
            
            $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Add photo URL to each candidate
            foreach ($candidates as &$candidate) {
                $candidate['photo_url'] = $candidate['photo'] ? $this->fileUpload->getFileUrl($candidate['photo']) : null;
            }
            
            return $this->sendResponse($candidates, 200);
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error fetching candidates: " . $e->getMessage(), 500);
        }
    }

    // Get candidate by ID
    public function getCandidateById($id) {
        try {
            $sql = "SELECT c.*, 
                           p.party_name,
                           p.party_code,
                           pos.name as position_name,
                           pos.allows_multiple_votes,
                           CONCAT(a.fname, ' ', a.lname) as creator_name,
                           a.email as creator_email,
                           CONCAT(c.fname, ' ', IFNULL(CONCAT(c.mname, ' '), ''), c.lname) as full_name
                    FROM candidates c
                    LEFT JOIN parties p ON c.party_id = p.id
                    LEFT JOIN positions pos ON c.position_id = pos.id
                    LEFT JOIN admin a ON c.created_by = a.id
                    WHERE c.id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            $candidate = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($candidate) {
                $candidate['photo_url'] = $candidate['photo'] ? $this->fileUpload->getFileUrl($candidate['photo']) : null;
                return $this->sendResponse($candidate, 200);
            } else {
                return $this->sendErrorResponse("Candidate not found", 404);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error fetching candidate: " . $e->getMessage(), 500);
        }
    }

    // Update candidate
    public function updateCandidate($id, $fname, $mname, $lname, $party_id, $position_id, $bio, $photoFile = null) {
        try {
            // Validate required fields first
            if (empty($fname) || empty($lname) || empty($party_id) || empty($position_id)) {
                return $this->sendErrorResponse("First name, last name, party, and position are required", 400);
            }
            
            // Check if candidate exists
            $existingCandidate = $this->getCandidateById($id);
            if ($existingCandidate['status'] === 'error') {
                return $existingCandidate;
            }
            
            // Ensure we have the data array
            if (!isset($existingCandidate['data'])) {
                return $this->sendErrorResponse("Candidate data not found", 404);
            }

            // Get election to verify position type match
            $electionCheck = $this->pdo->prepare("SELECT e.id as election_id, e.election_type FROM candidates c JOIN elections e ON c.election_id = e.id WHERE c.id = :id");
            $electionCheck->execute(['id' => $id]);
            $electionData = $electionCheck->fetch(PDO::FETCH_ASSOC);
            if (!$electionData) {
                return $this->sendErrorResponse("Election not found for this candidate", 404);
            }

            // Verify party exists
            $partyCheck = $this->pdo->prepare("SELECT id FROM parties WHERE id = :id");
            $partyCheck->execute(['id' => $party_id]);
            if (!$partyCheck->fetch()) {
                return $this->sendErrorResponse("Party not found", 404);
            }

            // Verify position exists and matches election type
            $positionCheck = $this->pdo->prepare("SELECT id, name, type FROM positions WHERE id = :id AND is_archived = FALSE");
            $positionCheck->execute(['id' => $position_id]);
            $position = $positionCheck->fetch(PDO::FETCH_ASSOC);
            if (!$position) {
                return $this->sendErrorResponse("Position not found", 404);
            }
            if (strtolower($position['type']) !== strtolower($electionData['election_type'])) {
                return $this->sendErrorResponse("Position type does not match election type", 400);
            }

            // Handle photo upload
            $photo = $existingCandidate['data']['photo']; // Keep existing photo by default
            if ($photoFile && isset($photoFile['tmp_name']) && !empty($photoFile['tmp_name'])) {
                $uploadResult = $this->fileUpload->upload($photoFile);
                if (!$uploadResult['success']) {
                    return $this->sendErrorResponse($uploadResult['message'], 400);
                }
                
                // Delete old photo if exists
                if (!empty($existingCandidate['data']['photo'])) {
                    $this->fileUpload->delete($existingCandidate['data']['photo']);
                }
                
                $photo = $uploadResult['filename'];
            }

            $positionName = $position['name']; // Store position name for backward compatibility

            $sql = "UPDATE candidates SET 
                    fname = :fname,
                    mname = :mname,
                    lname = :lname,
                    party_id = :party_id,
                    position_id = :position_id,
                    position = :position,
                    bio = :bio,
                    photo = :photo
                    WHERE id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':fname', $fname);
            $stmt->bindParam(':mname', $mname);
            $stmt->bindParam(':lname', $lname);
            $stmt->bindParam(':party_id', $party_id);
            $stmt->bindParam(':position_id', $position_id);
            $stmt->bindParam(':position', $positionName);
            $stmt->bindParam(':bio', $bio);
            $stmt->bindParam(':photo', $photo);
            
            if ($stmt->execute()) {
                $updatedCandidate = $this->getCandidateById($id);
                return $this->sendResponse([
                    'message' => 'Candidate updated successfully',
                    'candidate' => $updatedCandidate['data']
                ], 200);
            } else {
                return $this->sendErrorResponse("Failed to update candidate", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error updating candidate: " . $e->getMessage(), 500);
        }
    }

    // Archive candidate (soft delete)
    public function archiveCandidate($id) {
        try {
            $sql = "UPDATE candidates SET is_archived = TRUE WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    return $this->sendResponse(['message' => 'Candidate archived successfully'], 200);
                } else {
                    return $this->sendErrorResponse("Candidate not found", 404);
                }
            } else {
                return $this->sendErrorResponse("Failed to archive candidate", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error archiving candidate: " . $e->getMessage(), 500);
        }
    }

    // Delete candidate permanently
    public function deleteCandidate($id) {
        try {
            // Get candidate to delete photo
            $candidate = $this->getCandidateById($id);
            if ($candidate['status'] === 'error') {
                return $candidate;
            }

            $sql = "DELETE FROM candidates WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    // Delete photo file if exists
                    if (!empty($candidate['data']['photo'])) {
                        $this->fileUpload->delete($candidate['data']['photo']);
                    }
                    return $this->sendResponse(['message' => 'Candidate deleted successfully'], 200);
                } else {
                    return $this->sendErrorResponse("Candidate not found", 404);
                }
            } else {
                return $this->sendErrorResponse("Failed to delete candidate", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error deleting candidate: " . $e->getMessage(), 500);
        }
    }

    // Get candidates by election (public endpoint)
    public function getCandidatesByElectionPublic($electionId) {
        try {
            // No authentication required for public view
            
            // Check if election exists
            $electionStmt = $this->pdo->prepare("SELECT id, election_title, election_type FROM elections WHERE id = ? AND is_archived = FALSE");
            $electionStmt->execute([$electionId]);
            $election = $electionStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$election) {
                return $this->sendErrorResponse("Election not found", 404);
            }

            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            if (isset($_SESSION['voter_logged_in']) && $_SESSION['voter_logged_in'] === true) {
                $voterType = strtolower($_SESSION['voter_type'] ?? '');
                if ($voterType && strtolower($election['election_type'] ?? '') !== $voterType) {
                    return $this->sendErrorResponse("This election is not available for your voter type.", 403);
                }
            }

            $sql = "SELECT 
                        c.id,
                        c.photo,
                        CONCAT(c.fname, ' ', IFNULL(CONCAT(c.mname, ' '), ''), c.lname) as full_name,
                        c.position,
                        c.position_id,
                        pos.name as position_name,
                        pos.allows_multiple_votes,
                        c.bio,
                        p.party_name,
                        p.party_code
                    FROM candidates c
                    LEFT JOIN parties p ON c.party_id = p.id
                    LEFT JOIN positions pos ON c.position_id = pos.id
                    WHERE c.election_id = ? AND c.is_archived = FALSE
                    ORDER BY c.position, c.lname";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$electionId]);
            $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Add photo URLs and normalize boolean fields
            foreach ($candidates as &$candidate) {
                $candidate['photo_url'] = $candidate['photo'] ? $this->fileUpload->getFileUrl($candidate['photo']) : null;
                unset($candidate['photo']);
                // Ensure allows_multiple_votes is a boolean
                $candidate['allows_multiple_votes'] = (bool) $candidate['allows_multiple_votes'];
            }

            return $this->sendResponse([
                'election' => $election,
                'candidates' => $candidates
            ], 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to get candidates: " . $e->getMessage(), 500);
        }
    }
}

?>

