import { Selector, t } from 'testcafe';

export default class Page {
    constructor () {
    <% _.forEach(fields, function(field) { %>
        this.{{ field.identifier }} = Selector('{{ field.selector }}');
    <% }); %>
    }
    <% if (typeof functions != 'undefined' && functions || undefined) { %>
        <% _.forEach(functions, function(func) { %>
        async {{ func.name }}() {
            console.log('running login method');
            await t
            <% _.forEach(func.logic, function(logic) { %>
                <% _.forEach(logic, function(step) { %>
                    <% if (logic.typeText) { %>
                        .typeText(this.{{ step.identifier }}, '{{ step.text }}')
                    <% } else if (logic.click) { %>
                        .click(this.{{ step.identifier }})
                    <% } %>
                <% }); %>
            <% }); %>
            ;
        }
        <% }); %>
    <% } %>
}
