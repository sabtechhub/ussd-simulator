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
T.click('#bView button[data-v=map]').sleep(300).click('#bTidy').sleep(300).wait(1200);
T.say("It asks for the amount, and how many months. Then it works out the interest, and the monthly payment.");
T.move('#bmap .node[data-id=amount]', 800).wait(300).move('#bmap .node[data-id=months]', 700).wait(300).move('#bmap .node[data-id=offer]', 700);

L.section('Part 3', 'Try it', "Let us try it. Borrow one thousand cedis, for six months.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(600);
L.reply('1000');
L.reply('6');
T.say("The menu shows the interest, three hundred cedis, and the monthly payment, about two hundred and seventeen cedis. All worked out for us.");
T.wait(1000);
L.reply('1');
L.ok();
T.say("Now you can change it into your own service. Change the words, the limits, or the interest rate.");

L.section('Part 4', 'Keep your work safe', "Now, saving.");
L.page('builder');
T.say("Your work saves by itself in this browser. The green dot next to Save means it is saved.");
T.move('#saveState', 900);
T.say("To keep a copy, for example to send to a friend or use on another computer, choose File, then Save to file.");
T.click('.file-menu:not(.var-menu) summary').sleep(200).move('#bExport', 800).wait(1000);
T.say("To bring it back later, choose File, then Open file, and pick the file.");
T.move('#bImport', 700).wait(800);

L.section('Part 5', 'Start a new menu', "To start a brand new menu, choose Start over.");
T.click('#bReset').sleep(350).wait(900);
T.say("It asks first, because it clears everything. Save to file first, if you want to keep your menu.");
T.click('.dlg-ok').sleep(300).wait(600);
T.say("Now we have a clean, empty menu. Ready for your next idea.");
T.click('#bView button[data-v=list]').sleep(300).wait(800);

L.outro("Well done. You can now use ready-made samples, and keep your work safe. In the next video, we will put your menu live, so real customers can use it.",
  'Put your menu live');
