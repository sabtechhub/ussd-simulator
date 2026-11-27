/* Video 9: Ready-made samples and saving (simple) */
L.intro(9, 'Ready-made samples and saving', 'Start from one of 30 ready menus, and keep your work safe.',
  "This is video nine. You do not always have to start from nothing. There are thirty ready-made menus you can load, try and change. We will also learn how to keep your work safe.");

L.section('Part 1', 'Open the samples', "Open the Menu builder, then the File menu.");
L.page('builder');
T.click('.file-menu:not(.var-menu) summary').sleep(200).wait(500);
T.say("Choose, Load a sample.");
T.click('#bSamples').sleep(400).wait(800);
T.say("There are thirty samples, from very easy, to more advanced.");
T.scroll('.smp-list', 1100, 2600).wait(500).scroll('.smp-list', 2300, 2400).wait(500).scroll('.smp-list', 0, 1500);
T.say("They are real-life examples. Airtime top-up, data bundles, school fees, bill payment, sending money, loans, hotel bookings, and many more.");

L.section('Part 2', 'Find and load one', "Type in the search box to find one. Let us look for a loan calculator.");
T.click('.smp-search').type('.smp-search', 'loan', { msPerChar: 160 }).wait(800);
T.say("Click it to load it.");
T.click(() => [...document.querySelectorAll('.smp-item')].find(b => !b.hidden)).sleep(400).wait(600);
T.say("Here it is, on the Map. A loan menu for a small finance company.");
L.onMap();
L.tidy();
T.say("It asks for the amount, and how many months. Then it works out the interest, and the monthly payment.");
T.move(L.N('amount'), 800).wait(300).move(L.N('months'), 700).wait(300).move(L.N('offer'), 700);
T.say("Follow the arrows, and you understand the whole menu, without reading any code.");

L.section('Part 3', 'Make it yours on the Map', "Now let us change it into our own service, right on the Map.");
T.say("Our company charges four percent a month, not five. First, change the offer message. Click it, and type.");
L.msg('offer', 'Loan GHS {{amount}} for {{months}} months\nInterest (4%/month): GHS {{interest}}\nPay GHS {{monthly}} per month', 40);
T.say("The maths is in the box's settings. Click the settings button.");
L.settings('offer');
T.say("Interest is the amount, times zero point zero five, times the months. Change zero point zero five, to zero point zero four.");
T.click(L.pSet(0, 1)).type(L.pSet(0, 1), '={{amount}} * 0.04 * {{months}}', { msPerChar: 70 });
L.closeSettings();
T.say("You can change the limits in the same way. Open the amount box's settings, and change its condition.");
L.settings('amount');
T.move(L.pRule(0, 'value'), 900).wait(800);
L.closeSettings();

L.section('Part 4', 'Try it', "Let us try it. Borrow one thousand cedis, for six months.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(600);
L.reply('1000');
L.reply('6');
T.say("With our new rate, the interest is two hundred and forty cedis, and the monthly payment is about two hundred and seven cedis. All worked out for us.");
T.wait(1000);
L.reply('1');
L.ok();
T.say("So, with a sample and the Map, you can have your own service in minutes.");

L.section('Part 5', 'Keep your work safe', "Now, saving.");
L.page('builder');
T.say("Your work saves by itself in this browser. The green dot next to Save means it is saved.");
T.move('#saveState', 900);
T.say("To keep a copy, for example to send to a friend or use on another computer, choose File, then Save to file.");
T.click('.file-menu:not(.var-menu) summary').sleep(200).move('#bExport', 800).wait(1000);
T.say("To bring it back later, choose File, then Open file, and pick the file.");
T.move('#bImport', 700).wait(800);

L.section('Part 6', 'Start a new menu', "To start a brand new menu, choose Start over.");
T.click('#bReset').sleep(350).wait(900);
T.say("It asks first, because it clears everything. Save to file first, if you want to keep your menu.");
T.click('.dlg-ok').sleep(300).wait(600);
L.onMap();
T.say("Now the Map has just one empty box, main. Ready for your next idea.");
T.move(L.N('main'), 900).wait(600);

L.outro("Well done. You can now use ready-made samples, and keep your work safe. In the next video, we will put your menu live, so real customers can use it.",
  'Put your menu live');
