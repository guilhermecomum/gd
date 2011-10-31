/* Copyright (C) 2011 Governo do Estado do Rio Grande do Sul
 *
 *   Author: Lincoln de Sousa <lincoln@gg.rs.gov.br>
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

$(function () {
    /* Binding the click of the `control' links to an ajax get instead
     * of letting the whole page redirect/update. */
    function updateToAjax () {
        var $a = $(this);
        $.getJSON($(this).attr('href'), function (data) {
            if (data.status === 'ok') {
                $a
                    .parent() // div.controls
                    .parent() // li
                    .remove();
            }
        });
        return false;
    }
    $('div.controls a').click(updateToAjax);

    /* Creates a new instance of the buzz machinery that automatically
     * updates the buzz list. */
    function updateBuzz(msg, show) {
        if (show) {
            var $el = $(tmpl("buzzTemplate", msg));
            $('div.controls a', $el).click(updateToAjax);
            $('.listing').prepend($el);
        }
    }

    new Buzz(SIO_BASE, {
        new_buzz: function (msg) {
            // We'll do nothing if the user is located in the `accepted
            // buzz' page.
            updateBuzz(msg, location.search.indexOf('accepted') < 0);
        },

        buzz_accepted: function (msg) {
            updateBuzz(msg, location.search.indexOf('accepted') >= 0);
        }
    });
});