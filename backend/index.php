<?php
/**
 * Index file - redirects to Router.php
 * This ensures the API works even if .htaccess rewrite doesn't work
 */

// Get the request parameter from URL or default to empty
$request = $_GET['request'] ?? '';

// If no request parameter, redirect to Router.php with request parameter
if (empty($request) && !empty($_SERVER['REQUEST_URI'])) {
    // Extract path from REQUEST_URI
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = trim($path, '/');
    
    // Remove 'backend' or 'api' prefix if present
    $path = preg_replace('#^(backend|api)/#', '', $path);
    
    if (!empty($path)) {
        $request = $path;
    }
}

// Include Router.php
require_once(__DIR__ . '/Router.php');

