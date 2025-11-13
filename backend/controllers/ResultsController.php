<?php
require_once('./utils/utils.php');

class ResultsController extends GlobalUtil {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // Get election results
    public function getElectionResults($electionId) {
        try {
            // Validate election ID
            if (empty($electionId)) {
                return $this->sendErrorResponse("Election ID is required", 400);
            }

            // Check if election exists
            $electionStmt = $this->pdo->prepare("SELECT * FROM elections WHERE id = ?");
            $electionStmt->execute([$electionId]);
            $election = $electionStmt->fetch(PDO::FETCH_ASSOC);

            if (!$election) {
                return $this->sendErrorResponse("Election not found", 404);
            }

            // Get all candidates for this election
            $candidatesStmt = $this->pdo->prepare("
                SELECT 
                    c.id,
                    c.photo,
                    c.fname,
                    c.mname,
                    c.lname,
                    CONCAT(c.fname, ' ', IFNULL(CONCAT(c.mname, ' '), ''), c.lname) as full_name,
                    c.position,
                    c.bio,
                    p.party_name,
                    p.party_code
                FROM candidates c
                LEFT JOIN parties p ON c.party_id = p.id
                WHERE c.election_id = ? AND c.is_archived = 0
                ORDER BY c.position, c.lname
            ");
            $candidatesStmt->execute([$electionId]);
            $candidates = $candidatesStmt->fetchAll(PDO::FETCH_ASSOC);

            // Add photo URLs
            require_once('./utils/FileUpload.php');
            $fileUpload = new FileUpload('./uploads/candidates/');
            foreach ($candidates as &$candidate) {
                $candidate['photo_url'] = $candidate['photo'] ? $fileUpload->getFileUrl($candidate['photo']) : null;
            }

            // Get all votes for this election
            $votesStmt = $this->pdo->prepare("
                SELECT candidates_voted 
                FROM candidacy_votes 
                WHERE election_id = ?
            ");
            $votesStmt->execute([$electionId]);
            $allVotes = $votesStmt->fetchAll(PDO::FETCH_COLUMN);

            // Count votes for each candidate
            $voteCounts = [];
            $positionVoteCounts = [];

            foreach ($allVotes as $voteJson) {
                $votes = json_decode($voteJson, true);
                if (!$votes) continue;

                foreach ($votes as $vote) {
                    $candidateId = $vote['candidate_id'];
                    $position = $vote['position'];

                    // Count votes for candidate
                    if (!isset($voteCounts[$candidateId])) {
                        $voteCounts[$candidateId] = 0;
                    }
                    $voteCounts[$candidateId]++;

                    // Count total votes for position
                    if (!isset($positionVoteCounts[$position])) {
                        $positionVoteCounts[$position] = 0;
                    }
                    $positionVoteCounts[$position]++;
                }
            }

            // Group candidates by position with vote counts
            $resultsByPosition = [];
            foreach ($candidates as $candidate) {
                $position = $candidate['position'];
                $candidateId = $candidate['id'];
                
                if (!isset($resultsByPosition[$position])) {
                    $resultsByPosition[$position] = [
                        'position' => $position,
                        'total_votes' => $positionVoteCounts[$position] ?? 0,
                        'candidates' => []
                    ];
                }

                $voteCount = $voteCounts[$candidateId] ?? 0;
                $totalVotes = $positionVoteCounts[$position] ?? 1; // Avoid division by zero
                $percentage = $totalVotes > 0 ? ($voteCount / $totalVotes) * 100 : 0;

                $resultsByPosition[$position]['candidates'][] = [
                    'id' => $candidate['id'],
                    'photo_url' => $candidate['photo_url'],
                    'full_name' => $candidate['full_name'],
                    'position' => $candidate['position'],
                    'party_name' => $candidate['party_name'],
                    'party_code' => $candidate['party_code'],
                    'bio' => $candidate['bio'],
                    'vote_count' => $voteCount,
                    'percentage' => round($percentage, 2)
                ];
            }

            // Convert to indexed array
            $results = array_values($resultsByPosition);

            // Get total number of voters who voted
            $totalVotersStmt = $this->pdo->prepare("
                SELECT COUNT(DISTINCT voter_id) as total 
                FROM candidacy_votes 
                WHERE election_id = ?
            ");
            $totalVotersStmt->execute([$electionId]);
            $totalVoters = $totalVotersStmt->fetchColumn();

            return $this->sendResponse([
                'election' => [
                    'id' => $election['id'],
                    'election_title' => $election['election_title'],
                    'description' => $election['description'],
                    'start_date' => $election['start_date'],
                    'end_date' => $election['end_date']
                ],
                'results' => $results,
                'total_voters' => $totalVoters
            ], 200);

        } catch (\Exception $e) {
            return $this->sendErrorResponse("Failed to get election results: " . $e->getMessage(), 500);
        }
    }
}
?>

