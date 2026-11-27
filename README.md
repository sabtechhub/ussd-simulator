# SAB-TECH HUB USSD Simulator (Hubtel & Nalo)

Test your USSD application from the browser — no phone or live USSD code needed.

The page shows a phone with a dialer. Dial your short code and the simulator sends the same JSON requests **Hubtel** or **Nalo** would send to your endpoint, then shows your response in a USSD popup, just like on a real handset.

**Powered by SAB-TECH HUB**

## Features

- Phone UI with dialer keypad, USSD popup, reply field, Send / Cancel
- **Hubtel** format (`Initiation` / `Response` / `Release`, `ClientState`, `Sequence`)
- **Nalo** format (`USERID`, `MSISDN`, `USERDATA`, `MSGTYPE`, `NETWORK`, `SESSIONID`)
- Network selection: MTN, Telecel (Vodafone), AirtelTigo
- Request / response log with colored JSON, copy per entry and copy all
- Sample PHP endpoint code for Hubtel and Nalo (view and copy) to start your own endpoint
- Built-in demo endpoint (`mock.php`) to try it out
- Optional extra headers (e.g. `Authorization`) and an option to ignore SSL errors
- **Menu builder**: design your own USSD menus, inputs and conditions, test them on the phone, then generate the PHP endpoint
- Light and dark theme

## Menu builder

Open the **Menu builder** tab to design a USSD service without writing code first. Each screen is one of:

- **Menu** — a message and numbered options; each option goes to another screen.
- **Question** — the user types an answer, then it goes to the next screen.
- **End** — a last message; the session closes.

Press **▶ Test on phone** to try it, and **Get PHP code** for a ready Hubtel or Nalo endpoint written with plain `switch` statements and `if` conditions, so you can keep editing it by hand (for example to save votes or trigger payments).

Optional extras sit behind **More** on each screen: remember an answer (then show it with `{{name}}`; `{{phone}}` and `{{network}}` are always available), only accept a number / 4-digit PIN / phone number, and conditions such as *if `amount` greater than `100` → `too_many`*. Your menu is kept in your browser; **File → Save to file / Open file** keeps a copy as a `.json` file.

## Run it

Requires PHP 7.4+ (the cURL extension is used when available).

**XAMPP / WAMP / any Apache + PHP:** copy the files into a folder such as `htdocs/ussd-simulator` and open `http://localhost/ussd-simulator/`.

**PHP built-in server:**

```bash
php -S localhost:8090
```

Then open http://localhost:8090.

Click **Use demo endpoint** to try it straight away. The demo is answered inside the same PHP process, so it works on the built-in server as well as on Apache.

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
| `builder.js` | Menu builder: editor, flow runner and PHP code generator |
| `mock.php` | Demo USSD endpoint that understands both Hubtel and Nalo |
| `sample-hubtel.php` | Starter Hubtel endpoint — copy it into your project and build on it |
| `sample-nalo.php` | Starter Nalo endpoint — copy it into your project and build on it |

## License

MIT
