# SAB-TECH HUB USSD Simulator (Hubtel & Nalo)

Test your USSD application from the browser — no phone or live USSD code needed.

The page shows a phone with a dialer. Dial your short code and the simulator sends the same JSON requests **Hubtel** or **Nalo** would send to your endpoint, then shows your response in a USSD popup, just like on a real handset.

**Powered by SAB-TECH HUB**

## Features

- Phone UI with dialer keypad, USSD popup, reply field, Send / Cancel
- **Hubtel** format (`Initiation` / `Response` / `Release`, `ClientState`, `Sequence`)
- **Nalo** format (`USERID`, `MSISDN`, `USERDATA`, `MSGTYPE`, `NETWORK`, `SESSIONID`)
- Network selection: MTN, Telecel (Vodafone), AirtelTigo
- Test page with setup on the left, the phone in the middle and the conversation on the right
- Conversation view: your replies and the menu's answers as chat bubbles, with the raw JSON under **Details** (colored, copy per entry and copy all)
- Sample PHP endpoint code for Hubtel and Nalo (view and copy) to start your own endpoint
- Beginner friendly: plain-language steps, a "New to USSD?" guide, and a Demo menu that works straight away
- Choose what to test: **Demo**, **My builder menu** or **My server** (with a **Check** button that tells you if your server answers correctly)
- Optional extra headers (e.g. `Authorization`) and an option to ignore SSL errors
- **Menu builder**: design your own USSD menus, inputs, conditions and variables, test them on the phone, then generate the PHP endpoint
- **Map view**: screens as draggable boxes with arrows; drag from a dot to link, right-click to edit or delete
- Tooltips on every control, in-page confirmation dialogs, light and dark theme

## Menu builder

Open the **Menu builder** tab to build your USSD menus from scratch, without writing code first. You start with one empty screen; each screen is one of:

- **Menu** — a message and numbered options; each option goes to another screen.
- **Question** — the user types an answer, then it goes to the next screen.
- **End** — a last message; the session closes.

Press **▶ Test on phone** to try it, and **Get PHP code** for a ready Hubtel or Nalo endpoint written with plain `switch` statements and `if` conditions, so you can keep editing it by hand with your own logic.

Optional extras sit behind **More** on each screen: remember an answer, only accept a number / 4-digit PIN / phone number, conditions that send the user to a different screen depending on the answer, and **Set values**.

### Variables

Show a saved value in any message with `{{name}}`. `{{phone}}` and `{{network}}` are always available; answers you remember and values you set are added automatically. The **Variables** button lists them all — click one to copy it, or click **Add your own value** to add one.

**Set value** (under More) runs when the screen opens, e.g. `price = 5` or `greeting = Hello {{phone}}`. Start a value with `=` to calculate: `total = ={{price}} * {{qty}}` (numbers, `+ - * /` and brackets).

### List and Map

**List** edits screens one by one. **Map** shows them as boxes with arrows: type straight into a box to change its name, type, message or options, drag a box by its top bar to move it, drag from an option's dot onto another box to link them (or onto empty space for a new screen), double-click a box to edit it, and right-click a box, an arrow or empty space for more (delete, remove link, add a screen here, tidy up). **Full screen** gives the map the whole window.

Your menu is kept in your browser; **File → Save to file / Open file** keeps a copy as a `.json` file.

## Run it

Requires PHP 7.4+ (the cURL extension is used when available).

**XAMPP / WAMP / any Apache + PHP:** copy the files into a folder such as `htdocs/ussd-simulator` and open `http://localhost/ussd-simulator/`.

**PHP built-in server:**

```bash
php -S localhost:8090
```

Then open http://localhost:8090.

The page opens on the **Demo** menu, so you can press the green button and try it straight away. To test your own server, choose **My server**, paste its URL and press **Check**.

> PHP's built-in server handles one request at a time, so it cannot call another page on the same server. Run your own endpoint on a different port (e.g. `php -S localhost:8091`) or use XAMPP/Apache.

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
| `builder.js` | Menu builder: list and map editor, flow runner and PHP code generator |
| `icons.js` | Line icons (from Lucide, ISC licence) |
| `dialog.js` | In-page confirmation dialogs |
| `mock.php` | Demo USSD endpoint that understands both Hubtel and Nalo |
| `sample-hubtel.php` | Starter Hubtel endpoint — copy it into your project and build on it |
| `sample-nalo.php` | Starter Nalo endpoint — copy it into your project and build on it |

## License

MIT
