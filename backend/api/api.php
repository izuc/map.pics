<?php
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);
header("Content-Type: application/json");

$dbHost = "localhost";
$dbUsername = "map";
$dbPassword = "";
$dbName = "map";

$conn = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}
$conn->set_charset("utf8mb4");

$request = $_SERVER["REQUEST_URI"];
$params = explode("/", trim($request, "/"));

$apiIndex = array_search("api", $params);
$endpoint = $params[$apiIndex + 1] ?? null;

switch ($endpoint) {
    case "maps":
        handleMaps($conn);
        break;
    case "maps/coordinates":
        handleMapsCoordinates($conn);
        break;
    case "pics":
        handlePics($conn);
        break;
    case "pics/like":
        handlePicsLike($conn);
        break;
    case "users/register":
        handleUsersRegister($conn);
        break;
    case "users/login":
        handleUsersLogin($conn);
        break;
    case preg_match("/^users\/(\d+)$/", $endpoint, $matches) ? true : false:
        handleUserProfile($conn, $matches[1]);
        break;
    case "users/logout":
        handleUsersLogout();
        break;
    case "users":
        handleUsers($conn);
        break;
    default:
        http_response_code(404);
        echo json_encode(["error" => "Endpoint not found"]);
        break;
}

$conn->close();

function handleMaps($conn)
{
    if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $id = $_GET["id"] ?? null;
        $name = $_GET["name"] ?? null;

        if ($id) {
            $stmt = $conn->prepare(
                "SELECT map_id, map, svg, width, height, minlat, minlon, maxlat, maxlon, center, type, status FROM maps WHERE map_id = ?"
            );
            $stmt->bind_param("i", $id);
        } elseif ($name) {
            $stmt = $conn->prepare(
                "SELECT map_id, map, svg, width, height, minlat, minlon, maxlat, maxlon, center, type, status FROM maps WHERE map = ?"
            );
            $stmt->bind_param("s", $name);
        } else {
            $stmt = $conn->prepare(
                "SELECT map_id, map, width, height, minlat, minlon, maxlat, maxlon, center, type, status FROM maps"
            );
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $maps = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($maps);
    }
}

function handleMapsCoordinates($conn)
{
    if ($_SERVER["REQUEST_METHOD"] == "GET") {
        $lat = $_GET["lat"] ?? null;
        $lon = $_GET["lon"] ?? null;

        if ($lat && $lon) {
            $stmt = $conn->prepare(
                "SELECT * FROM maps WHERE minlat <= ? AND maxlat >= ? AND minlon <= ? AND maxlon >= ?"
            );
            $stmt->bind_param("dddd", $lat, $lat, $lon, $lon);
            $stmt->execute();
            $result = $stmt->get_result();
            $maps = $result->fetch_all(MYSQLI_ASSOC);
            echo json_encode($maps);
        } else {
            echo json_encode(["error" => "Missing latitude or longitude"]);
        }
    }
}

function handlePics($conn)
{
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $map_id = $_POST["map_id"] ?? null;
        $user_id = $_POST["user_id"] ?? null;
        $lat = $_POST["lat"] ?? null;
        $lon = $_POST["lon"] ?? null;
        $picDescription = $_POST["pic"] ?? null;
        $image = $_FILES["image"] ?? null;

        // Check if the user's location is within the map bounds
        $stmt = $conn->prepare(
            "SELECT COUNT(*) as count FROM maps WHERE map_id = ? AND minlat <= ? AND maxlat >= ? AND minlon <= ? AND maxlon >= ?"
        );
        $stmt->bind_param("idddd", $map_id, $lat, $lat, $lon, $lon);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $count = $row["count"];

        if ($count == 0) {
            echo json_encode(["error" => "Location is outside the map bounds"]);
            exit();
        }

        if ($image && $image["error"] == 0) {
            $tempName = $image["tmp_name"];
            $randomName = bin2hex(random_bytes(16));
            $targetPath = "../data/uploads/" . $randomName;

            if (move_uploaded_file($tempName, $targetPath)) {
                $location = "POINT($lat $lon)";
                $stmt = $conn->prepare(
                    "INSERT INTO pics (user_id, map_id, location, image, pic, ip_address) VALUES (?, ?, ST_PointFromText(?), ?, ?, ?)"
                );
                $ip_address = $_SERVER["REMOTE_ADDR"];
                $stmt->bind_param(
                    "iissss",
                    $user_id,
                    $map_id,
                    $location,
                    $targetPath,
                    $picDescription,
                    $ip_address
                );

                if ($stmt->execute()) {
                    echo json_encode(["message" => "Pic added successfully"]);
                } else {
                    echo json_encode(["error" => "Failed to add pic"]);
                }
            } else {
                echo json_encode(["error" => "Failed to move uploaded file"]);
            }
        } else {
            echo json_encode(["error" => "Invalid image upload"]);
        }
    }

    if ($_SERVER["REQUEST_METHOD"] == "GET" && isset($_GET["map_id"])) {
        $map_id = $_GET["map_id"];
        $stmt = $conn->prepare(
            "SELECT pic_id, user_id, map_id, ST_X(location) AS latitude, ST_Y(location) AS longitude, pic, ip_address, timestamp, image FROM pics WHERE map_id = ?"
        );

        if (!$stmt) {
            echo json_encode([
                "error" => "Failed to prepare statement: " . $conn->error,
            ]);
            exit();
        }

        $stmt->bind_param("i", $map_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $pics = $result->fetch_all(MYSQLI_ASSOC);
            foreach ($pics as &$pic) {
                $imagePath = $pic["image"];
                $imagePath = "../data/" . $imagePath;
                if (file_exists($imagePath)) {
                    $imageData = file_get_contents($imagePath);
                    $pic["image_base64"] =
                        "data:image/png;base64," . base64_encode($imageData);
                } else {
                    $pic["image_base64"] = "";
                }
                unset($pic["image"]); // Remove the 'image' key
            }
            $jsonResult = json_encode($pics);
            if ($jsonResult === false) {
                echo json_encode([
                    "error" => "JSON encoding error: " . json_last_error_msg(),
                ]);
            } else {
                echo $jsonResult;
            }
        } else {
            echo json_encode(["error" => "No results found"]);
        }

        $stmt->close();
    }
}

function handlePicsLike($conn)
{
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);

        if (
            isset(
                $data["pic_id"],
                $data["user_id"],
                $data["thumb"],
                $data["down"]
            )
        ) {
            $stmt = $conn->prepare(
                "REPLACE INTO likes (pic_id, user_id, ip_address, thumb, down) VALUES (?, ?, ?, ?, ?)"
            );
            $ip_address = $_SERVER["REMOTE_ADDR"];
            $stmt->bind_param(
                "iisii",
                $data["pic_id"],
                $data["user_id"],
                $ip_address,
                $data["thumb"],
                $data["down"]
            );

            if ($stmt->execute()) {
                echo json_encode([
                    "message" => "Like/Dislike recorded successfully",
                ]);
            } else {
                echo json_encode(["error" => "Failed to record like/dislike"]);
            }

            $stmt->close();
        } else {
            echo json_encode(["error" => "Missing required fields"]);
        }
    }

    if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET["pic_id"])) {
        $pic_id = $_GET["pic_id"];

        $likes_stmt = $conn->prepare(
            "SELECT COUNT(*) as likes FROM likes WHERE pic_id = ? AND thumb = 1"
        );
        $likes_stmt->bind_param("i", $pic_id);
        $likes_stmt->execute();
        $likes_result = $likes_stmt->get_result()->fetch_assoc();
        $likes = $likes_result["likes"];

        $dislikes_stmt = $conn->prepare(
            "SELECT COUNT(*) as dislikes FROM likes WHERE pic_id = ? AND down = 1"
        );
        $dislikes_stmt->bind_param("i", $pic_id);
        $dislikes_stmt->execute();
        $dislikes_result = $dislikes_stmt->get_result()->fetch_assoc();
        $dislikes = $dislikes_result["dislikes"];

        echo json_encode(["likes" => $likes, "dislikes" => $dislikes]);

        $likes_stmt->close();
        $dislikes_stmt->close();
    }
}

function handleUsersRegister($conn)
{
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data["user_name"], $data["password"])) {
            $userName = $data["user_name"];
            $password = password_hash($data["password"], PASSWORD_DEFAULT);
            $userAvatar = $data["user_avatar"] ?? "";

            $stmt = $conn->prepare(
                "INSERT INTO user (user_name, user_avatar, password) VALUES (?, ?, ?)"
            );
            $stmt->bind_param("sss", $userName, $userAvatar, $password);

            if ($stmt->execute()) {
                echo json_encode(["message" => "User registered successfully"]);
            } else {
                echo json_encode(["error" => "Failed to register user"]);
            }
            $stmt->close();
        } else {
            echo json_encode(["error" => "Missing required fields"]);
        }
    }
}

function handleUsersLogin($conn)
{
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data["user_name"], $data["password"])) {
            $userName = $data["user_name"];
            $stmt = $conn->prepare(
                "SELECT user_id, password FROM user WHERE user_name = ?"
            );
            $stmt->bind_param("s", $userName);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 1) {
                $user = $result->fetch_assoc();
                if (password_verify($data["password"], $user["password"])) {
                    echo json_encode([
                        "message" => "Login successful",
                        "session_id" => "YourSessionID",
                    ]);
                } else {
                    echo json_encode(["error" => "Invalid credentials"]);
                }
            } else {
                echo json_encode(["error" => "User not found"]);
            }
            $stmt->close();
        } else {
            echo json_encode(["error" => "Missing required fields"]);
        }
    }
}

function handleUserProfile($conn, $userId)
{
    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        $stmt = $conn->prepare(
            "SELECT user_id, user_name, user_avatar, ST_AsText(location) as location FROM user WHERE user_id = ?"
        );
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 1) {
            echo json_encode($result->fetch_assoc());
        } else {
            echo json_encode(["error" => "User not found"]);
        }
        $stmt->close();
    } elseif ($_SERVER["REQUEST_METHOD"] === "PUT") {
        // Update User Profile code
    } elseif ($_SERVER["REQUEST_METHOD"] === "DELETE") {
        // Delete User Account code
    }
}

function handleUsersLogout()
{
    // User logout code
}

function handleUsers($conn)
{
    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        $result = $conn->query(
            "SELECT user_id, user_name, user_avatar FROM user"
        );
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }
}
