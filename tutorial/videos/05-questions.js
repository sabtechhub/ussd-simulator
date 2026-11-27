/* Video 5: Ask questions, on the Map */
L.loadFlow({ name: 'Susu Group', start: 'main', screens: [
  { id: 'main', type: 'menu', text: 'Welcome to our Susu group', options: [{ key: '1', label: 'Join the group', next: 'name' }, { key: '0', label: 'Exit', next: 'bye' }] },
  { id: 'name', type: 'end', text: '' },
  { id: 'bye', type: 'end', text: 'Goodbye!' }] });
L.intro(5, 'Ask questions', 'Let customers type their name, age or email, and check the answers.',
  "This is video five. Sometimes you need the customer to type something, like their name. In this video, you will ask questions on the Map.");

L.section('Part 1', 'Our example', "Here is our real-life example.");
T.say("A savings group, sometimes called a susu group, wants new members to join by USSD.");
T.say("We will ask three things. Name, age, and email.");
L.page('builder');
L.onMap();
L.tidy();
T.say("We started the menu for you. Join the group, leads to a box called name. It is still empty.");
T.move(L.N('name'), 900);

L.section('Part 2', 'Ask for the name', "Let us turn it into a question.");
T.say("Change the box's kind to Question. It turns orange.");
L.kind('name', 'input');
L.msg('name', 'Enter your full name:', 80);
T.say("A question box has a dot called then. It says where to go after the customer answers.");
T.move(L.lastPort('name'), 900);
T.say("Drag it to an empty space, to make the next question. Make it a Question, called age.");
L.newScreen('name', L.lastPort('name'));
L.kind('new_screen', 'input');
L.name('new_screen', 'age');
L.msg('age', 'Enter your age:', 80);
T.say("Do the same once more, for the email.");
L.newScreen('age', L.lastPort('age'));
L.kind('new_screen', 'input');
L.name('new_screen', 'email');
L.msg('email', 'Enter your email address:', 70);
L.tidy();

L.section('Part 3', 'Check the answers', "What if a customer types the wrong thing? We can check it.");
T.say("Click the small settings button on the name box. All its settings open beside the map.");
L.settings('name');
T.say("Accept, says what kind of answer is allowed. A name should have letters only. Choose Text, no digits.");
T.pick(`${L.P} .more .two select`, 'text').wait(500);
T.say("If the answer is wrong, this message is shown. Write a friendly one.");
T.click(`${L.P} .more > input`).type(`${L.P} .more > input`, 'Please type your name using letters only.', { msPerChar: 50 });
T.say("Now click the age box's settings, and accept a number.");
L.settings('age');
T.pick(`${L.P} .more .two select`, 'number').wait(500);
T.say("And for the email box, accept an email address.");
L.settings('email');
T.pick(`${L.P} .more .two select`, 'email').wait(500);
L.closeSettings();

L.section('Part 4', 'Use the answers', "Now, a thank-you message that uses the answers.");
T.say("Drag the email box's dot to an empty space. This last box ends the session.");
L.newScreen('email', L.lastPort('email'));
L.name('new_screen', 'done');
T.say("Every answer is saved under the box's name. To show it, write the name between double curly brackets.");
L.msg('done', 'Welcome {{name}}! Age {{age}}, email {{email}}.', 55);
L.tidy();
T.say("Now the map shows the whole sign-up. Name, then age, then email, then thank you.");

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

L.outro("Well done. You can now ask questions and check the answers. In the next video, we will send customers to different boxes, depending on what they type.",
  'Make decisions with conditions');
