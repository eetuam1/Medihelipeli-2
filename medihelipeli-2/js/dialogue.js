// DIALOGUE POPUP
function dialoguePopup() {

  const dialogueOverlay = document.createElement('div');
  dialogueOverlay.id = 'dialogue-overlay';

  // Create a game over popup container
  const dialogueContainer = document.createElement('div');
  dialogueContainer.classList.add('dialogue-container');
  dialogueContainer.id = 'dialogue-div';

  // Create game over popup content
  const dialogueContent = document.createElement('div');
  dialogueContent.classList.add('dialogue-content');

  const dialogueImg = document.createElement('img');
  dialogueImg.id = 'dialogue-img';
  dialogueImg.classList.add('dialogue-img');
  dialogueImg.src = 'img/dispatcher1.png';

  dialogueContent.appendChild(dialogueImg);

  // Add game over popup content to the container
  dialogueContainer.appendChild(dialogueContent);

  // Append the dialogue popup container to the body
  document.body.appendChild(dialogueContainer);

  // Show the dialogue popup
  setTimeout(function() {
    $('#dialogue-div').fadeIn('fast');
  }, 400);


  var image = document.getElementById('dialogue-img');

  image.addEventListener('click', startDialogue);
}

// Function to change img in start dialogue
function startDialogue() {

  var dialogueImg = document.getElementById('dialogue-img');

  // Dialogue img sources
  if (dialogueImg.src.endsWith('img/dispatcher1.png')) {
    dialogueImg.src = 'img/mascot1.png';
  } else if (dialogueImg.src.endsWith('img/mascot1.png')) {
    dialogueImg.src = 'img/dispatcher2.png';
  }  else if (dialogueImg.src.endsWith('img/dispatcher2.png')) {
    dialogueImg.src = 'img/dispatcher3.png';
  } else if (dialogueImg.src.endsWith('img/dispatcher3.png')) {
    dialogueImg.src = 'img/mascot2.png';
  } else if (dialogueImg.src.endsWith('img/mascot2.png')) {
    dialogueImg.src = 'img/dispatcher4.png';
  } else {
    setTimeout(function() {
      $('#dialogue-div').fadeOut('fast');
    }, 1000);
  }
}
