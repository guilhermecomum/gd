# Copyright (C) 2011  Governo do Estado do Rio Grande do Sul
#
#   Author: Lincoln de Sousa <lincoln@gg.rs.gov.br>
#   Author: Rodrigo Sebastiao da Rosa <rodrigo-rosa@procergs.rs.gov.br>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

"""Module that uses the Template and Model APIs to build the Audience web
interface.
"""

from flask import Blueprint, render_template, request, abort, redirect
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy import desc

from gd.model import Audience, Term, get_or_404
from gd.utils import dumps
from gd.content.wp import wordpress


audience = Blueprint(
    'audience', __name__,
    template_folder='templates',
    static_folder='static')


@audience.route('/')
def index():
    """Returns the last published audience page"""
    try:
        inst = Audience.query \
            .filter_by(visible=True) \
            .order_by(desc('date')).first()
        return audience_details(inst.id)
    except (AttributeError, NoResultFound):
        abort(404)


@audience.route('/<int:aid>')
def audience_details(aid):
    """Renders an audience with its public template"""
    inst = get_or_404(Audience, id=aid, visible=True)
    how_to = wordpress.getPageByPath('how-to-use-governo-escuta')
    return render_template(
        'audience.html',
        audience=inst,
        how_to=getattr(how_to, 'content', ''),
        notice=inst.get_last_published_notice(),
    )

@audience.route('/<int:aid>/buzz_stream', methods=('POST',))
def buzz_stream(aid):
    """public_buzz, moderated_buzz, selected_buzz, last_published at once
    filtred by from_id, selected_ids, moderated_ids and last_published_id"""
    public_limit = int(request.values.get('public_limit'))
    public_ids = request.values.getlist('public_ids[]')
    moderated_ids = request.values.getlist('moderated_ids[]')
    selected_ids = request.values.getlist('selected_ids[]')
    last_published_id = int(request.values.get('last_published_id', 0))

    public = Audience.query.get(aid).get_public_buzz(0,public_limit,public_ids)

    moderated = Audience.query.get(aid).get_moderated_buzz(moderated_ids)
    selected = Audience.query.get(aid).get_selected_buzz(selected_ids)
    published = Audience.get(aid).get_last_published_notice()

    buzz = {'public': [notice.to_dict() for notice in public],
            'moderated': [notice.to_dict() for notice in moderated],
            'selected': [notice.to_dict() for notice in selected],
            'published': published and published.id != last_published_id \
            and published.to_dict() or None}
    return dumps(buzz)

@audience.route('/<int:aid>/public_buzz')
def public_buzz(aid):
    """Returns the public buzz of an audience in JSON format"""
    buzz = Audience.query.get(aid).get_public_buzz(0, 10)
    return dumps([notice.to_dict() for notice in buzz])


@audience.route('/<int:aid>/moderated_buzz')
def moderated_buzz(aid):
    """Returns the moderated buzz of an audience in JSON format"""
    buzz = Audience.query.get(aid).get_moderated_buzz()
    return dumps([notice.to_dict() for notice in buzz])

@audience.route('/<int:aid>/selected_buzz')
def selected_buzz(aid):
    """Returns the selected buzz of an audience in JSON format"""
    buzz = Audience.query.get(aid).get_selected_buzz()
    return dumps([notice.to_dict() for notice in buzz])


@audience.route('/<int:aid>/last_published')
def last_published(aid):
    """Returns the last published notice of an audience"""
    notice = Audience.get(aid).get_last_published_notice()
    return dumps(notice and notice.to_dict() or None)


@audience.route('/<int:aid>/tv')
def tv(aid):
    """Visualization for the last notice published"""
    inst = get_or_404(Audience, id=aid, visible=True)
    return render_template(
        'tv.html', audience=inst,
        notice=inst.get_last_published_notice())


@audience.route('/<int:aid>/tvbuzz')
def tvbuzz(aid):
    """Visualization for the buzz of an audience"""
    inst = get_or_404(Audience, id=aid, visible=True)
    return render_template(
        'tvbuzz.html', audience=inst,
        buzz=inst.get_moderated_buzz())
