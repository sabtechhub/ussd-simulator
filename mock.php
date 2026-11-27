<?php
/*
 * Demo USSD endpoint that speaks both Hubtel and Nalo formats.
 * Use it to try the simulator before pointing it at your real endpoint.
 *
 * index.php includes this file and calls ussd_mock_handle() directly when the
 * endpoint is this same mock.php, so the demo also works on `php -S`
 * (which can only handle one request at a time).
 */

if (!function_exists('ussd_mock_handle')) {

    function ussd_mock_step($state, $input) {
        $menu = "1. Check balance\n2. Buy airtime\n0. Exit";
        if ($state === '') return ["Welcome to Demo Shop\n$menu", 'menu', false];
        if ($state === 'menu') {
            if ($input === '1') return ["Your balance is GHS 25.40", '', true];
            if ($input === '2') return ["Enter amount (GHS):", 'amount', false];
            if ($input === '0') return ["Goodbye!", '', true];
            return ["Invalid option.\n$menu", 'menu', false];
        }
        if ($state === 'amount') {
            if (!is_numeric($input) || $input <= 0) return ["Invalid amount. Enter amount (GHS):", 'amount', false];
            $a = number_format((float)$input, 2);
            return ["Buy GHS $a airtime?\n1. Confirm\n2. Cancel", "confirm:$a", false];
        }
        if (strpos($state, 'confirm:') === 0) {
            $a = substr($state, 8);
            if ($input === '1') return ["Success! GHS $a airtime purchased.", '', true];
            return ["Transaction cancelled.", '', true];
        }
        return ["Session error.", '', true];
    }

    /** Takes the decoded request array, returns the response array. */
    function ussd_mock_handle(array $r) {
        $isNalo = isset($r['MSISDN']) || isset($r['USERID']);

        if ($isNalo) {
            $sid = preg_replace('/\W/', '', (string)($r['SESSIONID'] ?? 'x'));
            $file = sys_get_temp_dir() . "/ussdmock_$sid.txt";
            $first = filter_var($r['MSGTYPE'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $state = $first ? '' : (string)@file_get_contents($file);
            $input = $first ? '' : trim((string)($r['USERDATA'] ?? ''));
            [$msg, $next, $end] = ussd_mock_step($state, $input);
            $end ? @unlink($file) : file_put_contents($file, $next);
            return [
                'USERID' => $r['USERID'] ?? '',
                'MSISDN' => $r['MSISDN'] ?? '',
                'USERDATA' => $input,
                'MSG' => $msg,
                'MSGTYPE' => !$end,
            ];
        }

        $type = strtolower((string)($r['Type'] ?? ''));
        if ($type === 'release' || $type === 'timeout') {
            return ['SessionId' => $r['SessionId'] ?? '', 'Type' => 'Release', 'Message' => ''];
        }
        $first = $type === 'initiation';
        [$msg, $next, $end] = ussd_mock_step(
            $first ? '' : (string)($r['ClientState'] ?? ''),
            $first ? '' : trim((string)($r['Message'] ?? ''))
        );
        return [
            'SessionId' => $r['SessionId'] ?? '',
            'Type' => $end ? 'Release' : 'Response',
            'Message' => $msg,
            'Label' => 'Demo Shop',
            'ClientState' => $next,
            'DataType' => $end ? 'display' : 'input',
            'FieldType' => 'text',
        ];
    }
}

// Called directly over HTTP (not included by index.php)
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    header('Content-Type: application/json');
    $r = json_decode(file_get_contents('php://input'), true) ?: [];
    echo json_encode(ussd_mock_handle($r));
}
