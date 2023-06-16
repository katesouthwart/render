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
