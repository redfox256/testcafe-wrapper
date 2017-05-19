import { Selector, t} from 'testcafe';

export class Page {
    constructor () {
    <% _.forEach(fields, function(field) { %>
        this.{{ field.identifier }} = Selector('{{ field.selector }}');
    <% }); %>
    }
}

<% if (typeof functions != 'undefined' && functions || undefined) { %>
    <% _.forEach(functions, function(func) { %>
    export async function {{ func.name }}() {
        const page = new Page();
        await t
        <% _.forEach(func.logic, function(logic) { %>
            <% _.forEach(logic, function(step) { %>
                <% if (logic.typeText) { %>
                    .typeText(page.{{ step.identifier }}, '{{ step.text }}')
                <% } else if (logic.click) { %>
                    .click(page.{{ step.identifier }})
                <% } %>
            <% }); %>
        <% }); %>
        ;
    }
    <% }); %>
<% } %>
