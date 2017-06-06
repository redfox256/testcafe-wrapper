import { Selector, t} from 'testcafe';
<% if (typeof data != 'undefined' && data || undefined) { %>
  <% _.forEach(data, function(dataFile) { %>
    import {{ dataFile }} from '../data/{{ dataFile }}';
  <% }); %>
<% } %>

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
            <% if (logic.action === 'custom') { %>
                {{ logic.command }}
            <% } else if (logic.action === 'date') { %>
                .wait(1000);
                var clientFunction = ClientFunction(() => {
                    <% _.forEach(fields, function(field) { %>
                        <% if (logic.identifier === field.identifier) { %>
                            $('{{ field.selector }}').pickadate('set').set('select', [{{ logic.year }}, {{ logic.month }}, {{ logic.day }}])
                        <% } %>
                    <% }); %>
                });
                await clientFunction();
                t
            <% } else { %>
                .{{ logic.action }}
                <% if (logic.action === 'typeText') { %>
                    (page.{{ logic.identifier }}, {{ logic.text }})
                <% } else if (logic.action === 'click') { %>
                    (page.{{ logic.identifier }}
                        <% if (logic.withText) { %>
                            .withText({{ logic.withText }})
                        <% } %>
                    )
                <% } else if (logic.action === 'expect') { %>
                    (page.{{ logic.identifier }}.{{ logic.property }}).{{ logic.type }}({{ logic.expect }})
                <% } else if (logic.action === 'wait') { %>
                    ({{ logic.timeout }})
                <% } %>
            <% } %>
        <% }); %>
        ;
    }
    <% }); %>
<% } %>
