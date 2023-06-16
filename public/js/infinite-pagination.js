function loadNextPage() {
  const currentPage = parseInt($("#currentPage").val());
  const nextPage = currentPage + 1;

  $.ajax({
    url: window.location.pathname,
    type: "GET",
    data: { page: nextPage },
    success: function(data) {
      const $newPosts = $(data).find('.profile-post'); // Get only the new posts

            // Append the newly fetched posts to the timeline
            if ($newPosts.length > 0) {
              $newPosts.appendTo("#posts-container");
              // Update the current page value
              $("#currentPage").val(nextPage);
            } else {
              $('.no-more-posts').removeClass('d-none');
            }

          },
    error: function(xhr, status, error) {
      console.error(error);
    }
  });
}

$(document).ready(function() {
  const options = {
   root: null,
   rootMargin: '0px',
   threshold: 0
 };

 const observer = new IntersectionObserver(function(entries, observer) {
   entries.forEach(function(entry) {
     if (entry.isIntersecting) {
       loadNextPage();
     }
   });
 }, options);

 const targetElement = document.querySelector('.load-more-posts');
 observer.observe(targetElement);
});
