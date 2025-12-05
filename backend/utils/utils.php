<?php 

// Initialize session with proper cookie settings for cross-domain
function initSession() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return; // Session already started
    }
    
    // Detect if production
    $isProduction = !in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) 
        && strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') === false;
    
    if ($isProduction) {
        // Production: Cross-domain cookie settings
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'None'
        ]);
    } else {
        // Development
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => false,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
    }
    
    session_start();
}

class GlobalUtil{

    protected function isAdminAuthDisabled(): bool {
        if (defined('DISABLE_ADMIN_AUTH')) {
            return DISABLE_ADMIN_AUTH === true;
        }

        $env = getenv('DISABLE_ADMIN_AUTH');
        if ($env === false) {
            return false;
        }

        $env = strtolower(trim($env));
        return in_array($env, ['1', 'true', 'yes', 'on'], true);
    }

    function sendResponse($data, $statusCode)
    {
        return array("status" => "success", "data" => $data, "statusCode" => $statusCode);
    }

    function sendErrorResponse($message, $statusCode)
    {
        return array("status" => "error", "message" => $message, "statusCode" => $statusCode);
    }

    public function hasAccess($permission) {
        if (!$this->isAuthenticated()) {
            return false;
        }

        $rules = $_SESSION['user_rules'] ?? null;
        
        if (!$rules || !is_array($rules)) {
            return false;
        }

        // Check if the permission exists in rules and is set to true
        return isset($rules[$permission]) && $rules[$permission] === true;
    }

    public function getUserRules() {
        if ($this->isAuthenticated()) {
            return $_SESSION['user_rules'] ?? [];
        }
        return [];
    }

    public function isAuthenticated() {
        if ($this->isAdminAuthDisabled()) {
            return true;
        }

        return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    }

    // Helper function to hash password (for registration or password updates)
    public function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    public function checkSession() {
        try {
            if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
                return $this->sendResponse([
                    'logged_in' => true,
                    'user' => [
                        'id' => $_SESSION['user_id'],
                        'email' => $_SESSION['user_email'],
                        'fname' => $_SESSION['user_fname'],
                        'mname' => $_SESSION['user_mname'],
                        'lname' => $_SESSION['user_lname'],
                        'fullname' => $_SESSION['user_fullname'],
                        'rules' => $_SESSION['user_rules']
                    ]
                ], 200);
            } else {
                return $this->sendErrorResponse("Not authenticated", 401);
            }
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to check session: " . $e->getMessage(), 500);
        }
    }

    // Create elections table if it doesn't exist
    public function createElectionsTable($pdo) {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS elections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                img VARCHAR(255) DEFAULT NULL,
                election_title VARCHAR(255) NOT NULL,
                description TEXT,
                election_type ENUM('school', 'corporate', 'barangay') NOT NULL DEFAULT 'school',
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                created_by INT NOT NULL,
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_archived BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE CASCADE,
                INDEX idx_created_by (created_by),
                INDEX idx_election_type (election_type),
                INDEX idx_is_archived (is_archived),
                INDEX idx_start_date (start_date),
                INDEX idx_end_date (end_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            
            $pdo->exec($sql);
            return true;
        } catch (\Exception $e) {
            error_log("Failed to create elections table: " . $e->getMessage());
            return false;
        }
    }

    // Create candidates table if it doesn't exist
    public function createCandidatesTable($pdo) {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS candidates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                election_id INT NOT NULL,
                photo VARCHAR(255) DEFAULT NULL,
                fname VARCHAR(255) NOT NULL,
                mname VARCHAR(255) DEFAULT '',
                lname VARCHAR(255) NOT NULL,
                party_id INT DEFAULT NULL,
                position_id INT DEFAULT NULL,
                position VARCHAR(255) NOT NULL,
                bio TEXT,
                created_by INT NOT NULL,
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_archived BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
                FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE SET NULL,
                FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE CASCADE,
                INDEX idx_election_id (election_id),
                INDEX idx_party_id (party_id),
                INDEX idx_position_id (position_id),
                INDEX idx_created_by (created_by),
                INDEX idx_is_archived (is_archived)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            
            $pdo->exec($sql);
            
            // Add position_id column if it doesn't exist (for existing databases)
            try {
                $checkColumn = $pdo->query("SHOW COLUMNS FROM candidates LIKE 'position_id'");
                if ($checkColumn->rowCount() == 0) {
                    $pdo->exec("ALTER TABLE candidates ADD COLUMN position_id INT DEFAULT NULL AFTER party_id");
                    $pdo->exec("ALTER TABLE candidates ADD FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL");
                    $pdo->exec("ALTER TABLE candidates ADD INDEX idx_position_id (position_id)");
                }
            } catch (\Exception $e) {
                // Column might already exist or positions table doesn't exist yet
                error_log("Note: Could not add position_id column: " . $e->getMessage());
            }
            
            return true;
        } catch (\Exception $e) {
            error_log("Failed to create candidates table: " . $e->getMessage());
            return false;
        }
    }

    // Create positions table if it doesn't exist
    public function createPositionsTable($pdo) {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS positions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                allows_multiple_votes BOOLEAN DEFAULT FALSE,
                type ENUM('school', 'corporate', 'barangay') NOT NULL DEFAULT 'school',
                created_by INT NOT NULL,
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_archived BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE CASCADE,
                INDEX idx_name (name),
                INDEX idx_type (type),
                INDEX idx_created_by (created_by),
                INDEX idx_is_archived (is_archived),
                UNIQUE KEY unique_name_type (name, type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            
            $pdo->exec($sql);
            return true;
        } catch (\Exception $e) {
            error_log("Failed to create positions table: " . $e->getMessage());
            return false;
        }
    }

    // Create parties table if it doesn't exist
    public function createPartiesTable($pdo) {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS parties (
                id INT AUTO_INCREMENT PRIMARY KEY,
                party_name VARCHAR(255) NOT NULL UNIQUE,
                party_code VARCHAR(50) NOT NULL UNIQUE,
                description TEXT,
                created_by INT NOT NULL,
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_archived BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE CASCADE,
                INDEX idx_party_code (party_code),
                INDEX idx_created_by (created_by),
                INDEX idx_is_archived (is_archived)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            
            $pdo->exec($sql);
            
            // Insert default "Independent" party if not exists
            $checkInd = $pdo->prepare("SELECT id FROM parties WHERE party_code = 'IND'");
            $checkInd->execute();
            if (!$checkInd->fetch()) {
                // Use a system user ID or set to 1 (assuming admin ID 1 exists)
                $insertInd = $pdo->prepare("INSERT INTO parties (party_name, party_code, description, created_by) VALUES ('Independent', 'IND', 'Independent candidate', 1)");
                $insertInd->execute();
            }
            
            return true;
        } catch (\Exception $e) {
            error_log("Failed to create parties table: " . $e->getMessage());
            return false;
        }
    }

    // Create voters table if it doesn't exist
    public function createVotersTable($pdo) {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS voters (
                id INT AUTO_INCREMENT PRIMARY KEY,
                voters_id VARCHAR(100) NOT NULL UNIQUE,
                v_image VARCHAR(255) DEFAULT NULL,
                fname VARCHAR(255) NOT NULL,
                mname VARCHAR(255) DEFAULT '',
                lname VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                contact_number VARCHAR(20) DEFAULT NULL,
                sex ENUM('male', 'female', 'other') DEFAULT NULL,
                voter_type ENUM('school', 'corporate', 'barangay') NOT NULL DEFAULT 'school',
                password VARCHAR(255) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                is_archived BOOLEAN DEFAULT FALSE,
                date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_verified TIMESTAMP NULL DEFAULT NULL,
                created_by INT DEFAULT NULL,
                updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES admin(id) ON DELETE SET NULL,
                INDEX idx_voters_id (voters_id),
                INDEX idx_email (email),
                INDEX idx_sex (sex),
                INDEX idx_voter_type (voter_type),
                INDEX idx_is_verified (is_verified),
                INDEX idx_is_archived (is_archived),
                INDEX idx_created_by (created_by)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            
            $pdo->exec($sql);
            return true;
        } catch (\Exception $e) {
            error_log("Failed to create voters table: " . $e->getMessage());
            return false;
        }
    }

    // Create candidacy_votes table if it doesn't exist
    public function createCandidacyVotesTable($pdo) {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS candidacy_votes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                voter_id INT NOT NULL,
                election_id INT NOT NULL,
                candidates_voted JSON NOT NULL,
                date_voted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE,
                FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
                UNIQUE KEY unique_voter_election (voter_id, election_id),
                INDEX idx_voter_id (voter_id),
                INDEX idx_election_id (election_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            
            $pdo->exec($sql);
            return true;
        } catch (\Exception $e) {
            error_log("Failed to create candidacy_votes table: " . $e->getMessage());
            return false;
        }
    }

}

?>