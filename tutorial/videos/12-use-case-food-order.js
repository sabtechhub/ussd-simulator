/* Video 12: Use case - food order with delivery, made from a sample */
const S = id => `.scr[data-id=${id}]`;
const retype = (sel, text, ms = 55) => T.click(sel).type(sel, text, { msPerChar: ms });
L.intro(12, 'Use case: food order with delivery', 'Turn a ready-made sample into your own food shop menu.',
  "This is the last video, number twelve. We will make a food ordering menu with delivery. And we will do it the smart way: by changing a ready-made sample.");

L.section('The plan', 'Mama’s Kitchen', "Here is the plan.");
T.say("Mama's Kitchen sells jollof for thirty five cedis a plate, and waakye for twenty five.");
T.say("Customers choose the food, type how many plates, and choose where to deliver. Near, for ten cedis. Or far, for twenty five.");
T.say("The menu shows the total, and takes the order.");
T.say("One of our samples, the farm inputs order, already works exactly like this. We just need to change the words and prices.");

L.section('Step 1', 'Load the sample', "Step one. Load the sample.");
L.page('builder');
T.click('.file-menu:not(.var-menu) summary').sleep(200).click('#bSamples').sleep(400);
T.click('.smp-search').type('.smp-search', 'farm', { msPerChar: 160 }).wait(500);
T.click(() => [...document.querySelectorAll('.smp-item')].find(b => !b.hidden)).sleep(400).wait(600);
T.say("Let us look at it on the Map first, to understand it.");
T.click('#bView button[data-v=map]').sleep(300).click('#bTidy').sleep(300).wait(1200);
T.say("First, choose a product. Then, how many. Then, where to deliver. Then, the order is placed.");
T.move('#bmap .node[data-id=product]', 800).wait(300).move('#bmap .node[data-id=fert]', 700).wait(300).move('#bmap .node[data-id=region]', 700).wait(300).move('#bmap .node[data-id=ordered]', 700);
T.say("Now we change it into Mama's Kitchen. The List view is easiest for this.");
T.click('#bView button[data-v=list]').sleep(300);

L.section('Step 2', 'The food menu', "Step two. The name and the food menu.");
retype('#screens .two input', "Mama's Kitchen", 100);
retype(S('product') + ' textarea', 'What would you like to eat?', 60);
T.say("Change the two options to jollof and waakye, with their prices.");
retype(L.opt('product', 0, 1), 'Jollof - GHS 35 a plate', 60);
retype(L.opt('product', 1, 1), 'Waakye - GHS 25 a plate', 60);

L.section('Step 3', 'Prices and questions', "Step three. Each food has its own question, and its own price.");
T.say("The first question was for fertilizer. Change it to ask about plates of jollof.");
retype(S('fert') + ' textarea', 'How many plates of jollof?', 60);
T.say("Open More. The saved values are the item name and the price. Change them to Jollof, and thirty five.");
T.click(S('fert') + ' details.more summary').sleep(200).wait(300);
retype(L.setIn('fert', 0, 1), 'Jollof', 100);
retype(L.setIn('fert', 1, 1), '35', 160);
T.say("Do the same for the second question. Waakye, twenty five.");
retype(S('seed') + ' textarea', 'How many plates of waakye?', 60);
T.click(S('seed') + ' details.more summary').sleep(200);
retype(L.setIn('seed', 0, 1), 'Waakye', 100);
retype(L.setIn('seed', 1, 1), '25', 160);

L.section('Step 4', 'Delivery fees', "Step four. Delivery.");
T.say("Change the two delivery options. Near for ten cedis, and far for twenty five.");
retype(L.opt('region', 0, 1), 'Near (Accra) - GHS 10', 60);
retype(L.opt('region', 1, 1), 'Far - GHS 25', 70);
T.say("Each delivery option has its own confirm screen. On the near one, the total is the food plus ten.");
T.click(S('accra') + ' details.more summary').sleep(200);
retype(L.setIn('accra', 1, 1), '={{goods}} + 10', 80);
retype(S('accra') + ' textarea', '{{bags}} x {{item}}\nFood GHS {{goods}} + delivery GHS 10\nTotal GHS {{total}}', 40);
T.say("And on the far one, the food plus twenty five.");
T.click(S('other') + ' details.more summary').sleep(200);
retype(L.setIn('other', 1, 1), '={{goods}} + 25', 80);
retype(S('other') + ' textarea', '{{bags}} x {{item}}\nFood GHS {{goods}} + delivery GHS 25\nTotal GHS {{total}}', 40);
T.say("Finally, the thank-you message.");
retype(S('ordered') + ' textarea', 'Thank you! Your food is on the way. Pay GHS {{total}} on delivery.', 45);

L.section('Step 5', 'Test two orders', "Step five. Test two different orders.");
T.say("Order one. Two plates of jollof, delivered near.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(500);
L.reply('1');
L.reply('2');
L.reply('1');
T.say("Two plates of jollof is seventy cedis. Plus ten for delivery, is eighty. Correct. Press 1 to order.", "Two plates of jollof is seventy cedis. Plus ten for delivery, is eighty. Correct. Press one to order.");
L.reply('1');
L.ok(); L.dial();
T.say("Order two. Three plates of waakye, delivered far.");
L.reply('2');
L.reply('3');
L.reply('2');
T.say("Seventy five for the food, plus twenty five delivery, is one hundred. Correct again.");
L.reply('1');
L.ok();

L.section('Well done', 'You finished the course', "You have finished the whole course. Let us remember what you learned.");
T.say("You learned what USSD is, and how to test menus on the simulator phone.");
T.say("You built menus with options, questions, conditions, and prices. You used the Map and the samples.");
T.say("And you learned how to put your menu live, for real customers.");
T.say("Now it is your turn. Think of a service for your business, your school, or your church, and build it.");
L.outro("Thank you for watching. Good luck with your USSD service. Powered by SAB-TECH HUB.", '');
