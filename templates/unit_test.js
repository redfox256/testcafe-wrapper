import { Page } from './page_objects/{{ filename }}';
<% if (typeof before != 'undefined' && before || undefined) { %>
import { {{ before }} } from './page_objects/login';
<% } %>

const page = new Page();

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
        console.log('running beforeEach hook {{ before }}');
        await {{ before }}();
    })
<% } %>
;

<% _.forEach(tests, function(test) { %>
test
<% if (test.skip) { %>
.skip
<% } else if (test.only) { %>
.only
<% } %>
('{{ test.name }}', async t => {
    console.log('running {{ test.name }}');
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
        <% } else { %>
            .{{ logic.action }}
            <% if (logic.action === 'typeText') { %>
                (page.{{ logic.identifier }}, '{{ logic.text }}')
            <% } else if (logic.action === 'click') { %>
                (page.{{ logic.identifier }}
                    <% if (logic.withText) { %>
                        .withText('{{ logic.withText }}')
                    <% } %>
                )
            <% } else if (logic.action === 'expect') { %>
                (page.{{ logic.identifier }}.{{ logic.property }}).{{ logic.type }}('{{ logic.expect }}')
            <% } else if (logic.action === 'wait') { %>
                ({{ logic.timeout }})
            <% } %>
        <% } %>
    <% }); %>
    ;
});
<% }); %>
