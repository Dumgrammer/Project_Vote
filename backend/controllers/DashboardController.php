<?php

class DashboardController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getDashboardStats() {
        try {
            // Get total voters
            $votersQuery = $this->pdo->prepare("
                SELECT COUNT(*) as total 
                FROM voters 
                WHERE is_archived = 0
            ");
            $votersQuery->execute();
            $totalVoters = $votersQuery->fetch(PDO::FETCH_ASSOC)['total'];

            // Get total elections
            $electionsQuery = $this->pdo->prepare("
                SELECT COUNT(*) as total 
                FROM elections 
                WHERE is_archived = 0
            ");
            $electionsQuery->execute();
            $totalElections = $electionsQuery->fetch(PDO::FETCH_ASSOC)['total'];

            // Get total votes cast (count of candidacy_votes records)
            $votesQuery = $this->pdo->prepare("
                SELECT COUNT(*) as total 
                FROM candidacy_votes
            ");
            $votesQuery->execute();
            $totalVotes = $votesQuery->fetch(PDO::FETCH_ASSOC)['total'];

            // Get active elections (ongoing)
            $activeElectionsQuery = $this->pdo->prepare("
                SELECT COUNT(*) as total 
                FROM elections 
                WHERE is_archived = 0 
                AND NOW() >= start_date 
                AND NOW() <= end_date
            ");
            $activeElectionsQuery->execute();
            $activeElections = $activeElectionsQuery->fetch(PDO::FETCH_ASSOC)['total'];

            // Get voter participation by hour (last 48 hours for more granular spikes)
            $participationQuery = $this->pdo->prepare("
                SELECT 
                    DATE_FORMAT(cv.date_voted, '%Y-%m-%d %H:00:00') as vote_hour,
                    DATE_FORMAT(cv.date_voted, '%b %d %H:%i') as date_label,
                    HOUR(cv.date_voted) as hour,
                    COUNT(DISTINCT cv.voter_id) as voters_count,
                    COUNT(cv.id) as total_votes
                FROM candidacy_votes cv
                WHERE cv.date_voted >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
                GROUP BY vote_hour
                ORDER BY vote_hour ASC
            ");
            $participationQuery->execute();
            $participation = $participationQuery->fetchAll(PDO::FETCH_ASSOC);
            
            // If no recent data, get all-time voting activity by hour
            if (empty($participation)) {
                $participationQuery = $this->pdo->prepare("
                    SELECT 
                        DATE_FORMAT(cv.date_voted, '%Y-%m-%d %H:00:00') as vote_hour,
                        DATE_FORMAT(cv.date_voted, '%b %d %H:%i') as date_label,
                        HOUR(cv.date_voted) as hour,
                        COUNT(DISTINCT cv.voter_id) as voters_count,
                        COUNT(cv.id) as total_votes
                    FROM candidacy_votes cv
                    GROUP BY vote_hour
                    ORDER BY vote_hour ASC
                    LIMIT 48
                ");
                $participationQuery->execute();
                $participation = $participationQuery->fetchAll(PDO::FETCH_ASSOC);
            }

            // Get recent elections with vote counts
            $recentElectionsQuery = $this->pdo->prepare("
                SELECT 
                    e.id,
                    e.election_title,
                    e.start_date,
                    e.end_date,
                    COUNT(DISTINCT cv.voter_id) as total_voters,
                    COUNT(cv.id) as total_votes,
                    CASE 
                        WHEN NOW() >= e.start_date AND NOW() <= e.end_date THEN 'ongoing'
                        WHEN NOW() < e.start_date THEN 'upcoming'
                        ELSE 'completed'
                    END as status
                FROM elections e
                LEFT JOIN candidacy_votes cv ON e.id = cv.election_id
                WHERE e.is_archived = 0
                GROUP BY e.id
                ORDER BY e.created DESC
                LIMIT 5
            ");
            $recentElectionsQuery->execute();
            $recentElections = $recentElectionsQuery->fetchAll(PDO::FETCH_ASSOC);

            // Get top voted elections
            $topElectionsQuery = $this->pdo->prepare("
                SELECT 
                    e.id,
                    e.election_title,
                    COUNT(DISTINCT cv.voter_id) as voter_count,
                    COUNT(cv.id) as vote_count
                FROM elections e
                LEFT JOIN candidacy_votes cv ON e.id = cv.election_id
                WHERE e.is_archived = 0
                GROUP BY e.id
                ORDER BY voter_count DESC
                LIMIT 10
            ");
            $topElectionsQuery->execute();
            $topElections = $topElectionsQuery->fetchAll(PDO::FETCH_ASSOC);

            // Get voting trends (voters who voted vs total voters)
            $votingTrendsQuery = $this->pdo->prepare("
                SELECT 
                    e.id,
                    e.election_title,
                    COUNT(DISTINCT cv.voter_id) as voters_voted,
                    (SELECT COUNT(*) FROM voters WHERE is_archived = 0) as total_voters,
                    ROUND((COUNT(DISTINCT cv.voter_id) / (SELECT COUNT(*) FROM voters WHERE is_archived = 0)) * 100, 2) as participation_rate
                FROM elections e
                LEFT JOIN candidacy_votes cv ON e.id = cv.election_id
                WHERE e.is_archived = 0
                AND e.end_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY e.id
                ORDER BY e.start_date DESC
            ");
            $votingTrendsQuery->execute();
            $votingTrends = $votingTrendsQuery->fetchAll(PDO::FETCH_ASSOC);

            // Get most recent ended election with vote results
            $recentEndedElectionQuery = $this->pdo->prepare("
                SELECT 
                    e.id,
                    e.election_title,
                    e.start_date,
                    e.end_date
                FROM elections e
                WHERE e.is_archived = 0 
                AND e.end_date < NOW()
                ORDER BY e.end_date DESC
                LIMIT 1
            ");
            $recentEndedElectionQuery->execute();
            $recentEndedElection = $recentEndedElectionQuery->fetch(PDO::FETCH_ASSOC);

            $electionResults = [];
            if ($recentEndedElection) {
                // Get vote results for this election
                $votesStmt = $this->pdo->prepare("
                    SELECT candidates_voted 
                    FROM candidacy_votes 
                    WHERE election_id = ?
                ");
                $votesStmt->execute([$recentEndedElection['id']]);
                $allVotes = $votesStmt->fetchAll(PDO::FETCH_COLUMN);

                // Get candidates
                $candidatesStmt = $this->pdo->prepare("
                    SELECT 
                        c.id,
                        CONCAT(c.fname, ' ', IFNULL(CONCAT(LEFT(c.mname, 1), '. '), ''), c.lname) as full_name,
                        c.position,
                        p.party_code
                    FROM candidates c
                    LEFT JOIN parties p ON c.party_id = p.id
                    WHERE c.election_id = ? AND c.is_archived = 0
                    ORDER BY c.position, c.lname
                ");
                $candidatesStmt->execute([$recentEndedElection['id']]);
                $candidates = $candidatesStmt->fetchAll(PDO::FETCH_ASSOC);

                // Count votes
                $voteCounts = [];
                foreach ($allVotes as $voteJson) {
                    $votes = json_decode($voteJson, true);
                    if (!$votes) continue;

                    foreach ($votes as $vote) {
                        $candidateId = $vote['candidate_id'];
                        if (!isset($voteCounts[$candidateId])) {
                            $voteCounts[$candidateId] = 0;
                        }
                        $voteCounts[$candidateId]++;
                    }
                }

                // Format results by position (top 10 candidates)
                foreach ($candidates as $candidate) {
                    $voteCount = $voteCounts[$candidate['id']] ?? 0;
                    $electionResults[] = [
                        'candidate_name' => $candidate['full_name'],
                        'position' => $candidate['position'],
                        'party_code' => $candidate['party_code'],
                        'vote_count' => $voteCount
                    ];
                }

                // Sort by vote count and get top 10
                usort($electionResults, function($a, $b) {
                    return $b['vote_count'] - $a['vote_count'];
                });
                $electionResults = array_slice($electionResults, 0, 10);
            }

            return [
                'success' => true,
                'statusCode' => 200,
                'data' => [
                    'stats' => [
                        'totalVoters' => (int)$totalVoters,
                        'totalElections' => (int)$totalElections,
                        'totalVotes' => (int)$totalVotes,
                        'activeElections' => (int)$activeElections
                    ],
                    'participation' => $participation,
                    'recentElections' => $recentElections,
                    'topElections' => $topElections,
                    'votingTrends' => $votingTrends,
                    'recentEndedElection' => $recentEndedElection,
                    'electionResults' => $electionResults
                ]
            ];

        } catch (PDOException $e) {
            return [
                'success' => false,
                'statusCode' => 500,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    public function getElectionAnalytics($electionId) {
        try {
            // Get election details
            $electionQuery = $this->pdo->prepare("
                SELECT * FROM elections WHERE id = ? AND is_archived = 0
            ");
            $electionQuery->execute([$electionId]);
            $election = $electionQuery->fetch(PDO::FETCH_ASSOC);

            if (!$election) {
                return [
                    'success' => false,
                    'statusCode' => 404,
                    'message' => 'Election not found'
                ];
            }

            // Get all votes for this election to analyze
            $votesStmt = $this->pdo->prepare("
                SELECT candidates_voted, date_voted
                FROM candidacy_votes 
                WHERE election_id = ?
            ");
            $votesStmt->execute([$electionId]);
            $allVotes = $votesStmt->fetchAll(PDO::FETCH_ASSOC);

            // Count votes for each candidate by position
            $voteCounts = [];
            $hourlyVotes = array_fill(0, 24, 0);

            foreach ($allVotes as $voteRecord) {
                $votes = json_decode($voteRecord['candidates_voted'], true);
                if (!$votes) continue;

                // Count hourly votes
                $hour = (int)date('G', strtotime($voteRecord['date_voted']));
                $hourlyVotes[$hour]++;

                foreach ($votes as $vote) {
                    $candidateId = $vote['candidate_id'];
                    $position = $vote['position'];

                    if (!isset($voteCounts[$position])) {
                        $voteCounts[$position] = [];
                    }

                    if (!isset($voteCounts[$position][$candidateId])) {
                        $voteCounts[$position][$candidateId] = 0;
                    }
                    $voteCounts[$position][$candidateId]++;
                }
            }

            // Get candidate details with vote counts
            $candidatesStmt = $this->pdo->prepare("
                SELECT 
                    c.id,
                    c.fname,
                    c.lname,
                    CONCAT(c.fname, ' ', IFNULL(CONCAT(c.mname, ' '), ''), c.lname) as full_name,
                    c.position,
                    p.party_name
                FROM candidates c
                LEFT JOIN parties p ON c.party_id = p.id
                WHERE c.election_id = ? AND c.is_archived = 0
                ORDER BY c.position, c.lname
            ");
            $candidatesStmt->execute([$electionId]);
            $candidates = $candidatesStmt->fetchAll(PDO::FETCH_ASSOC);

            // Add vote counts to candidates
            $votesByPosition = [];
            foreach ($candidates as $candidate) {
                $position = $candidate['position'];
                $candidateId = $candidate['id'];
                $voteCount = $voteCounts[$position][$candidateId] ?? 0;

                if (!isset($votesByPosition[$position])) {
                    $votesByPosition[$position] = [];
                }

                $votesByPosition[$position][] = [
                    'position' => $position,
                    'fname' => $candidate['fname'],
                    'lname' => $candidate['lname'],
                    'full_name' => $candidate['full_name'],
                    'party_name' => $candidate['party_name'],
                    'vote_count' => $voteCount
                ];
            }

            // Format hourly votes
            $hourlyVotesFormatted = [];
            for ($i = 0; $i < 24; $i++) {
                $hourlyVotesFormatted[] = [
                    'hour' => $i,
                    'vote_count' => $hourlyVotes[$i]
                ];
            }

            return [
                'success' => true,
                'statusCode' => 200,
                'data' => [
                    'election' => $election,
                    'votesByPosition' => $votesByPosition,
                    'hourlyVotes' => $hourlyVotesFormatted
                ]
            ];

        } catch (PDOException $e) {
            return [
                'success' => false,
                'statusCode' => 500,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
}
