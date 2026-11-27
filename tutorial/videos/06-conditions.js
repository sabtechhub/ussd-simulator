/* Video 6: Make decisions with conditions, on the Map */
L.loadFlow({ name: 'Airtime', start: 'amount', screens: [
  { id: 'amount', type: 'input', text: 'Enter amount (GHS):', saveAs: 'amount', validate: 'number', rules: [], next: 'done' },
  { id: 'done', type: 'end', text: 'You bought GHS {{amount}} airtime.' },
  { id: 'too_small', type: 'end', text: 'The minimum is GHS 1.' },
  { id: 'too_big', type: 'end', text: 'The maximum is GHS 500.' },
  { id: 'bonus', type: 'end', text: 'You bought GHS {{amount}} airtime, with a free bonus!' }] });
L.intro(6, 'Make decisions with conditions', 'Send customers to different boxes, depending on their answer.',
  "This is video six. Your menu can make simple decisions. For example: if the amount is too big, say no. In this video, you will learn how, on the Map.");

L.section('Part 1', 'Our example', "Here is our real-life example.");
T.say("A shop sells airtime by USSD. The customer types an amount.");
T.say("Less than one cedi, is too small. More than five hundred, is too big. From one hundred to five hundred, there is a free bonus. Everything else is a normal purchase.");
T.say("We call these rules, conditions. Each condition says: if this is true, go to that box.");
L.page('builder');
L.onMap();
L.tidy();
T.say("We have the boxes ready. Right now, the amount question always goes to done. The other three boxes are not joined yet.");
T.move(L.N('amount'), 900).wait(300).move(L.N('too_small'), 700);

L.section('Part 2', 'The first rule', "Click the settings button on the amount box.");
L.settings('amount');
T.say("Press plus Condition. A new line appears. Read it like a sentence.");
T.click(L.pBtn('Condition')).sleep(250).wait(500);
T.say("If, amount. That is the customer's answer. Is less than. One. Then go to, too small.", "If, amount. That is the customer's answer. Is less than. One. Then go to, too small.");
T.pick(L.pRule(0, 'op'), '<').sleep(250);
T.click(L.pRule(0, 'value')).type(L.pRule(0, 'value'), '1', { msPerChar: 160 });
T.pick(L.pRule(0, 'next'), 'too_small').sleep(300).wait(600);
T.say("Look at the map. A dashed arrow now goes to too small. Dashed arrows are conditions.");
T.move(L.N('too_small'), 900);

L.section('Part 3', 'Two more rules', "Now the second rule. Too big.");
T.click(L.pBtn('Condition')).sleep(250);
T.pick(L.pRule(1, 'op'), '>').sleep(250);
T.click(L.pRule(1, 'value')).type(L.pRule(1, 'value'), '500', { msPerChar: 140 });
T.pick(L.pRule(1, 'next'), 'too_big').sleep(300).wait(400);
T.say("If amount is greater than 500, go to too big.", "If amount is greater than five hundred, go to too big.");
T.say("And the bonus. Choose, is between, and type 100, comma, 500.", "And the bonus. Choose, is between, and type one hundred, comma, five hundred.");
T.click(L.pBtn('Condition')).sleep(250);
T.pick(L.pRule(2, 'op'), 'between').sleep(250);
T.click(L.pRule(2, 'value')).type(L.pRule(2, 'value'), '100,500', { msPerChar: 140 });
T.pick(L.pRule(2, 'next'), 'bonus').sleep(300).wait(400);
L.closeSettings();
L.tidy();
T.say("Now the map shows every path. The rules are checked from top to bottom, and the first one that is true, wins. If none is true, the customer goes to otherwise. That is done.");
T.move(L.lastPort('amount'), 900);

L.section('Part 4', 'Other kinds of checks', "There are many other kinds of checks. Here are a few useful ones.");
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
T.say("Every amount went to the right box. That is the power of conditions.");

L.outro("Great work. Your menus can now make decisions. In the next video, we will let the menu do maths for you, like prices and totals.",
  'Prices, totals and maths');
