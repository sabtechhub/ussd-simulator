/* Video 3: Test your own server (simple) */
L.intro(3, 'Test your own server', 'If you or your developer already has a USSD server, test it here.',
  "This is video three. If you, or your developer, already made a USSD server, this video shows how to test it. If you do not have one yet, that is fine. You can still watch.");

L.section('Part 1', 'What you need', "First, what do you need?");
T.say("You need the address of your server. It looks like a website address.");
T.say("It is the same address you gave Hubtel or Nalo. Some people call it a callback link.");
T.say("A real-life example. A church in Kumasi has a USSD code for donations. Their developer gives them a link like, h t t p s, church dot com, slash ussd.", "A real-life example. A church in Kumasi has a USSD code for donations. Their developer gives them a link like, h t t p s, church dot com, slash U S S D.");
T.say("In this video, we will use a practice address that comes with the simulator.");

L.section('Part 2', 'Connect it', "Let us connect it. Three small steps.");
T.say("Step one. Under Which menu to test, choose My server.");
T.click('#srcSeg button[data-v=url]').wait(700);
T.say("Step two. A box appears. Paste your server's address in the box.");
T.click('#endpoint').type('#endpoint', 'http://localhost:8090/mock.php', { msPerChar: 60 });
T.say("Step three. Press Check. The simulator sends one test call to your server.");
T.click('#checkBtn').until(() => /Works|Could not|error|format/.test(document.querySelector('#srcNote').textContent)).sleep(200).wait(900);
T.say("Works! That means your server answered correctly. Now press Done.");
T.move('#srcNote', 800);
T.click('#setupDone').wait(500);

L.section('Part 3', 'Try it on the phone', "Now try your server on the phone, like a customer would.");
L.dial();
T.say("This menu now comes from your server. Choose 2, to buy airtime.", "This menu now comes from your server. Choose two, to buy airtime.");
L.reply('2');
T.say("Type an amount. Five.");
L.reply('5');
L.reply('1');
L.ok();
T.say("Every answer came from your server. If something looks wrong, you can see exactly where in the chat on the right.");

L.section('Part 4', 'When something is wrong', "What if something is wrong? The simulator tells you in simple words.");
T.say("Here, we type a wrong address on purpose, and press Check.");
T.click('#setupOpen').sleep(200);
T.click('#endpoint').type('#endpoint', 'http://localhost:1/ussd', { msPerChar: 60 });
T.click('#checkBtn').until(() => /Works|Could not|error|format/.test(document.querySelector('#srcNote').textContent), 25000).sleep(200).wait(600);
T.say("Could not reach it. This usually means the address has a mistake, or the server is switched off. Check the address, and try again.");
T.move('#srcNote', 800);
T.say("Sometimes Check says, error. That means the server was reached, but something inside it broke. Show this to your developer.");
T.say("Let us put the correct address back, and check again.");
T.click('#endpoint').type('#endpoint', 'http://localhost:8090/mock.php', { msPerChar: 50 });
T.click('#checkBtn').until(() => /Works/.test(document.querySelector('#srcNote').textContent)).sleep(200).wait(700);

L.section('Part 5', 'Good habits', "Here are some good testing habits.");
T.say("Try every option in your menu, one by one.");
T.say("Try wrong answers too. For example, letters instead of numbers. A good menu should answer politely.");
T.say("And try a different phone number or network, to test different customers.");
T.move('#msisdn', 700).wait(400).move('#operator', 600);
T.say("You can ignore Advanced settings. They are only for developers with special needs.");
T.move('#advBox summary', 700);
T.click('#setupDone');

L.outro("Well done. You can now test any USSD server in a few clicks. In the next video, we will make our own menu, without any code.",
  'Make your first menu');
