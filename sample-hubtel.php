<?php
// Hubtel USSD endpoint (Programmable Services) - sample
header('Content-Type: application/json');

$req         = json_decode(file_get_contents('php://input'), true) ?: [];
$type        = strtolower($req['Type'] ?? '');      // initiation | response | release | timeout
$sessionId   = $req['SessionId'] ?? '';
$mobile      = $req['Mobile'] ?? '';
$input       = trim($req['Message'] ?? '');
$clientState = $req['ClientState'] ?? '';           // whatever you sent back last time

function reply($sessionId, $message, $nextState = '', $end = false) {
    echo json_encode([
        'SessionId'   => $sessionId,
        'Type'        => $end ? 'Release' : 'Response',
        'Message'     => $message,
        'Label'       => 'Menu',
        'ClientState' => $nextState,
        'DataType'    => $end ? 'display' : 'input',
        'FieldType'   => 'text',
    ]);
    exit;
}

// User cancelled or session timed out
if ($type === 'release' || $type === 'timeout') {
    reply($sessionId, '', '', true);
}

// First dial, e.g. *713#
if ($type === 'initiation') {
    reply($sessionId, "Welcome\n1. Check balance\n2. Buy airtime\n0. Exit", 'menu');
}

switch ($clientState) {
    case 'menu':
        if ($input === '1') reply($sessionId, "Your balance is GHS 25.40", '', true);
        if ($input === '2') reply($sessionId, "Enter amount (GHS):", 'amount');
        if ($input === '0') reply($sessionId, "Goodbye!", '', true);
        reply($sessionId, "Invalid option.\n1. Check balance\n2. Buy airtime\n0. Exit", 'menu');

    case 'amount':
        if (!is_numeric($input) || $input <= 0) reply($sessionId, "Invalid amount. Enter amount (GHS):", 'amount');
        reply($sessionId, "Buy GHS $input airtime?\n1. Confirm\n2. Cancel", 'confirm:' . $input);

    default:
        if (strpos($clientState, 'confirm:') === 0) {
            $amount = substr($clientState, 8);
            if ($input === '1') {
                // TODO: process payment for $mobile here
                reply($sessionId, "Success! GHS $amount airtime purchased.", '', true);
            }
            reply($sessionId, "Transaction cancelled.", '', true);
        }
        reply($sessionId, "Session error. Please dial again.", '', true);
}
