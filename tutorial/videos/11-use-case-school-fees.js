/* Video 11: Use case - school fees payment, built from scratch on the Map */
L.intro(11, 'Use case: school fees payment', 'Build a complete school fees menu on the Map, from an empty page.',
  "This is video eleven. Now we put everything together. We will build a real menu for a school, from start to finish, on the Map. Parents will use it to pay school fees.");

L.section('The plan', 'What parents will do', "First, the plan. Here is what a parent will do.");
T.say("The parent dials the school's code, and chooses Pay school fees.");
T.say("They type their child's student ID. It must have exactly six digits.", "They type their child's student I D. It must have exactly six digits.");
T.say("They type the amount. Between ten and five thousand cedis.");
T.say("The menu adds a one percent fee, shows the total, and gives a receipt. There is also an option to check the fees balance. Let us build it.");

L.section('Step 1', 'The main menu', "Step one. The main menu.");
L.page('builder');
L.onMap();
L.msg('main', 'Welcome to Bright Future School', 60);
T.click(L.nodeOptText('main', 0)).type(L.nodeOptText('main', 0), 'Pay school fees', { msPerChar: 80 });
T.say("Drag the option's dot to an empty space. The new box asks for the student ID, so make it a Question called student.", "Drag the option's dot to an empty space. The new box asks for the student I D, so make it a Question called student.");
L.newScreen('main', L.port('main', 0));
L.kind('new_screen', 'input');
L.name('new_screen', 'student');
L.msg('student', 'Enter student ID (6 digits):', 60);

L.section('Step 2', 'Check the student ID', "Step two. Check the student ID.", "Step two. Check the student I D.");
T.say("Open the student box's settings. Accept numbers only.");
L.settings('student');
T.pick(`${L.P} .more .two select`, 'number').wait(400);
T.say("Add a condition. If the length is exactly six, go on. For where to go, choose New screen.");
T.click(L.pBtn('Condition')).sleep(250);
T.pick(L.pRule(0, 'op'), 'len_eq').sleep(250);
T.click(L.pRule(0, 'value')).type(L.pRule(0, 'value'), '6', { msPerChar: 160 });
T.pick(L.pRule(0, 'next'), '__new__').sleep(350);
L.closeSettings();
T.say("A new box appears on the map. It asks for the amount, so make it a Question called amount.");
L.kind('new_screen', 'input');
L.name('new_screen', 'amount');
L.msg('amount', 'Enter amount (GHS 10 - 5000):', 55);
T.say("Otherwise, the ID is wrong. Drag the student box's otherwise dot to an empty space, and explain the mistake.", "Otherwise, the I D is wrong. Drag the student box's otherwise dot to an empty space, and explain the mistake.");
L.newScreen('student', L.lastPort('student'));
L.name('new_screen', 'bad_id');
L.msg('bad_id', 'Student ID must have 6 digits. Please dial again.', 50);
L.tidy();

L.section('Step 3', 'Check the amount', "Step three. Check the amount.");
L.settings('amount');
T.pick(`${L.P} .more .two select`, 'number').wait(300);
T.say("If the amount is between ten and five thousand, go to a new confirm box.");
T.click(L.pBtn('Condition')).sleep(250);
T.pick(L.pRule(0, 'op'), 'between').sleep(250);
T.click(L.pRule(0, 'value')).type(L.pRule(0, 'value'), '10,5000', { msPerChar: 120 });
T.pick(L.pRule(0, 'next'), '__new__').sleep(350);

L.section('Step 4', 'Work out the total', "Step four. The confirm box, with the fee and the total.");
L.closeSettings();
T.say("Make it a Menu called confirm. Then open its settings, and set two values. The fee, is the amount times zero point zero one. That is one percent. The total, is the amount plus the fee.");
L.kind('new_screen', 'menu');
L.name('new_screen', 'confirm');
L.settings('confirm');
T.click(L.pBtn('Set value')).sleep(250);
T.type(L.pSet(0, 0), 'fee', { msPerChar: 120, change: true }).sleep(300);
T.click(L.pSet(0, 1)).type(L.pSet(0, 1), '={{amount}} * 0.01', { msPerChar: 80 });
T.click(L.pBtn('Set value')).sleep(250);
T.type(L.pSet(1, 0), 'total', { msPerChar: 120, change: true }).sleep(300);
T.click(L.pSet(1, 1)).type(L.pSet(1, 1), '={{amount}} + {{fee}}', { msPerChar: 80 });
L.closeSettings();
T.say("Now the confirm message, using the values.");
L.msg('confirm', 'Student {{student}}\nFees GHS {{amount}} + fee GHS {{fee}}\nPay GHS {{total}}?', 40);
T.say("And for amounts outside the limits, drag the amount box's otherwise dot to an empty space.");
L.newScreen('amount', L.lastPort('amount'));
L.name('new_screen', 'bad_amount');
L.msg('bad_amount', 'Amount must be between GHS 10 and 5000.', 50);
L.tidy();

L.section('Step 5', 'Pay or cancel', "Step five. Pay, or cancel.");
T.say("In the confirm box, type Pay for option one, and drag its dot to make the receipt.");
T.click(L.nodeOptText('confirm', 0)).type(L.nodeOptText('confirm', 0), 'Pay', { msPerChar: 120 });
L.newScreen('confirm', L.port('confirm', 0));
L.name('new_screen', 'paid');
L.msg('paid', 'Paid GHS {{total}} for student {{student}}. Receipt sent to {{phone}}.', 40);
T.say("Add option two, Cancel.");
T.click(`${L.N('confirm')} .node-add`).sleep(250);
T.type(L.nodeOptText('confirm', 1), 'Cancel', { msPerChar: 110 });
L.newScreen('confirm', L.port('confirm', 1));
L.name('new_screen', 'cancelled');
L.msg('cancelled', 'Payment cancelled.', 60);

L.section('Step 6', 'Fees balance', "Step six. Back on the main menu, add Check fees balance.");
T.click(`${L.N('main')} .node-add`).sleep(250);
T.type(L.nodeOptText('main', 1), 'Check fees balance', { msPerChar: 80 });
L.newScreen('main', L.port('main', 1));
L.name('new_screen', 'balance');
L.msg('balance', 'Fees balance this term: GHS 1,200.', 50);
T.say("Done. Press Tidy up, and full screen, to see the whole menu.");
L.tidy();
T.click('#bFull').sleep(500).wait(3500);
T.say("Follow the arrows: main menu, student, amount, confirm, and the receipt. Each mistake has its own box too.");
T.click('#bFull').sleep(400);

L.section('Step 7', 'Test like a parent', "Now let us test it, like a parent would.");
T.say("First, a mistake. A student ID with only five digits.", "First, a mistake. A student I D with only five digits.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(500);
L.reply('1');
L.reply('12345');
T.say("The menu tells the parent the ID must have six digits. Good.", "The menu tells the parent the I D must have six digits. Good.");
L.ok(); L.dial();
T.say("Now properly. Student 2 0 2 4 0 1, and one thousand five hundred cedis.", "Now properly. Student two zero two four zero one, and one thousand five hundred cedis.");
L.reply('1');
L.reply('202401');
L.reply('1500');
T.say("The fee is fifteen cedis, and the total is one thousand five hundred and fifteen. Press 1 to pay.", "The fee is fifteen cedis, and the total is one thousand five hundred and fifteen. Press one to pay.");
L.reply('1');
T.say("The receipt is ready. Our school fees menu works.");
L.ok();

L.outro("Excellent. You built a complete school fees service on the Map, with checks, a fee, a total and a receipt. In the last video, we will build a food ordering menu with delivery.",
  'Use case: food order with delivery');
