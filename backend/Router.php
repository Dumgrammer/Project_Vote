<?php

    // Production vs Development settings
    $isProduction = !in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false;
    
    if ($isProduction) {
        // Production: Disable error display
        ini_set('display_errors', 0);
        ini_set('display_startup_errors', 0);
        error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    } else {
        // Development: Show errors
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
    }
    
    // Security: Disable auth bypass in production
    if (!defined('DISABLE_ADMIN_AUTH')) {
        define('DISABLE_ADMIN_AUTH', !$isProduction);
    }
    
    // Start output buffering to prevent accidental output
    ob_start();
    
    // CORS Configuration - Update with your production frontend URL
    $allowedOrigins = [
        'http://localhost:5173',
        'https://project-vote-ob70uzblo.vercel.app',
        'https://project-vote-phi.vercel.app',
        // Add your Hostinger frontend domain here:
        'https://darkred-magpie-601133.hostingersite.com',
        // Add your custom domain if you have one:
        // 'https://yourdomain.com',
        // 'https://www.yourdomain.com',
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowedOrigins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        // Fallback: Allow the first allowed origin or use * for development only
        header('Access-Control-Allow-Origin: ' . ($isProduction ? $allowedOrigins[1] ?? $allowedOrigins[0] : '*'));
    }
   
    header('Access-Control-Allow-Credentials: true');
    
    // Allow specific HTTP methods
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
    
    // Allow specific headers
    header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token, Origin, Authorization, X-HTTP-Method-Override');
    
    // Set Content-Type header to application/json for all responses
    header('Content-Type: application/json');
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    
        exit(0);
    }
    
    require_once('./config/pollify.php');
    require_once('./utils/utils.php');
    
    // Initialize session early to ensure cookie is set
    initSession();
    
    require_once('./controllers/AdminController.php');
    require_once('./controllers/ElectionController.php');
    require_once('./controllers/CandidateController.php');
    require_once('./controllers/PartyController.php');
    require_once('./controllers/PositionController.php');
    require_once('./controllers/VoterController.php');
    require_once('./controllers/VoterAuthController.php');
    require_once('./controllers/ResultsController.php');
    require_once('./controllers/DashboardController.php');

    
    $con = new DatabaseAccess();
    $pdo = $con->connect();
    
    $adminController = new AdminController($con);
    $electionController = new ElectionController($con);
    $candidateController = new CandidateController($con);
    $partyController = new PartyController($con);
    $positionController = new PositionController($con);
    $voterController = new VoterController($pdo);
    $voterAuthController = new VoterAuthController($pdo);
    $resultsController = new ResultsController($pdo);
    $dashboardController = new DashboardController($pdo);
    
    
    // Check if 'request' parameter is set in the request
    if (isset($_REQUEST['request'])) {
        // Split the request into an array based on '/'
        $request = explode('/', $_REQUEST['request']);
    } else {
        // If 'request' parameter is not set, return a 404 response
        echo json_encode(["error" => "Not Found"]);
        http_response_code(404);
        exit();
    }
    
    // Handle HTTP Method Override for multipart/form-data PUT requests
    $requestMethod = $_SERVER['REQUEST_METHOD'];
    if ($requestMethod === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
        $requestMethod = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
    }
    
    // Handle requests based on HTTP method
    switch ($requestMethod) {
        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            switch ($request[0]) {
                case 'login':
                    if (isset($data->email) && isset($data->password)) {
                        $response = $adminController->login($data->email, $data->password);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Email and password are required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'register':
                    if (isset($data->email) && isset($data->password) && isset($data->fname) && isset($data->lname)) {
                        $mname = $data->mname ?? '';
                        $rules = $data->rules ?? null;
                        $response = $adminController->register(
                            $data->email,
                            $data->password,
                            $data->fname,
                            $mname,
                            $data->lname,
                            $rules
                        );
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Email, password, first name, and last name are required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'logout':
                    $response = $adminController->logout();
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'election':
                    // Handle multipart/form-data for file upload
                    $election_title = $_POST['election_title'] ?? null;
                    $description = $_POST['description'] ?? '';
                    $start_date = $_POST['start_date'] ?? null;
                    $end_date = $_POST['end_date'] ?? null;
                    $election_type = $_POST['election_type'] ?? 'school';
                    $imgFile = $_FILES['img'] ?? null;
                    
                    if ($election_title && $start_date && $end_date) {
                        $response = $electionController->createElection(
                            $election_title,
                            $description,
                            $start_date,
                            $end_date,
                            $election_type,
                            $imgFile
                        );
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Election title, start date, and end date are required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'candidate':
                    // Handle multipart/form-data for file upload
                    $election_id = $_POST['election_id'] ?? null;
                    $fname = $_POST['fname'] ?? null;
                    $mname = $_POST['mname'] ?? '';
                    $lname = $_POST['lname'] ?? null;
                    $party_id = $_POST['party_id'] ?? null;
                    $position_id = $_POST['position_id'] ?? null;
                    $bio = $_POST['bio'] ?? '';
                    $photoFile = $_FILES['photo'] ?? null;
                    
                    if ($election_id && $fname && $lname && $party_id && $position_id) {
                        $response = $candidateController->createCandidate(
                            $election_id,
                            $fname,
                            $mname,
                            $lname,
                            $party_id,
                            $position_id,
                            $bio,
                            $photoFile
                        );
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Election ID, first name, last name, party, and position are required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'position':
                    if (isset($data->name) && isset($data->type)) {
                        $allows_multiple_votes = $data->allows_multiple_votes ?? false;
                        $response = $positionController->createPosition(
                            $data->name,
                            $allows_multiple_votes,
                            $data->type
                        );
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Position name and type are required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'party':
                    if (isset($data->party_name) && isset($data->party_code)) {
                        $description = $data->description ?? '';
                        $response = $partyController->createParty(
                            $data->party_name,
                            $data->party_code,
                            $description
                        );
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Party name and code are required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'voter':
                    // Handle multipart/form-data for file upload
                    $postData = $_POST;
                    $filesData = $_FILES;
                    
                    $response = $voterController->createVoter($postData, $filesData);
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'voter-login':
                    if (isset($data->email) && isset($data->password)) {
                        $response = $voterAuthController->login($data->email, $data->password);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Email and password are required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'voter-logout':
                    $response = $voterAuthController->logout();
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'voter-profile':
                    // Handle multipart/form-data for profile update
                    $postData = $_POST;
                    $filesData = $_FILES;
                    
                    $response = $voterAuthController->updateProfile($postData, $filesData);
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'cast-votes':
                    if (isset($data->election_id) && isset($data->votes)) {
                        // Convert votes from stdClass objects to associative arrays
                        $votesArray = json_decode(json_encode($data->votes), true);
                        $response = $voterController->castVotes($data->election_id, $votesArray);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Election ID and votes are required"]);
                        http_response_code(400);
                    }
                    break;
                
                default:
                    echo json_encode(["error" => "This is forbidden"]);
                    http_response_code(403);
                    break;
            }
            break;

        case 'GET':
            switch ($request[0]) {
                case 'session':
                    $response = $adminController->checkSession();
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'check-auth':
                    if ($adminController->isAuthenticated()) {
                        echo json_encode([
                            "authenticated" => true,
                            "user" => [
                                "id" => $_SESSION['user_id'],
                                "email" => $_SESSION['user_email'],
                                "fname" => $_SESSION['user_fname'],
                                "mname" => $_SESSION['user_mname'],
                                "lname" => $_SESSION['user_lname'],
                                "fullname" => $_SESSION['user_fullname'],
                                "rules" => $_SESSION['user_rules']
                            ]
                        ]);
                    } else {
                        echo json_encode(["authenticated" => false]);
                        http_response_code(401);
                    }
                    break;
                
                case 'voter-session':
                    $response = $voterAuthController->checkSession();
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'voter-profile':
                    $response = $voterAuthController->getProfile();
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'voter-elections':
                    $response = $electionController->getElectionsForVoters();
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'voter-votes':
                    if (isset($_GET['election_id'])) {
                        $response = $voterController->getVoterVotes($_GET['election_id']);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Election ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'election-results':
                    if (isset($_GET['election_id'])) {
                        $response = $resultsController->getElectionResults($_GET['election_id']);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Election ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'get':
                    echo json_encode(["message" => "Hello World"]);
                    http_response_code(200);
                    break;
                
                case 'elections':
                    $includeArchived = isset($_GET['archived']) && $_GET['archived'] === 'true';
                    $response = $electionController->getAllElections($includeArchived);
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'election':
                    if (isset($request[1])) {
                        $response = $electionController->getElectionById($request[1]);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Election ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'candidates':
                    // Get candidates by election ID: /candidates?election_id=X
                    if (isset($_GET['election_id'])) {
                        $includeArchived = isset($_GET['archived']) && $_GET['archived'] === 'true';
                        $response = $candidateController->getCandidatesByElection($_GET['election_id'], $includeArchived);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Election ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'candidate':
                    if (isset($request[1])) {
                        $response = $candidateController->getCandidateById($request[1]);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Candidate ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'parties':
                    $includeArchived = isset($_GET['archived']) && $_GET['archived'] === 'true';
                    $response = $partyController->getAllParties($includeArchived);
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'positions':
                    $includeArchived = isset($_GET['archived']) && $_GET['archived'] === 'true';
                    $type = $_GET['type'] ?? null;
                    $response = $positionController->getAllPositions($includeArchived, $type);
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'position':
                    if (isset($request[1])) {
                        $response = $positionController->getPositionById($request[1]);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Position ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'party':
                    if (isset($request[1])) {
                        $response = $partyController->getPartyById($request[1]);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Party ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'voters':
                    $includeArchived = isset($_GET['archived']) && $_GET['archived'] === 'true';
                    $response = $voterController->getAllVoters($includeArchived);
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'voter':
                    if (isset($request[1])) {
                        $response = $voterController->getVoterById($request[1]);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Voter ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'uploads':
                    // Serve uploaded files: /uploads/elections/{filename}
                    if (isset($request[1]) && isset($request[2])) {
                        $folder = $request[1];  // e.g., 'elections'
                        $filename = $request[2]; // e.g., 'election_xyz.jpg'
                        $filepath = "./uploads/{$folder}/" . basename($filename);
                        
                        if (file_exists($filepath)) {
                            $finfo = finfo_open(FILEINFO_MIME_TYPE);
                            $mimeType = finfo_file($finfo, $filepath);
                            finfo_close($finfo);
                            
                            header('Content-Type: ' . $mimeType);
                            header('Content-Length: ' . filesize($filepath));
                            readfile($filepath);
                            exit();
                        } else {
                            http_response_code(404);
                            echo json_encode(["error" => "File not found"]);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(["error" => "Invalid file path"]);
                    }
                    break;
                
                case 'search-voters':
                    // Public search endpoint: /search-voters?q=searchterm
                    if (isset($_GET['q'])) {
                        $response = $voterController->searchVoters($_GET['q']);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Search term is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'search-candidates':
                    // Public search endpoint: /search-candidates?election_id=X
                    if (isset($_GET['election_id'])) {
                        $response = $candidateController->getCandidatesByElectionPublic($_GET['election_id']);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Election ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'dashboard-stats':
                    $response = $dashboardController->getDashboardStats();
                    echo json_encode($response);
                    http_response_code($response['statusCode']);
                    break;
                
                case 'election-analytics':
                    if (isset($_GET['election_id'])) {
                        $response = $dashboardController->getElectionAnalytics($_GET['election_id']);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Election ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                default:
                    echo json_encode(["error" => "Method not available"]);
                    http_response_code(404);
                    break;
            }
            break;
            
        case 'PUT':
            // Check content type - multipart/form-data uses $_POST, JSON uses php://input
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            $isMultipart = strpos($contentType, 'multipart/form-data') !== false;
            
            // PHP doesn't populate $_POST for PUT requests, so we need to parse manually
            // But if $_POST is already populated (some servers do this), use it
            if ($isMultipart) {
                // For multipart/form-data PUT, try $_POST first (some servers populate it)
                // If empty, we'll need to parse manually (but that's complex)
                // For now, assume $_POST might be populated by the server
                $data = null;
            } else {
                // For JSON, parse from php://input
                $rawInput = file_get_contents("php://input");
                $data = !empty($rawInput) ? json_decode($rawInput) : null;
            }
            
            switch ($request[0]) {
                case 'election':
                    if (isset($request[1])) {
                        if ($isMultipart) {
                            // Try $_POST first (some servers populate it for PUT)
                            if (!empty($_POST)) {
                                $election_title = $_POST['election_title'] ?? null;
                                $start_date = $_POST['start_date'] ?? null;
                                $end_date = $_POST['end_date'] ?? null;
                                $description = $_POST['description'] ?? '';
                                $election_type = $_POST['election_type'] ?? null;
                                $imgFile = $_FILES['img'] ?? null;
                            } else {
                                // $_POST is empty - parse multipart/form-data from php://input
                                $rawInput = file_get_contents("php://input");
                                
                                // Extract boundary from Content-Type header
                                $boundary = null;
                                if (preg_match('/boundary=(.*?)(?:;|$|\s)/', $contentType, $matches)) {
                                    $boundary = trim($matches[1], '"\'');
                                }
                                
                                // If no boundary in header, try to extract from raw input
                                if (!$boundary && !empty($rawInput)) {
                                    // Multipart data starts with boundary
                                    if (preg_match('/^--([^\r\n]+)/', $rawInput, $boundaryMatch)) {
                                        $boundary = $boundaryMatch[1];
                                    }
                                }
                                
                                if ($boundary && !empty($rawInput)) {
                                    // Parse multipart data
                                    $parts = explode('--' . $boundary, $rawInput);
                                    $parsedData = [];
                                    
                                    foreach ($parts as $part) {
                                        $part = trim($part);
                                        if (empty($part) || $part === '--') continue;
                                        
                                        // Match Content-Disposition header
                                        if (preg_match('/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:\s*;\s*filename="([^"]+)")?/i', $part, $nameMatch)) {
                                            $fieldName = $nameMatch[1];
                                            $filename = $nameMatch[2] ?? null;
                                            
                                            // Find the value after the headers (after double CRLF or \n\n)
                                            $headerEnd = strpos($part, "\r\n\r\n");
                                            if ($headerEnd === false) {
                                                $headerEnd = strpos($part, "\n\n");
                                            }
                                            
                                            if ($headerEnd !== false) {
                                                $fieldValue = substr($part, $headerEnd + 4); // Skip CRLFCRLF or \n\n
                                                // Remove trailing CRLF, newlines, and boundary markers
                                                $fieldValue = rtrim($fieldValue, "\r\n");
                                                $fieldValue = preg_replace('/--\s*$/', '', $fieldValue);
                                                $fieldValue = trim($fieldValue);
                                                
                                                if ($filename) {
                                                    // This is a file field - skip file parsing from raw input
                                                    // Files are complex to parse, rely on $_FILES if available
                                                } else {
                                                    $parsedData[$fieldName] = $fieldValue;
                                                }
                                            }
                                        }
                                    }
                                    
                                    $election_title = $parsedData['election_title'] ?? null;
                                    $start_date = $parsedData['start_date'] ?? null;
                                    $end_date = $parsedData['end_date'] ?? null;
                                    $description = $parsedData['description'] ?? '';
                                    $election_type = $parsedData['election_type'] ?? null;
                                    $imgFile = $_FILES['img'] ?? null; // Try $_FILES first, file parsing from raw is complex
                                    
                                    // Debug logging (remove in production)
                                    if (!$election_title || !$start_date || !$end_date) {
                                        error_log("Election update - Parsed data: " . json_encode($parsedData));
                                        error_log("Election update - Boundary: " . $boundary);
                                        error_log("Election update - Content-Type: " . $contentType);
                                    }
                                } else {
                                    // No boundary found or empty input, try JSON as fallback
                                    $data = !empty($rawInput) ? json_decode($rawInput) : null;
                                    if ($data) {
                                        $election_title = $data->election_title ?? null;
                                        $start_date = $data->start_date ?? null;
                                        $end_date = $data->end_date ?? null;
                                        $description = $data->description ?? '';
                                        $election_type = $data->election_type ?? null;
                                        $imgFile = null;
                                    } else {
                                        // Last resort: try parse_str if it's URL-encoded
                                        parse_str($rawInput, $parsedData);
                                        $election_title = $parsedData['election_title'] ?? null;
                                        $start_date = $parsedData['start_date'] ?? null;
                                        $end_date = $parsedData['end_date'] ?? null;
                                        $description = $parsedData['description'] ?? '';
                                        $election_type = $parsedData['election_type'] ?? null;
                                        $imgFile = $_FILES['img'] ?? null;
                                    }
                                }
                            }
                        } else {
                            // JSON request
                            $election_title = $data->election_title ?? null;
                            $start_date = $data->start_date ?? null;
                            $end_date = $data->end_date ?? null;
                            $description = $data->description ?? '';
                            $election_type = $data->election_type ?? null;
                            $imgFile = null; // No file upload for JSON
                        }
                        
                        if ($election_title && $start_date && $end_date) {
                            $response = $electionController->updateElection(
                                $request[1],
                                $election_title,
                                $description,
                                $start_date,
                                $end_date,
                                $election_type,
                                $imgFile
                            );
                            echo json_encode($response);
                            http_response_code($response['statusCode']);
                        } else {
                            // Enhanced error message with debug info
                            $debugInfo = [
                                'has_election_title' => !empty($election_title),
                                'has_start_date' => !empty($start_date),
                                'has_end_date' => !empty($end_date),
                                'is_multipart' => $isMultipart,
                                'post_empty' => empty($_POST),
                                'content_type' => $contentType,
                            ];
                            error_log("Election update validation failed: " . json_encode($debugInfo));
                            echo json_encode([
                                "error" => "Election title, start date, and end date are required",
                                "debug" => $debugInfo
                            ]);
                            http_response_code(400);
                        }
                    } else {
                        echo json_encode(["error" => "Election ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'candidate':
                    if (isset($request[1])) {
                        // Handle both JSON and multipart/form-data
                        // For PUT requests, PHP doesn't populate $_POST automatically
                        // So we need to check both $_POST (if server populates it) and parse from input
                        if ($isMultipart) {
                            // Try $_POST first (some servers populate it for PUT)
                            if (!empty($_POST)) {
                                $fname = $_POST['fname'] ?? null;
                                $mname = $_POST['mname'] ?? '';
                                $lname = $_POST['lname'] ?? null;
                                $party_id = $_POST['party_id'] ?? null;
                                $position_id = $_POST['position_id'] ?? null;
                                $bio = $_POST['bio'] ?? '';
                                $photoFile = $_FILES['photo'] ?? null;
                            } else {
                                // $_POST is empty - parse multipart/form-data from php://input
                                $rawInput = file_get_contents("php://input");
                                
                                // Extract boundary from Content-Type
                                preg_match('/boundary=(.*?)(?:;|$)/', $contentType, $matches);
                                $boundary = isset($matches[1]) ? trim($matches[1], '"\'') : null;
                                
                                if ($boundary && !empty($rawInput)) {
                                    // Parse multipart data
                                    $parts = explode('--' . $boundary, $rawInput);
                                    $parsedData = [];
                                    
                                    foreach ($parts as $part) {
                                        $part = trim($part);
                                        if (empty($part) || $part === '--') continue;
                                        
                                        // Split headers and body
                                        if (preg_match('/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:\s*;\s*filename="[^"]+")?/i', $part, $nameMatch)) {
                                            $fieldName = $nameMatch[1];
                                            
                                            // Find the value after the headers (after double CRLF)
                                            $headerEnd = strpos($part, "\r\n\r\n");
                                            if ($headerEnd === false) {
                                                $headerEnd = strpos($part, "\n\n");
                                            }
                                            
                                            if ($headerEnd !== false) {
                                                $fieldValue = substr($part, $headerEnd + 4); // Skip CRLFCRLF or \n\n
                                                // Remove trailing CRLF and boundary markers
                                                $fieldValue = rtrim($fieldValue, "\r\n");
                                                $fieldValue = preg_replace('/--\s*$/', '', $fieldValue);
                                                $parsedData[$fieldName] = trim($fieldValue);
                                            }
                                        }
                                    }
                                    
                                    $fname = $parsedData['fname'] ?? null;
                                    $mname = $parsedData['mname'] ?? '';
                                    $lname = $parsedData['lname'] ?? null;
                                    $party_id = $parsedData['party_id'] ?? null;
                                    $position_id = $parsedData['position_id'] ?? null;
                                    $bio = $parsedData['bio'] ?? '';
                                    $photoFile = null; // File parsing from raw input is complex, skip for now
                                } else {
                                    // No boundary found or empty input, try JSON as fallback
                                    $data = !empty($rawInput) ? json_decode($rawInput) : null;
                                    $fname = $data->fname ?? null;
                                    $mname = $data->mname ?? '';
                                    $lname = $data->lname ?? null;
                                    $party_id = $data->party_id ?? null;
                                    $position_id = $data->position_id ?? null;
                                    $bio = $data->bio ?? '';
                                    $photoFile = null;
                                }
                            }
                        } else {
                            // JSON request
                            $fname = $data->fname ?? null;
                            $mname = $data->mname ?? '';
                            $lname = $data->lname ?? null;
                            $party_id = $data->party_id ?? null;
                            $position_id = $data->position_id ?? null;
                            $bio = $data->bio ?? '';
                            $photoFile = null; // No file upload for JSON
                        }
                        
                        // Convert to integers if they're strings (allow 0 as valid ID)
                        $party_id = $party_id !== null && $party_id !== '' ? (int)$party_id : null;
                        $position_id = $position_id !== null && $position_id !== '' ? (int)$position_id : null;
                        
                        // Validate required fields (check for null/empty, but allow 0 as valid ID)
                        if ($fname && $lname && $party_id !== null && $position_id !== null) {
                            $response = $candidateController->updateCandidate(
                                $request[1],
                                $fname,
                                $mname,
                                $lname,
                                $party_id,
                                $position_id,
                                $bio,
                                $photoFile
                            );
                            echo json_encode($response);
                            http_response_code($response['statusCode']);
                        } else {
                            $missing = [];
                            if (!$fname) $missing[] = 'first name';
                            if (!$lname) $missing[] = 'last name';
                            if ($party_id === null) $missing[] = 'party';
                            if ($position_id === null) $missing[] = 'position';
                            // Debug info
                            $debug = [
                                'content_type' => $contentType,
                                'is_multipart' => $isMultipart,
                                'post_empty' => empty($_POST),
                                'fname' => $fname,
                                'lname' => $lname,
                                'party_id' => $party_id,
                                'position_id' => $position_id
                            ];
                            echo json_encode([
                                "error" => "Missing required fields: " . implode(', ', $missing),
                                "debug" => $debug
                            ]);
                            http_response_code(400);
                        }
                    } else {
                        echo json_encode(["error" => "Candidate ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'position':
                    if (isset($request[1])) {
                        if (isset($data->name) && isset($data->type)) {
                            $allows_multiple_votes = $data->allows_multiple_votes ?? false;
                            $response = $positionController->updatePosition(
                                $request[1],
                                $data->name,
                                $allows_multiple_votes,
                                $data->type
                            );
                            echo json_encode($response);
                            http_response_code($response['statusCode']);
                        } else {
                            echo json_encode(["error" => "Position name and type are required"]);
                            http_response_code(400);
                        }
                    } else {
                        echo json_encode(["error" => "Position ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'party':
                    if (isset($request[1])) {
                        if (isset($data->party_name) && isset($data->party_code)) {
                            $description = $data->description ?? '';
                            $response = $partyController->updateParty(
                                $request[1],
                                $data->party_name,
                                $data->party_code,
                                $description
                            );
                            echo json_encode($response);
                            http_response_code($response['statusCode']);
                        } else {
                            echo json_encode(["error" => "Party name and code are required"]);
                            http_response_code(400);
                        }
                    } else {
                        echo json_encode(["error" => "Party ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'voter':
                    if (isset($request[1])) {
                        // Handle multipart/form-data for file upload
                        $putData = $_POST;
                        $filesData = $_FILES;
                        
                        $response = $voterController->updateVoter($request[1], $putData, $filesData);
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Voter ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                default:
                    echo json_encode(["error" => "Method not available"]);
                    http_response_code(404);
                    break;
            }
            break;
            
        case 'DELETE':
            switch ($request[0]) {
                case 'election':
                    if (isset($request[1])) {
                        if (isset($request[2]) && $request[2] === 'archive') {
                            $response = $electionController->archiveElection($request[1]);
                        } else {
                            $response = $electionController->deleteElection($request[1]);
                        }
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Election ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'candidate':
                    if (isset($request[1])) {
                        if (isset($request[2]) && $request[2] === 'archive') {
                            $response = $candidateController->archiveCandidate($request[1]);
                        } else {
                            $response = $candidateController->deleteCandidate($request[1]);
                        }
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Candidate ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'party':
                    if (isset($request[1])) {
                        if (isset($request[2]) && $request[2] === 'archive') {
                            $response = $partyController->archiveParty($request[1]);
                        } else {
                            $response = $partyController->deleteParty($request[1]);
                        }
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Party ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'position':
                    if (isset($request[1])) {
                        if (isset($request[2]) && $request[2] === 'archive') {
                            $response = $positionController->archivePosition($request[1]);
                        } else {
                            $response = $positionController->deletePosition($request[1]);
                        }
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Position ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'voter':
                    if (isset($request[1])) {
                        if (isset($request[2]) && $request[2] === 'archive') {
                            $response = $voterController->archiveVoter($request[1]);
                        } else {
                            $response = $voterController->deleteVoter($request[1]);
                        }
                        echo json_encode($response);
                        http_response_code($response['statusCode']);
                    } else {
                        echo json_encode(["error" => "Voter ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                default:
                    echo json_encode(["error" => "Method not available"]);
                    http_response_code(404);
                    break;
            }
            break;
            
        default:
            echo json_encode(["error" => "Method not available"]);
            http_response_code(404);
            break;
    }
    
    // End output buffering and send output
    ob_end_flush();
?>