<?php
// Nalo USSD endpoint - sample
header('Content-Type: application/json');

$req       = json_decode(file_get_contents('php://input'), true) ?: [];
$userId    = $req['USERID'] ?? '';
$msisdn    = $req['MSISDN'] ?? '';
$input     = trim($req['USERDATA'] ?? '');
$isNew     = filter_var($req['MSGTYPE'] ?? false, FILTER_VALIDATE_BOOLEAN); // true = first dial
$network   = $req['NETWORK'] ?? '';
$sessionId = preg_replace('/\W/', '', $req['SESSIONID'] ?? '');

// Nalo does not send state back, so keep it yourself (file here; use DB/Redis in production)
$stateFile = sys_get_temp_dir() . "/ussd_$sessionId.txt";
$state     = $isNew ? '' : (string)@file_get_contents($stateFile);

function reply($message, $nextState = '', $end = false) {
    global $userId, $msisdn, $input, $stateFile;
    $end ? @unlink($stateFile) : file_put_contents($stateFile, $nextState);
    echo json_encode([
        'USERID'   => $userId,
        'MSISDN'   => $msisdn,
        'USERDATA' => $input,
        'MSG'      => $message,
        'MSGTYPE'  => !$end,   // true = wait for input, false = end session
    ]);
    exit;
}

if ($isNew) {
    reply("Welcome\n1. Check balance\n2. Buy airtime\n0. Exit", 'menu');
}

switch ($state) {
    case 'menu':
        if ($input === '1') reply("Your balance is GHS 25.40", '', true);
        if ($input === '2') reply("Enter amount (GHS):", 'amount');
        if ($input === '0') reply("Goodbye!", '', true);
        reply("Invalid option.\n1. Check balance\n2. Buy airtime\n0. Exit", 'menu');

    case 'amount':
        if (!is_numeric($input) || $input <= 0) reply("Invalid amount. Enter amount (GHS):", 'amount');
        reply("Buy GHS $input airtime?\n1. Confirm\n2. Cancel", 'confirm:' . $input);

    default:
        if (strpos($state, 'confirm:') === 0) {
            $amount = substr($state, 8);
            if ($input === '1') {
                // TODO: process payment for $msisdn here
                reply("Success! GHS $amount airtime purchased.", '', true);
            }
            reply("Transaction cancelled.", '', true);
        }
        reply("Session error. Please dial again.", '', true);
}
