/* Video 5: Ask questions (simple) */
L.loadFlow({ name: 'Susu Group', start: 'main', screens: [
  { id: 'main', type: 'menu', text: 'Welcome to our Susu group', options: [{ key: '1', label: 'Join the group', next: 'name' }, { key: '0', label: 'Exit', next: 'bye' }] },
  { id: 'name', type: 'end', text: '' },
  { id: 'bye', type: 'end', text: 'Goodbye!' }] });
L.intro(5, 'Ask questions', 'Let customers type their name, age or email, and check the answers.',
  "This is video five. Sometimes you need the customer to type something, like their name. In this video, you will learn how to ask questions.");

L.section('Part 1', 'Our example', "Here is our real-life example.");
T.say("A savings group, sometimes called a susu group, wants new members to join by USSD.");
T.say("We will ask three things. Your name. Your age. And your email.");
T.say("We have started the menu for you. Option one, Join the group, goes to a screen called name. It is still empty.");
L.page('builder');
T.move('.scr[data-id=name]', 900);

L.section('Part 2', 'Ask for the name', "Let us turn it into a question.");
T.say("Change this screen to Question.");
T.pick('.scr[data-id=name] .sh select', 'input').sleep(250);
T.say("Type the question.");
T.click('.scr[data-id=name] textarea').type('.scr[data-id=name] textarea', 'Enter your full name:', { msPerChar: 80 });
T.say("Then choose where to go next. We need another question, so choose New screen.");
T.pick('.scr[data-id=name] .then-row select', '__new__').sleep(250);
T.pick('.scr[data-id=new_screen] .sh select', 'input').sleep(250);
T.click('.scr[data-id=new_screen] .sh input').type('.scr[data-id=new_screen] .sh input', 'age', { change: true, msPerChar: 140 }).sleep(250);
T.click('.scr[data-id=age] textarea').type('.scr[data-id=age] textarea', 'Enter your age:', { msPerChar: 80 });
T.say("Now we have two questions. Name, then age.");

L.section('Part 3', 'Check the answers', "What if a customer types the wrong thing? We can check it.");
T.say("Click More, on the name question.");
T.click('.scr[data-id=name] details.more summary').sleep(200).wait(500);
T.say("Accept, says what kind of answer is allowed. A name should have letters only. Choose Text, no digits.");
T.pick('.scr[data-id=name] .more .two select', 'text').wait(500);
T.say("If the answer is wrong, this message is shown. Let us write a friendly one.");
T.click('.scr[data-id=name] .more > input').type('.scr[data-id=name] .more > input', 'Please type your name using letters only.', { msPerChar: 50 });
T.say("For the age, accept a number only.");
T.click('.scr[data-id=age] details.more summary').sleep(200);
T.pick('.scr[data-id=age] .more .two select', 'number').wait(500);
T.say("One more question, for the email. Accept, email address.");
T.pick('.scr[data-id=age] .then-row select', '__new__').sleep(250);
T.pick('.scr[data-id=new_screen] .sh select', 'input').sleep(250);
T.click('.scr[data-id=new_screen] .sh input').type('.scr[data-id=new_screen] .sh input', 'email', { change: true, msPerChar: 130 }).sleep(250);
T.click('.scr[data-id=email] textarea').type('.scr[data-id=email] textarea', 'Enter your email address:', { msPerChar: 70 });
T.click('.scr[data-id=email] details.more summary').sleep(200);
T.pick('.scr[data-id=email] .more .two select', 'email').wait(500);

L.section('Part 4', 'Use the answers', "Now, a thank-you message that uses the answers.");
T.say("Every answer is saved under the screen's name. To show it, write the name between double curly brackets.", "Every answer is saved under the screen's name. To show it, write the name between double curly brackets.");
T.pick('.scr[data-id=email] .then-row select', '__new__').sleep(250);
T.click('.scr[data-id=new_screen] .sh input').type('.scr[data-id=new_screen] .sh input', 'done', { change: true, msPerChar: 130 }).sleep(250);
T.click('.scr[data-id=done] textarea').type('.scr[data-id=done] textarea', 'Welcome {{name}}! Age {{age}}, email {{email}}.', { msPerChar: 55 });
T.say("When the customer sees this, the names in brackets become their real answers.");

L.section('Part 5', 'Test it', "Let us test it. We will make some mistakes on purpose.");
T.click('#bRun').until(L.dialogReady).sleep(300).wait(800);
T.say("Choose 1, to join.", "Choose one, to join.");
L.reply('1');
T.say("For the name, we type a number by mistake.");
L.reply('Ama 2');
T.say("See? Our friendly message appears, and it asks again. Now type the name correctly.");
L.reply('Ama Mensah', 90);
T.say("For the age, type letters by mistake. It asks again. Then type 25.", "For the age, type letters by mistake. It asks again. Then type twenty five.");
L.reply('twenty');
L.reply('25');
T.say("And the email.");
L.reply('ama@example.com', 80);
T.say("The thank-you message shows all three answers. Our susu group sign-up works.");
T.wait(1200);
L.ok();

L.outro("Well done. You can now ask questions and check the answers. In the next video, we will send customers to different screens, depending on what they type.",
  'Make decisions with conditions');
