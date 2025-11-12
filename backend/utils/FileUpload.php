<?php

class FileUpload {
    private $uploadDir;
    private $allowedExtensions;
    private $maxFileSize;

    public function __construct($uploadDir = './uploads/elections/', $maxFileSize = 5242880) {
        // 5MB default
        $this->uploadDir = $uploadDir;
        $this->maxFileSize = $maxFileSize;
        $this->allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        // Create directory if it doesn't exist
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
    }

    /**
     * Upload a file
     * @param array $file - The $_FILES array element
     * @return array - ['success' => bool, 'filename' => string, 'message' => string]
     */
    public function upload($file) {
        // Check if file was uploaded
        if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
            return ['success' => false, 'message' => 'No file uploaded'];
        }

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['success' => false, 'message' => 'Upload error: ' . $this->getUploadErrorMessage($file['error'])];
        }

        // Validate file size
        if ($file['size'] > $this->maxFileSize) {
            $maxSizeMB = $this->maxFileSize / 1048576;
            return ['success' => false, 'message' => "File size exceeds {$maxSizeMB}MB limit"];
        }

        // Get file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        // Validate file extension
        if (!in_array($extension, $this->allowedExtensions)) {
            return ['success' => false, 'message' => 'Invalid file type. Allowed: ' . implode(', ', $this->allowedExtensions)];
        }

        // Validate file is actually an image
        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            return ['success' => false, 'message' => 'File is not a valid image'];
        }

        // Generate unique filename
        $filename = $this->generateUniqueFilename($extension);
        $filepath = $this->uploadDir . $filename;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            return [
                'success' => true,
                'filename' => $filename,
                'filepath' => $filepath,
                'message' => 'File uploaded successfully'
            ];
        } else {
            return ['success' => false, 'message' => 'Failed to move uploaded file'];
        }
    }

    /**
     * Delete a file
     * @param string $filename
     * @return bool
     */
    public function delete($filename) {
        if (empty($filename)) {
            return false;
        }

        $filepath = $this->uploadDir . basename($filename);
        
        if (file_exists($filepath)) {
            return unlink($filepath);
        }
        
        return false;
    }

    /**
     * Generate a unique filename
     * @param string $extension
     * @return string
     */
    private function generateUniqueFilename($extension) {
        // Determine prefix based on upload directory
        if (strpos($this->uploadDir, 'candidates') !== false) {
            $prefix = 'candidate_';
        } elseif (strpos($this->uploadDir, 'voters') !== false) {
            $prefix = 'voter_';
        } else {
            $prefix = 'election_';
        }
        return uniqid($prefix, true) . '_' . time() . '.' . $extension;
    }

    /**
     * Get human-readable upload error message
     * @param int $errorCode
     * @return string
     */
    private function getUploadErrorMessage($errorCode) {
        switch ($errorCode) {
            case UPLOAD_ERR_INI_SIZE:
                return 'File exceeds upload_max_filesize directive in php.ini';
            case UPLOAD_ERR_FORM_SIZE:
                return 'File exceeds MAX_FILE_SIZE directive in HTML form';
            case UPLOAD_ERR_PARTIAL:
                return 'File was only partially uploaded';
            case UPLOAD_ERR_NO_FILE:
                return 'No file was uploaded';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Missing temporary folder';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Failed to write file to disk';
            case UPLOAD_ERR_EXTENSION:
                return 'A PHP extension stopped the file upload';
            default:
                return 'Unknown upload error';
        }
    }

    /**
     * Get the full URL path to an uploaded file
     * @param string $filename
     * @return string
     */
    public function getFileUrl($filename) {
        if (empty($filename)) {
            return '';
        }
        // Extract the folder name from uploadDir
        // e.g., './uploads/elections/' -> 'uploads/elections/'
        $relativePath = str_replace('./', '', $this->uploadDir);
        return $relativePath . basename($filename);
    }
    
    /**
     * Get the upload directory
     * @return string
     */
    public function getUploadDir() {
        return $this->uploadDir;
    }
}

?>

