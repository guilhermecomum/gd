/* Copyright (C) 2011 Governo do Estado do Rio Grande do Sul
 *
 *   Author: Lincoln de Sousa <lincoln@gg.rs.gov.br>
 *   Author: Thiago Silva <thiago@metareload.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

$(function() {
    // Toggles the buzz filter status to on/off.
    //
    // Control var that holds the state of the filter button. Set it to
    // true to show moderated buzz and false for the public messages.
    var filterState = false;
    $('a.filter').click(function() {
        var url = CURRENT_URL + (
            filterState ? '/moderated_buzz' : '/public_buzz');
        filterState = !filterState;
        if (filterState) {
            $(this).addClass('off');
        } else {
            $(this).removeClass('off');
        }
        $.getJSON(url, function (data) {
            var $root = $('#buzz');
            $root.html('');
            $(data).each(function (index, item) {
                $(tmpl('buzzTemplate', item)).appendTo($root);
            });
        });
    });


    /** Shows a tooltip of an element with manual control of show/hide
     *  operations */
    function showTooltip(elementOrSelector) {
        if (typeof elementOrSelector === 'string') {
            $element = $(elementOrSelector);
        } else {
            $element = elementOrSelector;
        }

        var $tooltip = $element.tooltip({
            effect: "fade",
            delay: 4200,
            opacity: 0.7,
            events: {
                input: 'customOpenEvent,customOpenEvent'
            }
        });
        $element.trigger('customOpenEvent');
        return $tooltip;
    }


    /** Posts a new notice on the message buzz */
    function postNotice(message) {
        var params = { aid: $('#aid').val(), message: message };
        $.post(url_for('buzz.post'), params, function (data) {
            var parsedData = $.parseJSON(data);
            if (parsedData.status !== 'ok') {
                // For any reason, the user got loged out, so, as it's
                // an async call, we have to request login credentials
                // again. It's not actually usual to happen but better
                // being safe than sorry.
                if (parsedData.code === 'NobodyHome') {
                    auth.showLoginForm({
                        success: function (userData) {
                            postNotice(message);
                        }
                    });
                    return;
                } else {
                    // Feedback the user. something wrong happened.
                    showTooltip(
                        $("#internal_chat textarea")
                            .attr('title', parsedData.msg));
                }
            } else {
                // Everything' fine, let's just clear the message box
                // and thank the user
                var $textbox = $("#internal_chat textarea")
                    .val('')
                    .attr('title', parsedData.msg);
                showTooltip($textbox);

                window.setTimeout(function () {
                    $textbox.attr('title', '');
                }, 10000);
            }
        });
    }


    $('#internal_chat').submit(function () {
        var $form = $(this);
        var $field = $('textarea', $form);
        var aid = $('#aid').val();
        var data = $.trim($field.val());

        // None received in the form. We cannot process this
        // request. Just feedback the user.
        if (data === '') {
            $field.addClass('error');
            return false;
        }

        // Just making sure that the user will not be confused by any
        // old error report.
        $field.removeClass('error');

        // Not authenticated users must access the login form
        if (!auth.isAuthenticated()) {
            auth.showLoginForm({
                success: function (userData) {
                    postNotice(data);
                }
            });
        } else {
            // Time to send the request to the server
            postNotice(data);
        }
        return false;
    });

    $('a.filter').tooltip({ opacity: 0.7 });

    // Starts a new instance of the buzz stream

    function updateBuzz(msg, show) {
        if (show) {
            var $el = $(tmpl("buzzTemplate", msg));
            $('#buzz').prepend($el);
        }
    }

    new Buzz(SIO_BASE, {
        new_buzz: function (msg) {
            updateBuzz(msg, filterState);
        },

        buzz_accepted: function (msg) {
            updateBuzz(msg, !filterState);
        }
    });

    // Initializing "how it works" stuff
    audience_how_it_works_spinning_gears_setup();

    $('img[rel]').overlay({
        oneInstance: false,
        speed: 'fast',
        top: '30%',
        mask: {
            color: '#111',
            opacity: 0.7
        },

        onLoad: function () {
            if ($(this.getOverlay()).data('firstRun') === undefined) {
                audience_show_how_it_works();
                $(this.getOverlay()).data('firstRun', 1);
            }
        }
    });
});


function audience_how_it_works_spinning_gears_setup() {
  var big_gear = $("#how-it-works-big-gear");
  var small_gear = $("#how-it-works-small-gear");
  var how_it_works = $("#how-it-works");
  var interval = 13;

  big_gear.data("angle",0);
  small_gear.data("angle",0);

  var timer = new Timer(interval);
  timer.then(function(timer,accel) {
    var big_current_angle = big_gear.data("angle");
    var small_current_angle = small_gear.data("angle");

    var big_angle = (big_current_angle + (Math.log(accel+2))) % 360;
    var small_angle = (small_current_angle - (Math.log(accel+2))) % 360;

    big_gear.data("angle",big_angle);
    small_gear.data("angle",small_angle);

    big_gear.rotate(big_angle);
    small_gear.rotate(small_angle);

    if (accel == 0) timer.stop();
  });

  var accel = 0;
  var max_accel = 100;
  how_it_works.hover(
    function() {
      timer.stepper(function() {
        if (accel < max_accel) accel++;
        return accel;
      });
      if (!timer.isRunning()) timer.run();
    },
    function() {
      timer.stepper(function() {
        if (accel > 0) accel--;
        return accel;
      });
    });
}


function audience_show_how_it_works() {

  // lots of inicialization vars...

  var couple = $(".step-1-couple");
  var mail = $(".step-1-mail");
  var trail = $(".step-1-mail-trail");

  big_gear = $(".step-2-big-gear");
  small_gear = $(".step-2-small-gear");

  big_gear.data("angle",0);
  small_gear.data("angle",0);

  var step_2 = $(".step-2");

  var gentleman = $(".mustache-gentleman");
  var step_3_text = $(".step-3 p");
  var dialog = $(".mustache-gentleman-dialog");


  //the function to spin the step-2 gears
  //TODO: when the how-it-works dialog closes
  //      stop this interval
  var spinning_gears = null;
  function spin_gears() {
      spinning_gears = setInterval(function() {
      var big_angle = (big_gear.data("angle")+1) % 360;
      var small_angle = (small_gear.data("angle")-1) % 360;

      big_gear.data("angle",big_angle);
      small_gear.data("angle",small_angle);

      big_gear.rotate(big_angle);
      small_gear.rotate(small_angle);
      }, 13);
    }

  //the function to show the dialog in step-3

  // the animation...

  var timer = new Timer();

  timer.then(function(timer, step) {   /* step 1 */
    var opacity = step * 4 / 100.0;
    if (opacity > 1) opacity = 1;
    couple.css("opacity", opacity);
    if (opacity == 1) timer.next();

  }).then(function(timer,step) {
    var left = parseInt(mail.css("left"))+1;
    mail.css("left", left+"px");

    var opacity = parseFloat(mail.css("opacity")) + 0.05;
    if (opacity > 1) opacity = 1;

    mail.css("opacity", opacity);
    trail.css("opacity", opacity/2);

    if (left == 0) timer.next();
  }).then(function(timer) { /* step 2 */
    if (!spinning_gears) spin_gears();

    var opacity = parseFloat(step_2.css("opacity")) + 0.05;
    if (opacity > 1) opacity = 1;
    step_2.css("opacity", opacity);

    if (opacity == 1) timer.next();
  }).then(function(timer) { /* step 3 */
    var opacity = parseFloat(gentleman.css("opacity")) + 0.05;
    if (opacity > 1) opacity = 1;
    gentleman.css("opacity", opacity);
    step_3_text.css("opacity", opacity);
    dialog.css("opacity",opacity);
    if (opacity == 1) timer.next();

    if (!dialog.is(":visible")) {
      dialog.animate({
        width: 'toggle'
      }, 1000, 'swing');
    }
  });

  timer.run();
}