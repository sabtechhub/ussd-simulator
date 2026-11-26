# USSD Simulator (Hubtel & Nalo)

Test your USSD application from the browser — no phone or live USSD code needed.

The page shows a phone with a dialer. Dial your short code and the simulator sends the same JSON requests **Hubtel** or **Nalo** would send to your endpoint, then shows your response in a USSD popup, just like on a real handset.

**Powered by SAB-TECH HUB**

## Features

- Phone UI with dialer keypad, USSD popup, reply field, Send / Cancel
- **Hubtel** format (`Initiation` / `Response` / `Release`, `ClientState`, `Sequence`)
- **Nalo** format (`USERID`, `MSISDN`, `USERDATA`, `MSGTYPE`, `NETWORK`, `SESSIONID`)
- Network selection: MTN, Telecel (Vodafone), AirtelTigo
- Request / response log with colored JSON, copy per entry and copy all
- Sample PHP endpoint code for Hubtel and Nalo (view and copy)
- Built-in demo endpoint (`mock.php`) to try it out
- Optional extra headers (e.g. `Authorization`) and an option to ignore SSL errors

## Run it

Requires PHP 7.4+ (the cURL extension is used when available).

**XAMPP / WAMP / any Apache + PHP:** copy the files into a folder such as `htdocs/ussd-simulator` and open `http://localhost/ussd-simulator/`.

**PHP built-in server:**

```bash
php -S localhost:8090
```

Then open http://localhost:8090.

> The built-in PHP server handles one request at a time, so to use the demo endpoint with it, start a second server (`php -S localhost:8091`) and set the endpoint to `http://localhost:8091/mock.php`. Under Apache, the **Use demo endpoint** button works directly.

## How it works

Browsers block pages from calling other websites directly (CORS), so `index.php` also acts as a small proxy: the page posts to `index.php?proxy=1`, and PHP forwards the JSON to your USSD endpoint and returns the reply.

### Hubtel request example

```json
{
  "Type": "Initiation",
  "Mobile": "233241234567",
  "SessionId": "260fc310f697461893d799a11da4e920",
  "ServiceCode": "713",
  "Message": "*713#",
  "Operator": "mtn",
  "Sequence": 1,
  "ClientState": "",
  "Platform": "USSD"
}
```

Reply with `"Type": "Response"` to keep the session open, or `"Type": "Release"` to end it.

### Nalo request example

```json
{
  "USERID": "NALOTest",
  "MSISDN": "233241234567",
  "USERDATA": "*713#",
  "MSGTYPE": true,
  "NETWORK": "MTN",
  "SESSIONID": "260fc310f697461893d799a11da4e920"
}
```

Reply with `"MSGTYPE": true` to wait for input, or `false` to end the session. The text to show goes in `MSG`.

## Security note

The proxy forwards requests to any URL entered on the page. That is fine on your own computer, but if you host this on a public server, anyone could use it to send requests from your server. Protect it (password, IP allow-list, or `.htaccess`) before putting it online.

## Files

| File | Purpose |
| --- | --- |
| `index.php` | Simulator UI and request proxy |
| `mock.php` | Demo USSD endpoint that understands both Hubtel and Nalo |

## License

MIT
