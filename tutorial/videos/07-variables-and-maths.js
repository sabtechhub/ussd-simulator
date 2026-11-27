/* Video 7: Prices, totals and maths (simple) */
L.loadFlow({ name: 'Tickets', start: 'type', screens: [
  { id: 'type', type: 'menu', text: 'Choose ticket', options: [{ key: '1', label: 'Regular - GHS 50', next: 'regular' }, { key: '2', label: 'VIP - GHS 150', next: 'vip' }] },
  { id: 'regular', type: 'input', text: 'How many tickets?', saveAs: 'qty', validate: 'number', rules: [], next: 'confirm' },
  { id: 'vip', type: 'input', text: 'How many tickets?', saveAs: 'qty', validate: 'number', rules: [], next: 'confirm' },
  { id: 'confirm', type: 'menu', text: '', options: [{ key: '1', label: 'Pay', next: 'paid' }, { key: '2', label: 'Cancel', next: 'cancel' }] },
  { id: 'paid', type: 'end', text: 'Paid! Tickets sent to {{phone}}.' },
  { id: 'cancel', type: 'end', text: 'Cancelled.' }] });
L.intro(7, 'Prices, totals and maths', 'Let your menu remember prices and work out totals for you.',
  "This is video seven. Your menu can remember things, like a price, and do maths, like working out a total. Let us see how.");

L.section('Part 1', 'Our example', "Here is our real-life example.");
T.say("An event sells tickets by USSD. Regular tickets cost fifty cedis. VIP tickets cost one hundred and fifty.");
T.say("The customer picks a ticket and types how many. The menu should show the total price.");
T.say("We have the screens ready. We just need the prices and the total.");
L.page('builder');

L.section('Part 2', 'Remember a price', "First, we teach the menu the price of each ticket.");
T.say("A saved value has a name, and a value. Like a small note. The name is price, the note says fifty.");
T.say("Open More on the regular screen. Press plus Set value.");
T.click('.scr[data-id=regular] details.more summary').sleep(200).wait(400);
T.click(L.btn('.scr[data-id=regular]', 'Set value')).sleep(200);
T.say("Name, price. Value, fifty.");
T.type(L.setIn('regular', 0, 0), 'price', { msPerChar: 130, change: true }).sleep(250);
T.click(L.setIn('regular', 0, 1)).type(L.setIn('regular', 0, 1), '50', { msPerChar: 170 });
T.say("And one more. Name, ticket. Value, Regular.");
T.click(L.btn('.scr[data-id=regular]', 'Set value')).sleep(200);
T.type(L.setIn('regular', 1, 0), 'ticket', { msPerChar: 130, change: true }).sleep(250);
T.click(L.setIn('regular', 1, 1)).type(L.setIn('regular', 1, 1), 'Regular', { msPerChar: 120 });
T.say("We do the same on the VIP screen. Price, one hundred and fifty. Ticket, VIP.");
T.click('.scr[data-id=vip] details.more summary').sleep(200);
T.click(L.btn('.scr[data-id=vip]', 'Set value')).sleep(200);
T.type(L.setIn('vip', 0, 0), 'price', { msPerChar: 100, change: true }).sleep(250);
T.click(L.setIn('vip', 0, 1)).type(L.setIn('vip', 0, 1), '150', { msPerChar: 140 });
T.click(L.btn('.scr[data-id=vip]', 'Set value')).sleep(200);
T.type(L.setIn('vip', 1, 0), 'ticket', { msPerChar: 100, change: true }).sleep(250);
T.click(L.setIn('vip', 1, 1)).type(L.setIn('vip', 1, 1), 'VIP', { msPerChar: 140 });
T.say("Now the menu knows the right price, whichever ticket the customer picks.");

L.section('Part 3', 'Work out the total', "Now, the maths.");
T.say("To do maths, start the value with an equals sign. Then write the sum, just like on a calculator.");
T.say("On the confirm screen, set total to: equals, price, times, the number of tickets.");
T.click('.scr[data-id=confirm] details.more summary').sleep(200);
T.click(L.btn('.scr[data-id=confirm]', 'Set value')).sleep(200);
T.type(L.setIn('confirm', 0, 0), 'total', { msPerChar: 120, change: true }).sleep(250);
T.click(L.setIn('confirm', 0, 1)).type(L.setIn('confirm', 0, 1), '={{price}} * {{qty}}', { msPerChar: 90 });
T.say("The star means times. You can also use plus, minus, and divide.");
T.say("Let us also add a small service fee, of two percent. That is the total, times zero point zero two.");
T.click(L.btn('.scr[data-id=confirm]', 'Set value')).sleep(200);
T.type(L.setIn('confirm', 1, 0), 'fee', { msPerChar: 130, change: true }).sleep(250);
T.click(L.setIn('confirm', 1, 1)).type(L.setIn('confirm', 1, 1), '={{total}} * 0.02', { msPerChar: 90 });
T.click(L.btn('.scr[data-id=confirm]', 'Set value')).sleep(200);
T.type(L.setIn('confirm', 2, 0), 'grand', { msPerChar: 130, change: true }).sleep(250);
T.click(L.setIn('confirm', 2, 1)).type(L.setIn('confirm', 2, 1), '={{total}} + {{fee}}', { msPerChar: 90 });
T.say("And grand, is the total plus the fee. That is what the customer pays.");

L.section('Part 4', 'Show it to the customer', "Now show these numbers in the message.");
T.say("Write each name between double curly brackets.");
T.click('.scr[data-id=confirm] textarea').type('.scr[data-id=confirm] textarea', '{{qty}} x {{ticket}} = GHS {{total}}\nFee GHS {{fee}}\nPay GHS {{grand}}?', { msPerChar: 45 });
T.say("Tip. The Variables button shows every name you can use. Click one to copy it.");
T.click('#varMenu summary').sleep(250).wait(2600).click('#varMenu summary').sleep(150);

L.section('Part 5', 'Test it', "Let us test. Choose VIP, and buy three tickets.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(600);
L.reply('2');
L.reply('3');
T.say("Three VIP tickets cost four hundred and fifty. The fee is nine. So the customer pays four hundred and fifty nine. The menu did the maths for us.");
T.wait(1000);
L.reply('1');
T.say("And the last message shows the customer's own phone number. The word phone, in brackets, always means the caller's number.");
L.ok();

L.outro("Excellent. Your menu can now remember prices and work out totals. In the next video, we will see the whole menu as a map, with boxes and arrows.",
  'See your menu as a map');
