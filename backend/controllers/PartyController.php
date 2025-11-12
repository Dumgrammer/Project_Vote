<?php
require_once('./utils/utils.php');

class PartyController extends GlobalUtil {
    private $pdo;

    public function __construct($dbAccess) {
        $this->pdo = $dbAccess->connect();
        
        // Ensure parties table exists
        $this->createPartiesTable($this->pdo);
    }

    // Create a new party
    public function createParty($party_name, $party_code, $description = '') {
        try {
            // Check if user is authenticated
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            // Validate required fields
            if (empty($party_name) || empty($party_code)) {
                return $this->sendErrorResponse("Party name and code are required", 400);
            }

            // Check if party code already exists
            $checkCode = $this->pdo->prepare("SELECT id FROM parties WHERE party_code = :party_code");
            $checkCode->execute(['party_code' => $party_code]);
            if ($checkCode->fetch()) {
                return $this->sendErrorResponse("Party code already exists", 400);
            }

            $created_by = $_SESSION['user_id'];

            $sql = "INSERT INTO parties (party_name, party_code, description, created_by) 
                    VALUES (:party_name, :party_code, :description, :created_by)";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':party_name', $party_name);
            $stmt->bindParam(':party_code', $party_code);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':created_by', $created_by);
            
            if ($stmt->execute()) {
                $partyId = $this->pdo->lastInsertId();
                
                // Fetch the created party
                $party = $this->getPartyById($partyId);
                
                return $this->sendResponse([
                    'message' => 'Party created successfully',
                    'party' => $party['data']
                ], 201);
            } else {
                return $this->sendErrorResponse("Failed to create party", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error creating party: " . $e->getMessage(), 500);
        }
    }

    // Get all parties
    public function getAllParties($includeArchived = false) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            $sql = "SELECT p.*, 
                           CONCAT(a.fname, ' ', a.lname) as creator_name,
                           a.email as creator_email
                    FROM parties p
                    LEFT JOIN admin a ON p.created_by = a.id";
            
            if (!$includeArchived) {
                $sql .= " WHERE p.is_archived = FALSE";
            }
            
            $sql .= " ORDER BY p.party_name ASC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            
            $parties = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $this->sendResponse($parties, 200);
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error fetching parties: " . $e->getMessage(), 500);
        }
    }

    // Get party by ID
    public function getPartyById($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            $sql = "SELECT p.*, 
                           CONCAT(a.fname, ' ', a.lname) as creator_name,
                           a.email as creator_email
                    FROM parties p
                    LEFT JOIN admin a ON p.created_by = a.id
                    WHERE p.id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            $party = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($party) {
                return $this->sendResponse($party, 200);
            } else {
                return $this->sendErrorResponse("Party not found", 404);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error fetching party: " . $e->getMessage(), 500);
        }
    }

    // Update party
    public function updateParty($id, $party_name, $party_code, $description) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            // Check if party exists
            $existingParty = $this->getPartyById($id);
            if ($existingParty['status'] === 'error') {
                return $existingParty;
            }

            // Prevent updating IND party
            if ($existingParty['data']['party_code'] === 'IND') {
                return $this->sendErrorResponse("Cannot update Independent party", 403);
            }

            // Check if party code already exists (excluding current party)
            $checkCode = $this->pdo->prepare("SELECT id FROM parties WHERE party_code = :party_code AND id != :id");
            $checkCode->execute(['party_code' => $party_code, 'id' => $id]);
            if ($checkCode->fetch()) {
                return $this->sendErrorResponse("Party code already exists", 400);
            }

            $sql = "UPDATE parties SET 
                    party_name = :party_name,
                    party_code = :party_code,
                    description = :description
                    WHERE id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':party_name', $party_name);
            $stmt->bindParam(':party_code', $party_code);
            $stmt->bindParam(':description', $description);
            
            if ($stmt->execute()) {
                $updatedParty = $this->getPartyById($id);
                return $this->sendResponse([
                    'message' => 'Party updated successfully',
                    'party' => $updatedParty['data']
                ], 200);
            } else {
                return $this->sendErrorResponse("Failed to update party", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error updating party: " . $e->getMessage(), 500);
        }
    }

    // Archive party (soft delete)
    public function archiveParty($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            // Prevent archiving IND party
            $party = $this->getPartyById($id);
            if ($party['status'] === 'success' && $party['data']['party_code'] === 'IND') {
                return $this->sendErrorResponse("Cannot archive Independent party", 403);
            }

            $sql = "UPDATE parties SET is_archived = TRUE WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    return $this->sendResponse(['message' => 'Party archived successfully'], 200);
                } else {
                    return $this->sendErrorResponse("Party not found", 404);
                }
            } else {
                return $this->sendErrorResponse("Failed to archive party", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error archiving party: " . $e->getMessage(), 500);
        }
    }

    // Delete party permanently
    public function deleteParty($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            // Prevent deleting IND party
            $party = $this->getPartyById($id);
            if ($party['status'] === 'success' && $party['data']['party_code'] === 'IND') {
                return $this->sendErrorResponse("Cannot delete Independent party", 403);
            }

            $sql = "DELETE FROM parties WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    return $this->sendResponse(['message' => 'Party deleted successfully'], 200);
                } else {
                    return $this->sendErrorResponse("Party not found", 404);
                }
            } else {
                return $this->sendErrorResponse("Failed to delete party", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error deleting party: " . $e->getMessage(), 500);
        }
    }
}

?>

