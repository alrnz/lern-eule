<?php
/* Lern-Eule: Spielstände auf dem eigenen Hosting sichern.
 *
 * Liegt unter https://lern-eule.lrnz.net/backup.php (Adresse steht in js/app.js bei SYNC_URL). Braucht PHP 7.0 oder neuer.
 *
 * Die App schickt alles per POST (Text mit JSON):
 *   {action:'put', id, base, force, state}  → speichern. Antwort {ok, rev, saved}
 *                                             409 {error:'conflict'}, wenn auf dem Server ein anderer Stand
 *                                             mit mehr XP liegt (zweites Gerät) und force nicht gesetzt ist.
 *   {action:'get', id, day?}                → neuester Stand (oder der eines Tages) plus Liste der Tage.
 * id = Code ohne Namen, z. B. TIGER-MOND-472. Ordnername ist ein Hash davon.
 * Pro Code: latest.json und eine Datei pro Tag (die letzten KEEP_DAYS bleiben).
 */

// Seiten, die speichern und laden dürfen
$ALLOWED_ORIGINS = array('https://alrnz.github.io', 'https://lern-eule.lrnz.net', 'http://localhost:8766', 'http://127.0.0.1:8766');
// Ablage außerhalb des Web-Ordners: auf Mittwald in files/ neben html/ (lokal ohne files/ daneben).
// Läge sie im Web-Ordner, sperrt eine .htaccess den direkten Abruf (nur Apache).
$DATA_DIR = is_dir(dirname(__DIR__) . '/files') ? dirname(__DIR__) . '/files/lern-eule-daten' : dirname(__DIR__) . '/lern-eule-daten';
$KEEP_DAYS = 30;
$MAX_BYTES = 500000;   // ein Spielstand hat meist unter 50 KB
$LIMIT_WRITE = 300;    // Speichervorgänge pro Stunde und IP
$LIMIT_MISS = 20;      // Abrufe mit unbekanntem Code pro Stunde und IP (gegen Raten)

date_default_timezone_set('Europe/Berlin');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out($code, $data) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($origin !== '') {
  if (!in_array($origin, $ALLOWED_ORIGINS, true)) out(403, array('ok' => false, 'error' => 'origin'));
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Max-Age: 86400');
}
$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '';
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method !== 'POST') out(405, array('ok' => false, 'error' => 'method'));

// Ablage anlegen und sperren
if (!is_dir($DATA_DIR) && !@mkdir($DATA_DIR, 0700, true)) out(500, array('ok' => false, 'error' => 'storage'));
if (!is_file($DATA_DIR . '/.htaccess')) {
  @file_put_contents($DATA_DIR . '/.htaccess',
    "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n");
  @file_put_contents($DATA_DIR . '/index.html', '');
}

/* ---------- Begrenzung pro IP und Stunde ---------- */
function rlFile($kind) {
  global $DATA_DIR;
  $d = $DATA_DIR . '/_rl';
  if (!is_dir($d)) @mkdir($d, 0700, true);
  $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
  return $d . '/' . $kind . '-' . substr(hash('sha256', 'lern-eule-rl:' . $ip), 0, 20) . '.json';
}
function rlCount($kind) {
  $r = @json_decode(@file_get_contents(rlFile($kind)), true);
  $h = (int)floor(time() / 3600);
  return (is_array($r) && isset($r['h']) && $r['h'] === $h) ? (int)$r['n'] : 0;
}
function rlHit($kind) {
  $h = (int)floor(time() / 3600);
  @file_put_contents(rlFile($kind), json_encode(array('h' => $h, 'n' => rlCount($kind) + 1)), LOCK_EX);
}
// Ab und zu alte Zähler wegräumen
if (mt_rand(1, 50) === 1) {
  foreach ((array)glob($DATA_DIR . '/_rl/*.json') as $f) if (@filemtime($f) < time() - 7200) @unlink($f);
}

/* ---------- Hilfen ---------- */
function cleanId($s) {
  $s = strtoupper(is_string($s) ? $s : '');
  return preg_match('/^[A-Z]{2,12}-[A-Z]{2,12}-[0-9]{3}$/', $s) ? $s : null;
}
function readRec($f) {
  if (!is_file($f)) return null;
  $r = json_decode((string)@file_get_contents($f), true);
  return (is_array($r) && isset($r['state']) && is_array($r['state'])) ? $r : null;
}
function xpOf($st) { return (isset($st['xp']) && is_numeric($st['xp'])) ? (float)$st['xp'] : 0; }
function writeAtomic($f, $data) {
  $tmp = $f . '.tmp' . mt_rand();
  if (@file_put_contents($tmp, $data) === false) return false;
  return @rename($tmp, $f);
}
function dayFiles($dir) {
  $list = array();
  foreach ((array)glob($dir . '/*.json') as $f) {
    $b = basename($f, '.json');
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $b)) $list[] = $b;
  }
  rsort($list);
  return $list;
}

/* ---------- Anfrage ---------- */
$raw = file_get_contents('php://input', false, null, 0, $MAX_BYTES + 1);
if ($raw === false || strlen($raw) > $MAX_BYTES) out(413, array('ok' => false, 'error' => 'size'));
$req = json_decode($raw, true);
if (!is_array($req)) out(400, array('ok' => false, 'error' => 'json'));
$id = cleanId(isset($req['id']) ? $req['id'] : '');
if (!$id) out(400, array('ok' => false, 'error' => 'id'));
$dir = $DATA_DIR . '/' . hash('sha256', 'lern-eule:' . $id);
$action = isset($req['action']) ? $req['action'] : '';

if ($action === 'get') {
  if (rlCount('miss') >= $LIMIT_MISS) out(429, array('ok' => false, 'error' => 'limit'));
  $head = readRec($dir . '/latest.json');
  if (!$head) { rlHit('miss'); out(404, array('ok' => false, 'error' => 'unknown')); }
  $rec = $head;
  if (!empty($req['day'])) {
    $day = (string)$req['day'];
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) out(400, array('ok' => false, 'error' => 'day'));
    $rec = readRec($dir . '/' . $day . '.json');
    if (!$rec) out(404, array('ok' => false, 'error' => 'day'));
  }
  $days = array();
  foreach (dayFiles($dir) as $d) {
    $r = readRec($dir . '/' . $d . '.json');
    if ($r) $days[] = array('day' => $d, 'saved' => $r['saved'], 'xp' => xpOf($r['state']));
  }
  out(200, array('ok' => true, 'rev' => $rec['rev'], 'head' => $head['rev'], 'saved' => $rec['saved'],
    'state' => $rec['state'], 'days' => $days));
}

if ($action === 'put') {
  $state = isset($req['state']) ? $req['state'] : null;
  if (!is_array($state) || !isset($state['xp']) || !is_numeric($state['xp'])) out(400, array('ok' => false, 'error' => 'state'));
  if (rlCount('write') >= $LIMIT_WRITE) out(429, array('ok' => false, 'error' => 'limit'));
  rlHit('write');
  if (!is_dir($dir) && !@mkdir($dir, 0700, true)) out(500, array('ok' => false, 'error' => 'storage'));
  $lock = fopen($dir . '/.lock', 'c');
  if ($lock) flock($lock, LOCK_EX);

  $cur = readRec($dir . '/latest.json');
  $base = isset($req['base']) ? (string)$req['base'] : '';
  // Ein anderes Gerät hat inzwischen gespeichert und hat mehr XP: nicht überschreiben, nachfragen.
  if ($cur && empty($req['force']) && $base !== $cur['rev'] && xpOf($cur['state']) > xpOf($state)) {
    out(409, array('ok' => false, 'error' => 'conflict', 'rev' => $cur['rev'], 'saved' => $cur['saved'], 'xp' => xpOf($cur['state'])));
  }
  $rec = array('rev' => bin2hex(random_bytes(6)), 'saved' => date('c'), 'state' => $state);
  $json = json_encode($rec, JSON_UNESCAPED_UNICODE);
  if ($json === false || !writeAtomic($dir . '/latest.json', $json) || !writeAtomic($dir . '/' . date('Y-m-d') . '.json', $json)) {
    out(500, array('ok' => false, 'error' => 'storage'));
  }
  foreach (array_slice(dayFiles($dir), $KEEP_DAYS) as $old) @unlink($dir . '/' . $old . '.json');
  out(200, array('ok' => true, 'rev' => $rec['rev'], 'saved' => $rec['saved']));
}

out(400, array('ok' => false, 'error' => 'action'));
