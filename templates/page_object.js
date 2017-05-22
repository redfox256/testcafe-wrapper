import { Selector, t} from 'testcafe';

export class Page {
    constructor () {
    <% _.forEach(fields, function(field) { %>
        this.{{ field.identifier }} = Selector('{{ field.selector }}');
        <% if (field.element === 'dropdown') { %>
            this.{{ field.identifier }}Option = this.{{ field.identifier }}.find('.item');
        <% } %>
    <% }); %>
    }
}

<% if (typeof functions != 'undefined' && functions || undefined) { %>
    <% _.forEach(functions, function(func) { %>
    export async function {{ func.name }}() {
        const page = new Page();
        await t
        <% _.forEach(func.logic, function(logic) { %>
            .{{ logic.action }}
            <% if (logic.action === 'typeText') { %>
                (page.{{ logic.identifier }}, '{{ logic.text }}')
            <% } else if (logic.action === 'click') { %>
                (page.{{ logic.identifier }})
            <% } %>
        <% }); %>
        ;
    }
    <% }); %>
<% } %>
