import { ClientFunction } from 'testcafe';
import * as current from './page_objects/{{ filename }}';
<% if (typeof include != 'undefined' && include || undefined) { %>
  <% _.forEach(include, function(file) { %>
    import * as {{ file }} from './page_objects/{{ file }}';
  <% }); %>
<% } %>
<% if (typeof data != 'undefined' && data || undefined) { %>
  <% _.forEach(data, function(dataFile) { %>
    import {{ dataFile }} from './data/{{ dataFile }}';
  <% }); %>
<% } %>

const page = new current.Page();

fixture
<% if (typeof skip != 'undefined' && skip || undefined) { %>
.skip
<% } else if (typeof only != 'undefined' && only || undefined) { %>
.only
<% } %>
`{{ fixture }}`
    .page `{{ page }}`
<% if (typeof before != 'undefined' && before || undefined) { %>
    .beforeEach(async t => {
        <% _.forEach(before, function(fBefore) { %>
            console.log('running before fixture: {{ fBefore }}');
            await {{ fBefore }}();
        <% }); %>
    })
<% } %>
;

<% _.forEach(tests, function(test) { %>
test
<% if (test.before) { %>
    .before(async t => {
        <% _.forEach(test.before, function(tBefore) { %>
            console.log('running before test: {{ tBefore }}');
            await {{ tBefore }}();
        <% }); %>
    })
<% } %>
<% if (test.skip) { %>
.skip
<% } else if (test.only) { %>
.only
<% } %>
('{{ test.name }}', async t => {
    await t
    <% _.forEach(test.logic, function(logic) { %>
        <% if (logic.validate) { %>
            .click(page.{{ logic.validate }});
            <% _.forEach(fields, function(field) { %>
                <% if (field.element === 'input' && (field.type === 'text' || field.type === 'password')) { %>
                    <% if (field.required) { %>
                        await t.expect(page.{{ field.identifier }}.getAttribute('title')).eql('This field is required');
                        await t.expect(true).ok(page.{{ field.identifier }}.parent('.field').hasClass('error'));
                    <% } %>
                    <% if (field.maxlength) { %>
                        await t.expect(page.{{ field.identifier }}.getAttribute('maxlength')).eql( '{{ field.maxlength }}' );
                    <% } %>
                    <% if (field.pattern) { %>
                        await t.expect(page.{{ field.identifier }}.getAttribute('pattern')).eql( '{{ field.pattern }}' );
                    <% } %>
                <% } %>
                // TODO other fields ,etc dropdowns, checkboxes
            <% }); %>
        <% } else if (logic.action === 'custom') { %>
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
});
<% }); %>
