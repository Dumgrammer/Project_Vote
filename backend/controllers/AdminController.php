<?php

require_once(__DIR__ . '/../utils/utils.php');
class AdminController extends GlobalUtil {
    private $pdo;
    private $conn;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->conn = $this->pdo->connect();
        
        // Start session if not already started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public function login($email, $password) {
        try {
            // Validate input
            if (empty($email) || empty($password)) {
                return $this->sendErrorResponse("Email and password are required", 400);
            }

            // Debug logging
            error_log("Login attempt for email: " . $email);

            // Fetch user by email only
            $stmt = $this->conn->prepare("SELECT * FROM admin WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Check if user exists
            if (!$user) {
                error_log("User not found: " . $email);
                return $this->sendErrorResponse("Invalid email or password", 401);
            }

            error_log("User found. Verifying password...");

            // Verify password using password_verify for hashed passwords
            if (!password_verify($password, $user['password'])) {
                error_log("Password verification failed for: " . $email);
                error_log("Provided password length: " . strlen($password));
                error_log("Stored hash: " . substr($user['password'], 0, 20) . "...");
                return $this->sendErrorResponse("Invalid email or password", 401);
            }

            error_log("Login successful for: " . $email);

            // Parse rules JSON - always decode, even if empty
            $rules = json_decode($user['rules'], true) ?? [];

            // Create session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_fname'] = $user['fname'] ?? '';
            $_SESSION['user_mname'] = $user['mname'] ?? '';
            $_SESSION['user_lname'] = $user['lname'] ?? '';
            $_SESSION['user_fullname'] = trim(($user['fname'] ?? '') . ' ' . ($user['mname'] ?? '') . ' ' . ($user['lname'] ?? ''));
            $_SESSION['user_rules'] = $rules;
            $_SESSION['logged_in'] = true;
            $_SESSION['login_time'] = time();

            // Remove password from response
            unset($user['password']);

            // Add parsed rules to user object
            $user['rules'] = $rules;

            return $this->sendResponse([
                'message' => 'Login successful',
                'user' => $user,
                'session_id' => session_id()
            ], 200);

        } catch (\PDOException $e) {
            return $this->sendErrorResponse("Failed to login: " . $e->getMessage(), 500);
        }
    }

    public function register($email, $password, $fname, $mname = '', $lname = '', $rules = null) {
        try {
            // Validate input
            if (empty($email) || empty($password) || empty($fname) || empty($lname)) {
                return $this->sendErrorResponse("Email, password, first name, and last name are required", 400);
            }

            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->sendErrorResponse("Invalid email format", 400);
            }

            // Validate password strength (minimum 6 characters)
            if (strlen($password) < 6) {
                return $this->sendErrorResponse("Password must be at least 6 characters long", 400);
            }

            // Check if email already exists
            $stmt = $this->conn->prepare("SELECT id FROM admin WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                return $this->sendErrorResponse("Email already exists", 409);
            }

            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Prepare rules JSON - default to empty JSON object if not provided
            $rulesJson = '{}';
            if ($rules !== null && $rules !== '') {
                if (is_array($rules) || is_object($rules)) {
                    // Convert array or object to JSON
                    $rulesJson = json_encode($rules);
                } else if (is_string($rules)) {
                    // Validate if it's valid JSON string
                    $decoded = json_decode($rules);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $rulesJson = $rules;
                    } else {
                        // If not valid JSON, treat as empty
                        $rulesJson = '{}';
                    }
                }
            }

            // Insert new user
            $stmt = $this->conn->prepare(
                "INSERT INTO admin (email, password, fname, mname, lname, rules, date_created, date_updated) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())"
            );
            
            $stmt->execute([
                $email,
                $hashedPassword,
                $fname,
                $mname,
                $lname,
                $rulesJson
            ]);

            $userId = $this->conn->lastInsertId();

            // Fetch the newly created user
            $stmt = $this->conn->prepare("SELECT id, email, fname, mname, lname, rules, date_created FROM admin WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Parse rules for response - always decode, even if empty
            $decodedRules = json_decode($user['rules'], true);
            
            // Check if it's actually an empty object {} or has data
            if ($decodedRules === null || $decodedRules === false) {
                $user['rules'] = [];
            } else {
                $user['rules'] = $decodedRules;
            }

            return $this->sendResponse([
                'message' => 'Registration successful',
                'user' => $user
            ], 201);

        } catch (\PDOException $e) {
            return $this->sendErrorResponse("Failed to register: " . $e->getMessage(), 500);
        }
    }

    public function logout() {
        try {
            // Destroy session
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_unset();
                session_destroy();
            }

            return $this->sendResponse(['message' => 'Logout successful'], 200);
        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to logout: " . $e->getMessage(), 500);
        }
    }



    
}
?>