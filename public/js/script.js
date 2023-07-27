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


//Post Like script
$(document).ready(function() {
  $(".like-button").on("click", function(event) {
    event.preventDefault();

    const likeButton = $(this);
    const postId = likeButton.data("post-id");
    const likesCountElement = likeButton.siblings(".likes-count");
    const currentLikesCount = parseInt(likesCountElement.text());
    const alreadyLiked = likeButton.data("already-liked");

    $.ajax({
      url: `/posts/${postId}/like?_=${Date.now()}`,
      method: "PUT",
      success: function(response) {
        const updatedLikesCount = parseInt(response.likes);

        likesCountElement.text(updatedLikesCount);

        likeButton.data("already-liked", !alreadyLiked);

        likeButton.toggleClass("liked");

        const heartIcon = likeButton.find("i.fa-heart");
        if (likeButton.data("already-liked")) {
          heartIcon.removeClass("fa-regular").addClass("fa-solid");
        } else {
          heartIcon.removeClass("fa-solid").addClass("fa-regular");
        }
      },
      error: function(err) {
        console.log(err);
        console.error(err);
      }
    });
  });
});

//Post Save script
$(document).ready(function() {
  $(".save-button").on("click", function(event) {
    event.preventDefault();

    const saveButton = $(this);
    const postId = saveButton.data("post-id");
    const savesCountElement = saveButton.siblings(".saves-count");
    const currentSavesCount = parseInt(savesCountElement.text());
    const alreadySaved = saveButton.data("already-saved");

    $.ajax({
      url: `/posts/${postId}/save?_=${Date.now()}`,
      method: "PUT",
      success: function(response) {
        const updatedSavesCount = parseInt(response.saves);

        savesCountElement.text(updatedSavesCount);

        saveButton.data("already-saved", !alreadySaved);

        saveButton.toggleClass("saved");

        const bookmarkIcon = saveButton.find("i.fa-bookmark");
        if (saveButton.data("already-saved")) {
          bookmarkIcon.removeClass("fa-regular").addClass("fa-solid");
        } else {
          bookmarkIcon.removeClass("fa-solid").addClass("fa-regular");
        }
      },
      error: function(err) {
        console.log(err);
        console.error(err);
      }
    });
  });
});

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

//Comment Delete script
function deleteComment(commentId) {
  fetch(`/comments/${commentId}/delete`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);

    window.location.reload();

  })
  .catch(error => console.error(error));
}

// Handle rating form submission
$(document).ready(function () {
  $('.rating input[type="radio"]').on('change', function () {
    const rating = $(this).val();
    const postId = window.location.pathname.split('/').pop();

    $.ajax({
      type: 'POST',
      url: `/posts/${postId}/rate`,
      data: { rating: rating },
      dataType: 'json',
      success: function (response) {
        alert('Rating submitted successfully.');
      },
      error: function (error) {
        alert('An error occurred while submitting the rating.');
        console.log(error);
      }
    });
  });
});

//Rounded ratings
document.addEventListener('DOMContentLoaded', function() {

  var roundedRating = window.roundedRating;


  for (var i = 1; i <= 5; i++) {
    var starElement = document.querySelector('.star-' + i);
    if (i <= roundedRating) {
      starElement.classList.remove('far');
      starElement.classList.add('fas');
    } else {
      starElement.classList.remove('fas');
      starElement.classList.add('far');
    }
  }
});

//Individual rating display on comments
document.addEventListener('DOMContentLoaded', function() {

  var individualRating = window.individualRating;


  for (var i = 1; i <= 5; i++) {
    var starElement = document.querySelector('.star-' + i);
    if (i <= roundedRating) {
      starElement.classList.remove('far');
      starElement.classList.add('fas');
    } else {
      starElement.classList.remove('fas');
      starElement.classList.add('far');
    }
  }
});
