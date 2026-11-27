/* Video 7: Prices, totals and maths, on the Map */
L.loadFlow({ name: 'Tickets', start: 'type', screens: [
  { id: 'type', type: 'menu', text: 'Choose ticket', options: [{ key: '1', label: 'Regular - GHS 50', next: 'regular' }, { key: '2', label: 'VIP - GHS 150', next: 'vip' }] },
  { id: 'regular', type: 'input', text: 'How many tickets?', saveAs: 'qty', validate: 'number', rules: [], next: 'confirm' },
  { id: 'vip', type: 'input', text: 'How many tickets?', saveAs: 'qty', validate: 'number', rules: [], next: 'confirm' },
  { id: 'confirm', type: 'menu', text: '', options: [{ key: '1', label: 'Pay', next: 'paid' }, { key: '2', label: 'Cancel', next: 'cancel' }] },
  { id: 'paid', type: 'end', text: 'Paid! Tickets sent to {{phone}}.' },
  { id: 'cancel', type: 'end', text: 'Cancelled.' }] });
L.intro(7, 'Prices, totals and maths', 'Let your menu remember prices and work out totals for you.',
  "This is video seven. Your menu can remember things, like a price, and do maths, like working out a total. Let us see how, on the Map.");

L.section('Part 1', 'Our example', "Here is our real-life example.");
T.say("An event sells tickets by USSD. Regular tickets cost fifty cedis. VIP tickets cost one hundred and fifty.");
T.say("The customer picks a ticket, and types how many. The menu should show the total.");
L.page('builder');
L.onMap();
L.tidy();
T.say("The boxes are ready. Both ticket questions lead to the confirm box. We just need the prices and the total.");
T.move(L.N('regular'), 800).wait(300).move(L.N('confirm'), 800);

L.section('Part 2', 'Remember a price', "First, we teach the menu the price of each ticket.");
T.say("A saved value is like a small note, with a name and a value. The name is price. The note says fifty.");
T.say("Open the settings of the regular box. At the bottom, press plus Set value.");
L.settings('regular');
T.click(L.pBtn('Set value')).sleep(250);
T.type(L.pSet(0, 0), 'price', { msPerChar: 130, change: true }).sleep(300);
T.click(L.pSet(0, 1)).type(L.pSet(0, 1), '50', { msPerChar: 170 });
T.say("And one more note. Name, ticket. Value, Regular.");
T.click(L.pBtn('Set value')).sleep(250);
T.type(L.pSet(1, 0), 'ticket', { msPerChar: 130, change: true }).sleep(300);
T.click(L.pSet(1, 1)).type(L.pSet(1, 1), 'Regular', { msPerChar: 120 });
T.say("The box on the map now shows its notes, so you can see them at a glance.");
T.move(L.N('regular'), 800);
T.say("Do the same on the VIP box. Price, one hundred and fifty. Ticket, VIP.");
L.settings('vip');
T.click(L.pBtn('Set value')).sleep(250);
T.type(L.pSet(0, 0), 'price', { msPerChar: 100, change: true }).sleep(300);
T.click(L.pSet(0, 1)).type(L.pSet(0, 1), '150', { msPerChar: 140 });
T.click(L.pBtn('Set value')).sleep(250);
T.type(L.pSet(1, 0), 'ticket', { msPerChar: 100, change: true }).sleep(300);
T.click(L.pSet(1, 1)).type(L.pSet(1, 1), 'VIP', { msPerChar: 140 });

L.section('Part 3', 'Work out the total', "Now, the maths.");
T.say("To do maths, start the value with an equals sign. Then write the sum, like on a calculator. The star means times.");
T.say("Open the settings of the confirm box. Set total to: equals, price, times, the number of tickets.");
L.settings('confirm');
T.click(L.pBtn('Set value')).sleep(250);
T.type(L.pSet(0, 0), 'total', { msPerChar: 120, change: true }).sleep(300);
T.click(L.pSet(0, 1)).type(L.pSet(0, 1), '={{price}} * {{qty}}', { msPerChar: 90 });
T.say("Add a service fee of two percent. That is the total times zero point zero two. And grand, the total plus the fee.");
T.click(L.pBtn('Set value')).sleep(250);
T.type(L.pSet(1, 0), 'fee', { msPerChar: 130, change: true }).sleep(300);
T.click(L.pSet(1, 1)).type(L.pSet(1, 1), '={{total}} * 0.02', { msPerChar: 90 });
T.click(L.pBtn('Set value')).sleep(250);
T.type(L.pSet(2, 0), 'grand', { msPerChar: 130, change: true }).sleep(300);
T.click(L.pSet(2, 1)).type(L.pSet(2, 1), '={{total}} + {{fee}}', { msPerChar: 90 });
L.closeSettings();

L.section('Part 4', 'Show it to the customer', "Now show these numbers in the confirm box's message.");
T.say("Write each name between double curly brackets.");
L.msg('confirm', '{{qty}} x {{ticket}} = GHS {{total}}\nFee GHS {{fee}}\nPay GHS {{grand}}?', 45);
T.say("Tip. The Variables button lists every name you can use. Click one to copy it.");
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

L.outro("Excellent. Your menu can now remember prices and work out totals. In the next video, we will learn more Map tricks, like moving, joining and tidying boxes.",
  'More Map tricks');
