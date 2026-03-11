<?php
// Turn off all error reporting
error_reporting(0);

$uploadsDir = __DIR__ . '/uploads/';

// Load configuration
$config = @json_decode(@file_get_contents(__DIR__ . '/import-variants.json'), true);

// Get allowed formats for site-uploads
$importFormats = [];
if (isset($config['site-uploads']['allowedFormats']) && is_array($config['site-uploads']['allowedFormats'])) {
  $importFormats = $config['site-uploads']['allowedFormats'];
}

// MIME types that support preview generation
$previewMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'];

if (ob_get_length()) {
  http_response_code(500);
  echo ob_get_contents();
} else {
  $data = null;

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    deleteObsoleteUploads();
    $data = uploadFiles();
  }

  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data);
}

function getUploadErrorMessage($errorCode)
{
  $messages = [
    UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
    UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.',
    UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded.',
    UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
    UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
    UPLOAD_ERR_CANT_WRITE => 'Cannot write to target directory. Please fix CHMOD.',
    UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
  ];

  return isset($messages[$errorCode]) ? $messages[$errorCode] : 'Unknown upload error';
}

function getUploadFileName($originalName, $tempPath)
{
  $ext = pathinfo($originalName, PATHINFO_EXTENSION);
  $hash = hash_file('md5', $tempPath, false);
  $shortHash = substr($hash, 0, 8);

  // Get MIME type and determine prefix
  $mimeType = getFileMimeType($originalName, $tempPath);
  $prefix = getFileTypePrefixFromMime($mimeType);

  return 'mwscr-' . $prefix . $shortHash . ($ext ? '.' . $ext : '');
}

function getPreviewPath($originalPath)
{
  $fileInfo = pathinfo($originalPath);
  return $fileInfo['dirname'] . '/' . $fileInfo['filename'] . '.preview.webp';
}

function getFileTypePrefixFromMime($mimeType)
{
  if (strpos($mimeType, 'image/') === 0) {
    return 'image-';
  }

  if (strpos($mimeType, 'video/') === 0) {
    return 'video-';
  }

  if ($mimeType === 'application/zip' || $mimeType === 'application/x-zip-compressed') {
    return 'archive-';
  }

  if ($mimeType === 'application/json') {
    return 'patch-';
  }

  // Default
  return 'file-';
}

function getFileMimeType($originalName, $tempPath)
{
  $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
  $mimeMap = [
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'webp' => 'image/webp',
    'bmp' => 'image/bmp',
    'gif' => 'image/gif',
    'json' => 'application/json',
    'mp4' => 'video/mp4',
    'avi' => 'video/x-msvideo',
    'zip' => 'application/zip',
  ];

  if (isset($mimeMap[$extension])) {
    return $mimeMap[$extension];
  }

  if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
      $mimeType = finfo_file($finfo, $tempPath);
      finfo_close($finfo);
      if ($mimeType !== false) {
        return $mimeType;
      }
    }
  }

  if (function_exists('mime_content_type')) {
    $mimeType = mime_content_type($tempPath);
    if ($mimeType !== false) {
      return $mimeType;
    }
  }

  return 'application/octet-stream';
}

function createImagePreview($filename, $mimeType)
{
  $baseSize = 320;

  $img = null;

  switch ($mimeType) {
    case 'image/png':
      $img = @imagecreatefrompng($filename);
      break;
    case 'image/jpeg':
      $img = @imagecreatefromjpeg($filename);
      break;
    case 'image/webp':
      $img = @imagecreatefromwebp($filename);
      break;
    case 'image/bmp':
      $img = @imagecreatefrombmp($filename);
      break;
    case 'image/gif':
      $img = @imagecreatefromgif($filename);
      break;
    default:
      return false;
  }

  if (!$img) {
    return false;
  }

  $imgWidth = @imagesx($img);
  $imgHeight = @imagesy($img);

  if ($imgWidth > $imgHeight) {
    $height = $baseSize;
    $width = ($imgWidth / $imgHeight) * $baseSize;
  } else {
    $width = $baseSize;
    $height = ($imgHeight / $imgWidth) * $baseSize;
  }

  $previewFileName = getPreviewPath($filename);

  $imgOutput = @imagecreatetruecolor($width, $height);
  @imagecopyresampled($imgOutput, $img, 0, 0, 0, 0, $width, $height, $imgWidth, $imgHeight);
  @imagewebp($imgOutput, $previewFileName, 85);

  // https://stackoverflow.com/questions/30078090/imagewebp-php-creates-corrupted-webp-files
  if (file_exists($previewFileName) && filesize($previewFileName) % 2 == 1) {
    file_put_contents($previewFileName, "\0", FILE_APPEND);
  }

  @imagedestroy($imgOutput);
  @imagedestroy($img);

  return $previewFileName;
}

function deleteObsoleteUploads()
{
  global $uploadsDir;

  if (!is_dir($uploadsDir)) {
    return;
  }

  $filenames = scandir($uploadsDir);

  foreach ($filenames as $filename) {
    if ($filename === '.' || $filename === '..') {
      continue;
    }

    $filePath = $uploadsDir . $filename;

    // Skip preview files in main deletion logic
    if (strpos($filename, '.preview.webp') !== false) {
      continue;
    }

    $modifiedTime = filemtime($filePath);
    $sevenDaysInSeconds = 60 * 60 * 24 * 7;

    if (time() - $modifiedTime > $sevenDaysInSeconds) {
      unlink($filePath);

      // Also delete preview if exists
      $previewPath = getPreviewPath($filePath);
      if (file_exists($previewPath)) {
        unlink($previewPath);
      }
    }
  }
}

function isValidFileType($mimeType, $fileSize)
{
  global $importFormats;

  if (empty($importFormats)) {
    return ['valid' => false, 'error' => 'Formats configuration not found'];
  }

  $fileSizeMB = $fileSize / (1024 * 1024);

  foreach ($importFormats as $formatConfig) {
    if (!isset($formatConfig['mimeTypes']) || !is_array($formatConfig['mimeTypes'])) {
      continue;
    }

    if (in_array($mimeType, $formatConfig['mimeTypes'])) {
      // Check maxSize if it exists in config
      if (isset($formatConfig['maxSize']) && $fileSizeMB > $formatConfig['maxSize']) {
        $label = isset($formatConfig['label']) ? $formatConfig['label'] : 'this type';
        return [
          'valid' => false,
          'error' => "File exceeds maximum size for {$label} ({$formatConfig['maxSize']}MB)",
        ];
      }

      return ['valid' => true, 'type' => isset($formatConfig['label']) ? $formatConfig['label'] : 'allowed'];
    }
  }

  return ['valid' => false, 'error' => 'File type not supported'];
}

function uploadFiles()
{
  global $uploadsDir, $previewMimeTypes;

  $baseUrl = 'https://mwscr.dehero.site/uploads/';

  if (!isset($_FILES['file'])) {
    return ['error' => 'No files uploaded'];
  }

  $files = $_FILES['file'];
  $result = [];

  // Handle single file upload
  if (!is_array($files['name'])) {
    $files = [
      'name' => [$files['name']],
      'type' => [$files['type']],
      'tmp_name' => [$files['tmp_name']],
      'error' => [$files['error']],
      'size' => [$files['size']],
    ];
  }

  $count = count($files['name']);

  for ($i = 0; $i < $count; $i++) {
    $errorCode = $files['error'][$i];

    $success = false;
    $errors = [];
    $url = '';

    if ($errorCode !== UPLOAD_ERR_OK) {
      $errors[] = getUploadErrorMessage($errorCode);
    } else {
      $tempPath = $files['tmp_name'][$i];
      $originalName = $files['name'][$i];
      $name = getUploadFileName($originalName, $tempPath);
      $url = $baseUrl . $name;
      $targetPath = $uploadsDir . $name;

      // Get MIME type using both original filename and temp file
      $mimeType = getFileMimeType($originalName, $tempPath);

      if (file_exists($targetPath)) {
        $success = true;
      } else {
        // Validate file type and size using config
        $validation = isValidFileType($mimeType, $files['size'][$i]);

        if (!$validation['valid']) {
          $errors[] = $validation['error'];
        }

        if (count($errors) === 0) {
          if (!is_dir(dirname($targetPath))) {
            @mkdir(dirname($targetPath), 0777, true);
          }

          if (move_uploaded_file($tempPath, $targetPath)) {
            $success = true;

            // Check if file supports preview
            if (in_array($mimeType, $previewMimeTypes)) {
              createImagePreview($targetPath, $mimeType);
            }
          } else {
            $error = error_get_last();
            $errors[] = isset($error['message']) ? $error['message'] : 'Failed to move uploaded file';
          }
        }
      }
    }

    $result[] = ['success' => $success, 'errors' => $errors, 'url' => $url];
  }

  return $result;
}
