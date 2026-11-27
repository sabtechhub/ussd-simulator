/* Video 11: Use case - school fees payment, built from scratch */
const S = id => `.scr[data-id=${id}]`;
const newAs = (type, name, text) => {   // the screen just created by "New screen": set its kind, name and message
  if (type !== 'end') T.pick(S('new_screen') + ' .sh select', type).sleep(250);
  T.click(S('new_screen') + ' .sh input').type(S('new_screen') + ' .sh input', name, { change: true, msPerChar: 110 }).sleep(250);
  return T.click(S(name) + ' textarea').type(S(name) + ' textarea', text, { msPerChar: 45 });
};
L.intro(11, 'Use case: school fees payment', 'Build a complete school fees menu, from an empty page.',
  "This is video eleven. Now we put everything together. We will build a real menu for a school, from start to finish. Parents will use it to pay school fees.");

L.section('The plan', 'What parents will do', "First, the plan. Here is what a parent will do.");
T.say("The parent dials the school's code, and chooses Pay school fees.");
T.say("They type their child's student ID. It must have exactly six digits.", "They type their child's student I D. It must have exactly six digits.");
T.say("They type the amount. Between ten and five thousand cedis.");
T.say("The menu adds a small one percent fee, and shows the total. The parent confirms, and gets a receipt.");
T.say("There will also be an option to check the fees balance. Let us build it.");

L.section('Step 1', 'The main menu', "Step one. The main menu.");
L.page('builder');
T.click('#screens .two input').type('#screens .two input', 'School Fees', { msPerChar: 100 });
T.click(S('main') + ' textarea').type(S('main') + ' textarea', 'Welcome to Bright Future School', { msPerChar: 60 });
T.say("Option one, Pay school fees. It goes to a new screen.");
T.click(L.opt('main', 0, 1)).type(L.opt('main', 0, 1), 'Pay school fees', { msPerChar: 80 });
T.pick(L.optSel('main', 0), '__new__').sleep(250);
T.say("This new screen is a question. We call it student, and ask for the student ID.", "This new screen is a question. We call it student, and ask for the student I D.");
newAs('input', 'student', 'Enter student ID (6 digits):');

L.section('Step 2', 'Check the student ID', "Step two. Check the student ID.", "Step two. Check the student I D.");
T.say("Open More. Accept numbers only.");
T.click(S('student') + ' details.more summary').sleep(200);
T.pick(S('student') + ' .more .two select', 'number').wait(400);
T.say("Now a condition. If the length is exactly six, go on to the amount.");
T.click(L.btn(S('student'), 'Condition')).sleep(200);
T.pick(L.ruleSel('student', 0), 'len_eq').sleep(200);
T.click(L.ruleIn('student', 0, 1)).type(L.ruleIn('student', 0, 1), '6', { msPerChar: 160 });
T.pick(L.ruleSel('student', 0, true), '__new__').sleep(250);
T.say("The next screen asks for the amount.");
newAs('input', 'amount', 'Enter amount (GHS 10 - 5000):');
T.say("Otherwise, the ID is wrong. Make a screen that says so.", "Otherwise, the I D is wrong. Make a screen that says so.");
T.pick(S('student') + ' .then-row select', '__new__').sleep(250);
newAs('end', 'bad_id', 'Student ID must have 6 digits. Please dial again.');

L.section('Step 3', 'Check the amount', "Step three. Check the amount.");
T.click(S('amount') + ' details.more summary').sleep(200);
T.pick(S('amount') + ' .more .two select', 'number').wait(300);
T.say("If the amount is between ten and five thousand, go to a confirm screen.");
T.click(L.btn(S('amount'), 'Condition')).sleep(200);
T.pick(L.ruleSel('amount', 0), 'between').sleep(200);
T.click(L.ruleIn('amount', 0, 1)).type(L.ruleIn('amount', 0, 1), '10,5000', { msPerChar: 120 });
T.pick(L.ruleSel('amount', 0, true), '__new__').sleep(250);
newAs('menu', 'confirm', 'Student {{student}}\nFees GHS {{amount}} + fee GHS {{fee}}\nPay GHS {{total}}?');
T.say("Otherwise, tell the parent the limits.");
T.pick(S('amount') + ' .then-row select', '__new__').sleep(250);
newAs('end', 'bad_amount', 'Amount must be between GHS 10 and 5000.');

L.section('Step 4', 'Work out the total', "Step four. Work out the fee and the total.");
T.say("On the confirm screen, open More. The fee is the amount times zero point zero one. That is one percent.");
T.click(S('confirm') + ' details.more summary').sleep(200);
T.click(L.btn(S('confirm'), 'Set value')).sleep(200);
T.type(L.setIn('confirm', 0, 0), 'fee', { msPerChar: 120, change: true }).sleep(250);
T.click(L.setIn('confirm', 0, 1)).type(L.setIn('confirm', 0, 1), '={{amount}} * 0.01', { msPerChar: 80 });
T.say("The total is the amount plus the fee.");
T.click(L.btn(S('confirm'), 'Set value')).sleep(200);
T.type(L.setIn('confirm', 1, 0), 'total', { msPerChar: 120, change: true }).sleep(250);
T.click(L.setIn('confirm', 1, 1)).type(L.setIn('confirm', 1, 1), '={{amount}} + {{fee}}', { msPerChar: 80 });

L.section('Step 5', 'Pay or cancel', "Step five. Pay, or cancel.");
T.say("Option one, Pay. It goes to a receipt.");
T.click(L.opt('confirm', 0, 1)).type(L.opt('confirm', 0, 1), 'Pay', { msPerChar: 120 });
T.pick(L.optSel('confirm', 0), '__new__').sleep(250);
newAs('end', 'paid', 'Paid GHS {{total}} for student {{student}}. Receipt sent to {{phone}}.');
T.say("Option two, Cancel.");
T.click(L.btn(S('confirm'), 'Option')).sleep(200);
T.type(L.opt('confirm', 1, 1), 'Cancel', { msPerChar: 110 });
T.pick(L.optSel('confirm', 1), '__new__').sleep(250);
newAs('end', 'cancelled', 'Payment cancelled.');

L.section('Step 6', 'Fees balance', "Step six. One more option on the main menu: check the fees balance.");
T.click(L.btn(S('main'), 'Option')).sleep(200);
T.type(L.opt('main', 1, 1), 'Check fees balance', { msPerChar: 80 });
T.pick(L.optSel('main', 1), '__new__').sleep(250);
newAs('end', 'balance', 'Fees balance this term: GHS 1,200.');
T.say("Done. Let us see the whole menu on the Map.");
T.scrollTop().click('#bView button[data-v=map]').sleep(300).click('#bTidy').sleep(300).wait(3500);
T.say("You can follow every path with your finger. Main menu, student, amount, confirm, and the receipt.");

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

L.outro("Excellent. You built a complete school fees service, with checks, a fee, a total and a receipt. In the last video, we will build a shop order menu with delivery.",
  'Use case: shop order with delivery');
