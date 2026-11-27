/* Video 6: Make decisions with conditions (simple) */
L.loadFlow({ name: 'Airtime', start: 'amount', screens: [
  { id: 'amount', type: 'input', text: 'Enter amount (GHS):', saveAs: 'amount', validate: 'number', rules: [], next: 'done' },
  { id: 'done', type: 'end', text: 'You bought GHS {{amount}} airtime.' },
  { id: 'too_small', type: 'end', text: 'The minimum is GHS 1.' },
  { id: 'too_big', type: 'end', text: 'The maximum is GHS 500.' },
  { id: 'bonus', type: 'end', text: 'You bought GHS {{amount}} airtime, with a free bonus!' }] });
L.intro(6, 'Make decisions with conditions', 'Send customers to different screens, depending on their answer.',
  "This is video six. Your menu can make simple decisions. For example: if the amount is too big, say no. In this video, you will learn how.");

L.section('Part 1', 'Our example', "Here is our real-life example.");
T.say("A shop sells airtime by USSD. The customer types an amount.");
T.say("The shop has three rules. Less than one cedi, is too small. More than five hundred, is too big. And from one hundred to five hundred, the customer gets a free bonus.");
T.say("Everything else is a normal purchase.");
T.say("We call these rules, conditions. Each condition says: if this is true, go to that screen.");

L.section('Part 2', 'The first rule', "We have the screens ready. Let us add the rules.");
L.page('builder');
T.say("Conditions are added to a Question. Open More, on the amount question.");
T.click('.scr[data-id=amount] details.more summary').sleep(200).wait(500);
T.say("Press plus Condition. A new line appears. Read it like a sentence.");
T.click(L.btn('.scr[data-id=amount]', 'Condition')).sleep(200).wait(600);
T.say("If, amount. That is the customer's answer.");
T.move(L.ruleIn('amount', 0, 0), 800);
T.say("Is less than. One. Then go to, too small.", "Is less than. One. Then go to, too small.");
T.pick(L.ruleSel('amount', 0), '<').sleep(200);
T.click(L.ruleIn('amount', 0, 1)).type(L.ruleIn('amount', 0, 1), '1', { msPerChar: 160 });
T.pick(L.ruleSel('amount', 0, true), 'too_small').wait(500);
T.say("So the rule reads: if amount is less than 1, go to too small.", "So the rule reads: if amount is less than one, go to too small.");

L.section('Part 3', 'Two more rules', "Now the second rule. Too big.");
T.click(L.btn('.scr[data-id=amount]', 'Condition')).sleep(200);
T.pick(L.ruleSel('amount', 1), '>').sleep(200);
T.click(L.ruleIn('amount', 1, 1)).type(L.ruleIn('amount', 1, 1), '500', { msPerChar: 140 });
T.pick(L.ruleSel('amount', 1, true), 'too_big').wait(500);
T.say("If amount is greater than 500, go to too big.", "If amount is greater than five hundred, go to too big.");
T.say("And the third rule. The bonus. Choose, is between, and type 100, comma, 500.", "And the third rule. The bonus. Choose, is between, and type one hundred, comma, five hundred.");
T.click(L.btn('.scr[data-id=amount]', 'Condition')).sleep(200);
T.pick(L.ruleSel('amount', 2), 'between').sleep(200);
T.click(L.ruleIn('amount', 2, 1)).type(L.ruleIn('amount', 2, 1), '100,500', { msPerChar: 140 });
T.pick(L.ruleSel('amount', 2, true), 'bonus').wait(500);
T.say("The rules are checked from top to bottom. The first one that is true, wins.");
T.say("If no rule is true, the customer goes to, Otherwise go to. Here, that is the normal done screen.");
T.move('.scr[data-id=amount] .then-row select', 900);

L.section('Part 4', 'Other kinds of checks', "There are many other kinds of checks. Here are a few useful ones.");
T.move(L.ruleSel('amount', 2), 700);
T.say("Equals. For example, if the PIN equals 1 2 3 4.", "Equals. For example, if the PIN equals one two three four.");
T.say("Is one of. For example, if the choice is one of 1, 2 or 3.", "Is one of. For example, if the choice is one of one, two or three.");
T.say("Is an email, or is a phone number, to check what the customer typed.");
T.say("And length is. For example, a student ID must have exactly 6 digits.", "And length is. For example, a student I D must have exactly six digits.");
T.say("You can also compare with something saved earlier. For example, if the amount is more than the balance, say, not enough money.");

L.section('Part 5', 'Test every rule', "Now let us test all four paths.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(600);
T.say("Type zero. It should be too small.");
L.reply('0');
L.ok(); L.dial();
T.say("Type six hundred. Too big.");
L.reply('600');
L.ok(); L.dial();
T.say("Type two hundred. Bonus!");
L.reply('200');
L.ok(); L.dial();
T.say("And fifty. A normal purchase.");
L.reply('50');
L.ok();
T.say("Every amount went to the right screen. That is the power of conditions.");

L.outro("Great work. Your menus can now make decisions. In the next video, we will let the menu do maths for you, like prices and totals.",
  'Prices, totals and maths');
