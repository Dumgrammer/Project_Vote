<?php

//set default time zone
date_default_timezone_set("Asia/Manila");

//set time limit of requests
set_time_limit(1000);

// Detect if we're in production (Hostinger) or local development
$isProduction = !in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) 
    && strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') === false
    && strpos($_SERVER['HTTP_HOST'] ?? '', '127.0.0.1') === false;

if ($isProduction) {
    // PRODUCTION (Hostinger) - UPDATE THESE WITH YOUR HOSTINGER DATABASE CREDENTIALS
    define("SERVER", "localhost"); // Usually 'localhost' on Hostinger, but check your hosting panel
    define("DATABASE", "u123456789_pollify"); // Replace with your Hostinger database name
    define("USER", "u123456789_admin"); // Replace with your Hostinger database username
    define("PASSWORD", "your_password_here"); // Replace with your Hostinger database password
    define("DRIVER", "mysql");
} else {
    // LOCAL DEVELOPMENT
    define("SERVER", "localhost");
    define("DATABASE", "pollify");
    define("USER", "root");
    define("PASSWORD", "");
    define("DRIVER", "mysql");
}

class DatabaseAccess{
    private $connectionString = DRIVER . ":host=" . SERVER . ";dbname=" . DATABASE . "; charset=utf8mb4";
    private $options = [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        \PDO::ATTR_EMULATE_PREPARES => false
    ];


    public function connect(){
        return new \PDO($this->connectionString, USER, PASSWORD, $this->options);
    }
}

?>