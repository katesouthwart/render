//Auth modal
const failedAuth = new Event("failedAuth");
const redirectField = $('#redirectUrlField');

document.addEventListener("failedAuth", () => {
  $('#failed-auth-modal').modal('show');
});

if(redirectField) {
  redirectField.val(window.location.pathname);
}


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
      success: function(res) {

        if ("authed" in res && res.authed == false) {
          document.dispatchEvent(failedAuth)
          return;
        }

        const updatedLikesCount = parseInt(res.likes);

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
      success: function(res) {

        if ("authed" in res && res.authed == false) {
          document.dispatchEvent(failedAuth)
          return;
        }

        const updatedSavesCount = parseInt(res.saves);

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
      success: function (res) {

        if ("authed" in res && res.authed == false) {
          document.dispatchEvent(failedAuth)
          return;
        }

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

//Follow button script
$(document).ready(function() {
  console.log("Document ready");

  const followForm = $("#followForm");
  console.log(followForm);

  followForm.on("submit", function(event) {
    event.preventDefault();

    const followButton = $("#followButton");
    const userId = followButton.data("user-id");
    const alreadyFollowed = followButton.data("already-followed");
    const alreadyRequested = followButton.data("already-requested");

    $.ajax({
      url: `/users/${userId}/follow?_=${Date.now()}`,
      method: "POST",
      success: function(res) {

        if ("authed" in res && res.authed == false) {
          document.dispatchEvent(failedAuth)
          return;
        }

        if(res.success = true) {
          followButton.text(res.buttonText).addClass(res.classes).removeClass(res.removeClasses);
        }

      },
      error: function(err) {
        console.log("Follow request failed:", err);
      }
    });

  });
});

//User Delete script
function deleteUser(userId) {
  $.ajax({
    url: `/users/${userId}/delete`,
    method: "DELETE",
    success: function(res) {

      const homeUrl = '/';

      if(res.success = true) {
        window.location.href = homeUrl;
      } else {
        alert('Could not delete user, please try again.');
      }
    },
    error: function(err) {
      console.log("Follow request failed:", err);
    }
  });
}

//user register password
function checkPassword() {
  console.log('sending');
  const password = $('#password').val();

  $.ajax({
    url: `/auth/checkpassword`,
    method: "POST",
    data: {
      password: password,
    },
    success: function(res) {
      console.log(res);
      if(res.success == true) {
        $('#password-failure').removeClass('d-inline').addClass('d-none');
        $('#upassword-success').removeClass('d-none').addClass('d-inline');
        $('#saveUserButton').removeClass('btn-outline-disabled').addClass('btn-primary').prop("disabled", false);
        $('#registerButton').removeClass('btn-outline-disabled').addClass('btn-primary').prop("disabled", false);
      } else {
        $('#password-success').removeClass('d-inline').addClass('d-none');
        $('#password-failure').removeClass('d-none').addClass('d-inline');
        $('#saveUserButton').removeClass('btn-primary').addClass('btn-outline-disabled').prop("disabled", true);
        $('#registerButton').removeClass('btn-primary').addClass('btn-outline-disabled').prop("disabled", true);
      }
    },
    error: function(err) {
      console.log("Error updating password:", err);
    }
  });
}

// user change Password
function userChangePassword(userId) {
  const oldPassword = $('#oldPassword').val();
  const newPasswordOne = $('#newPasswordOne').val();
  const newPasswordTwo = $('#newPasswordTwo').val();

  $.ajax({
    url: `/auth/${userId}/changepassword`,
    method: "POST",
    data: {
      newPasswordOne: newPasswordOne,
      newPasswordTwo: newPasswordTwo,
      oldPassword: oldPassword
    },
    success: function(res) {
      if(res.success == true) {
        $('#change-password-modal').modal('hide');
        $('#password-failure-alert').removeClass('d-block').addClass('d-none');
        $('#password-success-alert').removeClass('d-none').addClass('d-block');
      } else {
        $('#change-password-modal').modal('hide');
        $('#password-failure-alert').removeClass('d-none').addClass('d-block').text(res.message);
      }
    },
    error: function(err) {
      console.log("Error updating password:", err);
    }
  });
}

// user change Username
function userChangeUsername() {
  console.log('sending');
  const username = $('#username').val();

  $.ajax({
    url: `/auth/checkusername`,
    method: "POST",
    data: {
      username: username,
    },
    success: function(res) {
      console.log(res);
      if(res.success == true) {
        $('#username-change-failure').removeClass('d-inline').addClass('d-none');
        $('#username-change-success').removeClass('d-none').addClass('d-inline');
        $('#saveUserButton').removeClass('btn-outline-disabled').addClass('btn-primary').prop("disabled", false);
        $('#registerButton').removeClass('btn-outline-disabled').addClass('btn-primary').prop("disabled", false);
      } else {
        $('#username-change-success').removeClass('d-inline').addClass('d-none');
        $('#username-change-failure').removeClass('d-none').addClass('d-inline');
        $('#saveUserButton').removeClass('btn-primary').addClass('btn-outline-disabled').prop("disabled", true);
        $('#registerButton').removeClass('btn-primary').addClass('btn-outline-disabled').prop("disabled", true);
      }
    },
    error: function(err) {
      console.log("Error updating username:", err);
    }
  });
}

//lowercase email
$(document).ready(function() {
  $('#email').on("focusout", function() {
    const email = $('#email').val();
    const lowercaseEmail = email.toLowerCase();

    $("#email").val(lowercaseEmail);
  })
});
