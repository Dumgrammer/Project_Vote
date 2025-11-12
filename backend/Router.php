<?php

    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    
    // Start output buffering to prevent accidental output
    ob_start();
    
    // Allow requests from specific origin (required for credentials)
    header('Access-Control-Allow-Origin: http://localhost:5173');
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
    require_once('./controllers/AdminController.php');
    require_once('./controllers/ElectionController.php');
    require_once('./controllers/CandidateController.php');
    require_once('./controllers/PartyController.php');
    require_once('./controllers/VoterController.php');
    require_once('./controllers/VoterAuthController.php');

    
    $con = new DatabaseAccess();
    $pdo = $con->connect();
    
    $adminController = new AdminController($con);
    $electionController = new ElectionController($con);
    $candidateController = new CandidateController($con);
    $partyController = new PartyController($con);
    $voterController = new VoterController($pdo);
    $voterAuthController = new VoterAuthController($pdo);
    
    
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
                    $imgFile = $_FILES['img'] ?? null;
                    
                    if ($election_title && $start_date && $end_date) {
                        $response = $electionController->createElection(
                            $election_title,
                            $description,
                            $start_date,
                            $end_date,
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
                    $position = $_POST['position'] ?? null;
                    $bio = $_POST['bio'] ?? '';
                    $photoFile = $_FILES['photo'] ?? null;
                    
                    if ($election_id && $fname && $lname && $party_id && $position) {
                        $response = $candidateController->createCandidate(
                            $election_id,
                            $fname,
                            $mname,
                            $lname,
                            $party_id,
                            $position,
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
                
                default:
                    echo json_encode(["error" => "Method not available"]);
                    http_response_code(404);
                    break;
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            switch ($request[0]) {
                case 'election':
                    if (isset($request[1])) {
                        if (isset($data->election_title) && isset($data->start_date) && isset($data->end_date)) {
                            $description = $data->description ?? '';
                            $img = $data->img ?? null;
                            $response = $electionController->updateElection(
                                $request[1],
                                $data->election_title,
                                $description,
                                $data->start_date,
                                $data->end_date,
                                $img
                            );
                            echo json_encode($response);
                            http_response_code($response['statusCode']);
                        } else {
                            echo json_encode(["error" => "Election title, start date, and end date are required"]);
                            http_response_code(400);
                        }
                    } else {
                        echo json_encode(["error" => "Election ID is required"]);
                        http_response_code(400);
                    }
                    break;
                
                case 'candidate':
                    if (isset($request[1])) {
                        // Handle multipart/form-data for file upload
                        $fname = $_POST['fname'] ?? null;
                        $mname = $_POST['mname'] ?? '';
                        $lname = $_POST['lname'] ?? null;
                        $party_id = $_POST['party_id'] ?? null;
                        $position = $_POST['position'] ?? null;
                        $bio = $_POST['bio'] ?? '';
                        $photoFile = $_FILES['photo'] ?? null;
                        
                        if ($fname && $lname && $party_id && $position) {
                            $response = $candidateController->updateCandidate(
                                $request[1],
                                $fname,
                                $mname,
                                $lname,
                                $party_id,
                                $position,
                                $bio,
                                $photoFile
                            );
                            echo json_encode($response);
                            http_response_code($response['statusCode']);
                        } else {
                            echo json_encode(["error" => "First name, last name, party, and position are required"]);
                            http_response_code(400);
                        }
                    } else {
                        echo json_encode(["error" => "Candidate ID is required"]);
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