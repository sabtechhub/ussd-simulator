/* Video 12: Use case - food order with delivery, made from a sample, on the Map */
const set = (i, n, text, ms) => T.click(L.pSet(i, n)).type(L.pSet(i, n), text, { msPerChar: ms });
const opt = (id, i, text, ms = 60) => T.click(L.nodeOptText(id, i)).type(L.nodeOptText(id, i), text, { msPerChar: ms });
L.intro(12, 'Use case: food order with delivery', 'Turn a ready-made sample into your own food shop menu, on the Map.',
  "This is the last video, number twelve. We will make a food ordering menu with delivery. And we will do it the smart way: by changing a ready-made sample, right on the Map.");

L.section('The plan', 'Mama’s Kitchen', "Here is the plan.");
T.say("Mama's Kitchen sells jollof for thirty five cedis a plate, and waakye for twenty five.");
T.say("Customers choose the food, type how many plates, and choose where to deliver. Near, for ten cedis. Or far, for twenty five.");
T.say("The menu shows the total, and takes the order.");
T.say("One of our samples, the farm inputs order, already works exactly like this. We just need to change the words and prices.");

L.section('Step 1', 'Load the sample', "Step one. Load the sample.");
L.page('builder');
L.onMap();
T.click('.file-menu:not(.var-menu) summary').sleep(200).click('#bSamples').sleep(400);
T.click('.smp-search').type('.smp-search', 'farm', { msPerChar: 160 }).wait(500);
T.click(() => [...document.querySelectorAll('.smp-item')].find(b => !b.hidden)).sleep(400).wait(600);
L.onMap();
L.tidy();
T.say("Let us follow the arrows, to understand it. First, choose a product. Then, how many. Then, where to deliver. Then, the order is placed.");
T.move(L.N('product'), 800).wait(300).move(L.N('fert'), 700).wait(300).move(L.N('region'), 700).wait(300).move(L.N('ordered'), 700);
T.say("Now we change it into Mama's Kitchen. We can type straight into the boxes.");

L.section('Step 2', 'The food menu', "Step two. The food menu.");
L.msg('product', 'What would you like to eat?', 60);
T.say("Change the two options to jollof and waakye, with their prices.");
opt('product', 0, 'Jollof - GHS 35 a plate');
opt('product', 1, 'Waakye - GHS 25 a plate');

L.section('Step 3', 'Prices and questions', "Step three. Each food has its own question, and its own price.");
T.say("The first question was for fertilizer. Change it to ask about plates of jollof.");
L.msg('fert', 'How many plates of jollof?', 60);
T.say("Open its settings. The saved values are the item name and the price. Change them to Jollof, and thirty five.");
L.settings('fert');
set(0, 1, 'Jollof', 100);
set(1, 1, '35', 160);
L.closeSettings();
T.say("Do the same for the second question. Waakye, twenty five.");
L.msg('seed', 'How many plates of waakye?', 60);
L.settings('seed');
set(0, 1, 'Waakye', 100);
set(1, 1, '25', 160);
L.closeSettings();

L.section('Step 4', 'Delivery fees', "Step four. Delivery.");
T.say("Change the two delivery options. Near for ten cedis, and far for twenty five.");
opt('region', 0, 'Near (Accra) - GHS 10');
opt('region', 1, 'Far - GHS 25', 70);
T.say("Each delivery option has its own confirm box. On the near one, the total is the food plus ten.");
L.settings('accra');
set(1, 1, '={{goods}} + 10', 80);
L.closeSettings();
L.msg('accra', '{{bags}} x {{item}}\nFood GHS {{goods}} + delivery GHS 10\nTotal GHS {{total}}', 40);
T.say("And on the far one, the food plus twenty five.");
L.settings('other');
set(1, 1, '={{goods}} + 25', 80);
L.closeSettings();
L.msg('other', '{{bags}} x {{item}}\nFood GHS {{goods}} + delivery GHS 25\nTotal GHS {{total}}', 40);
T.say("Finally, the thank-you message.");
L.msg('ordered', 'Thank you! Your food is on the way. Pay GHS {{total}} on delivery.', 45);
T.say("Tip. You can also make these changes in the List view, if you prefer. Both views change the same menu.");
L.tidy();

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
T.say("You built menus on the Map, with options, questions, conditions, and prices. And you used the samples.");
T.say("And you learned how to put your menu live, for real customers.");
T.say("Now it is your turn. Think of a service for your business, your school, or your church, and build it.");
L.outro("Thank you for watching. Good luck with your USSD service. Powered by SAB-TECH HUB.", '');
