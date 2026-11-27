/*
 * The tutorial itself: chapters, captions and every click.
 * Runs after tour-engine.js. Builds a small airtime menu from scratch on screen.
 */
(function () {
  const { T } = window.tour;
  const q = s => () => document.querySelector(s);
  const btnText = (scope, text) => () => [...document.querySelectorAll(scope + ' button')].find(b => b.textContent.trim() === text);
  const optInput = (id, row, n) => () => { const r = document.querySelectorAll(`.scr[data-id="${id}"] .opt-row:not(.col-h)`)[row]; return r && r.querySelectorAll('input')[n]; };
  const optSelect = (id, row) => () => { const r = document.querySelectorAll(`.scr[data-id="${id}"] .opt-row:not(.col-h)`)[row]; return r && r.querySelector('select.nx'); };
  const dialogReady = () => document.querySelector('#overlay').classList.contains('show') && document.querySelector('#dlgBox').style.display !== 'none' && document.querySelector('#msg').textContent.trim() !== '';
  const reply = (text, cap) => {
    if (cap) T.caption(cap[0], cap[1]);
    T.click('#reply').type('#reply', text, { msPerChar: 110 }).wait(500).click('#sendBtn').until(dialogReady).sleep(250).wait(1800);
  };

  /* ===== Intro ===== */
  T.run(() => { window.scrollTo(0, 0); });
  T.title('', 'SAB-TECH HUB USSD Simulator', 'A complete, step-by-step guide: test Hubtel and Nalo USSD menus without a phone, build your own menus, and get the PHP code.', 4600, 'github.com/sabtechhub/ussd-simulator');

  /* ===== 1. Welcome ===== */
  T.title('Step 1', 'Meet the simulator', 'What USSD is, and the three parts of the screen.', 2800);
  T.caption('USSD is the menu that pops up when you dial a code like *713# — it works on any phone, without internet.', 'Step 1');
  T.move('#logs .guide h3', 900).wait(3200);
  T.caption('On the left you set up your test. In the middle is a test phone. On the right you see the conversation.', 'Step 1');
  T.move('#setup .card-h h2', 800).wait(1300).move('.phone .screen', 800).wait(1300).move('#tab-log h2', 800).wait(1600);

  /* ===== 2. Set up ===== */
  T.title('Step 2', 'Set up your test', 'Pick your provider, choose a menu and set the test phone.', 2800);
  T.scrollTop();
  T.caption('Choose your USSD provider. Not sure what it means? Point at the question mark.', 'Step 2');
  T.hover('#setupBody .q').sleep(500).wait(2600);
  T.click('#provSeg button[data-v=hubtel]').wait(800);
  T.caption('Choose which menu to test. Start with the ready-made Demo.', 'Step 2');
  T.click('#srcSeg button[data-v=demo]').wait(1400);
  T.caption('This is the customer you pretend to be, and the code they dial.', 'Step 2');
  T.move('#msisdn').wait(1200).move('#operator').wait(900).click('#code').type('#code', '*713#', { msPerChar: 120 }).wait(900);
  T.caption('Press Done. The setup folds into one line, so the screen stays tidy.', 'Step 2');
  T.click('#setupDone').wait(2000);

  /* ===== 3. Dial ===== */
  T.title('Step 3', 'Dial your first USSD code', 'Use the test phone exactly like a real one.', 2800);
  T.caption('Press the green call button to dial *713#.', 'Step 3');
  T.click('#callBtn').until(dialogReady).sleep(300).wait(2400);
  T.caption('The menu pops up. Type 1 and press SEND to check the balance.', 'Step 3');
  reply('1');
  T.caption('The session has ended. Press OK to close it.', 'Step 3');
  T.click('#cancelBtn').wait(900);

  /* ===== 4. Conversation ===== */
  T.title('Step 4', 'Read the conversation', 'See exactly what the phone sent and what came back.', 2800);
  T.caption('Your replies are on the right in blue. The menu’s answers are on the left.', 'Step 4');
  T.move('#logs .entry.req .bubble', 800).wait(1600).move('#logs .entry.res .bubble', 800).wait(1800);
  T.caption('Open Details to see the exact JSON sent to your server and its reply.', 'Step 4');
  T.click('#logs .entry.res details summary').sleep(200).wait(3200);

  /* ===== 5. Build ===== */
  T.title('Step 5', 'Build your own menu', 'Start from an empty screen in the Menu builder.', 2800);
  T.click('#mainTabs button[data-v=builder]').sleep(300).wait(1200);
  T.caption('Give your service a name, then write the first message.', 'Step 5');
  T.click('#screens .two input').type('#screens .two input', 'My Shop', { msPerChar: 90 }).wait(500);
  T.click('.scr[data-id=main] textarea').type('.scr[data-id=main] textarea', 'Welcome to My Shop', { msPerChar: 70 }).wait(700);
  T.caption('Option 1 is what the user presses. Type its text, then choose where it goes.', 'Step 5');
  T.click(optInput('main', 0, 1)).type(optInput('main', 0, 1), 'Check balance', { msPerChar: 70 }).wait(500);
  T.caption('Pick “+ New screen…” to create the next screen and link it in one go.', 'Step 5');
  T.pick(optSelect('main', 0), '__new__').sleep(200).wait(900);
  T.caption('This new screen ends the session. Write its message and give it a clear name.', 'Step 5');
  T.type('.scr[data-id=new_screen] textarea', 'Your balance is GHS 25.00', { msPerChar: 60 }).wait(400);
  T.click('.scr[data-id=new_screen] .sh input').type('.scr[data-id=new_screen] .sh input', 'balance', { msPerChar: 90, change: true }).sleep(200).wait(1000);
  T.caption('Add a second option for buying airtime.', 'Step 5');
  T.click(btnText('.scr[data-id=main]', 'Option')).sleep(150);
  T.type(optInput('main', 1, 1), 'Buy airtime', { msPerChar: 70 }).wait(400);
  T.pick(optSelect('main', 1), '__new__').sleep(200).wait(700);

  /* ===== 6. Questions & conditions ===== */
  T.title('Step 6', 'Ask a question and check the answer', 'Questions save what the user types. Conditions decide where to go next.', 3000);
  T.caption('Turn the new screen into a Question, name it “amount” and write the question.', 'Step 6');
  T.pick('.scr[data-id=new_screen] .sh select', 'input').sleep(200).wait(600);
  T.click('.scr[data-id=new_screen] .sh input').type('.scr[data-id=new_screen] .sh input', 'amount', { msPerChar: 90, change: true }).sleep(200);
  T.type('.scr[data-id=amount] textarea', 'Enter amount (GHS 1 - 500):', { msPerChar: 55 }).wait(500);
  T.caption('Choose where a good answer goes — another new screen to confirm the purchase.', 'Step 6');
  T.pick('.scr[data-id=amount] .then-row select', '__new__').sleep(200);
  T.type('.scr[data-id=new_screen] textarea', 'You bought GHS {{amount}} airtime.', { msPerChar: 55 }).wait(300);
  T.click('.scr[data-id=new_screen] .sh input').type('.scr[data-id=new_screen] .sh input', 'done', { msPerChar: 90, change: true }).sleep(200).wait(700);
  T.caption('Open More on the question to check the answer: accept numbers only…', 'Step 6');
  T.click('.scr[data-id=amount] details.more summary').sleep(150).wait(500);
  T.pick('.scr[data-id=amount] .more .two select', 'number').wait(600);
  T.caption('…and add a condition: if the amount is between 1 and 500, go to “done”.', 'Step 6');
  T.click(btnText('.scr[data-id=amount]', 'Condition')).sleep(150);
  T.pick('.scr[data-id=amount] .rule-row select:not(.nx)', 'between').sleep(150);
  T.click('.scr[data-id=amount] .rule-row input:not(.no-value):nth-of-type(2)');
  T.type(() => document.querySelectorAll('.scr[data-id=amount] .rule-row input')[1], '1,500', { msPerChar: 110 });
  T.pick('.scr[data-id=amount] .rule-row select.nx', 'done').wait(600);
  T.caption('Otherwise, send the user to a new screen that explains the limit.', 'Step 6');
  T.pick('.scr[data-id=amount] .then-row select', '__new__').sleep(200);
  T.type('.scr[data-id=new_screen] textarea', 'Amount must be between GHS 1 and 500.', { msPerChar: 45 }).wait(300);
  T.click('.scr[data-id=new_screen] .sh input').type('.scr[data-id=new_screen] .sh input', 'too_much', { msPerChar: 90, change: true }).sleep(200).wait(900);

  /* ===== 7. Variables ===== */
  T.title('Step 7', 'Variables and simple maths', 'Show saved values with {{name}} and calculate with =.', 3000);
  T.caption('On the “done” screen, open More and set a value: a 10% bonus.', 'Step 7');
  T.click('.scr[data-id=done] details.more summary').sleep(150).wait(400);
  T.click(btnText('.scr[data-id=done]', 'Set value')).sleep(150);
  T.type(() => document.querySelector('.scr[data-id=done] .set-row input'), 'bonus', { msPerChar: 100, change: true }).sleep(200);
  T.click(() => document.querySelectorAll('.scr[data-id=done] .set-row input')[1]);
  T.type(() => document.querySelectorAll('.scr[data-id=done] .set-row input')[1], '={{amount}} * 0.1', { msPerChar: 75 }).wait(600);
  T.caption('Then show it in the message with {{bonus}}.', 'Step 7');
  T.click('.scr[data-id=done] textarea').type('.scr[data-id=done] textarea', 'You bought GHS {{amount}} airtime.\nBonus: GHS {{bonus}}', { msPerChar: 45 }).wait(700);
  T.caption('The Variables button lists every value you can use. Click one to copy it.', 'Step 7');
  T.scrollTop().click('#varMenu summary').sleep(150).wait(3000).click('#varMenu summary').wait(400);

  /* ===== 8. Map ===== */
  T.title('Step 8', 'See your menu as a map', 'Boxes and arrows you can drag, link and edit.', 2800);
  T.caption('Switch to Map. Each screen is a box; arrows show where each option goes.', 'Step 8');
  T.click('#bView button[data-v=map]').sleep(250).click('#bTidy').sleep(250).wait(2600);
  T.caption('Drag a box by its top bar to move it.', 'Step 8');
  T.drag('#bmap .node[data-id=too_much] .grip', null, 900, [60, 90]).wait(1200);
  T.caption('Right-click a box, an arrow or empty space for more: edit, duplicate, delete…', 'Step 8');
  T.rightClick('#bmap .node[data-id=balance] .node-msg-in').sleep(200).wait(2600).key('Escape').wait(500);

  /* ===== 9. Test it ===== */
  T.title('Step 9', 'Test your menu on the phone', 'One click dials your menu on the test phone.', 2800);
  T.caption('Press Test on phone. Then choose 2 to buy airtime.', 'Step 9');
  T.click('#bRun').until(dialogReady).sleep(300).wait(2000);
  reply('2');
  T.caption('Type an amount — 50 — and press SEND.', 'Step 9');
  reply('50');
  T.caption('Your condition passed and the bonus was calculated: 10% of 50 is 5.', 'Step 9');
  T.wait(2400).click('#cancelBtn').wait(700);

  /* ===== 10. PHP ===== */
  T.title('Step 10', 'Get the PHP code', 'A ready Hubtel or Nalo endpoint for your server.', 2800);
  T.click('#mainTabs button[data-v=builder]').sleep(300);
  T.caption('Press Get PHP code. Copy it, or download it as a .php file for your server.', 'Step 10');
  T.click('#bGen').sleep(300).wait(3000);
  T.caption('Switch between Hubtel and Nalo — the same menu, in each provider’s format.', 'Step 10');
  T.click('#sampleSeg button[data-v=nalo]').sleep(200).wait(2400);
  T.move('#downloadCode').wait(1200).click('#closeSample').wait(600);

  /* ===== 11. Samples ===== */
  T.title('Step 11', 'Start from a ready-made sample', '30 sample menus, from simple to advanced.', 2800);
  T.caption('Open File and choose Load a sample.', 'Step 11');
  T.click('.file-menu:not(.var-menu) summary').sleep(150).wait(500).click('#bSamples').sleep(300).wait(1600);
  T.caption('Search for what you need — for example, sending money.', 'Step 11');
  T.click('.smp-search').type('.smp-search', 'money', { msPerChar: 120 }).wait(1200);
  T.click(() => [...document.querySelectorAll('.smp-item')].find(b => !b.hidden)).sleep(300).wait(1200);
  T.caption('Confirm, and the sample replaces your current menu.', 'Step 11');
  T.click('.dlg-ok').sleep(400).wait(2400);
  T.caption('Test it: send GHS 200 — the 1% fee and the total are worked out for you.', 'Step 11');
  T.click('#bRun').until(dialogReady).sleep(300).wait(1600);
  reply('0201234567');
  reply('200');
  reply('1234');
  T.wait(1600).click('#cancelBtn').wait(600);

  /* ===== 12. Your server ===== */
  T.title('Step 12', 'Test your own server', 'Point the simulator at your real USSD endpoint.', 2800);
  T.caption('Press Change, then choose My server.', 'Step 12');
  T.scrollTop().click('#setupOpen').sleep(200).wait(600).click('#srcSeg button[data-v=url]').wait(800);
  T.caption('Paste your callback URL and press Check. It tells you if your server answers correctly.', 'Step 12');
  T.click('#endpoint').type('#endpoint', 'http://localhost:8090/mock.php', { msPerChar: 45 }).wait(400);
  T.click('#checkBtn').until(() => /Works|Could not|error|format/.test(document.querySelector('#srcNote').textContent)).sleep(200).wait(3000);
  T.click('#setupDone').wait(1000);

  /* ===== Outro ===== */
  T.title('You are ready', 'Build, test and ship your USSD menus', 'Test any Hubtel or Nalo endpoint, build menus visually, and take the PHP code to your server.', 5200, 'Powered by SAB-TECH HUB · github.com/sabtechhub/ussd-simulator');
})();
