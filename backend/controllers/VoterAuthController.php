<?php
require_once('./utils/utils.php');

class VoterAuthController extends GlobalUtil {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // Login voter
    public function login($email, $password) {
        try {
            // Validate input
            if (empty($email) || empty($password)) {
                return $this->sendErrorResponse("Email and password are required", 400);
            }

            // Trim and normalize email (case-insensitive)
            $email = trim(strtolower($email));

            // Check if voter exists (case-insensitive email comparison)
            $sql = "SELECT * FROM voters WHERE LOWER(TRIM(email)) = ? AND is_archived = 0";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$email]);
            $voter = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$voter) {
                return $this->sendErrorResponse("Invalid credentials", 401);
            }

            // Check if password field exists and is not empty
            if (empty($voter['password'])) {
                return $this->sendErrorResponse("Account error: No password set. Please contact administrator.", 500);
            }

            // Verify password
            if (!password_verify($password, $voter['password'])) {
                return $this->sendErrorResponse("Invalid credentials", 401);
            }

            // Check if voter is verified (temporarily allow unverified for testing)
            // TODO: Re-enable verification check in production
            // if (!$voter['is_verified']) {
            //     return $this->sendErrorResponse("Your account is not yet verified. Please contact the administrator.", 403);
            // }

            // Start session and store voter data
            require_once(__DIR__ . '/../utils/utils.php');
            initSession();

            $_SESSION['voter_logged_in'] = true;
            $_SESSION['voter_id'] = $voter['id'];
            $_SESSION['voter_voters_id'] = $voter['voters_id'];
            $_SESSION['voter_email'] = $voter['email'];
            $_SESSION['voter_fname'] = $voter['fname'];
            $_SESSION['voter_mname'] = $voter['mname'];
            $_SESSION['voter_lname'] = $voter['lname'];
            $_SESSION['voter_fullname'] = trim($voter['fname'] . ' ' . ($voter['mname'] ? $voter['mname'] . ' ' : '') . $voter['lname']);
            $_SESSION['voter_sex'] = $voter['sex'];
            $_SESSION['voter_type'] = $voter['voter_type'];

            return $this->sendResponse([
                'message' => 'Login successful',
                'voter' => [
                    'id' => $voter['id'],
                    'voters_id' => $voter['voters_id'],
                    'email' => $voter['email'],
                    'fname' => $voter['fname'],
                    'mname' => $voter['mname'],
                    'lname' => $voter['lname'],
                    'fullname' => $_SESSION['voter_fullname'],
                    'sex' => $voter['sex'],
                    'voter_type' => $voter['voter_type']
                ]
            ], 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Login failed: " . $e->getMessage(), 500);
        }
    }

    // Check voter session
    public function checkSession() {
        require_once(__DIR__ . '/../utils/utils.php');
        initSession();

        if (isset($_SESSION['voter_logged_in']) && $_SESSION['voter_logged_in'] === true) {
            return $this->sendResponse([
                'logged_in' => true,
                'voter' => [
                    'id' => $_SESSION['voter_id'],
                    'voters_id' => $_SESSION['voter_voters_id'],
                    'email' => $_SESSION['voter_email'],
                    'fname' => $_SESSION['voter_fname'],
                    'mname' => $_SESSION['voter_mname'],
                    'lname' => $_SESSION['voter_lname'],
                    'fullname' => $_SESSION['voter_fullname'],
                    'sex' => $_SESSION['voter_sex'] ?? null,
                    'voter_type' => $_SESSION['voter_type'] ?? null
                ]
            ], 200);
        } else {
            return $this->sendResponse([
                'logged_in' => false
            ], 200);
        }
    }

    // Logout voter
    public function logout() {
        require_once(__DIR__ . '/../utils/utils.php');
        initSession();

        // Clear voter session data
        unset($_SESSION['voter_logged_in']);
        unset($_SESSION['voter_id']);
        unset($_SESSION['voter_voters_id']);
        unset($_SESSION['voter_email']);
        unset($_SESSION['voter_fname']);
        unset($_SESSION['voter_mname']);
        unset($_SESSION['voter_lname']);
        unset($_SESSION['voter_fullname']);
        unset($_SESSION['voter_sex']);
        unset($_SESSION['voter_type']);

        return $this->sendResponse([
            'message' => 'Logout successful'
        ], 200);
    }

    // Check if voter is authenticated
    public function isVoterAuthenticated() {
        require_once(__DIR__ . '/../utils/utils.php');
        initSession();
        return isset($_SESSION['voter_logged_in']) && $_SESSION['voter_logged_in'] === true;
    }

    // Get current voter profile
    public function getProfile() {
        try {
            $voterId = $_SESSION['voter_id'] ?? 1; // Default to voter ID 1 if no session

            $sql = "SELECT 
                        id,
                        voters_id,
                        v_image,
                        fname,
                        mname,
                        lname,
                        email,
                        contact_number,
                        sex,
                        voter_type,
                        is_verified,
                        date_registered,
                        date_verified,
                        CONCAT(fname, ' ', IFNULL(CONCAT(mname, ' '), ''), lname) as full_name
                    FROM voters
                    WHERE id = ? AND is_archived = 0";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$voterId]);
            $voter = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$voter) {
                return $this->sendErrorResponse("Voter not found", 404);
            }

            // Add image URL (relative path - frontend will construct full URL)
            require_once('./utils/FileUpload.php');
            $fileUpload = new FileUpload('./uploads/voters/');
            $voter['v_image_url'] = $voter['v_image'] ? $fileUpload->getFileUrl($voter['v_image']) : null;
            $voter['is_verified'] = (bool)$voter['is_verified'];

            // Remove password from response
            unset($voter['password']);

            return $this->sendResponse($voter, 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to get profile: " . $e->getMessage(), 500);
        }
    }

    // Update voter profile (contact details only)
    public function updateProfile($data, $files = []) {
        try {
            $voterId = $_SESSION['voter_id'] ?? 1; // Default to voter ID 1 if no session

            // Get existing voter data
            $checkStmt = $this->pdo->prepare("SELECT * FROM voters WHERE id = ?");
            $checkStmt->execute([$voterId]);
            $existingVoter = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$existingVoter) {
                return $this->sendErrorResponse("Voter not found", 404);
            }

            // Handle image upload
            require_once('./utils/FileUpload.php');
            $fileUpload = new FileUpload('./uploads/voters/');
            $imagePath = $existingVoter['v_image'];

            if (isset($files['v_image']) && isset($files['v_image']['tmp_name']) && !empty($files['v_image']['tmp_name'])) {
                // Delete old image if exists
                if ($existingVoter['v_image']) {
                    $fileUpload->delete($existingVoter['v_image']);
                }
                
                $uploadResult = $fileUpload->upload($files['v_image']);
                if ($uploadResult['success']) {
                    $imagePath = $uploadResult['filename'];
                } else {
                    return $this->sendErrorResponse($uploadResult['message'], 400);
                }
            }

            // Build update query (only allowed fields)
            $fields = [];
            $values = [];

            if (isset($data['fname']) && !empty($data['fname'])) {
                $fields[] = "fname = ?";
                $values[] = $data['fname'];
            }
            if (isset($data['mname'])) {
                $fields[] = "mname = ?";
                $values[] = $data['mname'];
            }
            if (isset($data['lname']) && !empty($data['lname'])) {
                $fields[] = "lname = ?";
                $values[] = $data['lname'];
            }
            if (isset($data['email']) && !empty($data['email'])) {
                // Check if email already exists for another voter
                $checkEmail = $this->pdo->prepare("SELECT id FROM voters WHERE email = ? AND id != ?");
                $checkEmail->execute([$data['email'], $voterId]);
                if ($checkEmail->fetch()) {
                    return $this->sendErrorResponse("Email already in use", 400);
                }
                $fields[] = "email = ?";
                $values[] = $data['email'];
            }
            if (isset($data['contact_number'])) {
                $fields[] = "contact_number = ?";
                $values[] = $data['contact_number'];
            }
            if (isset($data['sex']) && in_array($data['sex'], ['male', 'female', 'other'], true)) {
                $fields[] = "sex = ?";
                $values[] = $data['sex'];
            }
            if (isset($data['voter_type']) && in_array($data['voter_type'], ['school', 'corporate', 'barangay'], true)) {
                $fields[] = "voter_type = ?";
                $values[] = $data['voter_type'];
                $_SESSION['voter_type'] = $data['voter_type'];
            }
            // Only update password if provided and not empty
            if (isset($data['password']) && !empty(trim($data['password']))) {
                $fields[] = "password = ?";
                $values[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            if ($imagePath !== $existingVoter['v_image']) {
                $fields[] = "v_image = ?";
                $values[] = $imagePath;
            }

            $fields[] = "updated = NOW()";

            if (empty($fields)) {
                return $this->sendErrorResponse("No fields to update", 400);
            }

            // Add voter ID to values array
            $values[] = $voterId;

            // Update voter
            $sql = "UPDATE voters SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($values);

            // Update session if name or email changed
            if (isset($data['fname'])) $_SESSION['voter_fname'] = $data['fname'];
            if (isset($data['mname'])) $_SESSION['voter_mname'] = $data['mname'];
            if (isset($data['lname'])) $_SESSION['voter_lname'] = $data['lname'];
            if (isset($data['email'])) $_SESSION['voter_email'] = $data['email'];
            if (isset($data['sex']) && in_array($data['sex'], ['male', 'female', 'other'], true)) {
                $_SESSION['voter_sex'] = $data['sex'];
            }
            // voter_type session is handled during validation above
            
            // Update fullname in session
            $_SESSION['voter_fullname'] = trim(
                $_SESSION['voter_fname'] . ' ' . 
                ($_SESSION['voter_mname'] ? $_SESSION['voter_mname'] . ' ' : '') . 
                $_SESSION['voter_lname']
            );

            return $this->sendResponse([
                'message' => 'Profile updated successfully'
            ], 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to update profile: " . $e->getMessage(), 500);
        }
    }
}
?>

