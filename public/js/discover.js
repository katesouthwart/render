$(document).ready(function() {
    const tinderContainer = $('.tinder');
    const allCards = $('.tinder--card');
    const nope = $('#nope');
    const love = $('#love');

    function initCards() {
      const newCards = $('.tinder--card:not(.removed)');

      if (!newCards.length){
        console.log("Out of cards");
        return
      }

      newCards.each(function(index, card) {
        $(card).css('z-index', allCards.length - index);
        $(card).css('transform', 'scale(' + (20 - index) / 20 + ') translateY(-' + 30 * index + 'px)');
        $(card).css('opacity', (10 - index) / 10);
      });

      tinderContainer.addClass('loaded');
    }

    initCards();

    allCards.each(function(index, el) {
      const hammertime = new Hammer(el);

      hammertime.on('pan', function(event) {
        $(el).addClass('moving');
      });

      hammertime.on('pan', function(event) {
        if (event.deltaX === 0) return;
        if (event.center.x === 0 && event.center.y === 0) return;

        tinderContainer.toggleClass('tinder_love', event.deltaX > 0);
        tinderContainer.toggleClass('tinder_nope', event.deltaX < 0);

        const xMulti = event.deltaX * 0.03;
        const yMulti = event.deltaY / 80;
        const rotate = xMulti * yMulti;

        $(event.target).css('transform', 'translate(' + event.deltaX + 'px, ' + event.deltaY + 'px) rotate(' + rotate + 'deg)');
      });

      hammertime.on('panend', function(event) {
        $(el).removeClass('moving');
        tinderContainer.removeClass('tinder_love');
        tinderContainer.removeClass('tinder_nope');

        const moveOutWidth = $('body').width();
        const keep = Math.abs(event.deltaX) < 80 || Math.abs(event.velocityX) < 0.5;

        $(event.target).toggleClass('removed', !keep);

        if (keep) {
          $(event.target).css('transform', '');
        } else {
          const endX = Math.max(Math.abs(event.velocityX) * moveOutWidth, moveOutWidth);
          const toX = event.deltaX > 0 ? endX : -endX;
          const endY = Math.abs(event.velocityY) * moveOutWidth;
          const toY = event.deltaY > 0 ? endY : -endY;
          const xMulti = event.deltaX * 0.03;
          const yMulti = event.deltaY / 80;
          const rotate = xMulti * yMulti;

          $(event.target).css('transform', 'translate(' + toX + 'px, ' + (toY + event.deltaY) + 'px) rotate(' + rotate + 'deg)');

          // swiped to the right - follow
          if(event.deltaX > 0) {
            createButtonListener(true)(event);
          } else {
            // swiped to the left, reject
            createButtonListener(false)(event);
          }


          initCards();
        }
      });
    });

    function createButtonListener(love) {
      return function(event) {
        const cards = $('.tinder--card:not(.removed)');
        const moveOutWidth = $('body').width() * 1.5;
        let choice;

        if (!cards.length) return false;

        const card = cards.first();
        const id = card.data('user-id');

        card.addClass('removed');

        if (love) {
          card.css('transform', 'translate(' + moveOutWidth + 'px, -100px) rotate(-30deg)');
          choice = 'follow';
        } else {
          card.css('transform', 'translate(-' + moveOutWidth + 'px, -100px) rotate(30deg)');
          choice = 'reject';
        }

        initCards();

        event.preventDefault();

        sendUserChoice(choice, id);
      };
    }

    nope.on('click',createButtonListener(false));
    love.on('click', createButtonListener(true));

    function sendUserChoice(choice, id) {
      $.ajax({
        url: `/discover/userchoice`,
        method: "POST",
        data: {
          choice: choice,
          id: id
        },
        success: function(res) {

          if(res.success == true) {
            initCards()
            console.log('success');
          } else {
            console.log('User action failed');
          }
        },
        error: function(err) {
          console.log("Request failed:", err);
        }
      });
    }
  });
