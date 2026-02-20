<?php
// Turn off all error reporting
error_reporting(0);

$uploadsDir = __DIR__ . '/uploads/';

$importFormats = @json_decode(@file_get_contents(__DIR__ . '/import-variants.json'), true)['site-uploads'];

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

  return $messages[$errorCode];
}

function getUploadFileName($originalName, $filePath)
{
  $ext = pathinfo($originalName, PATHINFO_EXTENSION);
  $hash = hash_file('md5', $filePath, false);

  return $hash . ($ext ? '.' . $ext : '');
}

function getPreviewPath($originalPath)
{
  $fileInfo = pathinfo($originalPath);
  return $fileInfo['dirname'] . '/' . $fileInfo['filename'] . '.preview.webp';
}

function getFileMimeType($filePath)
{
  if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
      $mimeType = finfo_file($finfo, $filePath);
      finfo_close($finfo);
      if ($mimeType !== false) {
        return $mimeType;
      }
    }
  }

  if (function_exists('mime_content_type')) {
    $mimeType = mime_content_type($filePath);
    if ($mimeType !== false) {
      return $mimeType;
    }
  }

  $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
  $mimeMap = [
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'webp' => 'image/webp',
    'bmp' => 'image/bmp',
    'json' => 'application/json',
  ];

  return isset($mimeMap[$extension]) ? $mimeMap[$extension] : 'application/octet-stream';
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
  if (filesize($previewFileName) % 2 == 1) {
    file_put_contents($previewFileName, "\0", FILE_APPEND);
  }

  @imagedestroy($imgOutput);
  @imagedestroy($img);

  return $previewFileName;
}

function deleteObsoleteUploads()
{
  global $uploadsDir;

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

function isValidFileType($ext, $fileSize)
{
  global $importFormats;

  if (!$importFormats) {
    return ['valid' => false, 'error' => 'Formats configuration not found'];
  }

  $ext = strtolower($ext);
  $fileSizeMB = $fileSize / (1024 * 1024);

  foreach ($importFormats as $type => $formatConfig) {
    $formats = array_map('strtolower', explode(', ', $formatConfig['formats']));

    if (in_array($ext, $formats)) {
      if ($fileSizeMB <= $formatConfig['maxSize']) {
        return ['valid' => true, 'type' => $type];
      } else {
        return ['valid' => false, 'error' => "File exceeds maximum size for {$type} ({$formatConfig['maxSize']}MB)"];
      }
    }
  }

  return ['valid' => false, 'error' => 'File type not supported'];
}

function uploadFiles()
{
  global $uploadsDir, $previewMimeTypes;

  $baseUrl = 'https://mwscr.dehero.site/uploads/';
  $files = $_FILES['file'];
  $result = [];

  $count = count($files['name']);

  for ($i = 0; $i < $count; $i++) {
    $errorCode = $files['error'][$i];

    $success = false;
    $errors = [];

    if ($errorCode !== UPLOAD_ERR_OK) {
      $errors[] = getUploadErrorMessage($errorCode);
    } else {
      $tempPath = $files['tmp_name'][$i];
      $name = getUploadFileName($files['name'][$i], $tempPath);
      $url = $baseUrl . $name;
      $ext = pathinfo($name, PATHINFO_EXTENSION);
      $targetPath = $uploadsDir . $name;

      if (file_exists($targetPath)) {
        $success = true;
      } else {
        // Validate file type and size using import_formats.json
        $validation = isValidFileType($ext, $files['size'][$i]);

        if (!$validation['valid']) {
          $errors[] = $validation['error'];
        }

        if (count($errors) === 0) {
          @mkdir(dirname($targetPath), 0777, true);
          if (move_uploaded_file($tempPath, $targetPath)) {
            $success = true;

            // Check if file supports preview
            $mimeType = getFileMimeType($targetPath);

            if (in_array($mimeType, $previewMimeTypes)) {
              createImagePreview($targetPath, $mimeType);
            }
          } else {
            $errors[] = error_get_last()['message'];
          }
        }
      }
    }

    $result[] = ['success' => $success, 'errors' => $errors, 'url' => $url];
  }

  return $result;
}
