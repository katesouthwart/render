//Post Create Page
let addIngredientBtn = document.getElementById('addIngredientBtn');
let ingredientList = document.querySelector('.ingredientList');
let ingredientDiv = document.querySelectorAll('.ingredientDiv')[0];

if (addIngredientBtn) {
  addIngredientBtn.addEventListener('click', function(){
  let newIngredient = ingredientDiv.cloneNode(true);
  let input = newIngredient.getElementsByTagName('input')[0];
  input.value = '';
  ingredientList.appendChild(newIngredient);
});


let addInstructionBtn = document.getElementById('addInstructionBtn');
let instructionList = document.querySelector('.instructionList');
let instructionDiv = document.querySelectorAll('.instructionDiv')[0];

addInstructionBtn.addEventListener('click', function(){
  let newInstruction = instructionDiv.cloneNode(true);
  let input = newInstruction.getElementsByTagName('input')[0];
  input.value = '';
  instructionList.appendChild(newInstruction);
});
}


//Post Delete script
function deletePost(postId) {
  fetch(`/posts/${postId}/delete`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    const currentUrl = window.location.href;
    const timelineUrl = '/posts/timeline/all';

    if (currentUrl.includes(timelineUrl)) {
      location.reload();
    } else {
      window.location.href = timelineUrl;
    }
  })
  .catch(error => console.error(error));
}
