<?php
// Turn off all error reporting
error_reporting(0);

$uploadsDir = __DIR__ . '/uploads/';

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

function createImagePreview($filename)
{
  $baseSize = 320;

  $img = @imagecreatefrompng($filename);
  $imgWidth = @imagesx($img);
  $imgHeight = @imagesy($img);

  if ($imgWidth > $imgHeight) {
    $height = $baseSize;
    $width = ($imgWidth / $imgHeight) * $baseSize;
  } else {
    $width = $baseSize;
    $height = ($imgHeight / $imgWidth) * $baseSize;
  }

  $dir = pathinfo($filename, PATHINFO_DIRNAME);
  $name = pathinfo($filename, PATHINFO_FILENAME);
  $previewFileName = $dir . '/' . $name . '.webp';

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

    $modifiedTime = filemtime("$uploadsDir/$filename");
    $sevenDaysInSeconds = 60 * 60 * 24 * 7;

    if (time() - $modifiedTime > $sevenDaysInSeconds) {
      unlink("$uploadsDir/$filename");
    }
  }
}

function uploadFiles()
{
  global $uploadsDir;

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

      if (file_exists($targetPath)) {
        $success = true;
      } else {
        // Check file size
        if ($files['size'][$i] > 10485760) {
          $errors[] = 'File is too large.';
        }

        // Allow certain file formats
        if ($ext !== 'png') {
          $errors[] = 'Only PNG images are allowed.';
        }

        if (count($errors) === 0) {
          $targetPath = $uploadsDir . $name;

          @mkdir(dirname($targetPath), 0777, true);
          if (move_uploaded_file($tempPath, $targetPath)) {
            $success = true;
            createImagePreview($targetPath);
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
