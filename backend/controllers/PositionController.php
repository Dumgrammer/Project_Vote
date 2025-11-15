<?php
require_once('./utils/utils.php');

class PositionController extends GlobalUtil {
    private $pdo;

    public function __construct($dbAccess) {
        $this->pdo = $dbAccess->connect();
        
        // Ensure positions table exists
        $this->createPositionsTable($this->pdo);
    }

    // Create a new position
    public function createPosition($name, $allows_multiple_votes, $type) {
        try {
            // Check if user is authenticated
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            // Validate required fields
            if (empty($name) || empty($type)) {
                return $this->sendErrorResponse("Position name and type are required", 400);
            }

            // Validate type
            $allowedTypes = ['school', 'corporate', 'barangay'];
            $type = strtolower(trim($type));
            if (!in_array($type, $allowedTypes, true)) {
                return $this->sendErrorResponse("Type must be one of: school, corporate, barangay", 400);
            }

            // Check if position with same name and type already exists
            $checkPosition = $this->pdo->prepare("SELECT id FROM positions WHERE name = :name AND type = :type AND is_archived = FALSE");
            $checkPosition->execute(['name' => $name, 'type' => $type]);
            if ($checkPosition->fetch()) {
                return $this->sendErrorResponse("Position with this name and type already exists", 400);
            }

            $allowsMultiple = filter_var($allows_multiple_votes, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($allowsMultiple === null) {
                $allowsMultiple = false;
            }

            $created_by = $_SESSION['user_id'];

            $sql = "INSERT INTO positions (name, allows_multiple_votes, type, created_by) 
                    VALUES (:name, :allows_multiple_votes, :type, :created_by)";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':name', $name);
            $stmt->bindValue(':allows_multiple_votes', $allowsMultiple ? 1 : 0, PDO::PARAM_INT);
            $stmt->bindParam(':type', $type);
            $stmt->bindParam(':created_by', $created_by);
            
            if ($stmt->execute()) {
                $positionId = $this->pdo->lastInsertId();
                
                // Fetch the created position
                $position = $this->getPositionById($positionId);
                
                return $this->sendResponse([
                    'message' => 'Position created successfully',
                    'position' => $position['data']
                ], 201);
            } else {
                return $this->sendErrorResponse("Failed to create position", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error creating position: " . $e->getMessage(), 500);
        }
    }

    // Get all positions
    public function getAllPositions($includeArchived = false, $type = null) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            $sql = "SELECT p.*, 
                           CONCAT(a.fname, ' ', a.lname) as creator_name,
                           a.email as creator_email
                    FROM positions p
                    LEFT JOIN admin a ON p.created_by = a.id
                    WHERE 1=1";
            
            if (!$includeArchived) {
                $sql .= " AND p.is_archived = FALSE";
            }
            
            if ($type) {
                $type = strtolower(trim($type));
                $allowedTypes = ['school', 'corporate', 'barangay'];
                if (in_array($type, $allowedTypes, true)) {
                    $sql .= " AND p.type = :type";
                }
            }
            
            $sql .= " ORDER BY p.type ASC, p.name ASC";
            
            $stmt = $this->pdo->prepare($sql);
            if ($type && in_array(strtolower(trim($type)), ['school', 'corporate', 'barangay'], true)) {
                $stmt->bindParam(':type', $type);
            }
            $stmt->execute();
            
            $positions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert allows_multiple_votes from 0/1 to boolean
            foreach ($positions as &$position) {
                $position['allows_multiple_votes'] = (bool) $position['allows_multiple_votes'];
            }
            
            return $this->sendResponse($positions, 200);
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error fetching positions: " . $e->getMessage(), 500);
        }
    }

    // Get position by ID
    public function getPositionById($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            $sql = "SELECT p.*, 
                           CONCAT(a.fname, ' ', a.lname) as creator_name,
                           a.email as creator_email
                    FROM positions p
                    LEFT JOIN admin a ON p.created_by = a.id
                    WHERE p.id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            $position = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($position) {
                // Convert allows_multiple_votes from 0/1 to boolean
                $position['allows_multiple_votes'] = (bool) $position['allows_multiple_votes'];
                return $this->sendResponse($position, 200);
            } else {
                return $this->sendErrorResponse("Position not found", 404);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error fetching position: " . $e->getMessage(), 500);
        }
    }

    // Update position
    public function updatePosition($id, $name, $allows_multiple_votes, $type) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            // Check if position exists
            $existingPosition = $this->getPositionById($id);
            if ($existingPosition['status'] === 'error') {
                return $existingPosition;
            }

            // Validate required fields
            if (empty($name) || empty($type)) {
                return $this->sendErrorResponse("Position name and type are required", 400);
            }

            // Validate type
            $allowedTypes = ['school', 'corporate', 'barangay'];
            $type = strtolower(trim($type));
            if (!in_array($type, $allowedTypes, true)) {
                return $this->sendErrorResponse("Type must be one of: school, corporate, barangay", 400);
            }

            // Check if position with same name and type already exists (excluding current position)
            $checkPosition = $this->pdo->prepare("SELECT id FROM positions WHERE name = :name AND type = :type AND id != :id AND is_archived = FALSE");
            $checkPosition->execute(['name' => $name, 'type' => $type, 'id' => $id]);
            if ($checkPosition->fetch()) {
                return $this->sendErrorResponse("Position with this name and type already exists", 400);
            }

            $allowsMultiple = filter_var($allows_multiple_votes, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($allowsMultiple === null) {
                $allowsMultiple = false;
            }

            $sql = "UPDATE positions SET 
                    name = :name,
                    allows_multiple_votes = :allows_multiple_votes,
                    type = :type
                    WHERE id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':name', $name);
            $stmt->bindValue(':allows_multiple_votes', $allowsMultiple ? 1 : 0, PDO::PARAM_INT);
            $stmt->bindParam(':type', $type);
            
            if ($stmt->execute()) {
                $updatedPosition = $this->getPositionById($id);
                return $this->sendResponse([
                    'message' => 'Position updated successfully',
                    'position' => $updatedPosition['data']
                ], 200);
            } else {
                return $this->sendErrorResponse("Failed to update position", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error updating position: " . $e->getMessage(), 500);
        }
    }

    // Archive position (soft delete)
    public function archivePosition($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            $sql = "UPDATE positions SET is_archived = TRUE WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    return $this->sendResponse(['message' => 'Position archived successfully'], 200);
                } else {
                    return $this->sendErrorResponse("Position not found", 404);
                }
            } else {
                return $this->sendErrorResponse("Failed to archive position", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error archiving position: " . $e->getMessage(), 500);
        }
    }

    // Delete position permanently
    public function deletePosition($id) {
        try {
            if (!$this->isAuthenticated()) {
                return $this->sendErrorResponse("Unauthorized: Please login", 401);
            }

            $sql = "DELETE FROM positions WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    return $this->sendResponse(['message' => 'Position deleted successfully'], 200);
                } else {
                    return $this->sendErrorResponse("Position not found", 404);
                }
            } else {
                return $this->sendErrorResponse("Failed to delete position", 500);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Error deleting position: " . $e->getMessage(), 500);
        }
    }
}

?>

