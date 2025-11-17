<?php
require_once('./utils/utils.php');
require_once('./utils/FileUpload.php');

class ElectionController extends GlobalUtil {
    private $pdo;
    private $fileUpload;

    public function __construct($dbAccess) {
        $this->pdo = $dbAccess->connect();
        $this->fileUpload = new FileUpload();
        
        // Ensure elections table exists
        $this->createElectionsTable($this->pdo);
    }

    // Create a new election
    private array $allowedElectionTypes = ['school', 'corporate', 'barangay'];

    public function createElection($election_title, $description, $start_date, $end_date, $election_type = 'school', $imgFile = null) {
        try {
            // Check if user is authenticated
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            // Validate required fields
            if (empty($election_title) || empty($start_date) || empty($end_date)) {
                return $this->sendErrorResponse("Election title, start date, and end date are required", 400);
            }

            // Validate dates
            $start = strtotime($start_date);
            $end = strtotime($end_date);
            
            if ($start === false || $end === false) {
                return $this->sendErrorResponse("Invalid date format", 400);
            }

            if ($end <= $start) {
                return $this->sendErrorResponse("End date must be after start date", 400);
            }

            // Validate election type
            $normalizedType = strtolower(trim($election_type ?? ''));
            if (empty($normalizedType) || !in_array($normalizedType, $this->allowedElectionTypes, true)) {
                return $this->sendErrorResponse("Election type must be one of: school, corporate, barangay", 400);
            }

            // Handle file upload
            $img = null;
            if ($imgFile && isset($imgFile['tmp_name']) && !empty($imgFile['tmp_name'])) {
                $uploadResult = $this->fileUpload->upload($imgFile);
                if (!$uploadResult['success']) {
                    return $this->sendErrorResponse($uploadResult['message'], 400);
                }
                $img = $uploadResult['filename'];
            }

            $created_by = $_SESSION['user_id'];

            $sql = "INSERT INTO elections (election_title, description, election_type, start_date, end_date, img, created_by) 
                    VALUES (:election_title, :description, :election_type, :start_date, :end_date, :img, :created_by)";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':election_title', $election_title);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':election_type', $normalizedType);
            $stmt->bindParam(':start_date', $start_date);
            $stmt->bindParam(':end_date', $end_date);
            $stmt->bindParam(':img', $img);
            $stmt->bindParam(':created_by', $created_by);
            
            if ($stmt->execute()) {
                $electionId = $this->pdo->lastInsertId();
                
                // Fetch the created election
                $election = $this->getElectionById($electionId);
                
                return $this->sendResponse([
                    'message' => 'Election created successfully',
                    'election' => $election['data']
                ], 201);
            } else {
                return $this->sendErrorResponse("Failed to create election", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error creating election: " . $e->getMessage(), 500);
        }
    }

    // Get all elections (not archived by default)
    public function getAllElections($includeArchived = false) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            $sql = "SELECT e.*, 
                           CONCAT(a.fname, ' ', a.lname) as creator_name,
                           a.email as creator_email
                    FROM elections e
                    LEFT JOIN admin a ON e.created_by = a.id";
            
            if (!$includeArchived) {
                $sql .= " WHERE e.is_archived = FALSE";
            }
            
            $sql .= " ORDER BY e.created DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            
            $elections = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Add status and full image URL to each election
            foreach ($elections as &$election) {
                $election['status'] = $this->getElectionStatus($election['start_date'], $election['end_date']);
                $election['img_url'] = $election['img'] ? $this->fileUpload->getFileUrl($election['img']) : null;
            }
            
            return $this->sendResponse($elections, 200);
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error fetching elections: " . $e->getMessage(), 500);
        }
    }

    // Get election by ID
    public function getElectionById($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            $sql = "SELECT e.*, 
                           CONCAT(a.fname, ' ', a.lname) as creator_name,
                           a.email as creator_email
                    FROM elections e
                    LEFT JOIN admin a ON e.created_by = a.id
                    WHERE e.id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            $election = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($election) {
                $election['status'] = $this->getElectionStatus($election['start_date'], $election['end_date']);
                $election['img_url'] = $election['img'] ? $this->fileUpload->getFileUrl($election['img']) : null;
                return $this->sendResponse($election, 200);
            } else {
                return $this->sendErrorResponse("Election not found", 404);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error fetching election: " . $e->getMessage(), 500);
        }
    }

    // Update election
    public function updateElection($id, $election_title, $description, $start_date, $end_date, $election_type = null, $imgFile = null) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            // Check if election exists
            $existingElection = $this->getElectionById($id);
            if ($existingElection['status'] === 'error') {
                return $existingElection;
            }

            // Validate dates if provided
            if ($start_date && $end_date) {
                $start = strtotime($start_date);
                $end = strtotime($end_date);
                
                if ($start === false || $end === false) {
                    return $this->sendErrorResponse("Invalid date format", 400);
                }

                if ($end <= $start) {
                    return $this->sendErrorResponse("End date must be after start date", 400);
                }
            }

            // Handle file upload
            $img = $existingElection['data']['img']; // Keep existing image by default
            if ($imgFile && isset($imgFile['tmp_name']) && !empty($imgFile['tmp_name'])) {
                $uploadResult = $this->fileUpload->upload($imgFile);
                if (!$uploadResult['success']) {
                    return $this->sendErrorResponse($uploadResult['message'], 400);
                }
                
                // Delete old image if exists
                if (!empty($existingElection['data']['img'])) {
                    $this->fileUpload->delete($existingElection['data']['img']);
                }
                
                $img = $uploadResult['filename'];
            }

            $updateFields = "
                    election_title = :election_title,
                    description = :description,
                    start_date = :start_date,
                    end_date = :end_date,
                    img = :img
            ";

            $normalizedType = null;
            if ($election_type !== null) {
                $normalizedType = strtolower(trim($election_type));
                if (!in_array($normalizedType, $this->allowedElectionTypes, true)) {
                    return $this->sendErrorResponse("Election type must be one of: school, corporate, barangay", 400);
                }
                $updateFields .= ",
                    election_type = :election_type
                ";
            }

            $sql = "UPDATE elections SET " . $updateFields . " WHERE id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':election_title', $election_title);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':start_date', $start_date);
            $stmt->bindParam(':end_date', $end_date);
            $stmt->bindParam(':img', $img);
            if ($normalizedType !== null) {
                $stmt->bindParam(':election_type', $normalizedType);
            }
            
            if ($stmt->execute()) {
                $updatedElection = $this->getElectionById($id);
                return $this->sendResponse([
                    'message' => 'Election updated successfully',
                    'election' => $updatedElection['data']
                ], 200);
            } else {
                return $this->sendErrorResponse("Failed to update election", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error updating election: " . $e->getMessage(), 500);
        }
    }

    // Archive election (soft delete)
    public function archiveElection($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            $sql = "UPDATE elections SET is_archived = TRUE WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    return $this->sendResponse(['message' => 'Election archived successfully'], 200);
                } else {
                    return $this->sendErrorResponse("Election not found", 404);
                }
            } else {
                return $this->sendErrorResponse("Failed to archive election", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error archiving election: " . $e->getMessage(), 500);
        }
    }

    // Delete election permanently
    public function deleteElection($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            // Get election to delete its image
            $election = $this->getElectionById($id);
            if ($election['status'] === 'error') {
                return $election;
            }

            $sql = "DELETE FROM elections WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
                
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    // Delete image file if exists
                    if (!empty($election['data']['img'])) {
                        $this->fileUpload->delete($election['data']['img']);
                    }
                    return $this->sendResponse(['message' => 'Election deleted successfully'], 200);
                } else {
                    return $this->sendErrorResponse("Election not found", 404);
                }
            } else {
                return $this->sendErrorResponse("Failed to delete election", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error deleting election: " . $e->getMessage(), 500);
        }
    }

    // Helper function to determine election status
    // Get elections for voters (public access, verified voters only)
    public function getElectionsForVoters() {
        try {
            // Check if voter is authenticated
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            if (!isset($_SESSION['voter_logged_in']) || $_SESSION['voter_logged_in'] !== true) {
                return $this->sendErrorResponse("Unauthorized", 401);
            }

            $voterType = $_SESSION['voter_type'] ?? null;
            $sql = "SELECT id, election_title, description, election_type, start_date, end_date, img, created
                    FROM elections
                    WHERE is_archived = FALSE";

            $filterByType = false;
            $normalizedVoterType = null;
            if ($voterType) {
                $normalizedVoterType = strtolower(trim($voterType));
                if (in_array($normalizedVoterType, $this->allowedElectionTypes, true)) {
                    $sql .= " AND election_type = :voter_type";
                    $filterByType = true;
                }
            }

            $sql .= " ORDER BY start_date ASC";
            
            $stmt = $this->pdo->prepare($sql);
            if ($filterByType && $normalizedVoterType !== null) {
                $stmt->bindParam(':voter_type', $normalizedVoterType);
            }
            $stmt->execute();
            
            $elections = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Add status and full image URL to each election
            foreach ($elections as &$election) {
                $election['status'] = $this->getElectionStatus($election['start_date'], $election['end_date']);
                $election['img_url'] = $election['img'] ? $this->fileUpload->getFileUrl($election['img']) : null;
            }
            
            return $this->sendResponse($elections, 200);
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to get elections: " . $e->getMessage(), 500);
        }
    }

    private function getElectionStatus($start_date, $end_date) {
        $now = time();
        $start = strtotime($start_date);
        $end = strtotime($end_date);
        
        if ($now < $start) {
            return 'not_started';
        } elseif ($now >= $start && $now <= $end) {
            return 'ongoing';
        } else {
            return 'ended';
        }
    }
}

?>

